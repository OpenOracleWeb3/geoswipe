type GoogleMapsApi = typeof google;
type GoogleMapsWindow = Window & typeof globalThis & { google?: GoogleMapsApi };

const GOOGLE_MAPS_SCRIPT_ID = "geoswipe-google-maps-js";
const GOOGLE_MAPS_KEY = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  ?.VITE_GOOGLE_STREET_VIEW_API_KEY;

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

function getGoogleMapsWindow(): GoogleMapsWindow {
  return window as GoogleMapsWindow;
}

function buildGoogleMapsScriptUrl(apiKey: string): string {
  const url = new URL("https://maps.googleapis.com/maps/api/js");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("v", "weekly");
  url.searchParams.set("loading", "async");
  return url.toString();
}

export function loadGoogleMapsApi(): Promise<GoogleMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is only available in the browser."));
  }

  const googleWindow = getGoogleMapsWindow();

  if (googleWindow.google?.maps) {
    return Promise.resolve(googleWindow.google);
  }

  if (!GOOGLE_MAPS_KEY) {
    return Promise.reject(new Error("Missing Google Maps API key."));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const completeLoad = () => {
      const loadedWindow = getGoogleMapsWindow();
      if (loadedWindow.google?.maps) {
        resolve(loadedWindow.google);
        return;
      }

      googleMapsPromise = null;
      reject(new Error("Google Maps loaded without the maps namespace."));
    };

    const failLoad = () => {
      googleMapsPromise = null;
      reject(new Error("Google Maps failed to load."));
    };

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", completeLoad, { once: true });
      existingScript.addEventListener("error", failLoad, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = buildGoogleMapsScriptUrl(GOOGLE_MAPS_KEY);
    script.async = true;
    script.defer = true;
    script.addEventListener("load", completeLoad, { once: true });
    script.addEventListener("error", failLoad, { once: true });
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
