/**
 * Game mechanics constants for AccessCity engine
 *
 * Single source of truth for:
 * - Stat bounds (0-100 range)
 * - Stat thresholds (color-coded health display)
 * - Dice system (d20, difficulty, penalties, bonuses)
 *
 * Usage:
 * import { STAT_BOUNDS, STAT_THRESHOLDS, DICE } from '@/config/gameConstants';
 */

// ============================================================================
// STAT BOUNDS
// ============================================================================

/** Min and max values for all RPG stats (Physique, Mentale, etc.) */
export const STAT_BOUNDS = {
  MIN: 0,
  MAX: 100,
} as const;

// ============================================================================
// STAT THRESHOLDS (UI color coding)
// ============================================================================

/**
 * Thresholds for stat bar color coding.
 *
 * - value > HEALTHY → green
 * - value > WARNING → yellow
 * - value ≤ WARNING → red
 */
export const STAT_THRESHOLDS = {
  HEALTHY: 66,
  WARNING: 33,
} as const;

// ============================================================================
// DICE SYSTEM
// ============================================================================

/** d20 dice roll configuration and outcome modifiers */
export const DICE = {
  /** Number of faces on the die (d20) */
  D20_MAX: 20,
  /** Default difficulty threshold when none is specified */
  DEFAULT_DIFFICULTY: 10,
  /** Stat penalty on failed roll when a target stat is specified */
  FAIL_TARGET_PENALTY: 10,
  /** Stat penalty on failed roll applied to ALL stats (no target) */
  FAIL_ALL_PENALTY: 5,
  /** Stat bonus on successful roll for the target stat */
  SUCCESS_BONUS: 5,
} as const;
