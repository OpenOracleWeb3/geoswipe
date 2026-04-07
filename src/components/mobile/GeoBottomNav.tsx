import { CompassRose, Info, Scroll } from "@phosphor-icons/react";

export type GeoView = "play" | "learn" | "session";

interface GeoBottomNavProps {
  active: GeoView;
  onChange: (view: GeoView) => void;
}

export function GeoBottomNav({ active, onChange }: GeoBottomNavProps) {
  return (
    <nav className="gs-bottom-nav">
      <button className={active === "play" ? "active" : ""} onClick={() => onChange("play")}>
        <CompassRose size={16} weight="fill" />
        Play
      </button>
      <button className={active === "learn" ? "active" : ""} onClick={() => onChange("learn")}>
        <Info size={16} weight="fill" />
        Guide
      </button>
      <button className={active === "session" ? "active" : ""} onClick={() => onChange("session")}>
        <Scroll size={16} weight="fill" />
        Run
      </button>
    </nav>
  );
}
