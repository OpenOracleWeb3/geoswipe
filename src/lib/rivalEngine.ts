import type { GeoRound, RivalMomentum, RivalRoundResult } from "../types/game";

type RandomFn = () => number;

const DIFFICULTY_ACCURACY_OFFSET = {
  easy: 0.12,
  medium: 0,
  hard: -0.09
} as const;

const DIFFICULTY_POINTS = {
  easy: 90,
  medium: 135,
  hard: 180
} as const;

function hashSeed(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: string): RandomFn {
  let state = hashSeed(seed);

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getMomentum(round: GeoRound): RivalMomentum {
  if (round.modifier === "rival_surge") {
    return "surge";
  }

  // Cold momentum for certain rounds based on round number
  if (round.roundNumber === 4 || round.roundNumber === 12) {
    return "cold";
  }

  return "steady";
}

function getMomentumBonus(momentum: RivalMomentum): number {
  if (momentum === "surge") {
    return 0.15;
  }

  if (momentum === "cold") {
    return -0.2;
  }

  return 0;
}

function getEventLabel(momentum: RivalMomentum): string {
  if (momentum === "surge") {
    return "Rival surge";
  }

  if (momentum === "cold") {
    return "Rival hesitated";
  }

  return "Rival steady";
}

function getFlavorText(isCorrect: boolean, momentum: RivalMomentum): string {
  if (momentum === "surge" && isCorrect) {
    return "The rival read that one cleanly and kept pace.";
  }

  if (momentum === "cold" && !isCorrect) {
    return "The rival slowed down too. You did not lose extra ground.";
  }

  if (isCorrect) {
    return "The rival kept collecting disciplined points.";
  }

  return "The rival left points on the table.";
}

export function createRivalPlan(rounds: GeoRound[], sessionSeed: string): Record<string, RivalRoundResult> {
  const random = createRandom(`${sessionSeed}:rival`);

  return rounds.reduce<Record<string, RivalRoundResult>>((plan, round) => {
    const momentum = getMomentum(round);
    const baseAccuracy = 0.72; // Default rival accuracy
    const accuracyChance = Math.max(
      0.28,
      Math.min(0.93, baseAccuracy + DIFFICULTY_ACCURACY_OFFSET[round.difficulty] + getMomentumBonus(momentum))
    );
    const isCorrect = random() <= accuracyChance;
    const surgePoints = momentum === "surge" && isCorrect ? 40 : 0;
    const coldPenalty = momentum === "cold" && isCorrect ? -35 : 0;
    const modifierBonus = round.modifier === "high_value" && isCorrect ? 55 : 0;
    const speedBonus = round.modifier === "speed_round" && isCorrect ? 18 : 0;
    const delta = isCorrect
      ? Math.max(50, DIFFICULTY_POINTS[round.difficulty] + modifierBonus + speedBonus + surgePoints + coldPenalty)
      : 0;

    plan[round.id] = {
      roundId: round.id,
      delta,
      isCorrect,
      momentum,
      eventLabel: getEventLabel(momentum),
      flavorText: getFlavorText(isCorrect, momentum)
    };

    return plan;
  }, {});
}
