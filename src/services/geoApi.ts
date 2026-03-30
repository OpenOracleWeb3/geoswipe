import {
  COUNTRY_CENTROIDS
} from "../data/confusionPools";
import { CITY_BY_COUNTRY } from "../data/geoCatalog";
import type { GeoRound, RoundMedia } from "../types/game";

const GOOGLE_KEY = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_GOOGLE_STREET_VIEW_API_KEY;
const streetViewMetadataCache = new Map<string, Promise<GoogleStreetViewMetadata | null>>();
const STREET_VIEW_RADIUS_STEPS = [50, 150, 400, 1000] as const;
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

interface GoogleStreetViewMetadata {
  status?: string;
  pano_id?: string;
}

export interface StreetViewPullAttempt {
  index: number;
  source: "round_coords" | "catalog_coords";
  coordinates: [number, number];
  metadataStatus: string;
  panoId: string | null;
  selected: boolean;
}

export interface StreetViewPullTrace {
  country: string;
  roundId: string;
  requestedCoordinates: [number, number] | null;
  catalogCoordinates: [number, number] | null;
  resolvedCoordinates: [number, number] | null;
  resolvedPanoId: string | null;
  resolution: "pano" | "location_fallback" | "missing_input";
  attempts: StreetViewPullAttempt[];
  previewUrl: string | null;
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

function isValidCoordinatePair(value: [number, number] | null | undefined): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    !(value[0] === 0 && value[1] === 0)
  );
}

function buildGoogleStreetViewMetadataUrl([lat, lng]: [number, number], radius = 50): string {
  const url = new URL("https://maps.googleapis.com/maps/api/streetview/metadata");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("source", "outdoor");
  url.searchParams.set("key", GOOGLE_KEY ?? "");
  return url.toString();
}

function uniqCoordinates(items: Array<[number, number]>): Array<[number, number]> {
  return items.filter(
    (candidate, index) =>
      items.findIndex(([lat, lng]) => lat === candidate[0] && lng === candidate[1]) === index
  );
}

function getRoundCoordinateCandidates(round: GeoRound): Array<[number, number]> {
  const country = round.mediaCountry;
  const catalogCoordinates = CITY_BY_COUNTRY[country]?.coordinates;
  const candidates = [
    round.cityCoordinates,
    round.location.coordinates,
    catalogCoordinates,
    STREET_VIEW_ANCHORS[country],
    COUNTRY_CENTROIDS[country]
  ].filter(isValidCoordinatePair);

  return uniqCoordinates(candidates.map(([lat, lng]) => [normalizeCoordinate(lat), normalizeCoordinate(lng)]));
}

function getCoordinateCandidates(coords: [number, number]): Array<[number, number]> {
  return uniqCoordinates(STREET_VIEW_OFFSETS.map(([latOff, lngOff]) =>
    [normalizeCoordinate(coords[0] + latOff), normalizeCoordinate(coords[1] + lngOff)] as [number, number]
  ));
}

