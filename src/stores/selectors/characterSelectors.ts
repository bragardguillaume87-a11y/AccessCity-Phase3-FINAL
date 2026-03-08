/**
 * Character Selectors
 *
 * Memoized selectors for the characters store.
 * Prevents unnecessary re-renders by returning stable references.
 *
 * Based on: https://tkdodo.eu/blog/working-with-zustand
 */

import { useMemo } from 'react';
import { useCharactersStore } from '../charactersStore';
import type { Character } from '../../types';

// ============================================================================
// CHARACTER SELECTORS
// ============================================================================

/**
 * Select all characters (stable reference).
 * Use this instead of inline selectors for better performance.
 */
export function useCharacters(): Character[] {
  return useCharactersStore((state) => state.characters);
}

// ============================================================================
// ACTIONS SELECTORS (stable references)
// ============================================================================

/**
 * Select character actions (stable references).
 * Use object destructuring for specific actions.
 *
 * @example
 * ```typescript
 * const { addCharacter, updateCharacter } = useCharacterActions();
 * ```
 */
export function useCharacterActions() {
  const addCharacter = useCharactersStore((state) => state.addCharacter);
  const updateCharacter = useCharactersStore((state) => state.updateCharacter);
  const deleteCharacter = useCharactersStore((state) => state.deleteCharacter);

  return useMemo(
    () => ({
      addCharacter,
      updateCharacter,
      deleteCharacter,
    }),
    [addCharacter, updateCharacter, deleteCharacter]
  );
}

/**
 * Get character by ID (non-hook version for callbacks).
 * Uses store's built-in getCharacterById.
 *
 * @example
 * ```typescript
 * const handleClick = () => {
 *   const char = getCharacterById('player');
 *   console.log(char?.name);
 * };
 * ```
 */
export function getCharacterById(characterId: string): Character | undefined {
  return useCharactersStore.getState().getCharacterById(characterId);
}
