export type DifficultyBand = "easy" | "medium" | "hard";
export type DifficultyTier = DifficultyBand;
export type SwipeDirection = "left" | "right";
export type GameMode = "continent" | "world_region" | "country";
export type RegionStage = "americas" | "europe" | "africa_middle_east" | "asia_oceania";
export type RoundModifier = "none" | "rival_surge" | "high_value" | "speed_round";
export type GamePhase = "stage_intro" | "round_active" | "round_result" | "reassess_break" | "run_complete";
export type RivalMomentum = "cold" | "steady" | "surge";
export type ContinentId = "north_america" | "south_america" | "europe" | "africa" | "asia" | "oceania";
export type WorldRegionId =
  | "north_america"
  | "caribbean"
  | "central_america"
  | "andes"
  | "southern_cone"
  | "north_atlantic"
  | "iberia"
  | "central_europe"
  | "baltics"
  | "adriatic_balkans"
  | "mediterranean_europe"
  | "north_africa"
  | "east_africa"
  | "southern_africa"
  | "arabian_peninsula"
  | "levant"
  | "east_asia"
  | "southeast_asia"
  | "south_asia"
  | "indian_ocean"
  | "oceania";

export interface StageMeta {
  stage: RegionStage;
  stageNumber: number;
  label: string;
  shortLabel: string;
  introTitle: string;
  introBody: string;
  timerSeconds: number;
  modifier: RoundModifier;
  modifierLabel: string;
  pressureNote: string;
  rivalAccuracy: number;
}

export interface CountryPair {
  id: string;
  options: [string, string];
  difficultyBand: DifficultyBand;
  rationale: string;
  coachingLine: string;
  regionStage: RegionStage;
  regionTag: string;
  visualTags: string[];
  teachingClues: string[];
  contextSearchTerms: string[];
}

export interface RoundLocation {
  id: string;
  label: string;
  country: string;
  continentId: ContinentId;
  continentLabel: string;
  worldRegionId: WorldRegionId;
  worldRegionLabel: string;
  coordinates: [number, number];
  tags: string[];
}

export interface RoundPair {
  id: string;
  mode: GameMode;
  options: [string, string];
  rationale: string;
  coachingLine: string;
  regionTag: string;
  visualTags: string[];
  contextSearchTerms: string[];
}

export interface GeoRound {
  id: string;
  roundNumber: number;
  mode: GameMode;
  difficulty: DifficultyTier;
  modifier: RoundModifier;
  timerSeconds: number;
  pair: RoundPair;
  location: RoundLocation;
  leftOption: string;
  rightOption: string;
  correctAnswer: string;
  decoyAnswer: string;
  correctDirection: SwipeDirection;
  sceneKey: string;
}

export interface StaticRoundMedia {
  kind: "image";
  url: string;
}

export interface StreetViewRoundMedia {
  kind: "streetview";
  sceneKey: string;
  panoId: string;
  previewUrl: string;
  heading: number;
  pitch: number;
  zoom: number;
}

export type RoundMedia = StaticRoundMedia | StreetViewRoundMedia;

export interface RoundScoreInput {
  isCorrect: boolean;
  difficulty: DifficultyTier;
  streak: number;
  timeRemainingSec: number;
  timedOut: boolean;
  modifier: RoundModifier;
}

export interface RoundScoreBreakdown {
  delta: number;
  base: number;
  speedBonus: number;
  streakBonus: number;
  stageBonus: number;
  penalty: number;
}

export interface RivalRoundResult {
  roundId: string;
  delta: number;
  isCorrect: boolean;
  momentum: RivalMomentum;
  eventLabel: string;
  flavorText: string;
}

export interface RoundOutcome {
  roundId: string;
  correct: boolean;
  timedOut: boolean;
  selectedDirection: SwipeDirection | null;
  selectedAnswer: string | null;
  selectedCountry: string | null;
  correctAnswer: string;
  correctCountry: string;
  scoreBreakdown: RoundScoreBreakdown;
  rival: RivalRoundResult;
  playerScoreAfter: number;
  rivalScoreAfter: number;
  streakAfter: number;
  gapAfter: number;
}

export interface StagePerformance {
  stage: RegionStage;
  correct: number;
  total: number;
  accuracy: number;
  playerPoints: number;
  rivalPoints: number;
}

export interface SessionSummary {
  playerScore: number;
  rivalScore: number;
  margin: number;
  playerWon: boolean;
  correctCount: number;
  accuracy: number;
  maxStreak: number;
  difficultyCounts: Record<DifficultyBand, number>;
  uniqueCountries: number;
  uniqueWorldRegions: number;
  uniqueContinents: number;
  cachedScenes: number;
}

export interface BreakContextPayload {
  headline: string;
  subhead: string;
  clueChips: string[];
  coachingLine: string;
  imageUrls: string[];
}

export interface GameSessionPlan {
  mode: GameMode;
  queueId: string;
  packId: string;
  seed: string;
  startedAtIso: string;
  rounds: GeoRound[];
  rivalPlan: Record<string, RivalRoundResult>;
}
