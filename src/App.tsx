import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, ShieldCheckered, SignOut, SlidersHorizontal, X } from "@phosphor-icons/react";
import { GeoChoiceCard } from "./components/mobile/GeoChoiceCard";
import { GeoHomeScreen } from "./components/mobile/GeoHomeScreen";
import { GeoProfileScreen } from "./components/mobile/GeoProfileScreen";
import { GeoSoloLobby } from "./components/mobile/GeoSoloLobby";
import { RunSummaryCard } from "./components/mobile/RunSummaryCard";
import { useRoundFeedback } from "./hooks/useRoundFeedback";
import { calculateRoundScore } from "./lib/scoring";
import { calculateSwipeElo, type PlayerStats } from "./lib/rankingEngine";
import { buildSessionSummary, createGameSession } from "./lib/sessionEngine";
import { getPreloadedRoundMedia, preloadRoundMedia } from "./services/geoApi";
import { bootstrapPlayerSession, completeGoogleSignIn, persistCompletedSession, signOutToGuest, type LeaderboardEntry, type PlayerIdentity, type PlayerSnapshot } from "./services/backendApi";
import { disableGoogleAutoSelect, type GoogleAuthUser, type GoogleSignInPayload } from "./services/googleIdentity";
import type { CategoryMode, GamePhase, GeoRound, RoundMedia, RoundOutcome, SwipeDirection } from "./types/game";

const RESULT_FLASH_MIN_MS = 900;

