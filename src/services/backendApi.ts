import type { PlayerStats } from "../lib/rankingEngine";
import type { CategoryMode, GameSessionPlan, RoundOutcome, SessionSummary } from "../types/game";
import type { GoogleAuthUser } from "./googleIdentity";

const SESSION_TOKEN_STORAGE_KEY = "geoswipe_session_token";

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
  return configured.replace(/\/+$/, "");
}

function getStoredSessionToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ?? "";
}

function setStoredSessionToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  elo: number;
  rank: number;
  isYou: boolean;
  avatarUrl?: string;
}

export interface PlayerIdentity {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  authProvider: string;
  rank: string;
}

export interface PlayerSnapshot {
  player: PlayerIdentity;
  authUser: GoogleAuthUser | null;
  stats: PlayerStats;
  leaderboard: LeaderboardEntry[];
  sessionToken?: string;
}

export interface RecordSessionResponse {
  snapshot: PlayerSnapshot;
  globalDelta: number;
  categoryDelta: number;
  sessionId: string;
}

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const sessionToken = getStoredSessionToken();
  const response = await fetch(`${getApiBaseUrl()}${input}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "x-geoswipe-session": sessionToken } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload.error === "string" ? payload.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  const nextSessionToken =
    payload && typeof payload === "object"
      ? typeof (payload as { sessionToken?: unknown }).sessionToken === "string"
        ? (payload as { sessionToken: string }).sessionToken
        : typeof (payload as { snapshot?: { sessionToken?: unknown } }).snapshot?.sessionToken === "string"
          ? ((payload as { snapshot: { sessionToken: string } }).snapshot.sessionToken)
          : null
      : null;

  if (nextSessionToken) {
    setStoredSessionToken(nextSessionToken);
  }

  return payload as T;
}

export function bootstrapPlayerSession(): Promise<PlayerSnapshot> {
  return apiFetch<PlayerSnapshot>("/api/bootstrap");
}

export function completeGoogleSignIn(credential: string): Promise<PlayerSnapshot> {
  return apiFetch<PlayerSnapshot>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential })
  });
}

export function signOutToGuest(): Promise<PlayerSnapshot> {
  return apiFetch<PlayerSnapshot>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function persistCompletedSession({
  category,
  startedAtIso,
  completedAtIso,
  session,
  outcomes,
  summary
}: {
  category: CategoryMode;
  startedAtIso: string;
  completedAtIso: string;
  session: GameSessionPlan;
  outcomes: RoundOutcome[];
  summary: SessionSummary;
}): Promise<RecordSessionResponse> {
  return apiFetch<RecordSessionResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({
      category,
      startedAtIso,
      completedAtIso,
      session: {
        packId: session.packId,
        seed: session.seed,
        rounds: session.rounds
      },
      outcomes,
      summary
    })
  });
}
