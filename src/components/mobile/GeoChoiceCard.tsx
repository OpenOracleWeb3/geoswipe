import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowBigLeft, ArrowBigRight, Check, CircleHelp, Sparkles, TimerReset, X } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { getCountryFlagUrl } from "../../data/countryFlags";
import type { GeoRound, RoundMedia, RoundOutcome, SwipeDirection } from "../../types/game";
import { StreetViewPanorama } from "../ui/StreetViewPanorama";

interface GeoChoiceCardProps {
  round: GeoRound;
  media: RoundMedia | null;
  cardsAhead: number;
  isLoadingImage: boolean;
  loadingProgress: number;
  timerProgress?: number | null;
  secondsLeft?: number | null;
  resultOutcome?: RoundOutcome | null;
  disabled: boolean;
  minimal?: boolean;
  modifierLabel?: string;
  onGuess: (direction: SwipeDirection) => void;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_ZONE_PREVIEW = 30;

export function GeoChoiceCard({
  round,
  media,
  cardsAhead,
  isLoadingImage,
  loadingProgress,
  timerProgress = null,
  secondsLeft = null,
  resultOutcome = null,
  disabled,
  minimal = false,
  modifierLabel,
  onGuess
}: GeoChoiceCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const swipeDirectionRef = useRef<SwipeDirection | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const leftHintOpacity = useTransform(x, [-220, -20, 0], [1, 0.22, 0.22]);
  const rightHintOpacity = useTransform(x, [0, 20, 220], [0.22, 0.22, 1]);
  const promptOpacity = useTransform(x, [-40, 0, 40], [0, 1, 0]);

  const activeCountry = swipeDirection === "left" ? round.leftOption : swipeDirection === "right" ? round.rightOption : null;
  const activeFlagUrl = activeCountry ? getCountryFlagUrl(activeCountry) : null;
  const isInteractiveStreetView = media?.kind === "streetview";
  const hasTimer = timerProgress !== null;
  const stackDepth = Math.min(3, Math.max(0, cardsAhead));
  const resultTone = resultOutcome?.correct ? "ok" : resultOutcome?.timedOut ? "timeout" : resultOutcome ? "bad" : null;
  const resultLabel = resultOutcome?.correct ? "YES" : resultOutcome?.timedOut ? "TIME" : resultOutcome ? "NO" : "";
  const resultKicker = resultOutcome?.correct ? "Locked in" : resultOutcome?.timedOut ? "Clock ran out" : "Missed read";
  const resultCaption = resultOutcome
    ? resultOutcome.correct
      ? `${resultOutcome.correctAnswer} · +${resultOutcome.scoreBreakdown.delta} pts`
      : `Correct answer: ${resultOutcome.correctAnswer}`
    : "";
  const frameStyle = {
    "--gs-load-progress": `${Math.max(0, Math.min(100, Math.round(loadingProgress)))}%`,
    "--gs-timer-progress": `${Math.max(0, Math.min(100, Math.round((timerProgress ?? 1) * 100)))}%`
  } as CSSProperties;

  const submitGuess = (direction: SwipeDirection) => {
    if (disabled) {
      return;
    }

    onGuess(direction);
  };

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) {
      return;
    }

    let nextDirection: SwipeDirection | null = null;

    if (info.offset.x < -SWIPE_ZONE_PREVIEW) {
      nextDirection = "left";
    } else if (info.offset.x > SWIPE_ZONE_PREVIEW) {
      nextDirection = "right";
    }

    if (nextDirection !== swipeDirectionRef.current) {
      if (nextDirection === "right") {
        triggerHaptic([15, 30, 15]);
      } else if (nextDirection === "left") {
        triggerHaptic(8);
      }
    }

