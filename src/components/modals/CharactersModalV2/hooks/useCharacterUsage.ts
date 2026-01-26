import { useMemo } from 'react';
import type { Scene, Character } from '@/types';

/**
 * Character usage data interface
 */
export interface CharacterUsageData {
  /** List of scene titles/IDs where character is used */
  scenes: string[];
  /** Number of scenes where character appears */
  sceneCount: number;
}

/**
 * Check if a character is used in any scene
 *
 * @param characterId - Character ID to check
 * @param usageMap - Map of character usage data
 * @returns True if character is used in at least one scene
 */
export function isCharacterUsed(
  characterId: string,
  usageMap: Map<string, CharacterUsageData>
): boolean {
  const usage = usageMap.get(characterId);
  return usage !== undefined && usage.sceneCount > 0;
}

/**
 * Get formatted usage text for a character
 *
 * @param characterId - Character ID
 * @param usageMap - Map of character usage data
 * @returns Formatted usage text (e.g., "Utilisé dans 3 scènes")
 */
export function getUsageText(
  characterId: string,
  usageMap: Map<string, CharacterUsageData>
): string | undefined {
  const usage = usageMap.get(characterId);
  if (!usage || usage.sceneCount === 0) {
    return undefined;
  }

  const count = usage.sceneCount;
  return `Utilisé dans ${count} scène${count > 1 ? 's' : ''}`;
}

/**
 * useCharacterUsage - Track character usage across scenes
 *
 * **Pattern:** Custom pattern inspired by AssetsLibraryModal usage warnings
 *
 * Builds a map of which characters are used in which scenes. Used to:
 * - Show usage badges on character cards
 * - Display warnings before deleting used characters
 * - Filter characters by usage status
 *
 * ## Features
 * - **Memoized calculation:** Recalculates only when scenes or characters change
 * - **Map-based storage:** O(1) lookup for character usage
 * - **Scene tracking:** Lists all scene titles where character appears
 * - **Helper functions:** isCharacterUsed and getUsageText utilities
 *
 * ## Usage
 * ```tsx
 * const usageMap = useCharacterUsage(scenes, characters);
 *
 * // Check if character is used
 * const isUsed = isCharacterUsed(characterId, usageMap);
 *
 * // Get usage badge text
 * const badgeText = getUsageText(characterId, usageMap);
 *
 * // Get detailed usage info
 * const usage = usageMap.get(characterId);
 * if (usage) {
 *   console.log(`Used in: ${usage.scenes.join(', ')}`);
 * }
 * ```
 *
 * @param scenes - Array of all scenes
 * @param characters - Array of all characters (for dependency tracking)
 * @returns Map of character ID to usage data
 */
export function useCharacterUsage(
  scenes: Scene[],
  characters: Character[]
): Map<string, CharacterUsageData> {
  return useMemo(() => {
    const usage = new Map<string, CharacterUsageData>();

    // Iterate through all scenes
    scenes.forEach((scene) => {
      // Check if scene has characters
      if (!scene.characters || scene.characters.length === 0) {
        return;
      }

      // Iterate through characters in this scene
      scene.characters.forEach((sceneChar) => {
        const characterId = sceneChar.characterId;

        // Initialize usage data if not exists
        if (!usage.has(characterId)) {
          usage.set(characterId, {
            scenes: [],
            sceneCount: 0,
          });
        }

        // Add scene to character's usage list
        const data = usage.get(characterId)!;
        data.scenes.push(scene.title || scene.id || 'Scène sans titre');
        data.sceneCount++;
      });
    });

    return usage;
  }, [scenes, characters]);
}

export default useCharacterUsage;
