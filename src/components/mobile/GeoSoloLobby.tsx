import { useState, useEffect } from "react";

const RANKS = [
  { name: "Bronze", min: 0, max: 799, color: "#cd7f32", icon: "\uD83E\uDD49" },
  { name: "Silver", min: 800, max: 1199, color: "#c0c0c0", icon: "\uD83E\uDD48" },
  { name: "Gold", min: 1200, max: 1599, color: "#ffd700", icon: "\uD83E\uDD47" },
  { name: "Platinum", min: 1600, max: 1999, color: "#7dd3fc", icon: "\uD83D\uDC8E" },
  { name: "Diamond", min: 2000, max: 9999, color: "#a78bfa", icon: "\uD83D\uDC51" },
];

const CATEGORIES = [
  { id: "cities", label: "Cities", icon: "\uD83C\uDFD9\uFE0F", desc: "Name the city from a photo", difficulty: "Hard" as const },
  { id: "countries", label: "Countries", icon: "\uD83D\uDDFA\uFE0F", desc: "Identify the country", difficulty: "Medium" as const },
  { id: "continents", label: "Continents", icon: "\uD83C\uDF0D", desc: "Which continent is this?", difficulty: "Easy" as const },
  { id: "worldwide", label: "World Wide", icon: "\uD83C\uDF10", desc: "All categories, any difficulty", difficulty: "Mixed" as const },
];

type Difficulty = (typeof CATEGORIES)[number]["difficulty"];

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; color: string }> = {
  Easy: { bg: "rgba(46,204,113,0.15)", color: "#2ecc71" },
  Medium: { bg: "rgba(241,196,15,0.15)", color: "#f1c40f" },
  Hard: { bg: "rgba(231,76,60,0.15)", color: "#e74c3c" },
  Mixed: { bg: "rgba(155,89,182,0.15)", color: "#9b59b6" },
};

const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.8 + 0.4,
  opacity: Math.random() * 0.5 + 0.15,
  delay: Math.random() * 5,
}));

function getRank(elo: number) {
  return RANKS.find((r) => elo >= r.min && elo <= r.max) || RANKS[0];
}

function getProgress(elo: number) {
  const rank = getRank(elo);
  return ((elo - rank.min) / (rank.max - rank.min)) * 100;
}

function DailyRumbleCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{timeLeft}</span>;
}

interface GeoSoloLobbyProps {
  onPlay: (category: string) => void;
  onBack: () => void;
  elo: number;
}

