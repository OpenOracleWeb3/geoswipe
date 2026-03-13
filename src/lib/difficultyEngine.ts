import { COUNTRY_PAIRS, STAGE_ORDER } from "../data/confusionPools";
import type { CountryPair, DifficultyBand, GameMode, GeoRound, RegionStage, RoundModifier, StageMeta } from "../types/game";

type RandomFn = () => number;
const ROUND_TIMER_SECONDS = 30;

interface DifficultySummary {
  easy: number;
  medium: number;
  hard: number;
  mediumShare: number;
  hardShare: number;
}

const STAGE_BLUEPRINTS: Record<RegionStage, DifficultyBand[]> = {
  americas: ["easy", "medium", "medium", "hard", "hard"],
  europe: ["easy", "medium", "medium", "hard", "hard"],
  africa_middle_east: ["easy", "medium", "medium", "hard", "hard"],
  asia_oceania: ["easy", "medium", "hard", "hard", "hard"]
};

const STAGE_MODIFIER_MAP: Record<RegionStage, RoundModifier> = {
  americas: "none",
  europe: "rival_surge",
  africa_middle_east: "high_value",
  asia_oceania: "speed_round"
};

export const STAGE_META: StageMeta[] = [
  {
    stage: "americas",
    stageNumber: 1,
    label: "Americas",
    shortLabel: "AMER",
    introTitle: "Stage 1 · Build heat in the Americas",
    introBody: "Start broad, build confidence, and open a streak before the rival settles into the run.",
    timerSeconds: ROUND_TIMER_SECONDS,
    modifier: "none",
    modifierLabel: "Clean opening",
    pressureNote: "No gimmicks here. You need accuracy before the pressure spikes.",
    rivalAccuracy: 0.7
  },
  {
    stage: "europe",
    stageNumber: 2,
    label: "Europe",
    shortLabel: "EUR",
    introTitle: "Stage 2 · Europe tightens the screws",
    introBody: "Urban texture and old-world overlap rise sharply here, and the rival gets its first surge window.",
    timerSeconds: ROUND_TIMER_SECONDS,
    modifier: "rival_surge",
    modifierLabel: "Rival surge round",
    pressureNote: "Expect one round where the rival spikes. Protect your streak through it.",
    rivalAccuracy: 0.74
  },
  {
    stage: "africa_middle_east",
    stageNumber: 3,
    label: "Africa + Middle East",
    shortLabel: "AF/ME",
    introTitle: "Stage 3 · High-value swings",
    introBody: "The board widens, the contrasts soften, and one correctly-read round can swing the whole race.",
    timerSeconds: ROUND_TIMER_SECONDS,
    modifier: "high_value",
    modifierLabel: "High-value round",
    pressureNote: "One round is worth extra. Missing it gives the rival breathing room.",
    rivalAccuracy: 0.72
  },
  {
    stage: "asia_oceania",
    stageNumber: 4,
    label: "Asia + Oceania",
    shortLabel: "ASIA/OCE",
    introTitle: "Stage 4 · Final reads, cleaner nerve",
    introBody: "The final stretch keeps the 30-second clock but leans harder into look-alike density. Finish with control.",
    timerSeconds: ROUND_TIMER_SECONDS,
    modifier: "speed_round",
    modifierLabel: "Fast scoring",
    pressureNote: "Same timer, harder reads. Stay decisive without forcing the swipe.",
    rivalAccuracy: 0.78
  }
];

function hashSeed(input: string): number {
  let hash = 1779033703 ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);

  return (hash ^ (hash >>> 16)) >>> 0;
}

