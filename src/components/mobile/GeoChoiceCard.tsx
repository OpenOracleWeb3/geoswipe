import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowBigLeft, ArrowBigRight, CircleHelp, Sparkles } from "lucide-react";
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
  elo?: number;
  eloDelta?: number | null;
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
  elo,
  eloDelta,
  onGuess
}: GeoChoiceCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const swipeDirectionRef = useRef<SwipeDirection | null>(null);
  const isStreetView = media?.kind === "streetview" && Boolean(media.panoId || media.coordinates);
  const panoMode = isStreetView;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const leftHintOpacity = useTransform(x, [-220, -20, 0], [1, 0.22, 0.22]);
  const rightHintOpacity = useTransform(x, [0, 20, 220], [0.22, 0.22, 1]);


  const activeCountry = swipeDirection === "left" ? round.leftOption : swipeDirection === "right" ? round.rightOption : null;
  const showFlags = round.mode === "country" || round.mode === "city";
  const flagLookup = round.mode === "city" ? round.mediaCountry : activeCountry;
  const activeFlagUrl = showFlags && flagLookup ? getCountryFlagUrl(flagLookup) : null;
  const hasTimer = timerProgress !== null;
  const stackDepth = Math.min(3, Math.max(0, cardsAhead));
  const totalRounds = round.roundNumber + cardsAhead;
  const isCorrect = resultOutcome?.correct ?? false;
  const isWrong = resultOutcome != null && !resultOutcome.correct;
  const resultTone = isCorrect ? "ok" : resultOutcome?.timedOut ? "timeout" : isWrong ? "bad" : null;
  const resultKicker = resultOutcome
    ? resultOutcome.correct
      ? "Locked in"
      : resultOutcome.timedOut
        ? "Time ran out"
        : "Missed it"
    : null;
  const resultHeadline = resultOutcome
    ? resultOutcome.correct
      ? resultOutcome.correctAnswer
      : `This was ${resultOutcome.correctAnswer}`
    : null;
  const resultCaption = resultOutcome
    ? resultOutcome.correct
      ? `Clean read. ${resultOutcome.scoreBreakdown.delta >= 0 ? `+${resultOutcome.scoreBreakdown.delta}` : resultOutcome.scoreBreakdown.delta} points added.`
      : resultOutcome.timedOut
        ? "No answer locked before the timer hit zero."
        : `You picked ${resultOutcome.selectedAnswer}.`
    : null;
  const resultScoreLabel = resultOutcome
    ? `${resultOutcome.scoreBreakdown.delta >= 0 ? "+" : ""}${resultOutcome.scoreBreakdown.delta} pts`
    : null;
  const resultEloLabel = eloDelta != null ? `${eloDelta >= 0 ? "+" : ""}${eloDelta} ELO` : null;
  const frameStyle = {
    "--gs-load-progress": `${Math.max(0, Math.min(100, Math.round(loadingProgress)))}%`,
    "--gs-timer-progress": `${Math.max(0, Math.min(100, Math.round((timerProgress ?? 1) * 100)))}%`
  } as CSSProperties;
  const questionLabel = round.mode === "city" ? "city" : round.mode === "continent" ? "continent" : "country";

  const submitGuess = (direction: SwipeDirection) => {
    if (disabled) return;
    onGuess(direction);
  };

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

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
    if (disabled) return;

    const swipedLeft = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;
    const swipedRight = info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD;

    setSwipeDirection(null);
    swipeDirectionRef.current = null;

    if (swipedLeft) { triggerHaptic(10); onGuess("left"); return; }
    if (swipedRight) { triggerHaptic(10); onGuess("right"); return; }
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

      {!panoMode ? (
        <>
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
        </>
      ) : null}


      <motion.article
        className={`gs-choice-card ${swipeDirection ? `gs-choice-card-swipe-${swipeDirection}` : ""} ${panoMode ? "explore-mode" : ""}`}
        drag={disabled || panoMode ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragMomentum={true}
        style={{ x, rotate, opacity }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: disabled || panoMode ? 1 : 0.985 }}
      >
        {/* ── Matt's ELO bar + round counter ── */}
        <header className="gs-card-header" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {elo != null ? (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 16,
                color: "#fff",
                letterSpacing: -0.5
              }}>
                ELO: {elo}
              </span>
            ) : null}
            {!minimal && modifierLabel ? (
              <span className="gs-modifier-pill">{modifierLabel}</span>
            ) : null}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            {hasTimer && !isLoadingImage && secondsLeft !== null ? (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: 14,
                color: secondsLeft <= 5 ? "#e74c3c" : "rgba(255,255,255,0.5)",
                minWidth: 32,
                textAlign: "right"
              }}>
                {secondsLeft}s
              </span>
            ) : null}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: 6
            }}>
              {round.roundNumber}/{totalRounds}
            </span>
          </div>
        </header>

        {/* ── Image area ── */}
        <div className={`gs-image-frame ${isLoadingImage ? "loading" : hasTimer ? "timed" : "static"}`} style={frameStyle}>
          <div className={`gs-image-shell ${minimal ? "minimal" : ""} ${panoMode ? "interactive" : ""}`}>
            {isLoadingImage ? (
                <div className="gs-image-loading">
                  <Sparkles size={18} />
                  <strong>{Math.round(loadingProgress)}%</strong>
                  <span>Loading Street View...</span>
                </div>
              ) : media?.kind === "streetview" ? (
              <StreetViewPanorama media={media} alt="Geography challenge" interactive={panoMode} />
            ) : null}

            <AnimatePresence>
              {resultOutcome && resultTone ? (
                <motion.div
                  key={`${round.id}:result`}
                  className={`gs-result-burst ${resultTone}`}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.95 }}
                >
                  <motion.div
                    className="gs-result-burst-card"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.97 }}
                    transition={{ delay: 0.04, duration: 0.24, ease: "easeOut" }}
                  >
                    <div className="gs-result-burst-header">
                      {resultKicker ? <span className="gs-result-burst-kicker">{resultKicker}</span> : null}
                      {resultEloLabel ? <span className="gs-result-burst-elo">{resultEloLabel}</span> : null}
                    </div>

                    {resultHeadline ? <strong className="gs-result-burst-title">{resultHeadline}</strong> : null}
                    {resultCaption ? <p className="gs-result-burst-body">{resultCaption}</p> : null}

                    <div className="gs-result-burst-meta">
                      {resultScoreLabel ? <span className="gs-result-burst-chip">{resultScoreLabel}</span> : null}
                      {elo != null ? <span className="gs-result-burst-chip">ELO {elo}</span> : null}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Swipe preview flag badge */}
            {swipeDirection && activeCountry ? (
              <div className={`gs-swipe-flag-badge ${swipeDirection}`}>
                {activeFlagUrl ? <img src={activeFlagUrl} alt={`${activeCountry} flag`} className="gs-swipe-flag-image" /> : null}
                <strong>{activeCountry}</strong>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Copy section (non-minimal) ── */}
        {!minimal ? (
          <section className="gs-choice-copy">
            <span className="gs-choice-kicker">
              {panoMode ? `Tap the ${questionLabel} that fits` : `Swipe or tap a ${questionLabel}`}
            </span>
            <div className="gs-choice-title">
              <CircleHelp size={18} />
              {round.mode === "city" ? "Which city is this?" : round.mode === "continent" ? "Which continent is this?" : "Where was this photo taken?"}
            </div>
            <p>{round.pair.rationale}</p>
            <div className="gs-choice-clues">
              {round.pair.visualTags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Option buttons (Matt's pill style) ── */}
        <footer className={`gs-choice-actions ${minimal ? "minimal" : ""} ${panoMode ? "pano" : ""}`}>
          <button
            className={`gs-choice-action gs-choice-action-left ${swipeDirection === "left" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("left")}
          >
            <span className="gs-choice-action-label">
              {panoMode ? "Tap to choose" : (
                <>
                  <ArrowBigLeft size={18} />
                  Swipe left
                </>
              )}
            </span>
            <strong>{round.leftOption}</strong>
          </button>
          <button
            className={`gs-choice-action gs-choice-action-right ${swipeDirection === "right" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("right")}
          >
            <span className="gs-choice-action-label">
              {panoMode ? "Tap to choose" : (
                <>
                  Swipe right
                  <ArrowBigRight size={18} />
                </>
              )}
            </span>
            <strong>{round.rightOption}</strong>
          </button>
        </footer>
      </motion.article>
    </div>
  );
}
