interface StreakMeterProps {
  streak: number;
  label: string;
  nextAt: number | null;
}

export function StreakMeter({ streak, label, nextAt }: StreakMeterProps) {
  const fillWidth = Math.min(100, (streak / 6) * 100);

  return (
    <section className="gs-streak-meter">
      <div className="gs-streak-copy">
        <article>
          <span>Streak</span>
          <strong>{streak}</strong>
        </article>
        <article>
          <span>Status</span>
          <strong>{label}</strong>
        </article>
        <article>
          <span>Next tier</span>
          <strong>{nextAt ? `${nextAt} correct` : "Maxed"}</strong>
        </article>
      </div>
      <div className="gs-streak-track">
        <div className={`gs-streak-fill ${streak >= 4 ? "hot" : ""}`} style={{ width: `${fillWidth}%` }} />
      </div>
    </section>
  );
}
