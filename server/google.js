import { createRemoteJWKSet, jwtVerify } from "jose";
import { GOOGLE_CLIENT_ID } from "./config.js";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleCredential(credential) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Missing Google client ID on the server.");
  }

  const { payload } = await jwtVerify(credential, googleJwks, {
    audience: GOOGLE_CLIENT_ID,
    issuer: ["https://accounts.google.com", "accounts.google.com"]
  });

  if (!payload.sub || !payload.name || !payload.email) {
    throw new Error("Google credential payload is missing required identity fields.");
  }

  return {
    provider: "google",
    providerId: String(payload.sub),
    name: String(payload.name),
    email: String(payload.email),
    avatarUrl: typeof payload.picture === "string" ? payload.picture : undefined
  };
}