    swipeDirectionRef.current = nextDirection;
    setSwipeDirection(nextDirection);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) {
      return;
    }

    const swipedLeft = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;
    const swipedRight = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD;

    setSwipeDirection(null);
    swipeDirectionRef.current = null;

    if (swipedLeft) {
      triggerHaptic(10);
      onGuess("left");
      return;
    }

    if (swipedRight) {
      triggerHaptic(10);
      onGuess("right");
      return;
    }

    x.set(0);
  };

  return (
    <div className={`gs-card-stage ${cardsAhead > 0 ? "has-stack" : ""}`}>
      {cardsAhead > 0 ? (
        <div className="gs-card-stack" aria-hidden="true">
          {Array.from({ length: stackDepth }, (_, index) => {
            const depth = stackDepth - index;
            return <div key={depth} className={`gs-stack-layer depth-${depth}`} />;
          })}
          <div className="gs-stack-count">
            <strong>{cardsAhead}</strong>
            <span>{cardsAhead === 1 ? "swipe left" : "swipes left"}</span>
          </div>
        </div>
      ) : null}

      <motion.div
        className={`gs-direction-hint gs-direction-left ${minimal ? "minimal" : ""}`}
        style={{ opacity: leftHintOpacity }}
      >
        <ArrowBigLeft size={20} />
        <span>{round.leftOption}</span>
      </motion.div>

      <motion.div
        className={`gs-direction-hint gs-direction-right ${minimal ? "minimal" : ""}`}
        style={{ opacity: rightHintOpacity }}
      >
        <span>{round.rightOption}</span>
        <ArrowBigRight size={20} />
      </motion.div>

      {minimal ? (
        <motion.div className="gs-center-prompt" style={{ opacity: promptOpacity }}>
          {isInteractiveStreetView ? "Explore then tap below" : "Swipe the image"}
        </motion.div>
      ) : null}

      <motion.article
        className={`gs-choice-card ${swipeDirection ? `gs-choice-card-swipe-${swipeDirection}` : ""}`}
        drag={disabled || isInteractiveStreetView ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragMomentum={true}
        style={{ x, rotate, opacity }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: disabled || isInteractiveStreetView ? 1 : 0.985 }}
      >
        {!minimal ? (
          <header className="gs-card-header">
            <div className="gs-card-meta-pills">
              <span className="gs-region-pill">{round.pair.regionTag}</span>
              {modifierLabel ? <span className="gs-modifier-pill">{modifierLabel}</span> : null}
            </div>
          </header>
        ) : null}

        <div className={`gs-image-frame ${isLoadingImage ? "loading" : hasTimer ? "timed" : "static"}`} style={frameStyle}>
          <div className={`gs-image-shell ${minimal ? "minimal" : ""} ${isInteractiveStreetView ? "interactive" : ""}`}>
            {isLoadingImage ? (
              <div className="gs-image-loading">
                <Sparkles size={18} />
                <strong>{Math.round(loadingProgress)}%</strong>
                <span>Loading location image...</span>
              </div>
            ) : media?.kind === "streetview" ? (
              <StreetViewPanorama media={media} alt="Geography challenge" />
            ) : media?.kind === "image" ? (
              <img src={media.url} alt="Geography challenge" className="gs-round-image" />
            ) : (
              <div className="gs-image-loading">
                <CircleHelp size={18} />
                <strong>Image unavailable</strong>
                <span>Skip this read if the scene never appears.</span>
              </div>
            )}

            {hasTimer && !isLoadingImage && secondsLeft !== null ? (
              <div className={`gs-image-timer ${secondsLeft <= 5 ? "urgent" : ""}`}>{secondsLeft}s</div>
            ) : null}

            <AnimatePresence>
              {resultOutcome && resultTone ? (
                <motion.div
                  key={`${round.id}:${resultLabel}`}
                  className={`gs-result-burst ${resultTone}`}
                  initial={{ opacity: 0, scale: 0.76, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24, mass: 0.9 }}
                >
                  <motion.div
                    className="gs-result-burst-card"
                    initial={{ rotate: resultOutcome.correct ? -4 : 4 }}
                    animate={{ rotate: resultOutcome.correct ? -2 : 2 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <span className="gs-result-burst-kicker">{resultKicker}</span>
                    <div className="gs-result-burst-main">
                      <span className="gs-result-burst-icon">
                        {resultOutcome.correct ? <Check size={24} /> : resultOutcome.timedOut ? <TimerReset size={24} /> : <X size={24} />}
                      </span>
                      <strong>{resultLabel}</strong>
                    </div>
                    <p>{resultCaption}</p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {swipeDirection && activeCountry ? (
              <div className={`gs-swipe-flag-badge ${swipeDirection}`}>
                {activeFlagUrl ? <img src={activeFlagUrl} alt={`${activeCountry} flag`} className="gs-swipe-flag-image" /> : null}
                <strong>{activeCountry}</strong>
              </div>
            ) : null}
          </div>
        </div>

        {!minimal ? (
          <section className="gs-choice-copy">
            <span className="gs-choice-kicker">
              {isInteractiveStreetView ? "Explore Street View, then choose a country" : "Swipe or tap a country"}
            </span>
            <div className="gs-choice-title">
              <CircleHelp size={18} />
              Where was this photo taken?
            </div>
            <p>{round.pair.rationale}</p>
            <div className="gs-choice-clues">
              {round.pair.visualTags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>
        ) : null}

        <footer className={`gs-choice-actions ${minimal ? "minimal" : ""}`}>
          <button
            className={`gs-choice-action gs-choice-action-left ${swipeDirection === "left" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("left")}
          >
            <span className="gs-choice-action-label">
              <ArrowBigLeft size={18} />
              {isInteractiveStreetView ? "Choose left" : "Swipe left"}
            </span>
            <strong>{round.leftOption}</strong>
          </button>
          <button
            className={`gs-choice-action gs-choice-action-right ${swipeDirection === "right" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("right")}
          >
            <span className="gs-choice-action-label">
              {isInteractiveStreetView ? "Choose right" : "Swipe right"}
              <ArrowBigRight size={18} />
            </span>
            <strong>{round.rightOption}</strong>
          </button>
        </footer>
      </motion.article>
    </div>
  );
}
