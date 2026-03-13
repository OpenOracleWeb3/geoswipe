import { Gauge, Layers, Timer, Zap } from "lucide-react";

interface GameHudProps {
  round: number;
  totalRounds: number;
  secondsLeft: number;
  level: number;
  stageLabel: string;
  modifierLabel: string;
}

export function GameHud({ round, totalRounds, secondsLeft, level, stageLabel, modifierLabel }: GameHudProps) {
  const items = [
    { key: "stage", label: "Stage", value: stageLabel, icon: Layers },
    { key: "round", label: "Round", value: `${round}/${totalRounds}`, icon: Layers },
    { key: "timer", label: "Timer", value: `${secondsLeft}s`, icon: Timer },
    { key: "level", label: "Level", value: level, icon: Gauge },
    { key: "pressure", label: "Pressure", value: modifierLabel, icon: Zap }
  ] as const;

  return (
    <section className="gs-hud">
      {items.map((item) => {
        const Icon = item.icon;
        const cardClass = [
          "gs-hud-card",
          item.key === "timer" ? "timer" : "",
          item.key === "timer" && secondsLeft <= 10 ? "urgent" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <article key={item.key} className={cardClass}>
            <div className="gs-hud-label">
              <span className="gs-hud-icon">
                <Icon size={13} />
              </span>
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
          </article>
        );
      })}
    </section>
  );
}
