import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, RotateCcw, Settings2, X } from "lucide-react";
import { GeoChoiceCard } from "./components/mobile/GeoChoiceCard";
import { GeoHomeScreen } from "./components/mobile/GeoHomeScreen";
import { GeoProfileScreen } from "./components/mobile/GeoProfileScreen";
import { GeoSoloLobby } from "./components/mobile/GeoSoloLobby";
import { ReassessBreakCard } from "./components/mobile/ReassessBreakCard";
import { RunSummaryCard } from "./components/mobile/RunSummaryCard";
import { useRoundFeedback } from "./hooks/useRoundFeedback";
import { calculateRoundScore } from "./lib/scoring";
import { calculateSwipeElo, loadPlayerStats, recordSession } from "./lib/rankingEngine";
import { buildSessionSummary, createGameSession } from "./lib/sessionEngine";
import { getBreakContextImages, getPreloadedRoundMedia, getRoundMediaPreviewUrl, preloadRoundMedia } from "./services/geoApi";
import type { BreakContextPayload, CategoryMode, GamePhase, GeoRound, RoundMedia, RoundOutcome, SwipeDirection } from "./types/game";

const REASSESS_AFTER_MISSES = 3;
const RESULT_FLASH_MIN_MS = 2500;

function createSessionBundle(category: CategoryMode = "countries") {
  const startedAt = new Date();
  const session = createGameSession(startedAt, category);

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
  const initialBundle = useMemo(() => createSessionBundle(), []);
  const [screen, setScreen] = useState<"home" | "solo_lobby" | "profile" | "playing">("home");
  const [activeCategory, setActiveCategory] = useState<CategoryMode>("countries");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [globalElo, setGlobalElo] = useState(() => loadPlayerStats().globalElo);
  const [eloDelta, setEloDelta] = useState<number | null>(null);
  const [lastSwipeEloDelta, setLastSwipeEloDelta] = useState<number | null>(null);
  const sessionRecordedRef = useRef(false);

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

  // Record ELO when session completes
  useEffect(() => {
    if (!sessionDone || sessionRecordedRef.current || outcomes.length === 0) return;
    sessionRecordedRef.current = true;
    const result = recordSession(summary, activeCategory);
    setGlobalElo(result.stats.globalElo);
    setEloDelta(result.globalDelta);
  }, [sessionDone, outcomes.length, summary, activeCategory]);

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

  const startNewSession = (category: CategoryMode = activeCategory) => {
    const bundle = createSessionBundle(category);
    setActiveCategory(category);

    clearTransitionTimeout();
    breakRequestRef.current += 1;
    setMenuOpen(false);
    setScreen("playing");
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
    setEloDelta(null);
    setLastSwipeEloDelta(null);
    sessionRecordedRef.current = false;
  };

  const quitToStart = () => {
    startNewSession();
    setScreen("home");
  };

  const openSoloLobby = () => {
    setScreen("solo_lobby");
  };

  const startSoloRun = (category: string) => {
    startNewSession(category as CategoryMode);
  };

  useEffect(() => clearTransitionTimeout, []);

  useEffect(() => {
    if (screen !== "playing" || !currentRound || sessionDone) {
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

    // Preload next 3 rounds while loading current
    const upcoming = session.rounds.slice(roundIndex + 1, roundIndex + 4);
    if (upcoming.length > 0) {
      preloadRoundMedia(upcoming);
    }

    getPreloadedRoundMedia(currentRound)
      .then((media) => {
        if (cancelled) return;

        const previewUrl = getRoundMediaPreviewUrl(media);
        setImageLoadProgress((value) => Math.max(value, 92));

        // Preload the preview image into browser cache
        const previewImage = new Image();
        const handleReady = () => {
          if (cancelled) return;
          setCurrentRoundMedia(media);
          finalizeLoad(previewUrl);
        };

        previewImage.onload = handleReady;
        // On error, still set the media — the URL might work in the <img> tag
        // even if the Image() constructor failed (CORS, etc)
        previewImage.onerror = handleReady;
        previewImage.src = previewUrl;

        if (previewImage.complete) {
          handleReady();
        }
      })
      .catch(() => {
        // Even on total failure, don't leave media as null.
        // Build a direct Street View URL from the round's coordinates.
        window.clearInterval(progressTimer);
        if (!cancelled) {
          const coords = currentRound.cityCoordinates ?? currentRound.location.coordinates;
          const heading = (currentRound.roundNumber * 137) % 360;
          const fallbackMedia = {
            kind: "streetview" as const,
            sceneKey: `emergency:${currentRound.id}`,
            panoId: "",
            previewUrl: `https://maps.googleapis.com/maps/api/streetview?size=640x360&scale=2&location=${coords[0]},${coords[1]}&heading=${heading}&pitch=5&source=outdoor&key=${import.meta.env?.VITE_GOOGLE_STREET_VIEW_API_KEY ?? ""}`,
            heading,
            pitch: 5,
            zoom: 1
          };
          setCurrentRoundMedia(fallbackMedia);
          setCurrentImageUrl(fallbackMedia.previewUrl);
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
  }, [currentRound?.id, screen, session.seed, sessionDone]);

  useEffect(() => {
    if (screen !== "playing" || !currentRound) {
      return;
    }

    setSecondsLeft(currentRound.timerSeconds);
  }, [currentRound?.id, screen, session.seed]);

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

        const outcomeReason = outcome.timedOut ? "Timer expired before the read locked in." : `You chose ${outcome.selectedAnswer}.`;

        setBreakContext({
          headline: outcome.timedOut ? "Timer expired" : `${outcome.selectedAnswer} was the decoy`,
          subhead: `${outcomeReason} Correct answer: ${round.correctAnswer}.`,
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
          subhead: `Correct answer: ${round.correctAnswer}.`,
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
      selectedAnswer: selectedCountry,
      selectedCountry,
      correctAnswer: currentRound.correctAnswer,
      correctCountry: currentRound.correctAnswer,
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

    // Live ELO update per swipe
    const swipeDelta = calculateSwipeElo({
      correct: isCorrect,
      timedOut,
      difficulty: currentRound.difficulty,
      streak: nextStreak,
      currentElo: globalElo
    });
    setGlobalElo((prev) => Math.max(0, prev + swipeDelta));
    setLastSwipeEloDelta(swipeDelta);

    const shouldShowReassess = !isCorrect && nextMissCount >= REASSESS_AFTER_MISSES;

    // Hold the result screen for at least RESULT_FLASH_MIN_MS,
    // and also wait for the next round's image to be preloaded.
    const nextRound = session.rounds[roundIndex + 1];
    const minDelay = new Promise<void>((r) => {
      transitionTimeoutRef.current = window.setTimeout(() => {
        transitionTimeoutRef.current = null;
        r();
      }, RESULT_FLASH_MIN_MS);
    });
    const nextImageReady = nextRound
      ? getPreloadedRoundMedia(nextRound).then(() => {}).catch(() => {})
      : Promise.resolve();

    void Promise.all([minDelay, nextImageReady]).then(() => {
      if (shouldShowReassess) {
        setMissCount(0);
        setPhase("reassess_break");
        loadBreakContext(currentRound, outcome);
        return;
      }

      advanceRound();
    });
  };

  useEffect(() => {
    if (screen !== "playing" || !currentRound || sessionDone || phase !== "round_active" || currentRound.timerSeconds <= 0) {
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
  }, [currentRound, screen, phase, sessionDone]);

  if (screen === "home") {
    return (
      <div className="gs-app-shell home">
        <GeoHomeScreen onStartSolo={openSoloLobby} onProfile={() => setScreen("profile")} elo={globalElo} />
      </div>
    );
  }

  if (screen === "profile") {
    return (
      <div className="gs-app-shell home">
        <GeoProfileScreen elo={globalElo} onBack={() => setScreen("home")} />
      </div>
    );
  }

  if (screen === "solo_lobby") {
    return (
      <div className="gs-app-shell home">
        <GeoSoloLobby onPlay={startSoloRun} onBack={() => setScreen("home")} elo={globalElo} />
      </div>
    );
  }

  return (
    <div className="gs-app-shell">
      {!sessionDone ? (
        <div className="gs-app-actions">
          <button
            type="button"
            className="gs-icon-button gs-utility-menu-trigger"
            aria-label={menuOpen ? "Close round menu" : "Open round menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={18} /> : <Settings2 size={18} />}
          </button>

          {menuOpen ? (
            <>
              <button type="button" className="gs-utility-menu-scrim" aria-label="Close round menu" onClick={() => setMenuOpen(false)} />
              <div className="gs-utility-menu">
                <button type="button" className="gs-utility-menu-button" onClick={() => setMenuOpen(false)}>
                  <X size={16} />
                  Resume
                </button>
                <button type="button" className="gs-utility-menu-button" onClick={() => startNewSession()}>
                  <RotateCcw size={16} />
                  Restart Run
                </button>
                <button type="button" className="gs-utility-menu-button danger" onClick={quitToStart}>
                  <LogOut size={16} />
                  Quit Run
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <main className={`gs-main-content ${showMinimalHome ? "minimal" : ""}`}>
        <section className={`gs-arena-panel ${showMinimalHome ? "minimal-home" : ""}`}>
          {sessionDone ? <RunSummaryCard summary={summary} startedAt={sessionStartedAt} eloDelta={eloDelta} elo={globalElo} onRestart={startNewSession} /> : null}

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
                elo={globalElo}
                eloDelta={phase === "round_result" ? lastSwipeEloDelta : null}
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
    </div>
  );
}

export default GeoSwipeApp;
