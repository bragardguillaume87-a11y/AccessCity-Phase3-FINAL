import { useCharactersStore } from '@/stores';

/**
 * Helper hook: Get character avatar URL from store
 * Returns the sprite for the given mood, or the first available sprite
 */
export function useCharacterAvatar(speakerId: string, mood: string): string | null {
  const characters = useCharactersStore((state) => state.characters);
  const character = characters.find((c) => c.id === speakerId);

  if (!character || !character.sprites) return null;

  return character.sprites[mood] || character.sprites['neutral'] || Object.values(character.sprites)[0] || null;
}
