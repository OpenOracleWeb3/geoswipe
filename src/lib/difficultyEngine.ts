import { STAGE_ORDER } from "../data/confusionPools";
import { areDifferentContinents, CITY_BY_COUNTRY, getBroadContinent, PAIRS_BY_STAGE, type GeneratedPair } from "../data/geoCatalog";
import type {
  CategoryMode,
  DifficultyBand,
  GameMode,
  GeoRound,
  RegionStage,
  RoundModifier,
  StageMeta
} from "../types/game";

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
  americas: ["easy", "medium"],
  europe: ["medium", "hard"],
  africa_middle_east: ["easy", "medium", "hard"],
  asia_oceania: ["medium", "hard", "hard"]
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
    introTitle: "Stage 1 \u00B7 Build heat in the Americas",
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
    introTitle: "Stage 2 \u00B7 Europe tightens the screws",
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
    introTitle: "Stage 3 \u00B7 High-value swings",
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
    introTitle: "Stage 4 \u00B7 Final reads, cleaner nerve",
    introBody: "The final stretch keeps the 30-second clock but leans harder into look-alike density. Finish with control.",
    timerSeconds: ROUND_TIMER_SECONDS,
    modifier: "speed_round",
    modifierLabel: "Fast scoring",
    pressureNote: "Same timer, harder reads. Stay decisive without forcing the swipe.",
    rivalAccuracy: 0.78
  }
];

// ── Shared helpers ────────────────────────────────────────────────

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

function stageToContinentId(stage: RegionStage) {
  return stage === "americas" ? "north_america" as const
    : stage === "europe" ? "europe" as const
    : stage === "africa_middle_east" ? "africa" as const
    : "asia" as const;
}

function stageToWorldRegionId(stage: RegionStage) {
  return stage === "americas" ? "north_america" as const
    : stage === "europe" ? "central_europe" as const
    : stage === "africa_middle_east" ? "north_africa" as const
    : "east_asia" as const;
}

/**
 * Pick from the massive combinatorial pair pool for a given stage/difficulty.
 * Used by city, continent, and worldwide modes.
 */
function pickGeneratedPair(
  stage: RegionStage,
  difficulty: DifficultyBand,
  usedIds: Set<string>,
  previousOptions: [string, string] | null,
  random: RandomFn,
  filter?: (p: GeneratedPair) => boolean
): GeneratedPair {
  const stagePool = PAIRS_BY_STAGE[stage];
  let candidates = stagePool.filter(
    (p) => p.difficultyBand === difficulty && !usedIds.has(p.id) && (!filter || filter(p))
  );

  // Avoid immediate option repeat
  if (previousOptions) {
    const noRepeat = candidates.filter(
      (p) => !p.options.some((o) => previousOptions.includes(o))
    );
    if (noRepeat.length > 0) candidates = noRepeat;
  }

  // Fallback: any difficulty in stage matching filter
  if (candidates.length === 0) {
    candidates = stagePool.filter((p) => !usedIds.has(p.id) && (!filter || filter(p)));
  }
  // Fallback: any pair in stage
  if (candidates.length === 0) {
    candidates = stagePool;
  }

  const chosen = shuffle(candidates, random)[0];
  usedIds.add(chosen.id);
  return chosen;
}

// ── Round builders ────────────────────────────────────────────────

function createCountryRound(pair: GeneratedPair, roundNumber: number, stageMeta: StageMeta, roundInStage: number, random: RandomFn): GeoRound {
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
    mode: "country",
    difficulty: pair.difficultyBand,
    modifier,
    timerSeconds: stageMeta.timerSeconds,
    pair: {
      id: pair.id,
      mode: "country",
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
      continentId: stageToContinentId(stageMeta.stage),
      continentLabel: stageMeta.label,
      worldRegionId: stageToWorldRegionId(stageMeta.stage),
      worldRegionLabel: stageMeta.label,
      coordinates: [0, 0],
      tags: pair.visualTags
    },
    leftOption,
    rightOption,
    correctAnswer,
    decoyAnswer,
    correctDirection: correctAnswer === leftOption ? "left" : "right",
    sceneKey: `${pair.id}-${roundNumber}`,
    mediaCountry: correctAnswer
  };
}