function buildGoogleStreetViewPreviewUrl(panoId: string, heading: number, pitch: number): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=640x360&scale=2&pano=${panoId}&fov=85&heading=${heading}&pitch=${pitch}&return_error_code=true&key=${GOOGLE_KEY}`;
}

function deriveStreetViewPov(variantKey: string): Pick<Extract<RoundMedia, { kind: "streetview" }>, "heading" | "pitch" | "zoom"> {
  const seed = hashString(variantKey);
  const heading = seed % 360;
  const pitch = ((Math.floor(seed / 360) % 17) - 6);
  const zoom = 1;

  return { heading, pitch, zoom };
}

async function fetchStreetViewFromCoordinates(coords: [number, number], variantKey: string): Promise<RoundMedia | null> {
  if (!GOOGLE_KEY) {
    return null;
  }

  const cacheKey = `streetview:coords:${coords[0]},${coords[1]}:${variantKey}`;
  const cached = streetViewMetadataCache.get(cacheKey);
  if (cached) {
    const metadata = await cached;
    if (!metadata?.pano_id) {
      return null;
    }
    const pov = deriveStreetViewPov(variantKey);
    return {
      kind: "streetview",
      sceneKey: `coords:${variantKey}`,
      panoId: metadata.pano_id,
      coordinates: coords,
      previewUrl: buildGoogleStreetViewPreviewUrl(metadata.pano_id, pov.heading, pov.pitch),
      heading: pov.heading,
      pitch: pov.pitch,
      zoom: pov.zoom
    };
  }

  const candidates = getCoordinateCandidates(coords);

  const request = (async () => {
    for (const radius of STREET_VIEW_RADIUS_STEPS) {
      for (const candidate of candidates) {
        try {
          const response = await fetch(buildGoogleStreetViewMetadataUrl(candidate, radius));
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
    }
    return null;
  })();

  streetViewMetadataCache.set(cacheKey, request);
  const metadata = await request;
  if (!metadata?.pano_id) {
    return null;
  }

  const pov = deriveStreetViewPov(variantKey);
  return {
    kind: "streetview",
    sceneKey: `coords:${variantKey}`,
    panoId: metadata.pano_id,
    coordinates: coords,
    previewUrl: buildGoogleStreetViewPreviewUrl(metadata.pano_id, pov.heading, pov.pitch),
    heading: pov.heading,
    pitch: pov.pitch,
    zoom: pov.zoom
  };
}

async function probeStreetViewCandidates(
  coords: [number, number],
  source: StreetViewPullAttempt["source"]
): Promise<{
  attempts: StreetViewPullAttempt[];
  selectedCoordinates: [number, number] | null;
  metadata: GoogleStreetViewMetadata | null;
}> {
  const candidates = getCoordinateCandidates(coords);
  const attempts: StreetViewPullAttempt[] = [];
  let selectedCoordinates: [number, number] | null = null;
  let metadata: GoogleStreetViewMetadata | null = null;

  for (const radius of STREET_VIEW_RADIUS_STEPS) {
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      let payload: GoogleStreetViewMetadata | null = null;

      try {
        const response = await fetch(buildGoogleStreetViewMetadataUrl(candidate, radius));
        if (response.ok) {
          payload = (await response.json()) as GoogleStreetViewMetadata;
        } else {
          payload = { status: `HTTP_${response.status}` };
        }
      } catch {
        payload = { status: "FETCH_ERROR" };
      }

      const hit = payload?.status === "OK" && Boolean(payload.pano_id);
      attempts.push({
        index: attempts.length,
        source,
        coordinates: candidate,
        metadataStatus: `${payload?.status ?? "UNKNOWN"}@${radius}m`,
        panoId: payload?.pano_id ?? null,
        selected: hit
      });

      if (hit) {
        selectedCoordinates = candidate;
        metadata = payload;
        break;
      }
    }

    if (metadata?.pano_id) {
      break;
    }
  }

  return { attempts, selectedCoordinates, metadata };
}

export function getRoundMediaPreviewUrl(media: RoundMedia): string {
  return media.kind === "streetview" ? media.previewUrl : media.url;
}

export async function getRoundMedia(round: GeoRound): Promise<RoundMedia> {
  const country = round.mediaCountry;
  const coordinateCandidates = getRoundCoordinateCandidates(round);
  if (coordinateCandidates.length === 0 || !GOOGLE_KEY) {
    throw new Error(`No Street View coordinates available for round ${round.id}`);
  }

  for (let index = 0; index < coordinateCandidates.length; index += 1) {
    const media = await fetchStreetViewFromCoordinates(coordinateCandidates[index], `${round.id}:${index}`);
    if (media) {
      return media;
    }
  }

  throw new Error(`No Street View panorama found for ${country} on round ${round.id}`);
}

export async function getRoundImageUrl(round: GeoRound): Promise<string> {
  return getRoundMediaPreviewUrl(await getRoundMedia(round));
}

export async function traceRoundStreetViewPull(round: GeoRound): Promise<StreetViewPullTrace> {
  const country = round.mediaCountry;
  const catalogEntry = CITY_BY_COUNTRY[country];
  const requestedCoordinates = isValidCoordinatePair(round.cityCoordinates)
    ? round.cityCoordinates
    : isValidCoordinatePair(round.location.coordinates)
      ? round.location.coordinates
      : catalogEntry?.coordinates ?? null;
  const catalogCoordinates = isValidCoordinatePair(catalogEntry?.coordinates) ? catalogEntry.coordinates : null;

  if (!requestedCoordinates || !GOOGLE_KEY) {
    return {
      country,
      roundId: round.id,
      requestedCoordinates,
      catalogCoordinates,
      resolvedCoordinates: requestedCoordinates,
      resolvedPanoId: null,
      resolution: "missing_input",
      attempts: [],
      previewUrl: null
    };
  }

  const primaryProbe = await probeStreetViewCandidates(requestedCoordinates, "round_coords");
  if (primaryProbe.metadata?.pano_id) {
    const pov = deriveStreetViewPov(round.id);
    return {
      country,
      roundId: round.id,
      requestedCoordinates,
      catalogCoordinates,
      resolvedCoordinates: primaryProbe.selectedCoordinates,
      resolvedPanoId: primaryProbe.metadata.pano_id,
      resolution: "pano",
      attempts: primaryProbe.attempts,
      previewUrl: buildGoogleStreetViewPreviewUrl(primaryProbe.metadata.pano_id, pov.heading, pov.pitch)
    };
  }

  if (
    catalogCoordinates &&
    (!round.cityCoordinates ||
      catalogCoordinates[0] !== requestedCoordinates[0] ||
      catalogCoordinates[1] !== requestedCoordinates[1])
  ) {
    const fallbackProbe = await probeStreetViewCandidates(catalogCoordinates, "catalog_coords");
    if (fallbackProbe.metadata?.pano_id) {
      const pov = deriveStreetViewPov(round.id);
      return {
        country,
        roundId: round.id,
        requestedCoordinates,
        catalogCoordinates,
        resolvedCoordinates: fallbackProbe.selectedCoordinates,
        resolvedPanoId: fallbackProbe.metadata.pano_id,
        resolution: "pano",
        attempts: [...primaryProbe.attempts, ...fallbackProbe.attempts],
        previewUrl: buildGoogleStreetViewPreviewUrl(fallbackProbe.metadata.pano_id, pov.heading, pov.pitch)
      };
    }

    return {
      country,
      roundId: round.id,
      requestedCoordinates,
      catalogCoordinates,
      resolvedCoordinates: requestedCoordinates,
      resolvedPanoId: null,
      resolution: "location_fallback",
      attempts: [...primaryProbe.attempts, ...fallbackProbe.attempts],
      previewUrl: null
    };
  }

  return {
    country,
    roundId: round.id,
    requestedCoordinates,
    catalogCoordinates,
    resolvedCoordinates: requestedCoordinates,
    resolvedPanoId: null,
    resolution: "location_fallback",
    attempts: primaryProbe.attempts,
    previewUrl: null
  };
}

// ── Preloading ────────────────────────────────────────────────────

const preloadCache = new Map<string, Promise<RoundMedia>>();

/**
 * Preload media for upcoming rounds. Call this with the next N rounds
 * while the player is on the current card. Results are cached so
 * `getRoundMedia` returns instantly when the round becomes active.
 */
export function preloadRoundMedia(rounds: GeoRound[]): void {
  for (const round of rounds) {
    if (preloadCache.has(round.id)) continue;
    const promise = getRoundMedia(round).catch((error) => {
      preloadCache.delete(round.id);
      throw error;
    });
    preloadCache.set(round.id, promise);
  }
}

/**
 * Get preloaded media if available, otherwise fetch fresh.
 */
export async function getPreloadedRoundMedia(round: GeoRound): Promise<RoundMedia> {
  const cached = preloadCache.get(round.id);
  if (cached) return cached;
  const promise = getRoundMedia(round).catch((error) => {
    preloadCache.delete(round.id);
    throw error;
  });
  preloadCache.set(round.id, promise);
  return promise;
}
