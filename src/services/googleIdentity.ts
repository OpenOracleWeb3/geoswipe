export interface GoogleAuthUser {
  provider: "google";
  providerId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  state?: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
      disableAutoSelect: () => void;
    };
  };
}

type GoogleIdentityWindow = Window & typeof globalThis & {
  google?: {
    accounts?: GoogleIdentityApi["accounts"];
  };
};

const GOOGLE_IDENTITY_SCRIPT_ID = "geoswipe-google-identity";
const AUTH_STORAGE_KEY = "geoswipe:auth:v1";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

let googleIdentityPromise: Promise<GoogleIdentityApi> | null = null;

function getGoogleIdentityWindow(): GoogleIdentityWindow {
  return window as GoogleIdentityWindow;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);

  return decodeURIComponent(
    Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
  );
}

function parseStoredUser(value: string | null): GoogleAuthUser | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<GoogleAuthUser>;
    if (parsed.provider !== "google" || !parsed.providerId || !parsed.name || !parsed.email) {
      return null;
    }

    return {
      provider: "google",
      providerId: parsed.providerId,
      name: parsed.name,
      email: parsed.email,
      avatarUrl: parsed.avatarUrl
    };
  } catch {
    return null;
  }
}

export function isGoogleAuthConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function getGoogleClientId(): string {
  return GOOGLE_CLIENT_ID;
}

export function loadStoredGoogleAuthUser(): GoogleAuthUser | null {
  return parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEY));
}

export function persistGoogleAuthUser(user: GoogleAuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredGoogleAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function decodeGoogleCredential(credential: string): GoogleAuthUser | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!payload.sub || !payload.name || !payload.email) {
      return null;
    }

    return {
      provider: "google",
      providerId: payload.sub,
      name: payload.name,
      email: payload.email,
      avatarUrl: payload.picture
    };
  } catch {
    return null;
  }
}

export function disableGoogleAutoSelect(): void {
  getGoogleIdentityWindow().google?.accounts?.id?.disableAutoSelect?.();
}

export async function loadGoogleIdentityApi(): Promise<GoogleIdentityApi> {
  const googleWindow = getGoogleIdentityWindow();

  if (!isGoogleAuthConfigured()) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID");
  }

  if (googleWindow.google?.accounts?.id) {
    return googleWindow.google as GoogleIdentityApi;
  }

  if (googleIdentityPromise) {
    return googleIdentityPromise;
  }

  googleIdentityPromise = new Promise<GoogleIdentityApi>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      const loadedWindow = getGoogleIdentityWindow();
      if (loadedWindow.google?.accounts?.id) {
        resolve(loadedWindow.google as GoogleIdentityApi);
        return;
      }

      googleIdentityPromise = null;
      reject(new Error("Google Identity Services loaded without accounts.id"));
    };

    const handleError = () => {
      googleIdentityPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}

export async function renderGoogleSignInButton({
  parent,
  onAuthenticated
}: {
  parent: HTMLElement;
  onAuthenticated: (user: GoogleAuthUser) => void;
}): Promise<void> {
  const googleApi = await loadGoogleIdentityApi();

  googleApi.accounts.id.initialize({
    client_id: getGoogleClientId(),
    cancel_on_tap_outside: true,
    callback: (response) => {
      if (!response.credential) {
        return;
      }

      const user = decodeGoogleCredential(response.credential);
      if (!user) {
        return;
      }

      persistGoogleAuthUser(user);
      onAuthenticated(user);
    }
  });

  parent.innerHTML = "";
  googleApi.accounts.id.renderButton(parent, {
    type: "standard",
    theme: "filled_blue",
    text: "continue_with",
    shape: "pill",
    size: "large",
    logo_alignment: "left",
    width: String(Math.min(400, Math.max(220, parent.clientWidth || 320)))
  });
}
