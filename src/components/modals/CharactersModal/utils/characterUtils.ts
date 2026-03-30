import type { Character } from '@/types';

/**
 * Returns the URL of the first available sprite for a character.
 * Returns undefined if no sprites or moods are defined.
 *
 * Used by CharacterCard, SelectableCharacterCard, and CharacterPreviewPanel
 * to display a consistent preview image.
 */
export function getPreviewImage(character: Character): string | undefined {
  if (!character.sprites || !character.moods || character.moods.length === 0) {
    return undefined;
  }
  const firstMood = character.moods[0];
  return character.sprites[firstMood];
}
