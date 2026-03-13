import { motion, AnimatePresence } from "framer-motion";
import { Compass, Flame, MapPinned } from "lucide-react";

interface GeoOnboardingProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Compass,
    title: "Swipe to choose",
    body: "Every round shows one place image and two location options. Swipe toward the option you believe is correct."
  },
  {
    icon: Flame,
    title: "Build streak + score",
    body: "Hard rounds pay bigger points. Keep a streak alive to stack multipliers and level up faster."
  },
  {
    icon: MapPinned,
    title: "65% hard by design",
    body: "Each hour deck is tuned to 65% confusing look-alike rounds and 35% obvious contrast rounds."
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
            <div className="gs-sheet-handle" />
            <h2>How GeoSwipe Works</h2>
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
