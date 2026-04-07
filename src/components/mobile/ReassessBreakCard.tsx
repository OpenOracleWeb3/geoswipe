import { ArrowRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { BreakContextPayload, GeoRound, RoundOutcome } from "../../types/game";

interface ReassessBreakCardProps {
  round: GeoRound;
  outcome: RoundOutcome;
  context: BreakContextPayload | null;
  onContinue: () => void;
}

export function ReassessBreakCard({
  round,
  outcome,
  context,
  onContinue
}: ReassessBreakCardProps) {
  return (
    <section className="gs-break-card">
      <div className="gs-break-headline">
        <WarningCircle size={18} weight="fill" />
        <div>
          <p>Reassess the read</p>
          <h2>{context?.headline ?? "Missed read"}</h2>
        </div>
      </div>

      <div className="gs-break-grid">
        <article className="gs-break-primary">
          <div className="gs-break-primary-copy" style={{ padding: "20px 22px", minHeight: 180, justifyContent: "center" }}>
            <span>{outcome.timedOut ? "Timed out" : `You chose ${outcome.selectedAnswer}`}</span>
            <strong>{context?.subhead ?? `Correct answer: ${round.correctAnswer}`}</strong>
          </div>
        </article>

        <article className="gs-break-context">
          <div className="gs-break-context-top">
            <CheckCircle size={16} weight="fill" />
            <span>Correct answer context</span>
          </div>
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: "18px 20px 20px"
            }}
          >
            {(context?.clueChips ?? []).map((chip) => (
              <div
                key={chip}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontWeight: 600
                }}
              >
                {chip}
              </div>
            ))}
            <div style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
              Street View only mode is enabled for the run, so reassess screens stay text-first instead of showing static reference images.
            </div>
          </div>
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
        <ArrowRight size={16} weight="bold" />
      </button>
    </section>
  );
}
