import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowBigLeft, ArrowBigRight, CircleHelp, MapPin, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { getCountryFlagUrl } from "../../data/countryFlags";
import type { GeoRound, RoundMedia, RoundOutcome, SwipeDirection } from "../../types/game";
import { StreetViewPanorama } from "../ui/StreetViewPanorama";
import { StreetViewPullMap } from "../ui/StreetViewPullMap";

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
  const [exploreMode, setExploreMode] = useState(false);
  const [showPullMap, setShowPullMap] = useState(false);
  const swipeDirectionRef = useRef<SwipeDirection | null>(null);
  const isStreetView = media?.kind === "streetview" && Boolean(media.panoId);

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
  const frameStyle = {
    "--gs-load-progress": `${Math.max(0, Math.min(100, Math.round(loadingProgress)))}%`,
    "--gs-timer-progress": `${Math.max(0, Math.min(100, Math.round((timerProgress ?? 1) * 100)))}%`
  } as CSSProperties;

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


      <motion.article
        className={`gs-choice-card ${swipeDirection ? `gs-choice-card-swipe-${swipeDirection}` : ""}`}
        drag={disabled || exploreMode ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragMomentum={true}
        style={{ x, rotate, opacity }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: disabled || exploreMode ? 1 : 0.985 }}
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
          <div className={`gs-image-shell ${minimal ? "minimal" : ""}`}>
            {isLoadingImage ? (
              <div className="gs-image-loading">
                <Sparkles size={18} />
                <strong>{Math.round(loadingProgress)}%</strong>
                <span>Loading location image...</span>
              </div>
            ) : media?.kind === "streetview" ? (
              <StreetViewPanorama media={media} alt="Geography challenge" interactive={exploreMode} />
            ) : null}

            {/* Street View explore button — centered */}
            {isStreetView && !resultOutcome ? (
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 12,
                  zIndex: 15,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  pointerEvents: "none"
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowPullMap(true)}
                  style={{
                    pointerEvents: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 14px",
                    borderRadius: 24,
                    border: "1px solid rgba(255,255,255,0.24)",
                    background: "rgba(0,0,0,0.58)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    letterSpacing: 0.5,
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  <MapPin size={15} />
                  Data Map
                </button>

                {!exploreMode ? (
                  <button
                    type="button"
                    onClick={() => setExploreMode(true)}
                    style={{
                      pointerEvents: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 20px",
                      borderRadius: 24,
                      border: "1px solid rgba(255,255,255,0.3)",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      backdropFilter: "blur(10px)",
                      letterSpacing: 0.8,
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                    }}
                  >
                    <MapPin size={15} />
                    Street View
                  </button>
                ) : <div />}
              </div>
            ) : null}

            {/* Exit explore mode button */}
            {exploreMode && !resultOutcome ? (
              <button
                type="button"
                onClick={() => setExploreMode(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(231,76,60,0.7)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  letterSpacing: 0.5,
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                <X size={13} />
                Exit Explore
              </button>
            ) : null}

            {/* ── Matt's result burst ── */}
            <AnimatePresence>
              {resultOutcome && resultTone ? (
                <motion.div
                  key={`${round.id}:result`}
                  className={`gs-result-burst ${resultTone}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    background: isCorrect
                      ? "radial-gradient(ellipse at center, rgba(46,204,113,0.85) 0%, rgba(46,204,113,0.65) 100%)"
                      : "radial-gradient(ellipse at center, rgba(231,76,60,0.85) 0%, rgba(231,76,60,0.65) 100%)",
                    backdropFilter: "blur(8px)"
                  }}
                >
                  {/* Big result word */}
                  <motion.div
                    initial={{ scale: 0.5, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.05 }}
                    style={{
                      fontFamily: "'Dela Gothic One', 'Outfit', sans-serif",
                      fontSize: "clamp(36px, 10vw, 56px)",
                      fontWeight: 900,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      lineHeight: 1
                    }}
                  >
                    {isCorrect ? "CORRECT" : resultOutcome.timedOut ? "TIME UP" : "WRONG"}
                  </motion.div>

                  {/* ELO update */}
                  {eloDelta != null && elo != null ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 16
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 22,
                        color: "#fff"
                      }}>
                        <span>ELO: {elo}</span>
                        {eloDelta >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800,
                        fontSize: 28,
                        color: "#fff",
                        textShadow: "0 2px 12px rgba(0,0,0,0.3)"
                      }}>
                        {eloDelta >= 0 ? `+${eloDelta}` : eloDelta}
                      </div>
                    </motion.div>
                  ) : null}

                  {/* Correct answer caption */}
                  {!isCorrect ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.25 }}
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: 500
                      }}
                    >
                      Correct answer: {resultOutcome.correctAnswer}
                    </motion.p>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.25 }}
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: 500
                      }}
                    >
                      {resultOutcome.correctAnswer} · +{resultOutcome.scoreBreakdown.delta} pts
                    </motion.p>
                  )}
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
              Swipe or tap a {round.mode === "city" ? "city" : round.mode === "continent" ? "continent" : "country"}
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
        <footer className={`gs-choice-actions ${minimal ? "minimal" : ""}`}>
          <button
            className={`gs-choice-action gs-choice-action-left ${swipeDirection === "left" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("left")}
          >
            <span className="gs-choice-action-label">
              <ArrowBigLeft size={18} />
              {exploreMode ? "Tap left" : "Swipe left"}
            </span>
            <strong>{round.leftOption}</strong>
          </button>
          <button
            className={`gs-choice-action gs-choice-action-right ${swipeDirection === "right" ? "active" : ""}`}
            disabled={disabled}
            onClick={() => submitGuess("right")}
          >
            <span className="gs-choice-action-label">
              {exploreMode ? "Tap right" : "Swipe right"}
              <ArrowBigRight size={18} />
            </span>
            <strong>{round.rightOption}</strong>
          </button>
        </footer>
      </motion.article>

      {showPullMap ? <StreetViewPullMap round={round} onClose={() => setShowPullMap(false)} /> : null}
    </div>
  );
}
