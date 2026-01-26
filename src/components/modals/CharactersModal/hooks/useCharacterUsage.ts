import { useMemo } from 'react';
import type { Scene, Character } from '@/types';

/**
 * Character usage information across scenes
 */
export interface CharacterUsageData {
  /** Scene titles where this character appears */
  scenes: string[];
  /** Number of scenes using this character */
  sceneCount: number;
}

/**
 * Hook to track character usage across all scenes
 *
 * This hook is used to:
 * - Display usage information in the preview panel
 * - Show warnings before deleting characters that are used in scenes
 * - Filter characters by usage status (used/unused)
 * - Display usage badges in the Management tab
 *
 * @param scenes - All scenes in the project
 * @param characters - All characters in the project
 * @returns Map of character IDs to their usage data
 *
 * @example
 * ```typescript
 * const usageMap = useCharacterUsage(scenes, characters);
 * const usage = usageMap.get(characterId);
 * if (usage && usage.sceneCount > 0) {
 *   console.log(`Character is used in ${usage.sceneCount} scenes`);
 *   console.log(`Scenes: ${usage.scenes.join(', ')}`);
 * }
 * ```
 */
export function useCharacterUsage(
  scenes: Scene[],
  characters: Character[]
): Map<string, CharacterUsageData> {
  return useMemo(() => {
    const usage = new Map<string, CharacterUsageData>();

    // Iterate through all scenes and their characters
    scenes.forEach((scene) => {
      scene.characters.forEach((sceneChar) => {
        // Initialize usage data if this is the first time we see this character
        if (!usage.has(sceneChar.characterId)) {
          usage.set(sceneChar.characterId, {
            scenes: [],
            sceneCount: 0,
          });
        }

        // Get the usage data for this character
        const data = usage.get(sceneChar.characterId)!;

        // Add scene title (or ID as fallback) to the list
        data.scenes.push(scene.title || scene.id);
        data.sceneCount++;
      });
    });

    return usage;
  }, [scenes, characters]);
}

/**
 * Helper to check if a character is used in any scene
 *
 * @param characterId - Character ID to check
 * @param usageMap - Usage map from useCharacterUsage hook
 * @returns true if character is used, false otherwise
 */
export function isCharacterUsed(
  characterId: string,
  usageMap: Map<string, CharacterUsageData>
): boolean {
  const usage = usageMap.get(characterId);
  return !!usage && usage.sceneCount > 0;
}

/**
 * Helper to get formatted usage text for display
 *
 * @param characterId - Character ID
 * @param usageMap - Usage map from useCharacterUsage hook
 * @returns Formatted text like "Utilisé dans 3 scènes" or "Non utilisé"
 */
export function getUsageText(
  characterId: string,
  usageMap: Map<string, CharacterUsageData>
): string {
  const usage = usageMap.get(characterId);
  if (!usage || usage.sceneCount === 0) {
    return 'Non utilisé';
  }
  if (usage.sceneCount === 1) {
    return 'Utilisé dans 1 scène';
  }
  return `Utilisé dans ${usage.sceneCount} scènes`;
}
