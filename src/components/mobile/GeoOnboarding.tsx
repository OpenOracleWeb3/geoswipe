import { motion, AnimatePresence } from "framer-motion";
import { Compass, Flame, Swords, TimerReset } from "lucide-react";

interface GeoOnboardingProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Compass,
    title: "One photo, two countries",
    body: "Every round starts with one place image and a 30-second clock. Tap or swipe toward the country you think matches the scene."
  },
  {
    icon: Flame,
    title: "Streaks still matter",
    body: "Correct reads build a streak, and the scoring engine keeps rewarding consistent answers under pressure."
  },
  {
    icon: Swords,
    title: "The rival keeps pace",
    body: "A simulated rival scores alongside you during the run, so the margin can swing even when your card looks clean."
  },
  {
    icon: TimerReset,
    title: "Misses trigger context",
    body: "Wrong calls open a short reassess break with the right answer, clue chips, and extra context images before you continue."
  }
];

export function GeoOnboarding({ open, onClose }: GeoOnboardingProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="gs-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="gs-onboarding-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
          >
            <div className="gs-onboarding-brand">
              <span className="gs-onboarding-wordmark">GeoSwipe</span>
            </div>

            <p className="gs-sheet-brow">Map mode</p>
            <h2>Same run logic. Cleaner GeoSwipe presentation.</h2>
            <p className="gs-onboarding-lead">
              Lime actions, charcoal framing, softer copy, and one dominant image per read. The rules stay simple.
            </p>
            <div className="gs-onboarding-list">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="gs-onboarding-card">
                    <div className="gs-onboarding-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
            <button className="gs-primary-button" onClick={onClose}>
              Start Swiping
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
