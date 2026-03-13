import type { DifficultyTier, RoundModifier, RoundScoreBreakdown, RoundScoreInput } from "../types/game";

const BASE_POINTS: Record<DifficultyTier, number> = {
  easy: 100,
  medium: 145,
  hard: 195
};

const SPEED_MULTIPLIER: Record<DifficultyTier, number> = {
  easy: 6,
  medium: 8,
  hard: 10
};

const MISS_PENALTY: Record<DifficultyTier, number> = {
  easy: 55,
  medium: 80,
  hard: 105
};

const TIMEOUT_PENALTY: Record<DifficultyTier, number> = {
  easy: 70,
  medium: 95,
  hard: 125
};

const MODIFIER_BONUS: Record<RoundModifier, number> = {
  none: 0,
  rival_surge: 20,
  high_value: 90,
  speed_round: 24
};

interface LevelState {
  level: number;
  progress: number;
}

interface StreakMeta {
  label: string;
  nextAt: number | null;
}

function getLevelThreshold(level: number): number {
  if (level <= 1) {
    return 0;
  }

  const previousLevel = level - 1;
  return previousLevel * 240 + previousLevel * previousLevel * 110;
}

export function calculateRoundScore({
  isCorrect,
  difficulty,
  streak,
  timeRemainingSec,
  timedOut,
  modifier
}: RoundScoreInput): RoundScoreBreakdown {
  if (!isCorrect) {
    const penalty = timedOut ? TIMEOUT_PENALTY[difficulty] : MISS_PENALTY[difficulty];

    return {
      delta: -penalty,
      base: 0,
      speedBonus: 0,
      streakBonus: 0,
      stageBonus: 0,
      penalty
    };
  }

  const base = BASE_POINTS[difficulty];
  const speedBonus = Math.max(0, timeRemainingSec) * SPEED_MULTIPLIER[difficulty];
  const streakBonus = Math.min(streak, 5) * 25;
  const stageBonus = MODIFIER_BONUS[modifier];
  const delta = base + speedBonus + streakBonus + stageBonus;

  return {
    delta,
    base,
    speedBonus,
    streakBonus,
    stageBonus,
    penalty: 0
  };
}

export function getLevelFromScore(score: number): LevelState {
  const safeScore = Math.max(0, score);
  let level = 1;

  while (safeScore >= getLevelThreshold(level + 1)) {
    level += 1;
  }

  const currentLevelFloor = getLevelThreshold(level);
  const nextLevelFloor = getLevelThreshold(level + 1);
  const progressSpan = Math.max(1, nextLevelFloor - currentLevelFloor);
  const progress = (safeScore - currentLevelFloor) / progressSpan;

  return {
    level,
    progress: Math.max(0, Math.min(1, progress))
  };
}

export function getStreakMeta(streak: number): StreakMeta {
  if (streak >= 6) {
    return {
      label: "Unstoppable",
      nextAt: null
    };
  }

  if (streak >= 4) {
    return {
      label: "On Fire",
      nextAt: 6
    };
  }

  if (streak >= 2) {
    return {
      label: "Hot",
      nextAt: 4
    };
  }

  return {
    label: "Cold Start",
    nextAt: 2
  };
}
