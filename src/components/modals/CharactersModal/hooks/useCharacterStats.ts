import { useMemo } from 'react';
import type { Character } from '@/types';

/**
 * Statistics for an individual character
 */
export interface CharacterStats {
  /** Completeness percentage (0-100) */
  completeness: number;
  /** Number of moods defined for this character */
  moodCount: number;
  /** Number of sprites assigned to moods */
  spriteCount: number;
  /** Whether all moods have sprites */
  hasSpriteForAllMoods: boolean;
}

/**
 * Aggregate statistics for all characters
 */
export interface TotalCharacterStats {
  /** Total number of characters */
  total: number;
  /** Number of complete characters (all moods have sprites) */
  complete: number;
  /** Number of characters with at least one sprite */
  withSprites: number;
}

/**
 * Return type for useCharacterStats hook
 */
export interface UseCharacterStatsReturn {
  /** Function to calculate stats for a single character */
  getCharacterStats: (character: Character) => CharacterStats;
  /** Aggregate stats for all characters */
  totalStats: TotalCharacterStats;
}

/**
 * Calculate statistics for a single character
 *
 * @param character - Character object to analyze
 * @returns Stats object with completeness, mood count, sprite count, and completeness flag
 */
function getCharacterStats(character: Character): CharacterStats {
  const moodCount = character.moods ? character.moods.length : 0;
  const spriteCount = character.sprites
    ? Object.values(character.sprites).filter(sprite => sprite && sprite.trim()).length
    : 0;

  const hasSpriteForAllMoods = moodCount > 0 && spriteCount === moodCount;
  const completeness = moodCount > 0 ? Math.round((spriteCount / moodCount) * 100) : 0;

  return {
    completeness,
    moodCount,
    spriteCount,
    hasSpriteForAllMoods
  };
}

/**
 * Custom hook for calculating character statistics
 *
 * Provides both individual character stats calculation and aggregate stats
 * for all characters. Stats include completeness percentage, mood counts,
 * sprite counts, and completion flags.
 *
 * @param characters - Array of all characters to analyze
 * @returns Object containing getCharacterStats function and totalStats
 *
 * @example
 * ```tsx
 * const { getCharacterStats, totalStats } = useCharacterStats(characters);
 *
 * // Get stats for a single character
 * const stats = getCharacterStats(character);
 * console.log(stats.completeness); // 100
 *
 * // Access aggregate stats
 * console.log(totalStats.complete); // 5
 * ```
 */
export function useCharacterStats(characters: Character[]): UseCharacterStatsReturn {
  // Calculate total stats across all characters
  const totalStats = useMemo((): TotalCharacterStats => {
    const total = characters.length;

    const complete = characters.filter(c => {
      const stats = getCharacterStats(c);
      return stats.hasSpriteForAllMoods && stats.moodCount > 0;
    }).length;

    const withSprites = characters.filter(c => {
      const stats = getCharacterStats(c);
      return stats.spriteCount > 0;
    }).length;

    return {
      total,
      complete,
      withSprites
    };
  }, [characters]);

  return {
    getCharacterStats,
    totalStats
  };
}
