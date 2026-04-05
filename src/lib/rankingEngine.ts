/**
 * Ranking helpers shared by the frontend and the API contract.
 *
 * ELO starts at 500. The system is calibrated so:
 *   - A 50% accuracy session at medium difficulty → ~0 change
 *   - A perfect hard session beating the rival → +40 to +60
 *   - A bad easy session losing to rival → -20 to -40
 */

import type { CategoryMode, SessionSummary } from "../types/game";

// ── Rank tiers ────────────────────────────────────────────────────

export interface RankTier {
  name: string;
  min: number;
  max: number;
  color: string;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: "Bronze", min: 0, max: 799, color: "#cd7f32", icon: "\uD83E\uDD49" },
  { name: "Silver", min: 800, max: 1199, color: "#c0c0c0", icon: "\uD83E\uDD48" },
  { name: "Gold", min: 1200, max: 1599, color: "#ffd700", icon: "\uD83E\uDD47" },
  { name: "Platinum", min: 1600, max: 1999, color: "#7dd3fc", icon: "\uD83D\uDC8E" },
  { name: "Diamond", min: 2000, max: 9999, color: "#a78bfa", icon: "\uD83D\uDC51" },
];

export function getRankForElo(elo: number): RankTier {
  return RANK_TIERS.find((r) => elo >= r.min && elo <= r.max) ?? RANK_TIERS[0];
}

export function getRankProgress(elo: number): number {
  const rank = getRankForElo(elo);
  return Math.min(1, Math.max(0, (elo - rank.min) / (rank.max - rank.min)));
}

export function getNextRank(elo: number): RankTier | null {
  const current = getRankForElo(elo);
  const idx = RANK_TIERS.indexOf(current);
  return idx < RANK_TIERS.length - 1 ? RANK_TIERS[idx + 1] : null;
}

// ── ELO calculation ───────────────────────────────────────────────

interface EloUpdateInput {
  summary: SessionSummary;
  category: CategoryMode;
  currentElo: number;
}

interface EloUpdateResult {
  newElo: number;
  delta: number;
  breakdown: {
    accuracyFactor: number;
    difficultyBonus: number;
    rivalBonus: number;
    streakBonus: number;
  };
}

/**
 * Calculate ELO change after a session.
 *
 * The delta is a weighted combination of:
 *   1. Accuracy factor:    (accuracy - 0.5) × 60  → range -30 to +30
 *   2. Difficulty bonus:   hardShare × 20          → range 0 to +20
 *   3. Rival bonus:        +15 if won, -10 if lost
 *   4. Streak bonus:       min(maxStreak, 8) × 2   → range 0 to +16
 *
 * K-factor scales inversely with ELO (new players move faster):
 *   - ELO < 600:  K = 1.4
 *   - ELO < 1000: K = 1.2
 *   - ELO < 1500: K = 1.0
 *   - ELO >= 1500: K = 0.8
 */
export function calculateEloUpdate({ summary, currentElo }: EloUpdateInput): EloUpdateResult {
  const accuracyFactor = (summary.accuracy - 0.5) * 60;
  const hardShare = summary.difficultyCounts.hard / Math.max(1, summary.correctCount + (20 - summary.correctCount));
  const difficultyBonus = hardShare * 20;
  const rivalBonus = summary.playerWon ? 15 : -10;
  const streakBonus = Math.min(summary.maxStreak, 8) * 2;

  const rawDelta = accuracyFactor + difficultyBonus + rivalBonus + streakBonus;

  const kFactor = currentElo < 600 ? 1.4
    : currentElo < 1000 ? 1.2
    : currentElo < 1500 ? 1.0
    : 0.8;

  const delta = Math.round(rawDelta * kFactor);
  const newElo = Math.max(0, currentElo + delta);

  return {
    newElo,
    delta,
    breakdown: { accuracyFactor, difficultyBonus, rivalBonus, streakBonus }
  };
}

// ── Per-swipe ELO ─────────────────────────────────────────────────

export interface SwipeEloInput {
  correct: boolean;
  timedOut: boolean;
  difficulty: "easy" | "medium" | "hard";
  streak: number;
  currentElo: number;
}

/**
 * Small ELO adjustment after every single swipe.
 *
 * Correct:  +1 to +5 depending on difficulty and streak
 * Wrong:    -1 to -3 depending on difficulty
 * Timed out: -2 to -4
 *
 * This gives the player live feedback during a run while the
 * bulk of the ELO movement still comes from the session-end calc.
 */
export function calculateSwipeElo({ correct, timedOut, difficulty, streak, currentElo }: SwipeEloInput): number {
  const kFactor = currentElo < 600 ? 1.3 : currentElo < 1200 ? 1.0 : 0.8;

  if (!correct) {
    const basePenalty = difficulty === "hard" ? -1 : difficulty === "medium" ? -2 : -3;
    const timeoutExtra = timedOut ? -1 : 0;
    return Math.round((basePenalty + timeoutExtra) * kFactor);
  }

  const baseGain = difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
  const streakExtra = Math.min(streak, 5) >= 3 ? 1 : 0;
  return Math.round((baseGain + streakExtra) * kFactor);
}

export interface PlayerStats {
  globalElo: number;
  categoryElo: Record<CategoryMode, number>;
  totalSessions: number;
  totalCorrect: number;
  totalRounds: number;
  bestStreak: number;
  wins: number;
  losses: number;
  history: SessionHistoryEntry[];
}

export interface SessionHistoryEntry {
  timestamp: string;
  category: CategoryMode;
  playerScore: number;
  rivalScore: number;
  accuracy: number;
  eloBefore: number;
  eloAfter: number;
  eloDelta: number;
  won: boolean;
}
