import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Skull, Target } from "lucide-react";
import { GeoChoiceCard } from "./components/mobile/GeoChoiceCard";
import { GeoOnboarding } from "./components/mobile/GeoOnboarding";
import { GeoBottomNav, type GeoView } from "./components/mobile/GeoBottomNav";
import { GameHud } from "./components/mobile/GameHud";
import { ThinLoadingBar } from "./components/ui/ThinLoadingBar";
import { createSessionRounds, summarizeDifficulty } from "./lib/difficultyEngine";
import { calculateRoundScore, getLevelFromScore } from "./lib/scoring";
import { getRoundImageUrl } from "./services/geoApi";
import type { GeoRound, SwipeDirection } from "./types/game";

const TOTAL_ROUNDS = 20;
const ROUND_SECONDS = 9;

interface LastResult {
  correct: boolean;
  delta: number;
  correctCountry: string;
}

function GeoSwipeApp() {
  const [view, setView] = useState<GeoView>("play");
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    return localStorage.getItem("geoswipe:onboarding:v1") !== "seen";
  });

  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date());
  const [rounds, setRounds] = useState<GeoRound[]>(() => createSessionRounds(TOTAL_ROUNDS, new Date()));
  const [roundIndex, setRoundIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const currentRound = rounds[roundIndex] ?? null;
  const sessionDone = roundIndex >= rounds.length;
  const difficultySummary = useMemo(() => summarizeDifficulty(rounds), [rounds]);
  const levelState = useMemo(() => getLevelFromScore(score), [score]);

  const startNewSession = () => {
    const now = new Date();
    const newRounds = createSessionRounds(TOTAL_ROUNDS, now);

    setSessionStartedAt(now);
    setRounds(newRounds);
    setRoundIndex(0);
    setSecondsLeft(ROUND_SECONDS);
    setCurrentImageUrl("");
    setLocked(false);
    setScore(0);
    setStreak(0);
    setCorrectGuesses(0);
    setLastResult(null);
    setView("play");
  };

  useEffect(() => {
    if (!currentRound || sessionDone) {
      return;
    }

    let cancelled = false;
    setIsImageLoading(true);

    getRoundImageUrl(currentRound)
      .then((url) => {
        if (!cancelled) {
          setCurrentImageUrl(url);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsImageLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentRound, sessionDone]);

  useEffect(() => {
    if (!currentRound || sessionDone || locked) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((value: number) => {
        if (value <= 1) {
          clearInterval(timer);
          handleGuess(currentRound.correctDirection === "left" ? "right" : "left", true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound, locked, sessionDone]);

  const advanceRound = () => {
    setLastResult(null);
    setLocked(false);
    setRoundIndex((value: number) => value + 1);
    setSecondsLeft(ROUND_SECONDS);
  };

  const handleGuess = (direction: SwipeDirection, timedOut = false) => {
    if (!currentRound || locked || sessionDone) {
      return;
    }

    setLocked(true);

    const isCorrect = direction === currentRound.correctDirection;
    const breakdown = calculateRoundScore({
      isCorrect,
      difficulty: currentRound.difficulty,
      streak,
      timeRemainingSec: secondsLeft,
      timedOut
    });

    setScore((value: number) => Math.max(0, value + breakdown.delta));

    if (isCorrect) {
      setStreak((value: number) => value + 1);
      setCorrectGuesses((value: number) => value + 1);
    } else {
      setStreak(0);
    }

    setLastResult({
      correct: isCorrect,
      delta: breakdown.delta,
      correctCountry: currentRound.correctCountry
    });

    window.setTimeout(advanceRound, 1200);
  };

  const closeOnboarding = () => {
    localStorage.setItem("geoswipe:onboarding:v1", "seen");
    setOnboardingOpen(false);
  };

  const accuracy = rounds.length === 0 ? 0 : Math.round((correctGuesses / Math.max(1, roundIndex || 1)) * 100);
  const hardPercentage = Math.round(difficultySummary.hardShare * 100);

  return (
    <div className="gs-app-shell">
      <div className="gs-bg-orb gs-bg-orb-a" />
      <div className="gs-bg-orb gs-bg-orb-b" />

      <header className="gs-topbar">
        <div>
          <p className="gs-brow">GeoSwipe</p>
          <h1>Fast geography duel</h1>
        </div>
        <button className="gs-ghost-button" onClick={() => setOnboardingOpen(true)}>
          Rules
        </button>
      </header>

      {view === "play" && (
        <main className="gs-main-content">
          <GameHud
            score={score}
            streak={streak}
            round={Math.min(roundIndex + 1, rounds.length)}
            totalRounds={rounds.length}
            secondsLeft={secondsLeft}
            level={levelState.level}
          />

          <div className="gs-card-panel">
            <ThinLoadingBar isLoading={isImageLoading} color={currentRound?.difficulty === "hard" ? "amber" : "teal"} />

            {sessionDone || !currentRound ? (
              <section className="gs-session-complete">
                <h2>Session Complete</h2>
                <div className="gs-session-grid">
                  <article>
                    <span>Final Score</span>
                    <strong>{score.toLocaleString()}</strong>
                  </article>
                  <article>
                    <span>Accuracy</span>
                    <strong>{accuracy}%</strong>
                  </article>
                  <article>
                    <span>Hard Rounds</span>
                    <strong>{difficultySummary.hard}</strong>
                  </article>
                  <article>
                    <span>Easy Rounds</span>
                    <strong>{difficultySummary.easy}</strong>
                  </article>
                </div>
                <button className="gs-primary-button" onClick={startNewSession}>
                  <RotateCcw size={16} />
                  Run Another Session
                </button>
              </section>
            ) : (
              <>
                <GeoChoiceCard
                  round={currentRound}
                  imageUrl={currentImageUrl}
                  isLoadingImage={isImageLoading}
                  disabled={locked}
                  onGuess={handleGuess}
                />
                {lastResult ? (
                  <section className={`gs-result-flash ${lastResult.correct ? "ok" : "bad"}`}>
                    {lastResult.correct ? <CheckCircle2 size={16} /> : <Skull size={16} />}
                    <span>
                      {lastResult.correct ? "Correct" : "Miss"} · {lastResult.delta > 0 ? "+" : ""}
                      {lastResult.delta} pts · {lastResult.correctCountry}
                    </span>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </main>
      )}

      {view === "learn" && (
        <main className="gs-main-content">
          <section className="gs-learn-panel">
            <h2>Game Dynamics</h2>
            <article>
              <h3>Difficulty Engine</h3>
              <p>
                Each hourly deck is generated with deterministic weighting: <strong>{hardPercentage}% hard</strong> confusion
                pairs and {100 - hardPercentage}% easy contrast pairs.
              </p>
            </article>
            <article>
              <h3>Hard Examples</h3>
              <p>Czech Republic vs Russia, Serbia vs Bulgaria, Croatia vs Montenegro, Japan vs South Korea.</p>
            </article>
            <article>
              <h3>Easy Examples</h3>
              <p>Jamaica vs Russia, Maldives vs Hungary, Greenland vs Dominican Republic.</p>
            </article>
            <article>
              <h3>Scoring</h3>
              <p>
                Hard correct answers have higher base points. Remaining time and streak give additive bonuses. Misses break
                streak and apply a penalty.
              </p>
            </article>
          </section>
        </main>
      )}

      {view === "session" && (
        <main className="gs-main-content">
          <section className="gs-session-panel">
            <h2>Current Session</h2>
            <div className="gs-session-grid">
              <article>
                <span>Started</span>
                <strong>{sessionStartedAt.toLocaleTimeString()}</strong>
              </article>
              <article>
                <span>Round</span>
                <strong>
                  {Math.min(roundIndex, rounds.length)} / {rounds.length}
                </strong>
              </article>
              <article>
                <span>Correct</span>
                <strong>{correctGuesses}</strong>
              </article>
              <article>
                <span>Accuracy</span>
                <strong>{accuracy}%</strong>
              </article>
              <article>
                <span>Level</span>
                <strong>{levelState.level}</strong>
              </article>
              <article>
                <span>Next level</span>
                <strong>{Math.round(levelState.progress * 100)}%</strong>
              </article>
            </div>
            <div className="gs-session-actions">
              <button className="gs-primary-button" onClick={startNewSession}>
                <Target size={16} />
                Restart Session
              </button>
            </div>
          </section>
        </main>
      )}

      <GeoBottomNav active={view} onChange={setView} />
      <GeoOnboarding open={onboardingOpen} onClose={closeOnboarding} />
    </div>
  );
}

export default GeoSwipeApp;