/**
 * Dynamically derives a continent-mode round from a country pair.
 * Relabels the options to continent names and uses the underlying
 * country for media fetching.
 */
function createContinentRoundFromCountryPair(
  pair: GeneratedPair,
  roundNumber: number,
  stageMeta: StageMeta,
  roundInStage: number,
  random: RandomFn
): GeoRound {
  const [countryA, countryB] = pair.options;
  const catA = CITY_BY_COUNTRY[countryA];
  const catB = CITY_BY_COUNTRY[countryB];
  const continentA = catA ? getBroadContinent(catA.continent) : stageMeta.label;
  const continentB = catB ? getBroadContinent(catB.continent) : stageMeta.label;

  // If both countries map to the same broad continent, differentiate with finer labels
  const labelA = continentA === continentB && catA ? catA.continent : continentA;
  const labelB = continentA === continentB && catB ? catB.continent : continentB;

  const useOriginalOrder = random() >= 0.5;
  const leftLabel = useOriginalOrder ? labelA : labelB;
  const rightLabel = useOriginalOrder ? labelB : labelA;
  const leftCountry = useOriginalOrder ? countryA : countryB;
  const rightCountry = useOriginalOrder ? countryB : countryA;

  const correctIndex = random() >= 0.5 ? 0 : 1;
  const correctLabel = correctIndex === 0 ? leftLabel : rightLabel;
  const decoyLabel = correctIndex === 0 ? rightLabel : leftLabel;
  const mediaCountry = correctIndex === 0 ? leftCountry : rightCountry;
  const modifier = pickRoundModifier(stageMeta.stage, roundInStage);

  return {
    id: `cont-${pair.id}-${roundNumber}`,
    roundNumber,
    mode: "continent",
    difficulty: pair.difficultyBand,
    modifier,
    timerSeconds: stageMeta.timerSeconds,
    pair: {
      id: pair.id,
      mode: "continent",
      options: [labelA, labelB],
      rationale: pair.rationale,
      coachingLine: pair.coachingLine,
      regionTag: `${labelA} vs ${labelB}`,
      visualTags: pair.visualTags,
      contextSearchTerms: pair.contextSearchTerms
    },
    location: {
      id: `loc-${pair.id}`,
      label: mediaCountry,
      country: mediaCountry,
      continentId: stageToContinentId(stageMeta.stage),
      continentLabel: stageMeta.label,
      worldRegionId: stageToWorldRegionId(stageMeta.stage),
      worldRegionLabel: stageMeta.label,
      coordinates: [0, 0],
      tags: pair.visualTags
    },
    leftOption: leftLabel,
    rightOption: rightLabel,
    correctAnswer: correctLabel,
    decoyAnswer: decoyLabel,
    correctDirection: correctLabel === leftLabel ? "left" : "right",
    sceneKey: `cont-${pair.id}-${roundNumber}`,
    mediaCountry
  };
}

/**
 * Dynamically derives a city-mode round from a country pair.
 * Relabels the options to city names and uses the city coordinates
 * for Street View lookups.
 */
