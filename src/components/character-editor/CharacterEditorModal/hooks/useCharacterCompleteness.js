import { useMemo } from 'react';

/**
 * Custom hook for calculating character completeness
 * Extracted from CharacterEditorModal for better organization
 *
 * Calculates:
 * - Total mood count
 * - Sprite count (moods with assigned sprites)
 * - Completeness percentage
 *
 * @param {Array} moods - Array of mood names
 * @param {Object} sprites - Object mapping mood names to sprite URLs
 * @returns {Object} { moodCount, spriteCount, percentage }
 */
export function useCharacterCompleteness(moods, sprites = {}) {
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
