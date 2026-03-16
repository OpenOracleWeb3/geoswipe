import { useState, useEffect } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { getRankForElo, getRankProgress, getNextRank, loadPlayerStats, type PlayerStats } from "../../lib/rankingEngine";

interface GeoProfileScreenProps {
  elo: number;
  onBack: () => void;
}

// Fake leaderboard entries — in production these come from Postgres
function generateLeaderboard(playerElo: number): Array<{ name: string; elo: number; isYou: boolean }> {
  const names = [
    "GeoKing99", "MapMaster", "WanderLux", "AtlasAce",
    "NomadNova", "CompassPro", "TrekStar", "GlobeTrek",
    "RouteWiz", "TerraPilot", "DriftKing", "PathFinder",
    "ZoneRunner", "GridLock", "PoiHunter"
  ];

  const entries: Array<{ name: string; elo: number; isYou: boolean }> = [];

  // Generate players around the user's ELO
  for (let i = 0; i < names.length; i++) {
    const offset = Math.floor((i - 7) * 25 + (Math.sin(i * 3.7) * 40));
    entries.push({ name: names[i], elo: Math.max(0, playerElo + offset), isYou: false });
  }

  entries.push({ name: "You", elo: playerElo, isYou: true });
  entries.sort((a, b) => b.elo - a.elo);

  return entries;
}

export function GeoProfileScreen({ elo, onBack }: GeoProfileScreenProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  const rank = getRankForElo(elo);
  const progress = getRankProgress(elo);
  const nextRank = getNextRank(elo);
  const leaderboard = generateLeaderboard(elo);

  useEffect(() => {
    setStats(loadPlayerStats());
    setLoaded(true);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #03090f 0%, #0a1628 30%, #0d1f3c 60%, #081224 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Outfit', sans-serif",
      position: "relative",
      overflow: "auto",
      padding: "0 16px 40px",
      WebkitOverflowScrolling: "touch"
    }}>
      <style>{`
        @keyframes gs-profile-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gs-profile-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Banner art area */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        height: 120,
        borderRadius: "0 0 20px 20px",
        background: `linear-gradient(135deg, ${rank.color}33, ${rank.color}11)`,
        position: "relative",
        overflow: "hidden",
        marginBottom: -40
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 30% 40%, ${rank.color}22, transparent 70%)`,
        }} />
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.4)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{
          position: "absolute",
          top: 10,
          right: 14,
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: 1,
          textTransform: "uppercase"
        }}>
          Banner Art (Custom)
        </div>
      </div>

      {/* Profile section */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        animation: loaded ? "gs-profile-slideUp 0.5s 0.1s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none"
      }}>
        {/* Avatar */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: `3px solid ${rank.color}`,
          background: "linear-gradient(135deg, rgba(13,31,60,0.9), rgba(6,20,40,0.95))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: `0 0 20px ${rank.color}33`,
          marginBottom: 8
        }}>
          {rank.icon}
        </div>

        {/* Username */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#fff",
          letterSpacing: 0.5,
          marginBottom: 4
        }}>
          {stats?.totalSessions ? "Player" : "New Player"}
        </div>

        {/* ELO + Rank */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800,
            fontSize: 32,
            color: "#fff",
            letterSpacing: -1
          }}>
            ELO: {elo}
          </span>
        </div>

        <span style={{
          fontWeight: 700,
          fontSize: 16,
          color: rank.color,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 12
        }}>
          {rank.name}
        </span>

        {/* Progress bar */}
        <div style={{ width: "100%", maxWidth: 320, marginBottom: 20 }}>
          <div style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 3,
              background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`,
              boxShadow: `0 0 10px ${rank.color}44`,
              transition: "width 0.6s ease"
            }} />
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 11,
            color: "rgba(255,255,255,0.3)"
          }}>
            <span>{rank.min}</span>
            <span>{nextRank ? `${nextRank.name} at ${nextRank.min}` : "Max Rank"}</span>
          </div>
        </div>

        {/* Stats row */}
        {stats ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            width: "100%",
            maxWidth: 360,
            marginBottom: 24,
            animation: loaded ? "gs-profile-slideUp 0.5s 0.2s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none"
          }}>
            {[
              { label: "Sessions", value: stats.totalSessions },
              { label: "Win Rate", value: stats.totalSessions > 0 ? `${Math.round((stats.wins / stats.totalSessions) * 100)}%` : "---" },
              { label: "Best Streak", value: stats.bestStreak },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: "12px 8px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "#fff" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Leaderboard */}
        <div style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(145deg, rgba(13,31,60,0.7), rgba(6,16,36,0.85))",
          backdropFilter: "blur(16px)",
          padding: "20px 16px",
          position: "relative",
          overflow: "hidden",
          animation: loaded ? "gs-profile-slideUp 0.5s 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both" : "none"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)"
          }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            justifyContent: "center"
          }}>
            <Trophy size={18} color="#ffd700" />
            <span style={{
              fontFamily: "'Dela Gothic One', sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: 3,
              textTransform: "uppercase"
            }}>
              Leaderboard
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {leaderboard.map((entry, i) => {
              const position = i + 1;
              const isTop3 = position <= 3;
              const medalColor = position === 1 ? "#ffd700" : position === 2 ? "#c0c0c0" : position === 3 ? "#cd7f32" : undefined;

              return (
                <div
                  key={`${entry.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: entry.isYou
                      ? `linear-gradient(135deg, ${rank.color}18, ${rank.color}08)`
                      : "rgba(255,255,255,0.02)",
                    border: entry.isYou
                      ? `1.5px solid ${rank.color}55`
                      : "1px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  {/* Position */}
                  <span style={{
                    width: 28,
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: isTop3 ? 16 : 13,
                    color: medalColor ?? "rgba(255,255,255,0.25)"
                  }}>
                    {isTop3 ? (position === 1 ? "\uD83E\uDD47" : position === 2 ? "\uD83E\uDD48" : "\uD83E\uDD49") : `${position}.`}
                  </span>

                  {/* Name */}
                  <span style={{
                    flex: 1,
                    fontWeight: entry.isYou ? 700 : 500,
                    fontSize: 15,
                    color: entry.isYou ? rank.color : "rgba(255,255,255,0.5)",
                    letterSpacing: 0.3
                  }}>
                    {entry.name}
                  </span>

                  {/* ELO */}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    fontSize: 14,
                    color: entry.isYou ? "#fff" : "rgba(255,255,255,0.35)"
                  }}>
                    ELO {entry.elo}
                  </span>

                  {/* You badge */}
                  {entry.isYou ? (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: rank.color,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 20,
                      background: `${rank.color}15`
                    }}>
                      You
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