function createCityRoundFromCountryPair(
  pair: GeneratedPair,
  roundNumber: number,
  stageMeta: StageMeta,
  roundInStage: number,
  random: RandomFn
): GeoRound {
  const [countryA, countryB] = pair.options;
  const catA = CITY_BY_COUNTRY[countryA];
  const catB = CITY_BY_COUNTRY[countryB];
  const cityA = catA?.city ?? countryA;
  const cityB = catB?.city ?? countryB;
  const coordsA = catA?.coordinates ?? [0, 0] as [number, number];
  const coordsB = catB?.coordinates ?? [0, 0] as [number, number];

  const useOriginalOrder = random() >= 0.5;
  const leftCity = useOriginalOrder ? cityA : cityB;
  const rightCity = useOriginalOrder ? cityB : cityA;
  const leftCountry = useOriginalOrder ? countryA : countryB;
  const rightCountry = useOriginalOrder ? countryB : countryA;
  const leftCoords = useOriginalOrder ? coordsA : coordsB;
  const rightCoords = useOriginalOrder ? coordsB : coordsA;

  const correctIndex = random() >= 0.5 ? 0 : 1;
  const correctCity = correctIndex === 0 ? leftCity : rightCity;
  const decoyCity = correctIndex === 0 ? rightCity : leftCity;
  const mediaCountry = correctIndex === 0 ? leftCountry : rightCountry;
  const cityCoordinates = correctIndex === 0 ? leftCoords : rightCoords;
  const modifier = pickRoundModifier(stageMeta.stage, roundInStage);

  const searchTerms = [
    ...(catA ? catA.searchTerms : []),
    ...(catB ? catB.searchTerms : []),
    ...pair.contextSearchTerms.slice(0, 2)
  ];

  return {
    id: `city-${pair.id}-${roundNumber}`,
    roundNumber,
    mode: "city",
    difficulty: pair.difficultyBand,
    modifier,
    timerSeconds: stageMeta.timerSeconds,
    pair: {
      id: pair.id,
      mode: "city",
      options: [cityA, cityB],
      rationale: pair.rationale,
      coachingLine: pair.coachingLine,
      regionTag: `${cityA} vs ${cityB}`,
      visualTags: pair.visualTags,
      contextSearchTerms: searchTerms
    },
    location: {
      id: `loc-${pair.id}`,
      label: correctCity,
      country: mediaCountry,
      continentId: stageToContinentId(stageMeta.stage),
      continentLabel: stageMeta.label,
      worldRegionId: stageToWorldRegionId(stageMeta.stage),
      worldRegionLabel: stageMeta.label,
      coordinates: cityCoordinates,
      tags: pair.visualTags
    },
    leftOption: leftCity,
    rightOption: rightCity,
    correctAnswer: correctCity,
    decoyAnswer: decoyCity,
    correctDirection: correctCity === leftCity ? "left" : "right",
    sceneKey: `city-${pair.id}-${roundNumber}`,
    mediaCountry,
    cityCoordinates
  };
}

// ── Session round generators ──────────────────────────────────────

function createProgressiveRounds(seedDate: Date, packId: string): GeoRound[] {
  const random = createRandom(hashSeed(createPackSessionSeed(seedDate, packId)));
  const rounds: GeoRound[] = [];
  let previousOptions: [string, string] | null = null;

  for (const stage of STAGE_ORDER) {
    const stageMeta = getStageMeta(stage);
    const usedIds = new Set<string>();
    const pattern = STAGE_BLUEPRINTS[stage];

    pattern.forEach((difficulty, patternIndex) => {
      const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random);
      const roundNumber = rounds.length + 1;
      const roundInStage = patternIndex + 1;
      const round = createCountryRound(pair, roundNumber, stageMeta, roundInStage, random);

      rounds.push(round);
      previousOptions = pair.options;
    });
  }

  return rounds;
}

function createContinentRounds(seedDate: Date, packId: string): GeoRound[] {
  const random = createRandom(hashSeed(createPackSessionSeed(seedDate, packId) + ":continents"));
  const rounds: GeoRound[] = [];
  let previousOptions: [string, string] | null = null;

  for (const stage of STAGE_ORDER) {
    const stageMeta = getStageMeta(stage);
    const usedIds = new Set<string>();
    const pattern = STAGE_BLUEPRINTS[stage];

    pattern.forEach((difficulty, patternIndex) => {
      // Filter for cross-continent pairs so the labels differ
      const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random,
        (p) => areDifferentContinents(p.options[0], p.options[1])
      );
      const roundNumber = rounds.length + 1;
      const roundInStage = patternIndex + 1;
      const round = createContinentRoundFromCountryPair(pair, roundNumber, stageMeta, roundInStage, random);

      rounds.push(round);
      previousOptions = pair.options;
    });
  }

  return rounds;
}

