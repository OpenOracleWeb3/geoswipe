import { Gauge, Flame, Layers, Timer } from "lucide-react";

interface GameHudProps {
  score: number;
  streak: number;
  round: number;
  totalRounds: number;
  secondsLeft: number;
  level: number;
}

export function GameHud({ score, streak, round, totalRounds, secondsLeft, level }: GameHudProps) {
  return (
    <section className="gs-hud">
      <article>
        <div className="gs-hud-label">
          <Gauge size={14} /> Score
        </div>
        <strong>{score.toLocaleString()}</strong>
      </article>
      <article>
        <div className="gs-hud-label">
          <Flame size={14} /> Streak
        </div>
        <strong>{streak}</strong>
      </article>
      <article>
        <div className="gs-hud-label">
          <Layers size={14} /> Round
        </div>
        <strong>
          {round}/{totalRounds}
        </strong>
      </article>
      <article>
        <div className="gs-hud-label">
          <Timer size={14} /> Timer
        </div>
        <strong>{secondsLeft}s</strong>
      </article>
      <article>
        <div className="gs-hud-label">Level</div>
        <strong>{level}</strong>
      </article>
    </section>
  );
}
