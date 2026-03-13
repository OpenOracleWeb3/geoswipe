import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, RefreshCcw } from "lucide-react";
import { GeoChoiceCard } from "./components/mobile/GeoChoiceCard";
import { GeoOnboarding } from "./components/mobile/GeoOnboarding";
import { ReassessBreakCard } from "./components/mobile/ReassessBreakCard";
import { RunSummaryCard } from "./components/mobile/RunSummaryCard";
import { useRoundFeedback } from "./hooks/useRoundFeedback";
import { calculateRoundScore } from "./lib/scoring";
import { buildSessionSummary, createGameSession } from "./lib/sessionEngine";
import { getBreakContextImages, getRoundMedia, getRoundMediaPreviewUrl } from "./services/geoApi";
import type { BreakContextPayload, GameMode, GamePhase, GeoRound, RoundMedia, RoundOutcome, SwipeDirection } from "./types/game";

const REASSESS_AFTER_MISSES = 3;
const RESULT_FLASH_MS = 1100;

function createSessionBundle(mode: GameMode) {
  const startedAt = new Date();
  const session = createGameSession(startedAt, mode);

  return { startedAt, session };
}

function roundTag(round: GeoRound): string {
  return `${round.difficulty.toUpperCase()} · ${round.pair.regionTag}`;
}

function getRoundModifierLabel(round: GeoRound): string {
  return (
    {
      none: "Standard",
      rival_surge: "Rival surge",
      high_value: "High value",
      speed_round: "Fast scoring"
    } as const
  )[round.modifier];
}

