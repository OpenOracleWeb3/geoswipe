import { RotateCcw, Trophy, TrendingDown, TrendingUp } from "lucide-react";
import { getRankForElo } from "../../lib/rankingEngine";
import type { SessionSummary } from "../../types/game";

interface RunSummaryCardProps {
  summary: SessionSummary;
  startedAt: Date;
  eloDelta: number | null;
  elo: number;
  onRestart: () => void;
}

export function RunSummaryCard({ summary, startedAt, eloDelta, elo, onRestart }: RunSummaryCardProps) {
  const rank = getRankForElo(elo);

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

      {eloDelta !== null ? (
        <div className="gs-elo-result" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 12,
          background: eloDelta >= 0
            ? "linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(46, 204, 113, 0.03))"
            : "linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.03))",
          border: `1px solid ${eloDelta >= 0 ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)"}`,
          marginBottom: 16
        }}>
          <span style={{ fontSize: 20 }}>{rank.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: rank.color }}>{elo}</span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            fontSize: 16,
            color: eloDelta >= 0 ? "#2ecc71" : "#e74c3c"
          }}>
            {eloDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
            {rank.name}
          </span>
        </div>
      ) : null}

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
