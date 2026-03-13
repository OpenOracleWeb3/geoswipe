import { Compass, Info, ScrollText } from "lucide-react";

export type GeoView = "play" | "learn" | "session";

interface GeoBottomNavProps {
  active: GeoView;
  onChange: (view: GeoView) => void;
}

export function GeoBottomNav({ active, onChange }: GeoBottomNavProps) {
  return (
    <nav className="gs-bottom-nav">
      <button className={active === "play" ? "active" : ""} onClick={() => onChange("play")}>
        <Compass size={16} />
        Play
      </button>
      <button className={active === "learn" ? "active" : ""} onClick={() => onChange("learn")}>
        <Info size={16} />
        Guide
      </button>
      <button className={active === "session" ? "active" : ""} onClick={() => onChange("session")}>
        <ScrollText size={16} />
        Run
      </button>
    </nav>
  );
}
