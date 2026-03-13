import type { RoundOutcome } from "../../types/game";

interface RivalScoreRailProps {
  playerScore: number;
  rivalScore: number;
  lastOutcome: RoundOutcome | null;
}

export function RivalScoreRail({ playerScore, rivalScore, lastOutcome }: RivalScoreRailProps) {
  const total = Math.max(1, playerScore + rivalScore);
  const playerWidth = Math.max(14, (playerScore / total) * 100);
  const rivalWidth = Math.max(14, (rivalScore / total) * 100);
  const margin = playerScore - rivalScore;

  return (
    <section className="gs-rival-rail">
      <div className="gs-rival-head">
        <article>
          <span>You</span>
          <strong>{playerScore.toLocaleString()}</strong>
        </article>
        <article className="rival">
          <span>Rival</span>
          <strong>{rivalScore.toLocaleString()}</strong>
        </article>
      </div>

      <div className="gs-rival-bars">
        <div className="gs-rival-bar player" style={{ width: `${playerWidth}%` }} />
        <div className="gs-rival-bar rival" style={{ width: `${rivalWidth}%` }} />
      </div>

      <p className="gs-rival-caption">
        {margin >= 0 ? `You lead by ${margin.toLocaleString()}` : `Rival leads by ${Math.abs(margin).toLocaleString()}`}
        {lastOutcome ? ` · ${lastOutcome.rival.eventLabel}` : ""}
      </p>
      <p className="gs-rival-flavor">{lastOutcome?.rival.flavorText ?? "Both scorelines start cold. Build the first edge."}</p>
    </section>
  );
}
