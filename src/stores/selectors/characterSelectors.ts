/**
 * Character Selectors
 *
 * Memoized selectors for the characters store.
 * Prevents unnecessary re-renders by returning stable references.
 *
 * Based on: https://tkdodo.eu/blog/working-with-zustand
 */

import { useCallback, useMemo } from 'react';
import { useCharactersStore } from '../charactersStore';
import type { Character } from '../../types';

// ============================================================================
// CHARACTER SELECTORS
// ============================================================================

/**
 * Select a single character by ID.
 * Memoized to prevent re-renders when other characters change.
 *
 * @example
 * ```typescript
 * const player = useCharacterById('player');
 * const narrator = useCharacterById('narrator');
 * ```
 */
export function useCharacterById(characterId: string | null | undefined): Character | undefined {
  return useCharactersStore(
    useCallback(
      (state) => (characterId ? state.characters.find((c) => c.id === characterId) : undefined),
      [characterId]
    )
  );
}

/**
 * Select all characters (stable reference).
 * Use this instead of inline selectors for better performance.
 */
export function useCharacters(): Character[] {
  return useCharactersStore((state) => state.characters);
}

/**
 * Select characters count.
 */
export function useCharactersCount(): number {
  return useCharactersStore((state) => state.characters.length);
}

/**
 * Select character IDs only (lightweight selector for lists).
 */
export function useCharacterIds(): string[] {
  return useCharactersStore(
    useCallback((state) => state.characters.map((c) => c.id), [])
  );
}

/**
 * Select character names as a map (for lookups in dialogue cards).
 * Memoized object { id: name }.
 */
export function useCharacterNamesMap(): Record<string, string> {
  return useCharactersStore(
    useCallback(
      (state) =>
        state.characters.reduce(
          (acc, char) => {
            acc[char.id] = char.name;
            return acc;
          },
          {} as Record<string, string>
        ),
      []
    )
  );
}

/**
 * Select characters that can be speakers (have moods).
 * Excludes narrator-type characters without sprites.
 */
export function useSpeakableCharacters(): Character[] {
  return useCharactersStore(
    useCallback(
      (state) =>
        state.characters.filter(
          (c) => c.moods && c.moods.length > 0 && Object.keys(c.sprites).length > 0
        ),
      []
    )
  );
}

/**
 * Select character moods by ID.
 * Useful for mood pickers.
 */
export function useCharacterMoods(characterId: string | null | undefined): string[] {
  return useCharactersStore(
    useCallback(
      (state) => {
        if (!characterId) return [];
        const character = state.characters.find((c) => c.id === characterId);
        return character?.moods ?? [];
      },
      [characterId]
    )
  );
}

/**
 * Select character sprites by ID.
 * Returns { mood: spriteUrl } map.
 */
export function useCharacterSprites(
  characterId: string | null | undefined
): Record<string, string> {
  return useCharactersStore(
    useCallback(
      (state) => {
        if (!characterId) return {};
        const character = state.characters.find((c) => c.id === characterId);
        return character?.sprites ?? {};
      },
      [characterId]
    )
  );
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
