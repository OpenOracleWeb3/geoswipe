import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowBigLeft, ArrowBigRight, CircleHelp, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { GeoRound, SwipeDirection } from "../../types/game";

interface GeoChoiceCardProps {
  round: GeoRound;
  imageUrl: string;
  isLoadingImage: boolean;
  disabled: boolean;
  onGuess: (direction: SwipeDirection) => void;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_ZONE_PREVIEW = 30;

export function GeoChoiceCard({
  round,
  imageUrl,
  isLoadingImage,
  disabled,
  onGuess
}: GeoChoiceCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const swipeDirectionRef = useRef<SwipeDirection | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const leftHintOpacity = useTransform(x, [-220, -20, 0], [1, 0.2, 0.2]);
  const rightHintOpacity = useTransform(x, [0, 20, 220], [0.2, 0.2, 1]);

  const difficultyLabel = useMemo(
    () => (round.difficulty === "hard" ? "HARD MATCHUP" : "EASY CONTRAST"),
    [round.difficulty]
  );

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

    let newDirection: SwipeDirection | null = null;

    if (info.offset.x < -SWIPE_ZONE_PREVIEW) {
      newDirection = "left";
    } else if (info.offset.x > SWIPE_ZONE_PREVIEW) {
      newDirection = "right";
    }

    if (newDirection !== swipeDirectionRef.current) {
      if (newDirection === "right") {
        triggerHaptic([15, 30, 15]);
      } else if (newDirection === "left") {
        triggerHaptic(8);
      }
    }

    swipeDirectionRef.current = newDirection;
    setSwipeDirection(newDirection);
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
    <div className="gs-card-stage">
      <motion.div className="gs-direction-hint gs-direction-left" style={{ opacity: leftHintOpacity }}>
        <ArrowBigLeft size={20} />
        {round.leftOption}
      </motion.div>

      <motion.div className="gs-direction-hint gs-direction-right" style={{ opacity: rightHintOpacity }}>
        {round.rightOption}
        <ArrowBigRight size={20} />
      </motion.div>

      <motion.article
        className={`gs-choice-card ${swipeDirection ? "gs-choice-card-swipe-active" : ""}`}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragMomentum={true}
        style={{ x, rotate, opacity }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
      >
        <header className="gs-card-header">
          <span className={`gs-difficulty-pill ${round.difficulty}`}>{difficultyLabel}</span>
          <span className="gs-region-pill">{round.pair.regionTag}</span>
        </header>

        <div className="gs-image-shell">
          {isLoadingImage ? (
            <div className="gs-image-loading">
              <Sparkles size={18} />
              Loading location image...
            </div>
          ) : (
            <img src={imageUrl} alt="Geography challenge" className="gs-round-image" />
          )}
        </div>

        <section className="gs-choice-copy">
          <div className="gs-choice-title">
            <CircleHelp size={18} />
            Where was this photo taken?
          </div>
          <p>{round.pair.rationale}</p>
        </section>

        <footer className="gs-choice-actions">
          <button disabled={disabled} onClick={() => submitGuess("left")}>
            Swipe Left: {round.leftOption}
          </button>
          <button disabled={disabled} onClick={() => submitGuess("right")}>
            Swipe Right: {round.rightOption}
          </button>
        </footer>
      </motion.article>
    </div>
  );
}
