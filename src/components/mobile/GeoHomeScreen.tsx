import { useState, useEffect } from "react";

const CONTINENTS = [
  "M 120 85 Q 125 80 135 78 L 145 80 Q 155 82 158 88 L 160 95 Q 158 105 150 112 L 140 118 Q 132 120 128 115 L 122 108 Q 118 100 118 92 Z",
  "M 148 135 Q 152 130 156 132 L 160 138 Q 162 148 160 158 L 155 168 Q 150 175 147 170 L 144 160 Q 142 148 145 140 Z",
  "M 195 78 Q 200 75 206 77 L 210 82 Q 212 88 208 92 L 202 95 Q 196 94 194 88 Z",
  "M 198 105 Q 204 100 210 102 L 215 110 Q 218 122 215 135 L 210 145 Q 205 150 200 145 L 196 135 Q 193 120 195 110 Z",
  "M 220 70 Q 230 65 245 68 L 260 75 Q 268 82 265 90 L 255 98 Q 245 102 235 98 L 225 92 Q 218 85 218 78 Z",
  "M 265 145 Q 272 140 280 142 L 285 148 Q 286 155 282 158 L 274 160 Q 268 158 266 152 Z",
];

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.6 + 0.2,
  delay: Math.random() * 4,
}));

function Globe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} style={{ width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="globeGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1a5276" />
          <stop offset="45%" stopColor="#0e3d5c" />
          <stop offset="100%" stopColor="#061a2b" />
        </radialGradient>
        <radialGradient id="globeShine" cx="30%" cy="25%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="atmosGlow" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="rgba(52,152,219,0)" />
          <stop offset="95%" stopColor="rgba(52,152,219,0.15)" />
          <stop offset="100%" stopColor="rgba(52,152,219,0.3)" />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx="200" cy="200" r="155" />
        </clipPath>
        <filter id="continentGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="200" cy="200" r="170" fill="url(#atmosGlow)" />
      <circle cx="200" cy="200" r="155" fill="url(#globeGrad)" />

      <g clipPath="url(#globeClip)" opacity="0.08" stroke="#88c8e8" strokeWidth="0.7" fill="none">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <ellipse key={`lat-${i}`} cx="200" cy="200" rx={155} ry={22 * i} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`lon-${i}`}
            cx="200"
            cy="200"
            rx={25 * i + 5}
            ry={155}
            transform={`rotate(${i * 30} 200 200)`}
          />
        ))}
      </g>

      <g clipPath="url(#globeClip)" filter="url(#continentGlow)">
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} fill="#2ecc71" opacity="0.55" stroke="#27ae60" strokeWidth="0.8" />
        ))}
      </g>

      <circle cx="200" cy="200" r="155" fill="url(#globeShine)" />
    </svg>
  );
}

