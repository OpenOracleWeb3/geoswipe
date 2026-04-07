import { GlobeHemisphereWest, Rows, SealCheck, Trophy } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useState } from "react";
import { GoogleAuthPanel } from "../auth/GoogleAuthPanel";
import type { LeaderboardEntry, PlayerIdentity } from "../../services/backendApi";
import type { GoogleAuthUser, GoogleSignInPayload } from "../../services/googleIdentity";

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: `${Math.random() * 2 + 0.5}px`,
  opacity: `${Math.random() * 0.5 + 0.16}`,
  delay: `${Math.random() * 4.4}s`
}));

interface GeoLeaderboardScreenProps {
  elo: number;
  leaderboard: LeaderboardEntry[];
  playerIdentity: PlayerIdentity | null;
  authUser: GoogleAuthUser | null;
  onGoogleSignIn: (payload: GoogleSignInPayload) => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function GeoLeaderboardScreen({
  elo,
  leaderboard,
  playerIdentity,
  authUser,
  onGoogleSignIn,
  onGoogleSignOut
}: GeoLeaderboardScreenProps) {
  const [loaded, setLoaded] = useState(false);
  const isGuest = !authUser || playerIdentity?.authProvider === "anonymous";
  const topEntries = leaderboard.slice(0, 15);
  const yourEntry = leaderboard.find((entry) => entry.isYou) ?? null;

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={`gs-shell-screen${loaded ? " is-loaded" : ""}`}>
      <div className="gs-shell-stars" aria-hidden="true">
        {STARS.map((star) => (
          <div
            key={star.id}
            className="gs-shell-star"
            style={
              {
                "--x": star.x,
                "--y": star.y,
                "--size": star.size,
                "--opacity": star.opacity,
                "--delay": star.delay
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="gs-shell-wave gs-shell-wave-left" aria-hidden="true" />
      <div className="gs-shell-wave gs-shell-wave-right" aria-hidden="true" />

      <header className="gs-shell-header gs-shell-animate" style={{ "--delay": "0.04s" } as CSSProperties}>
        <div className="gs-shell-title-block">
          <p className="gs-shell-kicker">
            <Rows size={15} weight="fill" />
            Leaderboard
          </p>
          <h1 className="gs-shell-title">Global Ladder</h1>
          <p className="gs-shell-subtitle">
            {isGuest
              ? "Guest runs still rank on the server for this device. Sign in once to keep that standing across reinstalls and devices."
              : "Your signed-in account is now tied to your live rank, history, and leaderboard position."}
          </p>
        </div>
      </header>

      <main className="gs-shell-stack">
        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.12s" } as CSSProperties}>
          <div className="gs-shell-hero-top">
            <div>
              <p className="gs-shell-kicker">Your Standing</p>
              <div className="gs-shell-hero-value">{yourEntry ? `#${yourEntry.rank}` : "..."}</div>
              <p className="gs-shell-hero-copy">
                {isGuest
                  ? `You are playing as ${playerIdentity?.displayName ?? "a guest pilot"}. The server is still tracking your rating at ELO ${elo}.`
                  : `Signed in as ${playerIdentity?.displayName ?? authUser?.name ?? "GeoSwipe pilot"} with a live rating of ELO ${elo}.`}
              </p>
            </div>

            <div className="gs-shell-rank-pill">
              {isGuest ? <GlobeHemisphereWest size={18} weight="fill" /> : <SealCheck size={18} weight="fill" />}
              <span>{isGuest ? "Guest tracked" : "Account linked"}</span>
            </div>
          </div>

          {isGuest ? (
            <div className="gs-shell-auth-wrap">
              <GoogleAuthPanel
                compact
                user={authUser}
                onSignIn={onGoogleSignIn}
                onSignOut={onGoogleSignOut}
                title="Sign in to lock your rank"
                subtitle="Your guest data is already on the server. Signing in upgrades this player so the same score history follows you everywhere."
              />
            </div>
          ) : null}
        </section>

        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.18s" } as CSSProperties}>
          <div className="gs-shell-section-head">
            <p className="gs-shell-kicker">Top Window</p>
            <h3>Current Competition</h3>
          </div>

          {topEntries.length > 0 ? (
            <div className="gs-profile-leaderboard">
              {topEntries.map((entry) => {
                const medal = entry.rank === 1 ? "\uD83E\uDD47" : entry.rank === 2 ? "\uD83E\uDD48" : entry.rank === 3 ? "\uD83E\uDD49" : null;

                return (
                  <div key={`${entry.playerId}-${entry.rank}`} className={`gs-profile-leaderboard-row${entry.isYou ? " is-you" : ""}`}>
                    <span className="gs-profile-leaderboard-rank">{medal ?? `${entry.rank}.`}</span>
                    <span className="gs-profile-leaderboard-name">{entry.name}</span>
                    <span className="gs-profile-leaderboard-elo">ELO {entry.elo}</span>
                    {entry.isYou ? (
                      <span className="gs-profile-leaderboard-badge">
                        <Trophy size={12} weight="fill" />
                        You
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="gs-profile-empty">No leaderboard rows have come back from the API yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
