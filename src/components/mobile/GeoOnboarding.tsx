import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Compass, Hand, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

interface GeoOnboardingProps {
  playerName?: string | null;
  onComplete: () => Promise<void>;
}

const steps = [
  {
    icon: Compass,
    eyebrow: "Street View First",
    title: "Look around before you commit.",
    body: "GeoSwipe opens directly in the panorama. Read the road, skyline, and architecture first, then make the call from the bottom choice bar.",
    accent: "street",
    points: [
      "Panorama opens by default on every valid round.",
      "No extra mode switch or data map detour.",
      "Answer controls stay pinned at the bottom."
    ],
    stageLabel: "Panorama live",
    stageMetric: "360 read",
    chips: ["Signs", "Road lines", "Skyline"],
    footerLeft: "Tap left",
    footerRight: "Tap right"
  },
  {
    icon: Hand,
    eyebrow: "Fast Decisions",
    title: "Tap your answer when you are ready.",
    body: "The run is built around quick reads. Explore the scene, lock your guess, and move straight into the next city without extra break screens.",
    accent: "choice",
    points: [
      "Answer using the two fixed country buttons.",
      "Wrong answers resolve in-place and move on fast.",
      "The full run keeps its speed and pressure."
    ],
    stageLabel: "Choice rail",
    stageMetric: "2 options",
    chips: ["Left country", "Right country", "Timer live"],
    footerLeft: "Left choice",
    footerRight: "Right choice"
  },
  {
    icon: ShieldCheck,
    eyebrow: "Preserved Profile",
    title: "Your progress belongs to your account.",
    body: "Scores, sessions, and rating history now live on the server. Finish the intro once and the app keeps that state when you link Google or move devices later.",
    accent: "sync",
    points: [
      "Guest runs persist on the backend.",
      "Account linking preserves the full player record.",
      "Leaderboard, ELO, and history stay attached to one profile."
    ],
    stageLabel: "Server sync",
    stageMetric: "Postgres",
    chips: ["Runs", "ELO", "History"],
    footerLeft: "Guest data",
    footerRight: "Synced profile"
  }
] as const;

export function GeoOnboarding({ playerName, onComplete }: GeoOnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === steps.length - 1;
  const firstName = useMemo(() => {
    const raw = (playerName ?? "").trim();
    if (!raw) {
      return "Explorer";
    }

    return raw.split(/\s+/)[0] ?? "Explorer";
  }, [playerName]);

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not finish onboarding.");
      setIsSubmitting(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!isLastStep) {
      setError(null);
      setStepIndex((value) => value + 1);
      return;
    }

    await finishOnboarding();
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  return (
    <div className={`gs-ios-onboarding gs-ios-onboarding--${step.accent}`}>
      <div className="gs-ios-onboarding-backdrop" />
      <div className="gs-ios-onboarding-shell">
        <div className="gs-ios-onboarding-topbar">
          <span className="gs-ios-onboarding-pill">Welcome, {firstName}</span>
          <button
            type="button"
            className="gs-ios-onboarding-skip"
            onClick={() => void handleSkip()}
            disabled={isSubmitting}
          >
            Skip intro
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={step.title}
            className="gs-ios-onboarding-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="gs-ios-onboarding-copy">
              <span className="gs-ios-onboarding-kicker">{step.eyebrow}</span>
              <h1>{step.title}</h1>
              <p>{step.body}</p>
            </div>

            <div className="gs-ios-onboarding-device">
              <div className="gs-ios-onboarding-device-frame">
                <div className="gs-ios-onboarding-notch" />
                <div className="gs-ios-onboarding-device-topline">
                  <span>{step.stageLabel}</span>
                  <strong>{step.stageMetric}</strong>
                </div>
                <div className="gs-ios-onboarding-device-hero">
                  <div className="gs-ios-onboarding-icon-orb">
                    <Icon size={28} />
                  </div>
                  <div className="gs-ios-onboarding-chip-row">
                    {step.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </div>
                <div className="gs-ios-onboarding-choice-rail">
                  <div>{step.footerLeft}</div>
                  <div>{step.footerRight}</div>
                </div>
              </div>
            </div>

            <div className="gs-ios-onboarding-points">
              {step.points.map((point) => (
                <div key={point} className="gs-ios-onboarding-point">
                  <span />
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </AnimatePresence>

        <div className="gs-ios-onboarding-footer">
          <div className="gs-ios-onboarding-dots" aria-label="Onboarding progress">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={index === stepIndex ? "is-active" : ""}
                onClick={() => setStepIndex(index)}
                aria-label={`Go to onboarding step ${index + 1}`}
                disabled={isSubmitting}
              />
            ))}
          </div>

          {error ? <p className="gs-ios-onboarding-error">{error}</p> : null}

          <button
            type="button"
            className="gs-primary-button gs-ios-onboarding-cta"
            onClick={() => void handlePrimaryAction()}
            disabled={isSubmitting}
          >
            <span>{isLastStep ? (isSubmitting ? "Saving..." : "Start GeoSwipe") : "Continue"}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
