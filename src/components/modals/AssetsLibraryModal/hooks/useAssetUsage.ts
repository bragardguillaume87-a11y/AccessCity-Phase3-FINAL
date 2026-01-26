import { useMemo } from 'react';
import type { Scene, Character, AssetUsageInfo } from '@/types';

/**
 * Internal usage data structure
 */
interface AssetUsageData {
  scenes: string[];
  characters: string[];
}

/**
 * Hook for calculating asset usage across scenes and characters
 *
 * Tracks which assets are used as:
 * - Scene backgrounds (from scene.backgroundUrl or scene.background)
 * - Character sprites (from character.sprites for all moods)
 *
 * @param scenes - All scenes in the project
 * @param characters - All characters in the project
 * @returns Map of asset paths to usage data { scenes: string[], characters: string[] }
 *
 * @example
 * ```tsx
 * const scenes = useScenesStore(state => state.scenes);
 * const characters = useCharactersStore(state => state.characters);
 * const assetUsage = useAssetUsage(scenes, characters);
 *
 * // Check if asset is used
 * const usage = assetUsage.get('/assets/bg1.png');
 * if (usage) {
 *   console.log(`Used in ${usage.scenes.length} scenes`);
 * }
 * ```
 */
export function useAssetUsage(scenes: Scene[], characters: Character[]): Map<string, AssetUsageData> {
  return useMemo(() => {
    const usage = new Map<string, AssetUsageData>();

    // Assets used in scenes (backgrounds)
    scenes.forEach(scene => {
      const bg = scene.backgroundUrl;
      if (bg) {
        if (!usage.has(bg)) {
          usage.set(bg, { scenes: [], characters: [] });
        }
        usage.get(bg)!.scenes.push(scene.title || scene.id);
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
            usage.get(sprite)!.characters.push(character.name);
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
 * Transforms raw usage data into a structured format with counts
 * and usage details. Returns null if asset is not used.
 *
 * @param assetPath - Path to the asset
 * @param assetUsage - Usage map from useAssetUsage hook
 * @returns Formatted usage info or null if not used
 *
 * @example
 * ```tsx
 * const assetUsage = useAssetUsage(scenes, characters);
 * const info = getAssetUsageInfo('/assets/bg1.png', assetUsage);
 *
 * if (info) {
 *   console.log(`Used ${info.total} times`);
 *   console.log(`In scenes: ${info.scenes.join(', ')}`);
 * }
 * ```
 */
export function getAssetUsageInfo(
  assetPath: string,
  assetUsage: Map<string, AssetUsageData>
): AssetUsageInfo | null {
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
