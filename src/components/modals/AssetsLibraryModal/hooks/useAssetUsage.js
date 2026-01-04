import { useMemo } from 'react';

/**
 * Hook for calculating asset usage across scenes and characters
 *
 * Tracks which assets are used as:
 * - Scene backgrounds
 * - Character sprites (all moods)
 *
 * @param {Array} scenes - All scenes in the project
 * @param {Array} characters - All characters in the project
 * @returns {Map} Map of asset paths to usage info { scenes: [], characters: [] }
 */
export function useAssetUsage(scenes, characters) {
  return useMemo(() => {
    const usage = new Map();

    // Assets used in scenes (backgrounds)
    scenes.forEach(scene => {
      const bg = scene.background || scene.backgroundUrl;
      if (bg) {
        if (!usage.has(bg)) {
          usage.set(bg, { scenes: [], characters: [] });
        }
        usage.get(bg).scenes.push(scene.name || scene.id);
      }
    });

    // Assets used in characters (sprites)
    characters.forEach(character => {
      if (character.sprites) {
        Object.values(character.sprites).forEach(sprite => {
          if (sprite) {
            if (!usage.has(sprite)) {
              usage.set(sprite, { scenes: [], characters: [] });
            }
            usage.get(sprite).characters.push(character.name);
          }
        });
      }
    });

    return usage;
  }, [scenes, characters]);
}

/**
 * Get formatted usage information for a specific asset
 *
 * @param {string} assetPath - Path to the asset
 * @param {Map} assetUsage - Usage map from useAssetUsage hook
 * @returns {Object|null} Usage info or null if not used
 */
export function getAssetUsageInfo(assetPath, assetUsage) {
  const usage = assetUsage.get(assetPath);
  if (!usage) return null;

  const sceneCount = usage.scenes.length;
  const characterCount = usage.characters.length;
  const totalUsage = sceneCount + characterCount;

  if (totalUsage === 0) return null;

  return {
    total: totalUsage,
    scenes: usage.scenes,
    characters: usage.characters,
    sceneCount,
    characterCount
  };
}