function createSessionBundle(category: CategoryMode = "countries") {
  const startedAt = new Date();
  const session = createGameSession(startedAt, category);

  return { startedAt, session };
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

function applySnapshotToState(
  snapshot: PlayerSnapshot,
  options: {
    setPlayerIdentity: (identity: PlayerIdentity) => void;
    setAuthUser: (user: GoogleAuthUser | null) => void;
    setPlayerStats: (stats: PlayerStats) => void;
    setLeaderboard: (entries: LeaderboardEntry[]) => void;
    setGlobalElo: (elo: number) => void;
  }
) {
  options.setPlayerIdentity(snapshot.player);
  options.setAuthUser(snapshot.authUser);
  options.setPlayerStats(snapshot.stats);
  options.setLeaderboard(snapshot.leaderboard);
  options.setGlobalElo(snapshot.stats.globalElo);
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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageLoadProgress, setImageLoadProgress] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [globalElo, setGlobalElo] = useState(500);
  const [eloDelta, setEloDelta] = useState<number | null>(null);
  const [lastSwipeEloDelta, setLastSwipeEloDelta] = useState<number | null>(null);
  const [authUser, setAuthUser] = useState<GoogleAuthUser | null>(null);
  const [playerIdentity, setPlayerIdentity] = useState<PlayerIdentity | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [sessionPersistError, setSessionPersistError] = useState<string | null>(null);
  const sessionRecordedRef = useRef(false);

  const transitionTimeoutRef = useRef<number | null>(null);
  const resultAdvanceTokenRef = useRef(0);
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

  const applySnapshot = (snapshot: PlayerSnapshot) => {
    applySnapshotToState(snapshot, {
      setPlayerIdentity,
      setAuthUser,
      setPlayerStats,
      setLeaderboard,
      setGlobalElo
    });
  };

  const refreshPlayerState = async () => {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      applySnapshot(await bootstrapPlayerSession());
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Failed to load player state.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    void refreshPlayerState();
  }, []);

  useEffect(() => {
    if (!sessionDone || sessionRecordedRef.current || outcomes.length === 0) {
      return;
    }

    sessionRecordedRef.current = true;
    setSessionPersistError(null);

    void persistCompletedSession({
      category: activeCategory,
      startedAtIso: sessionStartedAt.toISOString(),
      completedAtIso: new Date().toISOString(),
      session,
      outcomes,
      summary
    })
      .then((result) => {
        applySnapshot(result.snapshot);
        setEloDelta(result.globalDelta);
      })
      .catch((error) => {
        setSessionPersistError(error instanceof Error ? error.message : "Failed to save this run.");
      });
  }, [activeCategory, outcomes, session, sessionDone, sessionStartedAt, summary]);

  const handleGoogleSignIn = async ({ credential }: GoogleSignInPayload) => {
    const snapshot = await completeGoogleSignIn(credential);
    applySnapshot(snapshot);
  };

  const signOutGoogle = async () => {
    disableGoogleAutoSelect();
    const snapshot = await signOutToGuest();
    applySnapshot(snapshot);
    setMenuOpen(false);
  };

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

  const invalidatePendingResultAdvance = () => {
    resultAdvanceTokenRef.current += 1;
    clearTransitionTimeout();
  };

  const startNewSession = (category: CategoryMode = activeCategory) => {
    const bundle = createSessionBundle(category);
    setActiveCategory(category);

    invalidatePendingResultAdvance();
    setMenuOpen(false);
    setScreen("playing");
    setSessionStartedAt(bundle.startedAt);
    setSession(bundle.session);
    setRoundIndex(0);
    setPhase("round_active");
    setSecondsLeft(bundle.session.rounds[0]?.timerSeconds ?? 0);
    setCurrentRoundMedia(null);
    setIsImageLoading(false);
    setImageLoadProgress(0);
    setPlayerScore(0);
    setRivalScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectGuesses(0);
    setOutcomes([]);
    setLastOutcome(null);
    setEloDelta(null);
    setLastSwipeEloDelta(null);
    setSessionPersistError(null);
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

  useEffect(
    () => () => {
      resultAdvanceTokenRef.current += 1;
      clearTransitionTimeout();
    },
    []
  );

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

    const finalizeLoad = (media: RoundMedia) => {
      if (cancelled || finalized) {
        return;
      }

      finalized = true;
      window.clearInterval(progressTimer);
      setCurrentRoundMedia(media);
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

    // Preload next 3 rounds while loading current
    const upcoming = session.rounds.slice(roundIndex + 1, roundIndex + 4);
    if (upcoming.length > 0) {
      preloadRoundMedia(upcoming);
    }

    getPreloadedRoundMedia(currentRound)
      .then((media) => {
        if (cancelled) return;

        setImageLoadProgress((value) => Math.max(value, 92));
        finalizeLoad(media);
      })
      .catch(() => {
        window.clearInterval(progressTimer);
        if (!cancelled) {
          setImageLoadProgress(100);
          setIsImageLoading(false);
          window.setTimeout(() => {
            if (!cancelled) {
              advanceRound();
            }
          }, 0);
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

  const advanceRound = () => {
    invalidatePendingResultAdvance();
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

    invalidatePendingResultAdvance();

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
    const resolvedTimeRemaining = timeRemainingOverride ?? secondsLeft;

    const swipeDelta = calculateSwipeElo({
      correct: isCorrect,
      timedOut,
      difficulty: currentRound.difficulty,
      streak: nextStreak,
      currentElo: globalElo
    });
    const nextElo = Math.max(0, globalElo + swipeDelta);

    const outcome: RoundOutcome = {
      roundId: currentRound.id,
      correct: isCorrect,
      timedOut,
      selectedDirection: timedOut ? null : direction,
      selectedAnswer: selectedCountry,
      selectedCountry,
      correctAnswer: currentRound.correctAnswer,
      correctCountry: currentRound.correctAnswer,
      timeRemainingSec: resolvedTimeRemaining,
      scoreBreakdown: breakdown,
      rival,
      eloDelta: swipeDelta,
      eloAfter: nextElo,
      playerScoreAfter: nextPlayerScore,
      rivalScoreAfter: nextRivalScore,
      streakAfter: nextStreak,
      gapAfter: nextPlayerScore - nextRivalScore
    };

    setPhase("round_result");
    setPlayerScore(nextPlayerScore);
    setRivalScore(nextRivalScore);
    setStreak(nextStreak);
    setMaxStreak(nextMaxStreak);
    setCorrectGuesses((value) => value + (isCorrect ? 1 : 0));
    setOutcomes((value) => [...value, outcome]);
    setLastOutcome(outcome);
    void playRoundFeedback({ correct: isCorrect, timedOut });

    // Live ELO update per swipe
    setGlobalElo(nextElo);
    setLastSwipeEloDelta(swipeDelta);

    const resultAdvanceToken = resultAdvanceTokenRef.current + 1;
    resultAdvanceTokenRef.current = resultAdvanceToken;

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
      if (resultAdvanceTokenRef.current !== resultAdvanceToken) {
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

  if (isBootstrapping) {
    return (
      <div className="gs-app-shell home">
        <div className="gs-run-summary" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="gs-run-summary-hero" style={{ paddingTop: 48 }}>
            <div className="gs-run-summary-copy">
              <span className="gs-run-summary-kicker">Connecting</span>
              <h2>Loading your GeoSwipe profile.</h2>
              <p>Opening your synced player state and leaderboard snapshot.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="gs-app-shell home">
        <div className="gs-run-summary" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="gs-run-summary-hero" style={{ paddingTop: 48 }}>
            <div className="gs-run-summary-copy">
              <span className="gs-run-summary-kicker">Connection problem</span>
              <h2>The GeoSwipe backend is not ready.</h2>
              <p>{bootstrapError}</p>
            </div>
            <aside className="gs-run-summary-margin-card">
              <span>Status</span>
              <strong>Retry</strong>
              <small>Check Render Postgres + API env</small>
            </aside>
          </div>
          <button className="gs-primary-button gs-run-summary-cta" onClick={() => void refreshPlayerState()}>
            <ArrowCounterClockwise size={16} weight="bold" />
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="gs-app-shell home">
        <GeoHomeScreen
          onStartSolo={openSoloLobby}
          onProfile={() => setScreen("profile")}
          elo={globalElo}
          authUser={authUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={signOutGoogle}
        />
      </div>
    );
  }

  if (screen === "profile") {
    return (
      <div className="gs-app-shell home">
        <GeoProfileScreen
          elo={globalElo}
          onBack={() => setScreen("home")}
          playerLabel={playerIdentity?.displayName ?? "Player"}
          playerEmail={playerIdentity?.email ?? null}
          playerAvatarUrl={playerIdentity?.avatarUrl ?? null}
          stats={playerStats}
          leaderboard={leaderboard}
          authUser={authUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={signOutGoogle}
        />
      </div>
    );
  }

  if (screen === "solo_lobby") {
    return (
      <div className="gs-app-shell home">
        <GeoSoloLobby
          onPlay={startSoloRun}
          onBack={() => setScreen("home")}
          elo={globalElo}
          authUser={authUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={signOutGoogle}
        />
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
            {menuOpen ? <X size={18} weight="bold" /> : <SlidersHorizontal size={18} weight="bold" />}
          </button>

          {menuOpen ? (
            <>
              <button type="button" className="gs-utility-menu-scrim" aria-label="Close round menu" onClick={() => setMenuOpen(false)} />
              <div className="gs-utility-menu">
                <div
                  style={{
                    marginBottom: 6,
                    padding: "10px 12px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#fff"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <ShieldCheckered size={14} weight="fill" color={authUser ? "#9fe870" : "rgba(255,255,255,0.4)"} />
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: authUser ? "#9fe870" : "rgba(255,255,255,0.42)" }}>
                      {authUser ? "Google linked" : "Anonymous profile"}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {playerIdentity?.displayName ?? authUser?.name ?? "GeoSwipe player"}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {playerIdentity?.email ?? "Not linked yet"}
                  </div>
                </div>
                <button type="button" className="gs-utility-menu-button" onClick={() => setMenuOpen(false)}>
                  <X size={16} weight="bold" />
                  Resume
                </button>
                <button type="button" className="gs-utility-menu-button" onClick={() => startNewSession()}>
                  <ArrowCounterClockwise size={16} weight="bold" />
                  Restart Run
                </button>
                {authUser ? (
                  <button type="button" className="gs-utility-menu-button" onClick={signOutGoogle}>
                    <SignOut size={16} weight="bold" />
                    Sign Out
                  </button>
                ) : null}
                <button type="button" className="gs-utility-menu-button danger" onClick={quitToStart}>
                  <SignOut size={16} weight="bold" />
                  Quit Run
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <main className={`gs-main-content ${showMinimalHome ? "minimal" : ""}`}>
        <section className={`gs-arena-panel ${showMinimalHome ? "minimal-home" : ""}`}>
          {sessionDone && sessionPersistError ? (
            <div
              style={{
                margin: "0 auto 16px",
                maxWidth: 420,
                padding: "12px 14px",
                borderRadius: 18,
                background: "rgba(145, 32, 32, 0.16)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff4f1",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {sessionPersistError}
            </div>
          ) : null}
          {sessionDone ? <RunSummaryCard summary={summary} startedAt={sessionStartedAt} eloDelta={eloDelta} elo={globalElo} onRestart={startNewSession} /> : null}

          {!sessionDone && currentRound ? (
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
        </section>
      </main>
    </div>
  );
}

export default GeoSwipeApp;
