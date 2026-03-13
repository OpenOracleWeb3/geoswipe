import {
  COUNTRY_CENTROIDS,
  COUNTRY_SEARCH_KEYWORDS
} from "../data/confusionPools";
import type { GeoRound, RoundMedia } from "../types/game";

const GOOGLE_KEY = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_GOOGLE_STREET_VIEW_API_KEY;
const commonsCache = new Map<string, string[]>();
const streetViewMetadataCache = new Map<string, Promise<GoogleStreetViewMetadata | null>>();
const STREET_VIEW_ANCHORS: Partial<Record<string, [number, number]>> = {
  Canada: [43.6532, -79.3832],
  Jamaica: [17.9712, -76.7936],
  "United States": [40.758, -73.9855],
  Mexico: [19.4326, -99.1332],
  Chile: [-33.4489, -70.6693],
  Peru: [-12.0464, -77.0428],
  Argentina: [-34.6037, -58.3816],
  Bolivia: [-16.4897, -68.1193],
  "Costa Rica": [9.9281, -84.0907],
  Colombia: [4.711, -74.0721],
  Iceland: [64.1466, -21.9426],
  Greece: [37.9838, 23.7275],
  Spain: [40.4168, -3.7038],
  Portugal: [38.7223, -9.1393],
  Poland: [52.2297, 21.0122],
  "Czech Republic": [50.0755, 14.4378],
  Latvia: [56.9496, 24.1052],
  Lithuania: [54.6872, 25.2797],
  Croatia: [45.815, 15.9819],
  Montenegro: [42.4304, 19.2594],
  Slovakia: [48.1486, 17.1077],
  Slovenia: [46.0569, 14.5058],
  Egypt: [30.0444, 31.2357],
  "South Africa": [-26.2041, 28.0473],
  Oman: [23.588, 58.3829],
  Jordan: [31.9454, 35.9284],
  Morocco: [33.5731, -7.5898],
  Tunisia: [36.8065, 10.1815],
  Kenya: [-1.2921, 36.8219],
  Tanzania: [-6.7924, 39.2083],
  Qatar: [25.2854, 51.531],
  "United Arab Emirates": [25.2048, 55.2708],
  Maldives: [4.1755, 73.5093],
  Japan: [35.6762, 139.6503],
  Thailand: [13.7563, 100.5018],
  Vietnam: [10.8231, 106.6297],
  "New Zealand": [-36.8485, 174.7633],
  Australia: [-33.8688, 151.2093],
  "South Korea": [37.5665, 126.978],
  Malaysia: [3.139, 101.6869],
  Indonesia: [-6.2088, 106.8456],
  India: [28.6139, 77.209],
  Nepal: [27.7172, 85.324]
};

interface WikimediaPage {
  imageinfo?: Array<{ url?: string }>;
}

interface WikimediaResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

interface GoogleStreetViewMetadata {
  status?: string;
  pano_id?: string;
}

const STREET_VIEW_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [0.012, 0.012],
  [0.016, -0.013],
  [-0.014, 0.011],
  [-0.01, -0.018],
  [0.022, 0],
  [0, 0.022],
  [-0.022, 0],
  [0, -0.022],
  [0.028, 0.016],
  [-0.028, -0.016],
  [0.013, -0.027],
  [-0.013, 0.027]
];

function hashString(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function buildGoogleStreetViewMetadataUrl([lat, lng]: [number, number]): string {
  return `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${GOOGLE_KEY}`;
}

function getStreetViewCandidateLocations(country: string, variantKey: string): Array<[number, number]> {
  const bases = [STREET_VIEW_ANCHORS[country], COUNTRY_CENTROIDS[country]].filter(
    (value): value is [number, number] => Array.isArray(value)
  );
  const variantHash = hashString(`${country}:${variantKey}`);
  const offsetStart = variantHash % STREET_VIEW_OFFSETS.length;

  const candidates = bases.flatMap(([lat, lng], baseIndex) => {
    const baseOffset = (offsetStart + baseIndex * 3) % STREET_VIEW_OFFSETS.length;

    return STREET_VIEW_OFFSETS.map((_, index) => {
      const [latOffset, lngOffset] = STREET_VIEW_OFFSETS[(baseOffset + index) % STREET_VIEW_OFFSETS.length];
      return [normalizeCoordinate(lat + latOffset), normalizeCoordinate(lng + lngOffset)] as [number, number];
    });
  });

  return candidates.filter(
    (candidate, index) =>
      candidates.findIndex(([lat, lng]) => lat === candidate[0] && lng === candidate[1]) === index
  );
}

function uniq(items: string[]): string[] {
  return [...new Set(items)];
}

async function fetchGoogleStreetViewMetadata(country: string, variantKey: string): Promise<GoogleStreetViewMetadata | null> {
  if (!GOOGLE_KEY) {
    return null;
  }

  const candidates = getStreetViewCandidateLocations(country, variantKey);
  if (candidates.length === 0) {
    return null;
  }

  const cacheKey = `streetview:${country}:${variantKey}`;
  const cached = streetViewMetadataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    for (const candidate of candidates) {
      try {
        const response = await fetch(buildGoogleStreetViewMetadataUrl(candidate));
        if (!response.ok) {
          continue;
        }

        const payload = (await response.json()) as GoogleStreetViewMetadata;
        if (payload.status === "OK" && payload.pano_id) {
          return payload;
        }
      } catch {
        continue;
      }
    }

    return null;
  })();

  streetViewMetadataCache.set(cacheKey, request);
  return request;
}

