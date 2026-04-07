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
        Home
      </button>
      <button className={active === "play" ? "active" : ""} onClick={() => onChange("play")}>
        <CompassRose size={18} weight="fill" />
        Play
      </button>
      <button className={active === "leaderboard" ? "active" : ""} onClick={() => onChange("leaderboard")}>
        <Rows size={18} weight="fill" />
        Leaders
      </button>
      <button className={active === "profile" ? "active" : ""} onClick={() => onChange("profile")}>
        <UserCircle size={18} weight="fill" />
        Profile
      </button>
    </nav>
  );
}