export function GeoSoloLobby({ onPlay, onBack, elo }: GeoSoloLobbyProps) {
  const [loaded, setLoaded] = useState(false);

  const rank = getRank(elo);
  const progress = getProgress(elo);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #03090f 0%, #0a1628 30%, #0d1f3c 60%, #081224 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Outfit', sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "0 16px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Dela+Gothic+One&family=JetBrains+Mono:wght@400;600;700&display=swap');

        @keyframes gs-lobby-twinkle {
          0% { opacity: 0.1; }
          100% { opacity: 0.7; }
        }

        @keyframes gs-lobby-slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gs-lobby-countdownPulse {
          0%, 100% { text-shadow: 0 0 12px rgba(46, 204, 113, 0.3); }
          50% { text-shadow: 0 0 24px rgba(46, 204, 113, 0.6); }
        }

        @keyframes gs-lobby-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes gs-lobby-progressFill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }

        @keyframes gs-lobby-borderWave {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }

        .gs-lobby-wave-left, .gs-lobby-wave-right {
          position: absolute;
          top: 0;
          width: 5px;
          height: 100%;
          background: repeating-linear-gradient(
            180deg,
            rgba(46, 204, 113, 0.25) 0px,
            rgba(52, 152, 219, 0.15) 20px,
            rgba(46, 204, 113, 0.08) 40px,
            transparent 60px,
            rgba(46, 204, 113, 0.25) 80px
          );
          background-size: 100% 200%;
          animation: gs-lobby-borderWave 6s linear infinite;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 120'%3E%3Cpath d='M3 0 Q6 15 3 30 Q0 45 3 60 Q6 75 3 90 Q0 105 3 120' stroke='white' stroke-width='6' fill='none'/%3E%3C/svg%3E");
          mask-repeat: repeat-y;
          mask-size: 5px 120px;
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 120'%3E%3Cpath d='M3 0 Q6 15 3 30 Q0 45 3 60 Q6 75 3 90 Q0 105 3 120' stroke='white' stroke-width='6' fill='none'/%3E%3C/svg%3E");
          -webkit-mask-repeat: repeat-y;
          -webkit-mask-size: 5px 120px;
          z-index: 1;
        }
        .gs-lobby-wave-left { left: 10px; }
        .gs-lobby-wave-right { right: 10px; animation-direction: reverse; }

        .gs-lobby-cat-btn {
          width: 100%;
          max-width: 320px;
          padding: 18px 28px;
          border-radius: 50px;
          border: 1.5px solid rgba(46, 204, 113, 0.2);
          background: linear-gradient(135deg, rgba(13, 31, 60, 0.85), rgba(6, 20, 40, 0.9));
          color: #e8f4ea;
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          backdrop-filter: blur(10px);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .gs-lobby-cat-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50px;
          background: linear-gradient(90deg, transparent, rgba(46,204,113,0.06), transparent);
          background-size: 200% 100%;
          animation: gs-lobby-shimmer 3s ease-in-out infinite;
        }

        .gs-lobby-cat-btn:hover {
          border-color: rgba(46, 204, 113, 0.5);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 28px rgba(46, 204, 113, 0.18), 0 0 50px rgba(46, 204, 113, 0.06);
          background: linear-gradient(135deg, rgba(18, 40, 72, 0.9), rgba(10, 28, 52, 0.95));
        }

        .gs-lobby-cat-btn:active {
          transform: translateY(1px) scale(0.98);
        }

        .gs-lobby-cat-btn.selected {
          border-color: rgba(46, 204, 113, 0.7);
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.15), rgba(10, 28, 52, 0.95));
          box-shadow: 0 0 30px rgba(46, 204, 113, 0.15);
        }

        .gs-lobby-difficulty-tag {
          position: absolute;
          right: 20px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.8px;
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .gs-lobby-rank-card {
          width: 100%;
          max-width: 360px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(145deg, rgba(13, 31, 60, 0.7), rgba(6, 16, 36, 0.85));
          backdrop-filter: blur(16px);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .gs-lobby-rank-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(46,204,113,0.3), transparent);
        }

        .gs-lobby-back-btn {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 10;
          padding: 8px 16px;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(13, 31, 60, 0.7);
          color: rgba(255,255,255,0.6);
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.25s;
          letter-spacing: 0.5px;
        }

        .gs-lobby-back-btn:hover {
          border-color: rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.85);
        }

        .gs-lobby-play-btn {
          width: 100%;
          max-width: 320px;
          padding: 18px 28px;
          border-radius: 50px;
          border: 2px solid rgba(46, 204, 113, 0.6);
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.08));
          color: #2ecc71;
          font-family: 'Outfit', sans-serif;
          font-size: 19px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .gs-lobby-play-btn:hover {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(46, 204, 113, 0.12));
          box-shadow: 0 0 40px rgba(46, 204, 113, 0.25);
          transform: translateY(-2px) scale(1.02);
        }

        .gs-lobby-play-btn:active {
          transform: translateY(1px) scale(0.98);
        }

        .gs-lobby-play-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.3);
          background: rgba(13, 31, 60, 0.5);
        }

        .gs-lobby-play-btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>

      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {STARS.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: "#fff",
              opacity: s.opacity,
              animation: `gs-lobby-twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="gs-lobby-wave-left" />
      <div className="gs-lobby-wave-right" />

      {/* Back button */}
      <button type="button" className="gs-lobby-back-btn" onClick={onBack}>
        {"\u2190"} Back
      </button>

      {/* Main content */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          marginTop: 48,
        }}
      >
        {/* ELO + Rank card */}
        <div
          className="gs-lobby-rank-card"
          style={{
            animation: loaded ? "gs-lobby-slideUp 0.6s 0.1s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              ELO
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 42,
                color: "#fff",
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {elo}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>{rank.icon}</span>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: rank.color,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {rank.name}
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  "--target-width": `${progress}%`,
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`,
                  animation: loaded ? "gs-lobby-progressFill 1.2s 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none",
                  boxShadow: `0 0 12px ${rank.color}44`,
                } as React.CSSProperties}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: 0.5,
              }}
            >
              <span>{rank.min}</span>
              <span>{nextRank ? `${nextRank.name} at ${nextRank.min}` : "Max Rank"}</span>
            </div>
          </div>
        </div>

        {/* Daily Rumble */}
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            textAlign: "center",
            marginBottom: 28,
            animation: loaded ? "gs-lobby-slideUp 0.6s 0.25s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none",
          }}
        >
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,165,0,0.15)",
              background: "linear-gradient(135deg, rgba(255,165,0,0.06), rgba(13,31,60,0.5))",
              padding: "16px 20px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,165,0,0.6)",
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Next Daily Rumble
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 32,
                fontWeight: 700,
                color: "#ffa500",
                letterSpacing: 2,
                animation: "gs-lobby-countdownPulse 2s ease-in-out infinite",
              }}
            >
              <DailyRumbleCountdown />
            </div>
          </div>
        </div>

        {/* Category buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            width: "100%",
            marginBottom: 28,
          }}
        >
          {CATEGORIES.map((cat, i) => {
            const dc = DIFFICULTY_COLORS[cat.difficulty];
            return (
              <button
                key={cat.id}
                className="gs-lobby-cat-btn"
                onClick={() => onPlay(cat.id)}
                style={{
                  animation: loaded
                    ? `gs-lobby-slideUp 0.5s ${0.4 + i * 0.1}s cubic-bezier(0.25,0.46,0.45,0.94) both`
                    : "none",
                }}
              >
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className="gs-lobby-difficulty-tag"
                  style={{ background: dc.bg, color: dc.color }}
                >
                  {cat.difficulty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Rank tiers */}
        <div
          className="gs-lobby-rank-card"
          style={{
            animation: loaded ? "gs-lobby-slideUp 0.6s 0.85s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Dela Gothic One', sans-serif",
              fontSize: 22,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: 4,
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            Rank
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RANKS.map((r) => {
              const isCurrent = r.name === rank.name;
              return (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: isCurrent
                      ? `linear-gradient(135deg, ${r.color}18, ${r.color}08)`
                      : "rgba(255,255,255,0.02)",
                    border: isCurrent ? `1px solid ${r.color}44` : "1px solid transparent",
                    transition: "all 0.3s",
                  }}
                >
                  <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: 15,
                        color: isCurrent ? r.color : "rgba(255,255,255,0.35)",
                        letterSpacing: 1,
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      {r.min} - {r.max}+
                    </div>
                  </div>
                  {isCurrent && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: r.color,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${r.color}15`,
                      }}
                    >
                      You
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
