import { CaretLeft, Crosshair, Fire, Trophy, TrendUp } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useState } from "react";
import { getNextRank, getRankForElo, getRankProgress, type PlayerStats } from "../../lib/rankingEngine";
import { GoogleAuthPanel } from "../auth/GoogleAuthPanel";
import type { GoogleAuthUser, GoogleSignInPayload } from "../../services/googleIdentity";
import type { LeaderboardEntry } from "../../services/backendApi";

const STARS = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: `${Math.random() * 2 + 0.5}px`,
  opacity: `${Math.random() * 0.55 + 0.18}`,
  delay: `${Math.random() * 4.8}s`
}));

interface GeoProfileScreenProps {
  elo: number;
  onBack: () => void;
  playerLabel: string;
  playerEmail: string | null;
  playerAvatarUrl: string | null;
  stats: PlayerStats | null;
  leaderboard: LeaderboardEntry[];
  authUser: GoogleAuthUser | null;
  onGoogleSignIn: (payload: GoogleSignInPayload) => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function GeoProfileScreen({
  elo,
  onBack,
  playerLabel,
  playerEmail,
  playerAvatarUrl,
  stats,
  leaderboard,
  authUser,
  onGoogleSignIn,
  onGoogleSignOut
}: GeoProfileScreenProps) {
  const [loaded, setLoaded] = useState(false);

  const rank = getRankForElo(elo);
  const progress = getRankProgress(elo);
  const nextRank = getNextRank(elo);
  const accuracy = stats && stats.totalRounds > 0 ? Math.round((stats.totalCorrect / stats.totalRounds) * 100) : 0;
  const winRate = stats && stats.totalSessions > 0 ? Math.round((stats.wins / stats.totalSessions) * 100) : 0;

  useEffect(() => {
    setLoaded(true);
  }, []);

  const summaryStats = [
    { label: "Sessions", value: stats?.totalSessions ?? 0, icon: Trophy },
    { label: "Accuracy", value: `${accuracy}%`, icon: Crosshair },
    { label: "Best streak", value: stats?.bestStreak ?? 0, icon: Fire },
    { label: "Win rate", value: `${winRate}%`, icon: TrendUp }
  ];

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
        <button type="button" className="gs-shell-back" onClick={onBack}>
          <CaretLeft size={16} weight="bold" />
          Back
        </button>

        <div className="gs-shell-title-block">
          <p className="gs-shell-kicker">
            <Trophy size={15} weight="fill" />
            Pilot Profile
          </p>
          <h1 className="gs-shell-title">Rank + History</h1>
          <p className="gs-shell-subtitle">Your global rating, session record, and leaderboard position all live here.</p>
        </div>
      </header>

      <main className="gs-shell-stack">
        <section className="gs-shell-card gs-profile-hero gs-shell-animate" style={{ "--delay": "0.12s" } as CSSProperties}>
          <div className="gs-profile-identity">
            <div
              className="gs-profile-avatar"
              style={
                {
                  "--rank-border": rank.color,
                  "--rank-glow": `${rank.color}33`
                } as CSSProperties
              }
            >
              {playerAvatarUrl ? <img src={playerAvatarUrl} alt={playerLabel} /> : <span>{rank.icon}</span>}
            </div>

            <div className="gs-profile-name-block">
              <p className="gs-shell-kicker">Active Pilot</p>
              <h2 className="gs-profile-name">{playerLabel}</h2>
              <p className="gs-profile-email">{playerEmail ?? "Guest profile"}</p>

              <div className="gs-profile-rank-line">
                <div
                  className="gs-shell-rank-pill"
                  style={
                    {
                      "--rank-glow": `${rank.color}18`,
                      "--rank-border": `${rank.color}4d`,
                      "--rank-color": rank.color
                    } as CSSProperties
                  }
                >
                  <span className="gs-shell-rank-icon" aria-hidden="true">
                    {rank.icon}
                  </span>
                  <span>{rank.name}</span>
                </div>

                <span className="gs-profile-elo-pill">ELO {elo}</span>
              </div>
            </div>
          </div>

          <div className="gs-shell-progress">
            <div className="gs-shell-progress-track">
              <div
                className="gs-shell-progress-fill"
                style={
                  {
                    width: `${progress * 100}%`,
                    "--progress-color": rank.color
                  } as CSSProperties
                }
              />
            </div>
            <div className="gs-shell-progress-meta">
              <span>{rank.min}</span>
              <span>{nextRank ? `${nextRank.name} at ${nextRank.min}` : "Top tier reached"}</span>
            </div>
          </div>

          <div className="gs-profile-summary-grid">
            {summaryStats.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="gs-profile-summary-card">
                  <div className="gs-profile-summary-icon">
                    <Icon size={16} weight="fill" />
                  </div>
                  <div className="gs-profile-summary-copy">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="gs-shell-auth-wrap gs-shell-animate" style={{ "--delay": "0.18s" } as CSSProperties}>
          <GoogleAuthPanel
            compact
            user={authUser}
            onSignIn={onGoogleSignIn}
            onSignOut={onGoogleSignOut}
            title={authUser ? "Account status" : "Connect Google"}
            subtitle={
              authUser
                ? "This player is synced and ready to keep every score and session."
                : "Link your account so this pilot keeps every run, rank, and history entry."
            }
          />
        </div>

        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.24s" } as CSSProperties}>
          <div className="gs-shell-section-head">
            <p className="gs-shell-kicker">Leaderboard</p>
            <h3>Global Standings</h3>
          </div>

          {leaderboard.length > 0 ? (
            <div className="gs-profile-leaderboard">
              {leaderboard.map((entry) => {
                const medal = entry.rank === 1 ? "\uD83E\uDD47" : entry.rank === 2 ? "\uD83E\uDD48" : entry.rank === 3 ? "\uD83E\uDD49" : null;

                return (
                  <div key={`${entry.playerId}-${entry.rank}`} className={`gs-profile-leaderboard-row${entry.isYou ? " is-you" : ""}`}>
                    <span className="gs-profile-leaderboard-rank">{medal ?? `${entry.rank}.`}</span>
                    <span className="gs-profile-leaderboard-name">{entry.name}</span>
                    <span className="gs-profile-leaderboard-elo">ELO {entry.elo}</span>
                    {entry.isYou ? <span className="gs-profile-leaderboard-badge">You</span> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="gs-profile-empty">Leaderboard data will appear once the backend has enough live players.</div>
          )}
        </section>
      </main>
    </div>
  );
}
