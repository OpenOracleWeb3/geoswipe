import {
  Compass,
  Flame,
  Globe2,
  Map,
  RotateCcw,
  Target,
  Timer,
  Trophy,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { getNextRank, getRankForElo, getRankProgress } from "../../lib/rankingEngine";
import type { SessionSummary } from "../../types/game";

interface RunSummaryCardProps {
  summary: SessionSummary;
  startedAt: Date;
  eloDelta: number | null;
  elo: number;
  onRestart: () => void;
}

function formatDuration(startedAt: Date): string {
  const elapsedMs = Math.max(0, Date.now() - startedAt.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getHeadline(summary: SessionSummary): string {
  if (summary.playerWon && summary.margin >= 350) {
    return "You owned that run.";
  }

  if (summary.playerWon) {
    return "You closed ahead.";
  }

  if (summary.margin <= -350) {
    return "The rival broke the line late.";
  }

  return "The rival edged this one.";
}

function getSubhead(summary: SessionSummary): string {
  if (summary.playerWon && summary.accuracy >= 0.8) {
    return "Strong reads, low waste, and enough clean finishes to keep the rival chasing.";
  }

  if (summary.playerWon) {
    return "You stayed composed through the swing rounds and protected the margin.";
  }

  if (summary.accuracy >= 0.7) {
    return "The result was close. One or two cleaner reads would have flipped the board.";
  }

  return "The miss rate was too high to survive the pressure rounds. Run it back with sharper reads.";
}

function getMomentumLabel(summary: SessionSummary): string {
  if (summary.maxStreak >= 6) {
    return "Hot streak";
  }

  if (summary.accuracy >= 0.75) {
    return "High accuracy";
  }

  if (summary.margin >= 0) {
    return "Controlled finish";
  }

  return "Needs rematch";
}

export function RunSummaryCard({ summary, startedAt, eloDelta, elo, onRestart }: RunSummaryCardProps) {
  const rank = getRankForElo(elo);
  const nextRank = getNextRank(elo);
  const rankProgressPct = Math.round(getRankProgress(elo) * 100);
  const totalRounds = summary.difficultyCounts.easy + summary.difficultyCounts.medium + summary.difficultyCounts.hard;
  const duration = formatDuration(startedAt);
  const scoreCeiling = Math.max(summary.playerScore, summary.rivalScore, 1);
  const playerBar = Math.max(18, Math.round((summary.playerScore / scoreCeiling) * 100));
  const rivalBar = Math.max(18, Math.round((summary.rivalScore / scoreCeiling) * 100));
  const marginLabel = summary.margin >= 0 ? `+${summary.margin}` : `${summary.margin}`;
  const rankDeltaTone = eloDelta !== null && eloDelta >= 0 ? "up" : "down";
  const eloToNext = nextRank ? Math.max(0, nextRank.min - elo) : 0;
  const launchedAt = startedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <section className={`gs-run-summary ${summary.playerWon ? "won" : "lost"}`}>
      <div className="gs-run-summary-hero">
        <div className="gs-run-summary-copy">
          <div className="gs-run-summary-kicker-row">
            <span className="gs-run-summary-kicker">Run complete</span>
            <span className="gs-run-summary-status-pill">{getMomentumLabel(summary)}</span>
          </div>
          <h2>{getHeadline(summary)}</h2>
          <p>{getSubhead(summary)}</p>
        </div>

        <aside className="gs-run-summary-margin-card">
          <span>{summary.playerWon ? "Finish margin" : "Final gap"}</span>
          <strong>{marginLabel}</strong>
          <small>{summary.playerWon ? "Ahead of rival" : "Behind rival"}</small>
        </aside>
      </div>

      <div className="gs-run-summary-scoreboard">
        <article className="gs-run-score-card player">
          <div className="gs-run-score-head">
            <div className="gs-run-score-label">
              <Trophy size={16} />
              <span>You</span>
            </div>
            <strong>{summary.playerScore.toLocaleString()}</strong>
          </div>
          <div className="gs-run-score-meter">
            <div className="gs-run-score-fill" style={{ width: `${playerBar}%` }} />
          </div>
          <p>{summary.playerWon ? "Front-runner at the horn." : "Still enough signal to build on."}</p>
        </article>

        <article className="gs-run-score-card rival">
          <div className="gs-run-score-head">
            <div className="gs-run-score-label">
              <Compass size={16} />
              <span>Rival</span>
            </div>
            <strong>{summary.rivalScore.toLocaleString()}</strong>
          </div>
          <div className="gs-run-score-meter">
            <div className="gs-run-score-fill" style={{ width: `${rivalBar}%` }} />
          </div>
          <p>{summary.playerWon ? "The chase came up short." : "It converted more of the swing rounds."}</p>
        </article>
      </div>

      {eloDelta !== null ? (
        <article className="gs-run-rank-card">
          <div className="gs-run-rank-topline">
            <div className="gs-run-rank-tier">
              <span className="gs-run-rank-icon" aria-hidden="true">{rank.icon}</span>
              <div>
                <span>Current rank</span>
                <strong style={{ color: rank.color }}>{rank.name}</strong>
              </div>
            </div>

            <div className="gs-run-rank-numbers">
              <strong>{elo}</strong>
              <span className={`gs-run-rank-delta ${rankDeltaTone}`}>
                {eloDelta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
              </span>
            </div>
          </div>

          <div className="gs-run-rank-track">
            <div className="gs-run-rank-track-fill" style={{ width: `${rankProgressPct}%`, background: rank.color }} />
          </div>

          <div className="gs-run-rank-foot">
            <span>{rankProgressPct}% through {rank.name}</span>
            <span>{nextRank ? `${eloToNext} to ${nextRank.name}` : "Top tier reached"}</span>
          </div>
        </article>
      ) : null}

      <div className="gs-run-summary-panels">
        <article className="gs-run-summary-panel">
          <div className="gs-run-summary-panel-head">
            <Target size={16} />
            <span>Performance</span>
          </div>
          <div className="gs-run-summary-stats-grid">
            <div className="gs-run-stat-chip">
              <span>Accuracy</span>
              <strong>{Math.round(summary.accuracy * 100)}%</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>Correct reads</span>
              <strong>{summary.correctCount}/{totalRounds}</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>Best streak</span>
              <strong>{summary.maxStreak}</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>Run length</span>
              <strong>{duration}</strong>
            </div>
          </div>
        </article>

        <article className="gs-run-summary-panel">
          <div className="gs-run-summary-panel-head">
            <Map size={16} />
            <span>Coverage</span>
          </div>
          <div className="gs-run-summary-stats-grid">
            <div className="gs-run-stat-chip">
              <span>Countries seen</span>
              <strong>{summary.uniqueCountries}</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>World regions</span>
              <strong>{summary.uniqueWorldRegions}</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>Continents</span>
              <strong>{summary.uniqueContinents}</strong>
            </div>
            <div className="gs-run-stat-chip">
              <span>Hard rounds</span>
              <strong>{summary.difficultyCounts.hard}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="gs-run-summary-meta-row">
        <div className="gs-run-summary-meta-card">
          <Timer size={16} />
          <div>
            <span>Run launched</span>
            <strong>{launchedAt}</strong>
          </div>
        </div>

        <div className="gs-run-summary-meta-card">
          <Flame size={16} />
          <div>
            <span>Difficulty mix</span>
            <strong>
              E {summary.difficultyCounts.easy} · M {summary.difficultyCounts.medium} · H {summary.difficultyCounts.hard}
            </strong>
          </div>
        </div>

        <div className="gs-run-summary-meta-card">
          <Globe2 size={16} />
          <div>
            <span>Board state</span>
            <strong>{summary.playerWon ? "Cleared" : "Still contested"}</strong>
          </div>
        </div>
      </div>

      <button className="gs-primary-button gs-run-summary-cta" onClick={onRestart}>
        <RotateCcw size={16} />
        Start Another Run
      </button>
    </section>
  );
}
