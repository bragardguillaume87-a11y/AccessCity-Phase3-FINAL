import { useCharactersStore } from '@/stores';

/**
 * Helper hook: Get character avatar URL from store.
 *
 * ✅ Le selector retourne directement une string (primitive).
 * Zustand compare via Object.is(oldUrl, newUrl) → pas de re-render si l'URL n'a pas changé.
 *
 * ⚠️ NE PAS faire : useCharactersStore(s => s.characters) → souscrit au tableau entier
 *    → tous les nœuds du graphe re-rendent dès qu'un personnage est modifié, même non-lié.
 */
export function useCharacterAvatar(speakerId: string, mood: string): string | null {
  return useCharactersStore((state) => {
    const character = state.characters.find((c) => c.id === speakerId);
    if (!character?.sprites) return null;
    return character.sprites[mood] || character.sprites['neutral'] || Object.values(character.sprites)[0] || null;
  });
}
