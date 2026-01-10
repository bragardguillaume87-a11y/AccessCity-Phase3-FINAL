import { useMemo } from 'react';

/**
 * Completeness calculation result
 */
export interface CompletenessResult {
  /** Total number of moods */
  moodCount: number;
  /** Number of moods with sprites assigned */
  spriteCount: number;
  /** Completeness percentage (0-100) */
  percentage: number;
}

/**
 * Custom hook for calculating character completeness
 *
 * Calculates character completeness metrics based on moods and sprites:
 * - Total mood count
 * - Sprite count (moods with assigned sprites)
 * - Completeness percentage
 *
 * Extracted from CharacterEditorModal for better organization.
 *
 * @param moods - Array of mood names
 * @param sprites - Object mapping mood names to sprite URLs
 * @returns Completeness metrics
 *
 * @example
 * ```typescript
 * const { moodCount, spriteCount, percentage } = useCharacterCompleteness(
 *   ['neutral', 'happy', 'sad'],
 *   { neutral: 'url1.png', happy: 'url2.png' }
 * );
 * console.log(percentage); // 66 (2/3 moods have sprites)
 * ```
 */
export function useCharacterCompleteness(
  moods: string[],
  sprites: Record<string, string> = {}
): CompletenessResult {
  const completeness = useMemo(() => {
    const moodCount = moods.length;
    const spriteCount = Object.values(sprites).filter(s => s && s.trim()).length;
    const percentage = moodCount > 0 ? Math.round((spriteCount / moodCount) * 100) : 0;

    return {
      moodCount,
      spriteCount,
      percentage
    };
  }, [moods, sprites]);

  return completeness;
}