function createCityRounds(seedDate: Date, packId: string): GeoRound[] {
  const random = createRandom(hashSeed(createPackSessionSeed(seedDate, packId) + ":cities"));
  const rounds: GeoRound[] = [];
  let previousOptions: [string, string] | null = null;

  for (const stage of STAGE_ORDER) {
    const stageMeta = getStageMeta(stage);
    const usedIds = new Set<string>();
    const pattern = STAGE_BLUEPRINTS[stage];

    pattern.forEach((difficulty, patternIndex) => {
      const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random);
      const roundNumber = rounds.length + 1;
      const roundInStage = patternIndex + 1;
      const round = createCityRoundFromCountryPair(pair, roundNumber, stageMeta, roundInStage, random);

      rounds.push(round);
      previousOptions = pair.options;
    });
  }

  return rounds;
}

const WORLDWIDE_WEIGHTS: Array<{ mode: GameMode; weight: number }> = [
  { mode: "continent", weight: 0.3 },
  { mode: "country", weight: 0.4 },
  { mode: "city", weight: 0.3 }
];

function pickWorldWideMode(random: RandomFn): GameMode {
  const roll = random();
  let cumulative = 0;
  for (const { mode, weight } of WORLDWIDE_WEIGHTS) {
    cumulative += weight;
    if (roll < cumulative) {
      return mode;
    }
  }
  return "country";
}

function createWorldWideRounds(seedDate: Date, packId: string): GeoRound[] {
  const random = createRandom(hashSeed(createPackSessionSeed(seedDate, packId) + ":worldwide"));
  const rounds: GeoRound[] = [];
  let previousOptions: [string, string] | null = null;

  for (const stage of STAGE_ORDER) {
    const stageMeta = getStageMeta(stage);
    const usedIds = new Set<string>();
    const pattern = STAGE_BLUEPRINTS[stage];

    pattern.forEach((difficulty, patternIndex) => {
      const roundMode = pickWorldWideMode(random);
      const roundNumber = rounds.length + 1;
      const roundInStage = patternIndex + 1;
      let round: GeoRound;

      if (roundMode === "continent") {
        const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random,
          (p) => areDifferentContinents(p.options[0], p.options[1])
        );
        round = createContinentRoundFromCountryPair(pair, roundNumber, stageMeta, roundInStage, random);
        previousOptions = pair.options;
      } else if (roundMode === "city") {
        const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random);
        round = createCityRoundFromCountryPair(pair, roundNumber, stageMeta, roundInStage, random);
        previousOptions = pair.options;
      } else {
        const pair = pickGeneratedPair(stage, difficulty, usedIds, previousOptions, random);
        round = createCountryRound(pair, roundNumber, stageMeta, roundInStage, random);
        previousOptions = pair.options;
      }

      rounds.push(round);
    });
  }

  return rounds;
}

// ── Public API ────────────────────────────────────────────────────

export function createSessionSeed(seedDate: Date): string {
  return `${getHourBucket(seedDate)}:geoswipe`;
}

export function createPackSessionSeed(seedDate: Date, packId: string): string {
  return `${createSessionSeed(seedDate)}:pack-${packId}`;
}

export function createSessionRounds(seedDate: Date, category: CategoryMode = "countries", packId = "001"): GeoRound[] {
  switch (category) {
    case "continents":
      return createContinentRounds(seedDate, packId);
    case "countries":
      return createProgressiveRounds(seedDate, packId);
    case "cities":
      return createCityRounds(seedDate, packId);
    case "worldwide":
      return createWorldWideRounds(seedDate, packId);
  }
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
