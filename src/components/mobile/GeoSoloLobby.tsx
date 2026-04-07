import { CaretLeft, CompassRose, Crosshair, GlobeHemisphereWest, Lightning, MapTrifold, Trophy } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useState } from "react";
import { GoogleAuthPanel } from "../auth/GoogleAuthPanel";
import type { GoogleAuthUser, GoogleSignInPayload } from "../../services/googleIdentity";

const RANKS = [
  { name: "Bronze", min: 0, max: 799, color: "#cd7f32", icon: "\uD83E\uDD49" },
  { name: "Silver", min: 800, max: 1199, color: "#c0c0c0", icon: "\uD83E\uDD48" },
  { name: "Gold", min: 1200, max: 1599, color: "#ffd700", icon: "\uD83E\uDD47" },
  { name: "Platinum", min: 1600, max: 1999, color: "#7dd3fc", icon: "\uD83D\uDC8E" },
  { name: "Diamond", min: 2000, max: 9999, color: "#a78bfa", icon: "\uD83D\uDC51" }
];

const CATEGORIES = [
  { id: "cities", label: "Cities", desc: "Pin exact skylines, plazas, and landmark-heavy rounds.", difficulty: "Hard" as const },
  { id: "countries", label: "Countries", desc: "Read road clues, street furniture, and geography at speed.", difficulty: "Medium" as const },
  { id: "continents", label: "Continents", desc: "Broader reads, fast confidence, and cleaner streak building.", difficulty: "Easy" as const },
  { id: "worldwide", label: "World Wide", desc: "Mix every lane together for the full GeoSwipe pressure test.", difficulty: "Mixed" as const }
];

type Difficulty = (typeof CATEGORIES)[number]["difficulty"];

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; color: string }> = {
  Easy: { bg: "rgba(46,204,113,0.15)", color: "#2ecc71" },
  Medium: { bg: "rgba(241,196,15,0.15)", color: "#f1c40f" },
  Hard: { bg: "rgba(231,76,60,0.15)", color: "#e74c3c" },
  Mixed: { bg: "rgba(155,89,182,0.15)", color: "#9b59b6" }
};

const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: `${Math.random() * 1.8 + 0.4}px`,
  opacity: `${Math.random() * 0.5 + 0.15}`,
  delay: `${Math.random() * 5}s`
}));

function getRank(elo: number) {
  return RANKS.find((rank) => elo >= rank.min && elo <= rank.max) || RANKS[0];
}

function getProgress(elo: number) {
  const rank = getRank(elo);
  return ((elo - rank.min) / (rank.max - rank.min)) * 100;
}

function getCategoryIcon(categoryId: string) {
  switch (categoryId) {
    case "cities":
      return Crosshair;
    case "countries":
      return MapTrifold;
    case "continents":
      return GlobeHemisphereWest;
    default:
      return CompassRose;
  }
}

interface GeoSoloLobbyProps {
  onPlay: (category: string) => void;
  onBack: () => void;
  elo: number;
  authUser: GoogleAuthUser | null;
  onGoogleSignIn: (payload: GoogleSignInPayload) => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function GeoSoloLobby({ onPlay, onBack, elo, authUser, onGoogleSignIn, onGoogleSignOut }: GeoSoloLobbyProps) {
  const [loaded, setLoaded] = useState(false);

  const rank = getRank(elo);
  const progress = getProgress(elo);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];

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
        <button type="button" className="gs-shell-back" onClick={onBack}>
          <CaretLeft size={16} weight="bold" />
          Home
        </button>

        <div className="gs-shell-title-block">
          <p className="gs-shell-kicker">
            <Lightning size={15} weight="fill" />
            Solo Lobby
          </p>
          <h1 className="gs-shell-title">Pick Your Arena</h1>
          <p className="gs-shell-subtitle">Every queue drops you into a 20-round Street View sprint. Choose the lane you want to master.</p>
        </div>
      </header>

