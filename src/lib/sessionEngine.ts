import { STAGE_ORDER } from "../data/confusionPools";
import { createPackSessionSeed, createSessionRounds, STAGE_META } from "./difficultyEngine";
import { createRivalPlan } from "./rivalEngine";
import type { DifficultyBand, GameMode, GamePhase, GameSessionPlan, RegionStage, RoundOutcome, SessionSummary } from "../types/game";

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

export function createGameSession(startedAt: Date, mode: GameMode = "progressive", packId = createPackId()): GameSessionPlan {
  const seed = `${createPackSessionSeed(startedAt, packId)}:${mode}`;
  const rounds = createSessionRounds(startedAt, mode, packId);
  const rivalPlan = createRivalPlan(rounds, seed);

  return {
    mode,
    packId,
    seed,
    startedAtIso: startedAt.toISOString(),
    rounds,
    rivalPlan,
    stages: STAGE_META
  };
}

export function getPhaseForRound(rounds: GameSessionPlan["rounds"], roundIndex: number): GamePhase {
  if (roundIndex >= rounds.length) {
    return "run_complete";
  }

  if (roundIndex === 0 || rounds[roundIndex - 1].stage !== rounds[roundIndex].stage) {
    return "stage_intro";
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

  const stageBreakdown = STAGE_ORDER.map((stage) => {
    const stageRounds = rounds.filter((round) => round.stage === stage);
    const stageOutcomeIds = new Set(stageRounds.map((round) => round.id));
    const stageOutcomes = outcomes.filter((outcome) => stageOutcomeIds.has(outcome.roundId));
    const stageCorrect = stageOutcomes.filter((outcome) => outcome.correct).length;
    const playerPoints = stageOutcomes.reduce((sum, outcome) => sum + outcome.scoreBreakdown.delta, 0);
    const rivalPoints = stageOutcomes.reduce((sum, outcome) => sum + outcome.rival.delta, 0);

    return {
      stage,
      correct: stageCorrect,
      total: stageRounds.length,
      accuracy: stageRounds.length === 0 ? 0 : stageCorrect / stageRounds.length,
      playerPoints,
      rivalPoints
    };
  });

  const bestStage = stageBreakdown.reduce(
    (best, stage) => (stage.accuracy > best.accuracy ? stage : best),
    stageBreakdown[0]
  ).stage as RegionStage;

  return {
    playerScore,
    rivalScore,
    margin: playerScore - rivalScore,
    playerWon: playerScore >= rivalScore,
    correctCount,
    accuracy: outcomes.length === 0 ? 0 : correctCount / outcomes.length,
    maxStreak,
    bestStage,
    difficultyCounts,
    stageBreakdown
  };
}