function createRandom(seed: number): RandomFn {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function getHourBucket(seedDate: Date): string {
  const hourBucket = new Date(seedDate);
  hourBucket.setMinutes(0, 0, 0);
  return hourBucket.toISOString();
}

function getStageMeta(stage: RegionStage): StageMeta {
  return STAGE_META.find((meta) => meta.stage === stage)!;
}

function pickRoundModifier(stage: RegionStage, roundInStage: number): RoundModifier {
  if (stage === "europe" && roundInStage === 3) {
    return "rival_surge";
  }

  if (stage === "africa_middle_east" && roundInStage === 4) {
    return "high_value";
  }

  if (stage === "asia_oceania") {
    return "speed_round";
  }

  return "none";
}

function pickPair(
  stage: RegionStage,
  difficulty: DifficultyBand,
  usedIds: Set<string>,
  previousPair: CountryPair | null,
  random: RandomFn
): CountryPair {
  const byStage = COUNTRY_PAIRS.filter((pair) => pair.regionStage === stage && pair.difficultyBand === difficulty && !usedIds.has(pair.id));
  const withoutImmediateCountryRepeat = byStage.filter(
    (pair) =>
      !previousPair || !pair.options.some((country) => previousPair.options.includes(country))
  );

  const candidatePool = withoutImmediateCountryRepeat.length > 0 ? withoutImmediateCountryRepeat : byStage;
  const fallbackPool = candidatePool.length > 0 ? candidatePool : COUNTRY_PAIRS.filter((pair) => pair.regionStage === stage);
  const chosen = shuffle(fallbackPool, random)[0];

  usedIds.add(chosen.id);
  return chosen;
}

function createRound(pair: CountryPair, roundNumber: number, stageMeta: StageMeta, roundInStage: number, random: RandomFn): GeoRound {
  const [firstOption, secondOption] = pair.options;
  const useOriginalOrder = random() >= 0.5;
  const leftOption = useOriginalOrder ? firstOption : secondOption;
  const rightOption = useOriginalOrder ? secondOption : firstOption;
  const correctAnswer = random() >= 0.5 ? firstOption : secondOption;
  const decoyAnswer = correctAnswer === firstOption ? secondOption : firstOption;
  const modifier = pickRoundModifier(stageMeta.stage, roundInStage);

  return {
    id: `${pair.id}-${roundNumber}`,
    roundNumber,
    mode: "continent",
    difficulty: pair.difficultyBand,
    modifier,
    timerSeconds: stageMeta.timerSeconds,
    pair: {
      id: pair.id,
      mode: "continent",
      options: pair.options,
      rationale: pair.rationale,
      coachingLine: pair.coachingLine,
      regionTag: pair.regionTag,
      visualTags: pair.visualTags,
      contextSearchTerms: pair.contextSearchTerms
    },
    location: {
      id: `loc-${pair.id}`,
      label: correctAnswer,
      country: correctAnswer,
      continentId: stageMeta.stage === "americas" ? "north_america" : stageMeta.stage === "europe" ? "europe" : stageMeta.stage === "africa_middle_east" ? "africa" : "asia",
      continentLabel: stageMeta.label,
      worldRegionId: stageMeta.stage === "americas" ? "north_america" : stageMeta.stage === "europe" ? "central_europe" : stageMeta.stage === "africa_middle_east" ? "north_africa" : "east_asia",
      worldRegionLabel: stageMeta.label,
      coordinates: [0, 0],
      tags: pair.visualTags
    },
    leftOption,
    rightOption,
    correctAnswer,
    decoyAnswer,
    correctDirection: correctAnswer === leftOption ? "left" : "right",
    sceneKey: `${pair.id}-${roundNumber}`
  };
}

export function createSessionSeed(seedDate: Date): string {
  return `${getHourBucket(seedDate)}:geoswipe`;
}

export function createPackSessionSeed(seedDate: Date, packId: string): string {
  return `${createSessionSeed(seedDate)}:pack-${packId}`;
}

export function createSessionRounds(seedDate: Date, mode: GameMode = "continent", packId = "001"): GeoRound[] {
  const progressiveRounds = createProgressiveRounds(seedDate, packId);
  return progressiveRounds;
}

function createProgressiveRounds(seedDate: Date, packId: string): GeoRound[] {
  const random = createRandom(hashSeed(createPackSessionSeed(seedDate, packId)));
  const rounds: GeoRound[] = [];
  let previousPair: CountryPair | null = null;

  for (const stage of STAGE_ORDER) {
    const stageMeta = getStageMeta(stage);
    const usedIds = new Set<string>();
    const pattern = STAGE_BLUEPRINTS[stage];

    pattern.forEach((difficulty, patternIndex) => {
      const pair = pickPair(stage, difficulty, usedIds, previousPair, random);
      const roundNumber = rounds.length + 1;
      const roundInStage = patternIndex + 1;
      const round = createRound(pair, roundNumber, stageMeta, roundInStage, random);

      rounds.push(round);
      previousPair = pair;
    });
  }

  return rounds;
}

export function summarizeDifficulty(rounds: GeoRound[]): DifficultySummary {
  const easy = rounds.filter((round) => round.difficulty === "easy").length;
  const medium = rounds.filter((round) => round.difficulty === "medium").length;
  const hard = rounds.filter((round) => round.difficulty === "hard").length;

  return {
    easy,
    medium,
    hard,
    mediumShare: rounds.length === 0 ? 0 : medium / rounds.length,
    hardShare: rounds.length === 0 ? 0 : hard / rounds.length
  };
}

export function getStageMetaByStage(stage: RegionStage): StageMeta {
  return getStageMeta(stage);
}

export function getStageModifierLabel(stage: RegionStage): string {
  return getStageMeta(stage).modifierLabel;
}

export function getDeckModifier(stage: RegionStage): RoundModifier {
  return STAGE_MODIFIER_MAP[stage];
}
