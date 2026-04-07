import { CompassRose, House, Rows, UserCircle } from "@phosphor-icons/react";

export type GeoView = "home" | "play" | "leaderboard" | "profile";

interface GeoBottomNavProps {
  active: GeoView;
  onChange: (view: GeoView) => void;
}

export function GeoBottomNav({ active, onChange }: GeoBottomNavProps) {
  return (
    <nav className="gs-bottom-nav">
      <button className={active === "home" ? "active" : ""} onClick={() => onChange("home")}>
        <House size={18} weight="fill" />
        <span className="gs-bottom-nav-label">Home</span>
      </button>
      <button className={active === "play" ? "active" : ""} onClick={() => onChange("play")}>
        <CompassRose size={18} weight="fill" />
        <span className="gs-bottom-nav-label">Play</span>
      </button>
      <button className={active === "leaderboard" ? "active" : ""} onClick={() => onChange("leaderboard")}>
        <Rows size={18} weight="fill" />
        <span className="gs-bottom-nav-label">Rank</span>
      </button>
      <button className={active === "profile" ? "active" : ""} onClick={() => onChange("profile")}>
        <UserCircle size={18} weight="fill" />
        <span className="gs-bottom-nav-label">Me</span>
      </button>
    </nav>
  );
}
