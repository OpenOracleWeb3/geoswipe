import {
  COUNTRY_CENTROIDS,
  COUNTRY_SEARCH_KEYWORDS
} from "../data/confusionPools";
import type { GeoRound } from "../types/game";

const GOOGLE_KEY = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_GOOGLE_STREET_VIEW_API_KEY;
const commonsCache = new Map<string, string>();

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function buildGoogleStreetViewUrl(country: string): string | null {
  if (!GOOGLE_KEY) {
    return null;
  }

  const centroid = COUNTRY_CENTROIDS[country];
  if (!centroid) {
    return null;
  }

  const [lat, lng] = centroid;
  const heading = randomInt(360);
  const pitch = randomInt(16) - 6;

  return `https://maps.googleapis.com/maps/api/streetview?size=1280x720&location=${lat},${lng}&fov=85&heading=${heading}&pitch=${pitch}&key=${GOOGLE_KEY}`;
}

async function fetchWikimediaImage(country: string): Promise<string | null> {
  const cacheKey = `commons:${country}`;
  if (commonsCache.has(cacheKey)) {
    return commonsCache.get(cacheKey)!;
  }

  const keywords = COUNTRY_SEARCH_KEYWORDS[country] ?? [country, "street", "city"];
  const query = `${keywords.join(" ")} -flag -map -coat -logo`;

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "20");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const pages = Object.values(payload?.query?.pages ?? {}) as Array<{
      imageinfo?: Array<{ url?: string }>;
    }>;

    const imageUrls = pages
      .map((page) => page.imageinfo?.[0]?.url)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
      .filter((imageUrl) => !imageUrl.includes("Flag"))
      .filter((imageUrl) => imageUrl.endsWith(".jpg") || imageUrl.endsWith(".jpeg") || imageUrl.endsWith(".png"));

    if (imageUrls.length === 0) {
      return null;
    }

    const picked = imageUrls[randomInt(imageUrls.length)];
    commonsCache.set(cacheKey, picked);
    return picked;
  } catch {
    return null;
  }
}

function buildUnsplashFallback(country: string): string {
  const encoded = encodeURIComponent(`${country},travel,street,landscape`);
  return `https://source.unsplash.com/1280x720/?${encoded}`;
}

export async function getRoundImageUrl(round: GeoRound): Promise<string> {
  const googleUrl = buildGoogleStreetViewUrl(round.correctCountry);
  if (googleUrl) {
    return googleUrl;
  }

  const wikimediaUrl = await fetchWikimediaImage(round.correctCountry);
  if (wikimediaUrl) {
    return wikimediaUrl;
  }

  return buildUnsplashFallback(round.correctCountry);
}
