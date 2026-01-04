import { useMemo } from 'react';

/**
 * Calculate statistics for a character
 *
 * @param {Object} character - Character object
 * @returns {Object} Stats object with { completeness, moodCount, spriteCount, hasSpriteForAllMoods }
 */
function getCharacterStats(character) {
  const moodCount = character.moods ? Object.keys(character.moods).length : 0;
  const spriteCount = character.moods
    ? Object.values(character.moods).filter(sprite => sprite && sprite.trim()).length
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
 * @param {Array} characters - Array of all characters
 * @returns {Object} { getCharacterStats, totalStats }
 */
export function useCharacterStats(characters) {
  // Calculate total stats across all characters
  const totalStats = useMemo(() => {
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
