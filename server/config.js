import "dotenv/config";

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const SESSION_COOKIE_NAME = "geoswipe_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90;

export function assertServerConfig() {
  const missing = [];

  if (!DATABASE_URL) {
    missing.push("DATABASE_URL");
  }

  if (!SESSION_SECRET) {
    missing.push("SESSION_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(", ")}`);
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/"
  };
}

export function getPoolConfig() {
  const shouldUseSsl = process.env.PGSSL === "true";

  return {
    connectionString: DATABASE_URL,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false
  };
}
