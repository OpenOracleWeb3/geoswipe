import type { StageMeta } from "../../types/game";

interface StageIntroCardProps {
  stage: StageMeta;
  playerScore: number;
  rivalScore: number;
  onStart: () => void;
}

export function StageIntroCard({ stage, playerScore, rivalScore, onStart }: StageIntroCardProps) {
  const margin = playerScore - rivalScore;

  return (
    <section className={`gs-stage-card ${stage.stage}`}>
      <p className="gs-stage-kicker">
        Stage {stage.stageNumber} · {stage.shortLabel}
      </p>
      <h2>{stage.introTitle}</h2>
      <p className="gs-stage-body">{stage.introBody}</p>

      <div className="gs-stage-grid">
        <article>
          <span>Timer</span>
          <strong>{stage.timerSeconds}s</strong>
        </article>
        <article>
          <span>Pressure</span>
          <strong>{stage.modifierLabel}</strong>
        </article>
        <article>
          <span>Rival pace</span>
          <strong>{Math.round(stage.rivalAccuracy * 100)}%</strong>
        </article>
        <article>
          <span>Score state</span>
          <strong>{margin >= 0 ? `+${margin}` : margin}</strong>
        </article>
      </div>

      <p className="gs-stage-note">{stage.pressureNote}</p>

      <button className="gs-primary-button" onClick={onStart}>
        Start Stage
      </button>
    </section>
  );
}
