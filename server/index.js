import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CORS_ALLOWED_ORIGINS, PORT } from "./config.js";
import { ensureDatabaseReady, withTransaction } from "./db.js";
import { verifyGoogleCredential } from "./google.js";
import { buildPlayerSnapshot, createAnonymousPlayer, getOrCreateSessionPlayer, recordCompletedSession, signInWithGooglePlayer } from "./store.js";
import { readSessionPlayerId, SESSION_HEADER_NAME, setSessionCookie } from "./session.js";

const app = express();
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(serverDir, "../dist");

app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (origin && CORS_ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", `Content-Type, Authorization, ${SESSION_HEADER_NAME}`);
    res.setHeader("Access-Control-Expose-Headers", SESSION_HEADER_NAME);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
});

async function attachSession(res, playerId) {
  const sessionToken = await setSessionCookie(res, playerId);
  res.setHeader(SESSION_HEADER_NAME, sessionToken);
  return sessionToken;
}

async function sendSnapshot(res, snapshot) {
  const sessionToken = await attachSession(res, snapshot.player.id);
  res.json({
    ...snapshot,
    sessionToken
  });
}

async function sendRecordedSession(res, result) {
  const sessionToken = await attachSession(res, result.snapshot.player.id);
  res.json({
    ...result,
    snapshot: {
      ...result.snapshot,
      sessionToken
    }
  });
}

app.get("/api/health", async (_req, res) => {
  await ensureDatabaseReady();
  res.json({ ok: true });
});

app.get("/api/bootstrap", async (req, res, next) => {
  try {
    const sessionPlayerId = await readSessionPlayerId(req);
    const snapshot = await withTransaction(async (client) => {
      const player = await getOrCreateSessionPlayer(client, sessionPlayerId);
      return buildPlayerSnapshot(client, player.id);
    });

    await sendSnapshot(res, snapshot);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    const credential = typeof req.body?.credential === "string" ? req.body.credential : "";
    if (!credential) {
      res.status(400).json({ error: "Missing Google credential." });
      return;
    }

    const googleUser = await verifyGoogleCredential(credential);
    const sessionPlayerId = await readSessionPlayerId(req);
    const snapshot = await withTransaction(async (client) => {
      const player = await signInWithGooglePlayer(client, sessionPlayerId, googleUser);
      return buildPlayerSnapshot(client, player.id);
    });

    await sendSnapshot(res, snapshot);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (_req, res, next) => {
  try {
    const snapshot = await withTransaction(async (client) => {
      const player = await createAnonymousPlayer(client);
      return buildPlayerSnapshot(client, player.id);
    });

    await sendSnapshot(res, snapshot);
  } catch (error) {
    next(error);
  }
});

app.post("/api/sessions", async (req, res, next) => {
  try {
    const sessionPlayerId = await readSessionPlayerId(req);
    const result = await withTransaction(async (client) => {
      const player = await getOrCreateSessionPlayer(client, sessionPlayerId);
      return recordCompletedSession(client, player.id, req.body);
    });

    await sendRecordedSession(res, result);
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API route." });
});

app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }

  res.sendFile(path.resolve(distDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Internal server error.";
  const status = message.startsWith("Missing") ? 400 : 500;
  res.status(status).json({ error: message });
});

async function start() {
  await ensureDatabaseReady();
  app.listen(PORT, () => {
    console.log(`GeoSwipe server listening on http://127.0.0.1:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start GeoSwipe server:", error);
  process.exit(1);
});
