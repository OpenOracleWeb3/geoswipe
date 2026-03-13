export type DifficultyTier = "hard" | "easy";
export type SwipeDirection = "left" | "right";

export interface CountryPair {
  id: string;
  options: [string, string];
  difficulty: DifficultyTier;
  rationale: string;
  regionTag: string;
  visualTags: string[];
}

export interface GeoRound {
  id: string;
  roundNumber: number;
  difficulty: DifficultyTier;
  pair: CountryPair;
  leftOption: string;
  rightOption: string;
  correctCountry: string;
  correctDirection: SwipeDirection;
}

export interface RoundScoreInput {
  isCorrect: boolean;
  difficulty: DifficultyTier;
  streak: number;
  timeRemainingSec: number;
  timedOut: boolean;
}

export interface RoundScoreBreakdown {
  delta: number;
  base: number;
  speedBonus: number;
  streakBonus: number;
  penalty: number;
}