      <main className="gs-shell-stack">
        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.12s" } as CSSProperties}>
          <div className="gs-shell-hero-top">
            <div>
              <p className="gs-shell-kicker">Current Rating</p>
              <div className="gs-shell-hero-value">{elo}</div>
              <p className="gs-shell-hero-copy">You are currently running in the {rank.name} lane.</p>
            </div>

            <div
              className="gs-shell-rank-pill"
              style={
                {
                  "--rank-glow": `${rank.color}22`,
                  "--rank-border": `${rank.color}55`,
                  "--rank-color": rank.color
                } as CSSProperties
              }
            >
              <span className="gs-shell-rank-icon" aria-hidden="true">
                {rank.icon}
              </span>
              <span>{rank.name}</span>
            </div>
          </div>

          <div className="gs-shell-progress">
            <div className="gs-shell-progress-track">
              <div
                className="gs-shell-progress-fill"
                style={
                  {
                    width: `${progress}%`,
                    "--progress-color": rank.color
                  } as CSSProperties
                }
              />
            </div>
            <div className="gs-shell-progress-meta">
              <span>{rank.min}</span>
              <span>{nextRank ? `${nextRank.name} at ${nextRank.min}` : "Max rank reached"}</span>
            </div>
          </div>
        </section>

        <div className="gs-shell-auth-wrap gs-shell-animate" style={{ "--delay": "0.18s" } as CSSProperties}>
          <GoogleAuthPanel
            compact
            user={authUser}
            onSignIn={onGoogleSignIn}
            onSignOut={onGoogleSignOut}
            title={authUser ? "Account connected" : "Connect Google"}
            subtitle={
              authUser
                ? "Your run history and rating are attached to this synced account."
                : "Link your account before you queue so your climb survives every device."
            }
          />
        </div>

        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.24s" } as CSSProperties}>
          <div className="gs-shell-section-head">
            <p className="gs-shell-kicker">Choose Mode</p>
            <h3>Launch A Run</h3>
          </div>

          <div className="gs-lobby-category-grid">
            {CATEGORIES.map((category) => {
              const Icon = getCategoryIcon(category.id);
              const difficultyColor = DIFFICULTY_COLORS[category.difficulty];

              return (
                <button key={category.id} type="button" className="gs-lobby-category-card" onClick={() => onPlay(category.id)}>
                  <div className="gs-lobby-category-top">
                    <div className="gs-lobby-category-title">
                      <Icon size={20} weight="fill" />
                      <span>{category.label}</span>
                    </div>
                    <span
                      className="gs-lobby-difficulty"
                      style={{ background: difficultyColor.bg, color: difficultyColor.color }}
                    >
                      {category.difficulty}
                    </span>
                  </div>

                  <p className="gs-lobby-category-desc">{category.desc}</p>

                  <div className="gs-lobby-category-cta">
                    <Lightning size={15} weight="fill" />
                    Start run
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="gs-shell-card gs-shell-animate" style={{ "--delay": "0.30s" } as CSSProperties}>
          <div className="gs-shell-section-head">
            <p className="gs-shell-kicker">Rank Ladder</p>
            <h3>Where You Stand</h3>
          </div>

          <div className="gs-lobby-rank-list">
            {RANKS.map((tier) => {
              const isCurrent = tier.name === rank.name;

              return (
                <div
                  key={tier.name}
                  className={`gs-lobby-rank-row${isCurrent ? " is-current" : ""}`}
                  style={
                    isCurrent
                      ? ({
                          "--rank-glow": `${tier.color}18`,
                          "--rank-border": `${tier.color}44`,
                          "--rank-color": tier.color
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <span className="gs-lobby-rank-medal" aria-hidden="true">
                    {tier.icon}
                  </span>
                  <div className="gs-lobby-rank-copy">
                    <strong>{tier.name}</strong>
                    <span>
                      {tier.min} to {tier.max}+
                    </span>
                  </div>
                  {isCurrent ? (
                    <span className="gs-lobby-rank-current">
                      <Trophy size={14} weight="fill" />
                      You
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
