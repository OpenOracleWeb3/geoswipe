import { createPackSessionSeed, createSessionRounds } from "./difficultyEngine";
import { createRivalPlan } from "./rivalEngine";
import type { DifficultyBand, GameMode, GamePhase, GameSessionPlan, RoundOutcome, SessionSummary } from "../types/game";

interface SessionSummaryInput {
  rounds: GameSessionPlan["rounds"];
  outcomes: RoundOutcome[];
  playerScore: number;
  rivalScore: number;
  correctCount: number;
  maxStreak: number;
}

function createPackId(): string {
  return String(Math.floor(Math.random() * 384) + 1).padStart(3, "0");
}

export function createGameSession(startedAt: Date, mode: GameMode = "continent", packId = createPackId()): GameSessionPlan {
  const seed = `${createPackSessionSeed(startedAt, packId)}:${mode}`;
  const rounds = createSessionRounds(startedAt, mode, packId);
  const rivalPlan = createRivalPlan(rounds, seed);

  return {
    mode,
    queueId: packId,
    seed,
    startedAtIso: startedAt.toISOString(),
    rounds,
    rivalPlan
  };
}

export function getPhaseForRound(rounds: GameSessionPlan["rounds"], roundIndex: number): GamePhase {
  if (roundIndex >= rounds.length) {
    return "run_complete";
  }

  return "round_active";
}

export function buildSessionSummary({
  rounds,
  outcomes,
  playerScore,
  rivalScore,
  correctCount,
  maxStreak
}: SessionSummaryInput): SessionSummary {
  const difficultyCounts = rounds.reduce<Record<DifficultyBand, number>>(
    (counts, round) => {
      counts[round.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  const uniqueCountries = new Set(rounds.map((round) => round.correctAnswer)).size;
  const uniqueWorldRegions = new Set(rounds.map((round) => round.location.worldRegionId)).size;
  const uniqueContinents = new Set(rounds.map((round) => round.location.continentId)).size;

  return {
    playerScore,
    rivalScore,
    margin: playerScore - rivalScore,
    playerWon: playerScore >= rivalScore,
    correctCount,
    accuracy: outcomes.length === 0 ? 0 : correctCount / outcomes.length,
    maxStreak,
    difficultyCounts,
    uniqueCountries,
    uniqueWorldRegions,
    uniqueContinents,
    cachedScenes: 0
  };
}