function GeoSwipeApp() {
  const initialBundle = useMemo(() => createSessionBundle("progressive"), []);
  const [mode, setMode] = useState<GameMode>(initialBundle.session.mode);
  const [onboardingOpen, setOnboardingOpen] = useState(() => localStorage.getItem("geoswipe:onboarding:v1") !== "seen");
  const [sessionStartedAt, setSessionStartedAt] = useState(initialBundle.startedAt);
  const [session, setSession] = useState(initialBundle.session);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("round_active");
  const [secondsLeft, setSecondsLeft] = useState(() => initialBundle.session.rounds[0]?.timerSeconds ?? 0);
  const [currentRoundMedia, setCurrentRoundMedia] = useState<RoundMedia | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageLoadProgress, setImageLoadProgress] = useState(0);
  const [breakContext, setBreakContext] = useState<BreakContextPayload | null>(null);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);

  const breakRequestRef = useRef(0);
  const transitionTimeoutRef = useRef<number | null>(null);
  const { playRoundFeedback } = useRoundFeedback();

  const currentRound = session.rounds[roundIndex] ?? null;
  const sessionDone = phase === "run_complete" || roundIndex >= session.rounds.length;
  const showMinimalHome = !sessionDone && (phase === "round_active" || phase === "round_result");
  const summary = useMemo(
    () =>
      buildSessionSummary({
        rounds: session.rounds,
        outcomes,
        playerScore,
        rivalScore,
        correctCount: correctGuesses,
        maxStreak
      }),
    [correctGuesses, maxStreak, outcomes, playerScore, rivalScore, session.rounds]
  );

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

  const startNewSession = (nextMode: GameMode = mode) => {
    const bundle = createSessionBundle(nextMode);

    clearTransitionTimeout();
    breakRequestRef.current += 1;
    setMode(nextMode);
    setSessionStartedAt(bundle.startedAt);
    setSession(bundle.session);
    setRoundIndex(0);
    setPhase("round_active");
    setSecondsLeft(bundle.session.rounds[0]?.timerSeconds ?? 0);
    setCurrentRoundMedia(null);
    setCurrentImageUrl("");
    setIsImageLoading(false);
    setImageLoadProgress(0);
    setBreakContext(null);
    setIsBreakLoading(false);
    setPlayerScore(0);
    setRivalScore(0);
    setStreak(0);
    setMissCount(0);
    setMaxStreak(0);
    setCorrectGuesses(0);
    setOutcomes([]);
    setLastOutcome(null);
  };

  useEffect(() => clearTransitionTimeout, []);

  useEffect(() => {
    if (!currentRound || sessionDone) {
      return;
    }

    let cancelled = false;
    let finalized = false;
    let settleTimeout: number | null = null;
    const progressTimer = window.setInterval(() => {
      setImageLoadProgress((value) => {
        if (value >= 90) {
          return value;
        }

        if (value < 24) {
          return Math.min(90, value + 12);
        }

        if (value < 58) {
          return Math.min(90, value + 8);
        }

        return Math.min(90, value + 4);
      });
    }, 140);

    const finalizeLoad = (previewUrl: string) => {
      if (cancelled || finalized) {
        return;
      }

      finalized = true;
      window.clearInterval(progressTimer);
      setCurrentImageUrl(previewUrl);
      setImageLoadProgress(100);
      settleTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setIsImageLoading(false);
        }
      }, 120);
    };

    setIsImageLoading(true);
    setImageLoadProgress(8);
    setCurrentRoundMedia(null);
    setCurrentImageUrl("");

    getRoundMedia(currentRound)
      .then((media) => {
        if (cancelled) {
          return;
        }

        const previewUrl = getRoundMediaPreviewUrl(media);
        setImageLoadProgress((value) => Math.max(value, 92));

        const previewImage = new Image();
        const handleReady = () => {
          setCurrentRoundMedia(media);
          finalizeLoad(previewUrl);
        };

        previewImage.onload = handleReady;
        previewImage.onerror = handleReady;
        previewImage.src = previewUrl;

        if (previewImage.complete) {
          handleReady();
        }
      })
      .catch(() => {
        window.clearInterval(progressTimer);
        if (!cancelled) {
          setCurrentRoundMedia(null);
          setCurrentImageUrl("");
          setImageLoadProgress(100);
          setIsImageLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
      if (settleTimeout !== null) {
        window.clearTimeout(settleTimeout);
      }
    };
  }, [currentRound?.id, session.seed, sessionDone]);

  useEffect(() => {
    if (!currentRound) {
      return;
    }

    setSecondsLeft(currentRound.timerSeconds);
  }, [currentRound?.id, session.seed]);

  const loadBreakContext = (round: GeoRound, outcome: RoundOutcome) => {
    const requestId = breakRequestRef.current + 1;
    breakRequestRef.current = requestId;
    setBreakContext(null);
    setIsBreakLoading(true);

    getBreakContextImages(round)
      .then((imageUrls) => {
        if (requestId !== breakRequestRef.current) {
          return;
        }

        const outcomeReason = outcome.timedOut ? "Timer expired before the read locked in." : `You chose ${outcome.selectedCountry}.`;

        setBreakContext({
          headline: outcome.timedOut ? "Timer expired" : `${outcome.selectedCountry} was the decoy`,
          subhead: `${outcomeReason} Correct answer: ${round.correctCountry}.`,
          clueChips: [roundTag(round), round.pair.visualTags.slice(0, 2).join(" · ")],
          coachingLine: round.pair.coachingLine,
          imageUrls
        });
      })
      .catch(() => {
        if (requestId !== breakRequestRef.current) {
          return;
        }

        setBreakContext({
          headline: "Reassess the read",
          subhead: `Correct answer: ${round.correctCountry}.`,
          clueChips: [roundTag(round), round.pair.visualTags.slice(0, 2).join(" · ")],
          coachingLine: round.pair.coachingLine,
          imageUrls: []
        });
      })
      .finally(() => {
        if (requestId === breakRequestRef.current) {
          setIsBreakLoading(false);
        }
      });
  };

  const advanceRound = () => {
    breakRequestRef.current += 1;
    setBreakContext(null);
    setIsBreakLoading(false);
    setLastOutcome(null);

    const nextIndex = roundIndex + 1;
    if (nextIndex >= session.rounds.length) {
      setRoundIndex(nextIndex);
      setPhase("run_complete");
      return;
    }

    setRoundIndex(nextIndex);
    setPhase("round_active");
    setSecondsLeft(session.rounds[nextIndex].timerSeconds);
  };

  const resolveRound = (direction: SwipeDirection, timedOut = false, timeRemainingOverride?: number) => {
    if (!currentRound || phase !== "round_active" || sessionDone) {
      return;
    }

    clearTransitionTimeout();

    const isCorrect = !timedOut && direction === currentRound.correctDirection;
    const selectedCountry = timedOut ? null : direction === "left" ? currentRound.leftOption : currentRound.rightOption;
    const breakdown = calculateRoundScore({
      isCorrect,
      difficulty: currentRound.difficulty,
      streak,
      timeRemainingSec: timeRemainingOverride ?? secondsLeft,
      timedOut,
      modifier: currentRound.modifier
    });

    const rival = session.rivalPlan[currentRound.id];
    const nextPlayerScore = Math.max(0, playerScore + breakdown.delta);
    const nextRivalScore = rivalScore + rival.delta;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const nextMaxStreak = Math.max(maxStreak, nextStreak);
    const nextMissCount = isCorrect ? 0 : missCount + 1;
    const outcome: RoundOutcome = {
      roundId: currentRound.id,
      correct: isCorrect,
      timedOut,
      selectedDirection: timedOut ? null : direction,
      selectedCountry,
      correctCountry: currentRound.correctCountry,
      scoreBreakdown: breakdown,
      rival,
      playerScoreAfter: nextPlayerScore,
      rivalScoreAfter: nextRivalScore,
      streakAfter: nextStreak,
      gapAfter: nextPlayerScore - nextRivalScore
    };

    setPhase("round_result");
    setPlayerScore(nextPlayerScore);
    setRivalScore(nextRivalScore);
    setStreak(nextStreak);
    setMissCount(isCorrect ? 0 : nextMissCount);
    setMaxStreak(nextMaxStreak);
    setCorrectGuesses((value) => value + (isCorrect ? 1 : 0));
    setOutcomes((value) => [...value, outcome]);
    setLastOutcome(outcome);
    void playRoundFeedback({ correct: isCorrect, timedOut });

    const shouldShowReassess = !isCorrect && nextMissCount >= REASSESS_AFTER_MISSES;

    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;

      if (shouldShowReassess) {
        setMissCount(0);
        setPhase("reassess_break");
        loadBreakContext(currentRound, outcome);
        return;
      }

      advanceRound();
    }, RESULT_FLASH_MS);
  };

  useEffect(() => {
    if (!currentRound || sessionDone || phase !== "round_active" || currentRound.timerSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => resolveRound(currentRound.correctDirection, true, 0), 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentRound, phase, sessionDone]);

  const closeOnboarding = () => {
    localStorage.setItem("geoswipe:onboarding:v1", "seen");
    setOnboardingOpen(false);
  };

  return (
    <div className="gs-app-shell">
      <header className="gs-topbar">
        <div className="gs-brand-mark">
          <div>
            <p className="gs-brand-caption">Pack {session.packId} · {mode === "progressive" ? "Pano mode" : "Free mode"}</p>
            <span className="gs-brand-title">GeoSwipe</span>
          </div>
        </div>

        <div className="gs-topbar-trailing">
          <div className="gs-mode-switch" role="tablist" aria-label="Game mode">
            <button
              className={`gs-mode-button ${mode === "progressive" ? "active" : ""}`}
              onClick={() => startNewSession("progressive")}
            >
              Progressive
            </button>
            <button
              className={`gs-mode-button ${mode === "free" ? "active" : ""}`}
              onClick={() => startNewSession("free")}
            >
              Free
            </button>
          </div>

          <button className="gs-ghost-button" onClick={() => startNewSession(mode)}>
            <RefreshCcw size={16} />
            New Pack
          </button>

          <button className="gs-ghost-button" onClick={() => setOnboardingOpen(true)}>
            <BookOpen size={16} />
            Rules
          </button>
        </div>
      </header>

      <main className={`gs-main-content ${showMinimalHome ? "minimal" : ""}`}>
        <section className={`gs-arena-panel ${showMinimalHome ? "minimal-home" : ""}`}>
          {sessionDone ? <RunSummaryCard summary={summary} startedAt={sessionStartedAt} onRestart={() => startNewSession(mode)} /> : null}

          {!sessionDone && phase !== "reassess_break" && currentRound ? (
            <div className="gs-live-round-shell">
              <GeoChoiceCard
                key={`${session.seed}:${currentRound.id}`}
                round={currentRound}
                media={currentRoundMedia}
                cardsAhead={Math.max(0, session.rounds.length - currentRound.roundNumber)}
                isLoadingImage={isImageLoading}
                loadingProgress={imageLoadProgress}
                timerProgress={currentRound.timerSeconds > 0 ? secondsLeft / currentRound.timerSeconds : 1}
                secondsLeft={secondsLeft}
                resultOutcome={phase === "round_result" ? lastOutcome : null}
                disabled={phase !== "round_active"}
                minimal={showMinimalHome}
                modifierLabel={currentRound.modifier === "none" ? undefined : getRoundModifierLabel(currentRound)}
                onGuess={resolveRound}
              />
            </div>
          ) : null}

          {!sessionDone && phase === "reassess_break" && currentRound && lastOutcome ? (
            <ReassessBreakCard
              round={currentRound}
              outcome={lastOutcome}
              originalImageUrl={currentImageUrl}
              context={breakContext}
              isLoading={isBreakLoading}
              onContinue={advanceRound}
            />
          ) : null}
        </section>
      </main>

      <GeoOnboarding open={onboardingOpen} onClose={closeOnboarding} />
    </div>
  );
}

export default GeoSwipeApp;
