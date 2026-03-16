import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { BreakContextPayload, GeoRound, RoundOutcome } from "../../types/game";

interface ReassessBreakCardProps {
  round: GeoRound;
  outcome: RoundOutcome;
  originalImageUrl: string;
  context: BreakContextPayload | null;
  isLoading: boolean;
  onContinue: () => void;
}

export function ReassessBreakCard({
  round,
  outcome,
  originalImageUrl,
  context,
  isLoading,
  onContinue
}: ReassessBreakCardProps) {
  return (
    <section className="gs-break-card">
      <div className="gs-break-headline">
        <AlertTriangle size={18} />
        <div>
          <p>Reassess the read</p>
          <h2>{context?.headline ?? "Missed read"}</h2>
        </div>
      </div>

      <div className="gs-break-grid">
        <article className="gs-break-primary">
          <img src={originalImageUrl} alt="Original round" className="gs-break-primary-image" />
          <div className="gs-break-primary-copy">
            <span>{outcome.timedOut ? "Timed out" : `You chose ${outcome.selectedAnswer}`}</span>
            <strong>{context?.subhead ?? `Correct answer: ${round.correctAnswer}`}</strong>
          </div>
        </article>

        <article className="gs-break-context">
          <div className="gs-break-context-top">
            <CheckCircle2 size={16} />
            <span>Correct answer context</span>
          </div>
          {isLoading ? (
            <div className="gs-break-loading">Loading surrounding references...</div>
          ) : (
            <div className="gs-break-context-images">
              {(context?.imageUrls ?? []).map((imageUrl) => (
                <img key={imageUrl} src={imageUrl} alt={`${round.correctAnswer} context`} />
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="gs-chip-row">
        {(context?.clueChips ?? []).map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>

      <p className="gs-break-coaching">{context?.coachingLine ?? round.pair.coachingLine}</p>

      <button className="gs-primary-button" onClick={onContinue}>
        Back To The Run
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
