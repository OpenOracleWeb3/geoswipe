import { RotateCcw, Trophy } from "lucide-react";
import type { SessionSummary } from "../../types/game";

interface RunSummaryCardProps {
  summary: SessionSummary;
  startedAt: Date;
  onRestart: () => void;
}

export function RunSummaryCard({ summary, startedAt, onRestart }: RunSummaryCardProps) {
  return (
    <section className="gs-run-summary">
      <div className="gs-run-summary-head">
        <div>
          <p>Run complete</p>
          <h2>{summary.playerWon ? "You finished ahead." : "The rival took this run."}</h2>
        </div>
        <div className="gs-run-badge">
          <Trophy size={18} />
          {summary.margin >= 0 ? `+${summary.margin}` : summary.margin}
        </div>
      </div>

      <div className="gs-session-grid">
        <article>
          <span>Player Score</span>
          <strong>{summary.playerScore.toLocaleString()}</strong>
        </article>
        <article>
          <span>Rival Score</span>
          <strong>{summary.rivalScore.toLocaleString()}</strong>
        </article>
        <article>
          <span>Accuracy</span>
          <strong>{Math.round(summary.accuracy * 100)}%</strong>
        </article>
        <article>
          <span>Correct</span>
          <strong>{summary.correctCount}</strong>
        </article>
        <article>
          <span>Max Streak</span>
          <strong>{summary.maxStreak}</strong>
        </article>
        <article>
          <span>Started</span>
          <strong>{startedAt.toLocaleTimeString()}</strong>
        </article>
      </div>

      <button className="gs-primary-button" onClick={onRestart}>
        <RotateCcw size={16} />
        Start Fresh Run
      </button>
    </section>
  );
}