function buildGoogleStreetViewPreviewUrl(panoId: string, heading: number, pitch: number): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=640x360&scale=2&pano=${panoId}&fov=85&heading=${heading}&pitch=${pitch}&return_error_code=true&key=${GOOGLE_KEY}`;
}

function getStreetViewVariantKey(country: string, variantKey: string): string {
  return `${country}:${variantKey}`;
}

function deriveStreetViewPov(variantKey: string): Pick<Extract<RoundMedia, { kind: "streetview" }>, "heading" | "pitch" | "zoom"> {
  const seed = hashString(variantKey);
  const heading = seed % 360;
  const pitch = ((Math.floor(seed / 360) % 17) - 6);
  const zoom = 1;

  return { heading, pitch, zoom };
}

async function buildGoogleStreetViewMedia(country: string, variantKey: string): Promise<RoundMedia | null> {
  const metadata = await fetchGoogleStreetViewMetadata(country, variantKey);
  if (!metadata?.pano_id) {
    return null;
  }

  const pov = deriveStreetViewPov(getStreetViewVariantKey(country, variantKey));

  return {
    kind: "streetview",
    sceneKey: getStreetViewVariantKey(country, variantKey),
    panoId: metadata.pano_id,
    previewUrl: buildGoogleStreetViewPreviewUrl(metadata.pano_id, pov.heading, pov.pitch),
    heading: pov.heading,
    pitch: pov.pitch,
    zoom: pov.zoom
  };
}

async function fetchWikimediaImages(searchTerms: string[], limit: number): Promise<string[]> {
  const cacheKey = `commons:${searchTerms.join("|")}:${limit}`;
  if (commonsCache.has(cacheKey)) {
    return commonsCache.get(cacheKey)!;
  }

  const query = `${searchTerms.join(" ")} -flag -map -coat -logo`;

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(Math.max(limit * 3, 12)));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as WikimediaResponse;
    const pages = Object.values(payload.query?.pages ?? {}) as WikimediaPage[];

    const imageUrls = uniq(
      pages
        .map((page) => page.imageinfo?.[0]?.url)
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
        .filter((imageUrl) => !imageUrl.includes("Flag"))
        .filter((imageUrl) => imageUrl.endsWith(".jpg") || imageUrl.endsWith(".jpeg") || imageUrl.endsWith(".png"))
    ).slice(0, limit);

    commonsCache.set(cacheKey, imageUrls);
    return imageUrls;
  } catch {
    return [];
  }
}

function buildGenericPhotoFallback(country: string, descriptor: string, sig = 0): string {
  const seed = encodeURIComponent(`${country}-${descriptor}-${sig}`);
  return `https://picsum.photos/seed/${seed}/1280/720`;
}

export function getRoundMediaPreviewUrl(media: RoundMedia): string {
  return media.kind === "streetview" ? media.previewUrl : media.url;
}

export async function getRoundMedia(round: GeoRound): Promise<RoundMedia> {
  const country = round.correctAnswer;
  const googleMedia = await buildGoogleStreetViewMedia(country, round.id);
  if (googleMedia) {
    return googleMedia;
  }

  const queryTerms = [
    country,
    ...(COUNTRY_SEARCH_KEYWORDS[country] ?? [country, "street", "city"]),
    ...round.pair.contextSearchTerms.slice(0, 2)
  ];
  const wikimediaImages = await fetchWikimediaImages(queryTerms, 4);
  if (wikimediaImages.length > 0) {
    return {
      kind: "image",
      url: wikimediaImages[hashString(round.id) % wikimediaImages.length]
    };
  }

  return {
    kind: "image",
    url: buildGenericPhotoFallback(country, round.pair.visualTags[0] ?? "landscape", round.roundNumber)
  };
}

export async function getRoundImageUrl(round: GeoRound): Promise<string> {
  return getRoundMediaPreviewUrl(await getRoundMedia(round));
}

export async function getBreakContextImages(round: GeoRound): Promise<string[]> {
  const country = round.correctAnswer;
  const queryTerms = [
    country,
    ...(COUNTRY_SEARCH_KEYWORDS[country] ?? [country, "street", "city"]),
    ...round.pair.contextSearchTerms
  ];
  const wikimediaImages = await fetchWikimediaImages(queryTerms, 5);

  if (wikimediaImages.length >= 3) {
    return wikimediaImages.slice(0, 3);
  }

  const googleFallbacks = GOOGLE_KEY
    ? (await Promise.all(
        [0, 1, 2].map((variant) => buildGoogleStreetViewMedia(country, `${round.id}:context:${variant}`))
      ))
        .filter((media): media is Exclude<RoundMedia, { kind: "image" }> => Boolean(media && media.kind === "streetview"))
        .map((media) => media.previewUrl)
    : [];
  const descriptorFallbacks = round.pair.contextSearchTerms
    .slice(0, 3)
    .map((term, index) => buildGenericPhotoFallback(country, term, index));

  return uniq([...wikimediaImages, ...googleFallbacks, ...descriptorFallbacks]).slice(0, 3);
}
