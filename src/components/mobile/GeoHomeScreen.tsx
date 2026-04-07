import { GlobeHemisphereWest, Lightning, Sparkle, UserCircle } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useState } from "react";
import { GoogleAuthPanel } from "../auth/GoogleAuthPanel";
import type { GoogleAuthUser, GoogleSignInPayload } from "../../services/googleIdentity";

const CONTINENTS = [
  "M 120 85 Q 125 80 135 78 L 145 80 Q 155 82 158 88 L 160 95 Q 158 105 150 112 L 140 118 Q 132 120 128 115 L 122 108 Q 118 100 118 92 Z",
  "M 148 135 Q 152 130 156 132 L 160 138 Q 162 148 160 158 L 155 168 Q 150 175 147 170 L 144 160 Q 142 148 145 140 Z",
  "M 195 78 Q 200 75 206 77 L 210 82 Q 212 88 208 92 L 202 95 Q 196 94 194 88 Z",
  "M 198 105 Q 204 100 210 102 L 215 110 Q 218 122 215 135 L 210 145 Q 205 150 200 145 L 196 135 Q 193 120 195 110 Z",
  "M 220 70 Q 230 65 245 68 L 260 75 Q 268 82 265 90 L 255 98 Q 245 102 235 98 L 225 92 Q 218 85 218 78 Z",
  "M 265 145 Q 272 140 280 142 L 285 148 Q 286 155 282 158 L 274 160 Q 268 158 266 152 Z"
];

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: `${Math.random() * 2 + 0.5}px`,
  opacity: `${Math.random() * 0.6 + 0.2}`,
  delay: `${Math.random() * 4}s`
}));

function Globe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
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

interface GeoHomeScreenProps {
  onStartSolo: () => void;
  onProfile: () => void;
  elo: number;
  authUser: GoogleAuthUser | null;
  onGoogleSignIn: (payload: GoogleSignInPayload) => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
}

export function GeoHomeScreen({ onStartSolo, onProfile, elo, authUser, onGoogleSignIn, onGoogleSignOut }: GeoHomeScreenProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={`gs-home-screen${loaded ? " is-loaded" : ""}`}>
      <div className="gs-home-stars" aria-hidden="true">
        {STARS.map((star) => (
          <div
            key={star.id}
            className="gs-home-star"
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

      <div className="gs-home-wave gs-home-wave-left" aria-hidden="true" />
      <div className="gs-home-wave gs-home-wave-right" aria-hidden="true" />

      <div className="gs-home-inner">
        <div className="gs-home-title-block">
          <p className="gs-home-kicker">
            <GlobeHemisphereWest size={15} weight="fill" />
            Live Geo Arena
          </p>
          <h1 className="gs-home-title">GeoSwipe</h1>
        </div>

        <button type="button" className="gs-home-elo-badge" onClick={onProfile}>
          <UserCircle size={20} weight="fill" />
          <span className="gs-home-elo-label">Pilot</span>
          <strong>ELO {elo}</strong>
        </button>

        <div className="gs-home-auth-wrap">
          <GoogleAuthPanel
            compact
            user={authUser}
            onSignIn={onGoogleSignIn}
            onSignOut={onGoogleSignOut}
            title={authUser ? "Google account linked" : "Connect your profile"}
            subtitle={
              authUser
                ? "This GeoSwipe profile is synced and ready to travel with you."
                : "Sign in once and keep your rating, run history, and account attached."
            }
          />
        </div>

        <div className="gs-home-globe-stage">
          <div className="gs-home-globe-rotor">
            <Globe className="gs-home-globe-svg" />
          </div>

          <div className="gs-home-mode-stack">
            <button type="button" className="gs-home-mode-button" onClick={onStartSolo}>
              <span className="gs-home-mode-row">
                <Lightning size={18} weight="fill" />
                <span>Launch Solo Run</span>
              </span>
              <span className="gs-home-mode-desc">20 live Street View rounds. Fast reads, faster taps, one clean climb.</span>
            </button>
          </div>
        </div>

        <p className="gs-home-footer">
          <Sparkle size={16} weight="fill" />
          <span>Swipe the world.</span>
          <span aria-hidden="true">·</span>
          <span>Tap your pilot badge any time for profile and ranking.</span>
        </p>
      </div>
    </div>
  );
}
