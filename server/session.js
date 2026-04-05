import { jwtVerify, SignJWT } from "jose";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS, SESSION_SECRET, getSessionCookieOptions } from "./config.js";

const secretKey = new TextEncoder().encode(SESSION_SECRET);
export const SESSION_HEADER_NAME = "x-geoswipe-session";

export async function createSessionToken(playerId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(playerId)
    .setIssuedAt()
    .setExpirationTime(`${Math.floor(SESSION_MAX_AGE_MS / 1000)}s`)
    .sign(secretKey);
}

export async function readSessionPlayerId(req) {
  const bearerHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const headerToken =
    typeof req.headers[SESSION_HEADER_NAME] === "string"
      ? req.headers[SESSION_HEADER_NAME]
      : bearerHeader.startsWith("Bearer ")
        ? bearerHeader.slice("Bearer ".length)
        : null;
  const token = headerToken || req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(res, playerId) {
  const token = await createSessionToken(playerId);
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return token;
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    ...getSessionCookieOptions(),
    maxAge: 0
  });
}