function StarField() {
  return (
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
            animation: `gs-home-twinkle ${2 + s.delay}s ease-in-out infinite alternate`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

interface GeoHomeScreenProps {
  onStartSolo: () => void;
  onProfile: () => void;
  elo: number;
}

export function GeoHomeScreen({ onStartSolo, onProfile, elo }: GeoHomeScreenProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [globeRotation, setGlobeRotation] = useState(0);

  useEffect(() => {
    setLoaded(true);
    const interval = setInterval(() => {
      setGlobeRotation((r) => r + 0.15);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const modes = [
    { id: "solo", label: "Solo", icon: "\uD83C\uDFAF", available: true, desc: "Test your geography knowledge" },
    { id: "coop", label: "Co-op", icon: "\uD83E\uDD1D", available: false, desc: "Coming Soon" },
    { id: "competitive", label: "Competitive", icon: "\u2694\uFE0F", available: false, desc: "Coming Soon" },
  ];

  const handleModeClick = (modeId: string) => {
    if (modeId === "solo") {
      onStartSolo();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #03090f 0%, #0a1628 30%, #0d1f3c 60%, #081224 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Outfit', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "40px 20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Dela+Gothic+One&display=swap');

        @keyframes gs-home-twinkle {
          0% { opacity: 0.15; }
          100% { opacity: 0.8; }
        }

        @keyframes gs-home-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes gs-home-pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.15), inset 0 1px 0 rgba(255,255,255,0.06); }
          50% { box-shadow: 0 0 35px rgba(46, 204, 113, 0.3), inset 0 1px 0 rgba(255,255,255,0.1); }
        }

        @keyframes gs-home-slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gs-home-scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes gs-home-titleReveal {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); letter-spacing: 12px; }
          to { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 4px; }
        }

        @keyframes gs-home-borderWave {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }

        .gs-home-mode-btn {
          position: relative;
          width: 260px;
          padding: 16px 24px;
          border: 1px solid rgba(46, 204, 113, 0.25);
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(13, 31, 60, 0.9), rgba(6, 20, 40, 0.95));
          color: #e8f4ea;
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          backdrop-filter: blur(12px);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          overflow: hidden;
        }

        .gs-home-mode-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.08), transparent);
          opacity: 0;
          transition: opacity 0.35s;
        }

        .gs-home-mode-btn:hover::before {
          opacity: 1;
        }

        .gs-home-mode-btn:hover {
          border-color: rgba(46, 204, 113, 0.6);
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 8px 32px rgba(46, 204, 113, 0.2), 0 0 60px rgba(46, 204, 113, 0.08);
        }

        .gs-home-mode-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .gs-home-mode-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .gs-home-mode-btn.disabled:hover {
          transform: none;
          box-shadow: none;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .gs-home-mode-btn.disabled:hover::before {
          opacity: 0;
        }

        .gs-home-wave-border-left, .gs-home-wave-border-right {
          position: absolute;
          top: 0;
          width: 6px;
          height: 100%;
          background: repeating-linear-gradient(
            180deg,
            rgba(46, 204, 113, 0.3) 0px,
            rgba(52, 152, 219, 0.2) 20px,
            rgba(46, 204, 113, 0.1) 40px,
            transparent 60px,
            rgba(46, 204, 113, 0.3) 80px
          );
          background-size: 100% 200%;
          animation: gs-home-borderWave 6s linear infinite;
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 120'%3E%3Cpath d='M3 0 Q6 15 3 30 Q0 45 3 60 Q6 75 3 90 Q0 105 3 120' stroke='white' stroke-width='6' fill='none'/%3E%3C/svg%3E");
          mask-repeat: repeat-y;
          mask-size: 6px 120px;
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 120'%3E%3Cpath d='M3 0 Q6 15 3 30 Q0 45 3 60 Q6 75 3 90 Q0 105 3 120' stroke='white' stroke-width='6' fill='none'/%3E%3C/svg%3E");
          -webkit-mask-repeat: repeat-y;
          -webkit-mask-size: 6px 120px;
        }

        .gs-home-wave-border-left { left: 12px; }
        .gs-home-wave-border-right { right: 12px; animation-direction: reverse; }

        .gs-home-elo-badge {
          animation: gs-home-pulseGlow 3s ease-in-out infinite;
        }
      `}</style>

      <StarField />

      <div className="gs-home-wave-border-left" />
      <div className="gs-home-wave-border-right" />

      {/* Title */}
      <div style={{
        animation: loaded ? "gs-home-titleReveal 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards" : "none",
        opacity: loaded ? 1 : 0,
        zIndex: 2,
        textAlign: "center",
        marginBottom: 8,
      }}>
        <h1 style={{
          fontFamily: "'Dela Gothic One', sans-serif",
          fontSize: "clamp(42px, 8vw, 64px)",
          color: "transparent",
          background: "linear-gradient(135deg, #2ecc71 0%, #3498db 50%, #2ecc71 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          margin: 0,
          letterSpacing: "4px",
          textTransform: "uppercase",
          filter: "drop-shadow(0 2px 20px rgba(46, 204, 113, 0.3))",
        }}>
          GeoSwipe
        </h1>
      </div>

      {/* ELO Badge — tappable to open profile */}
      <div className="gs-home-elo-badge" role="button" tabIndex={0} onClick={onProfile} onKeyDown={(e) => e.key === "Enter" && onProfile()} style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 22px",
        borderRadius: 40,
        background: "linear-gradient(135deg, rgba(13, 31, 60, 0.85), rgba(6, 20, 40, 0.9))",
        border: "1px solid rgba(46, 204, 113, 0.2)",
        marginBottom: 32,
        zIndex: 2,
        animation: loaded ? "gs-home-slideUp 0.6s 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both" : "none",
      }}>
        <span style={{ fontSize: 18 }}>{"\uD83C\uDF0D"}</span>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>ELO</span>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#2ecc71",
          letterSpacing: 1,
        }}>{elo}</span>
      </div>

      {/* Globe + Buttons */}
      <div style={{
        position: "relative",
        width: "min(360px, 85vw)",
        height: "min(360px, 85vw)",
        animation: loaded ? "gs-home-scaleIn 0.9s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both, gs-home-float 8s 1.5s ease-in-out infinite" : "none",
        zIndex: 2,
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${globeRotation}deg)`,
        }}>
          <Globe />
        </div>

        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          zIndex: 3,
        }}>
          {modes.map((mode, i) => (
            <button
              key={mode.id}
              className={`gs-home-mode-btn ${!mode.available ? "disabled" : ""}`}
              onMouseEnter={() => mode.available && setHoveredBtn(mode.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              disabled={!mode.available}
              onClick={() => handleModeClick(mode.id)}
              style={{
                animation: loaded ? `gs-home-slideUp 0.5s ${0.5 + i * 0.12}s cubic-bezier(0.25, 0.46, 0.45, 0.94) both` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{mode.icon}</span>
                <span>{mode.label}</span>
              </div>
              {hoveredBtn === mode.id && mode.available && (
                <div style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 4,
                  letterSpacing: 0.5,
                  textTransform: "none",
                }}>
                  {mode.desc}
                </div>
              )}
              {!mode.available && (
                <div style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 3,
                  letterSpacing: 0.8,
                }}>
                  {mode.desc}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40,
        zIndex: 2,
        opacity: loaded ? 0.3 : 0,
        transition: "opacity 1.5s 1s",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12,
        color: "#fff",
        letterSpacing: 3,
        textTransform: "uppercase",
      }}>
        Swipe the world
      </div>
    </div>
  );
}
