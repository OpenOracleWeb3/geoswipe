import { Lightning, Speedometer, Stack, Timer } from "@phosphor-icons/react";

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
    { key: "stage", label: "Stage", value: stageLabel, icon: Stack },
    { key: "round", label: "Round", value: `${round}/${totalRounds}`, icon: Stack },
    { key: "timer", label: "Timer", value: `${secondsLeft}s`, icon: Timer },
    { key: "level", label: "Level", value: level, icon: Speedometer },
    { key: "pressure", label: "Pressure", value: modifierLabel, icon: Lightning }
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
                <Icon size={13} weight="fill" />
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
