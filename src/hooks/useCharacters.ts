import { useCallback } from 'react';
import { useCharactersStore } from '@/stores/index';
import { SYSTEM_CHARACTERS, DEFAULTS } from '@/config/constants';
import type { Character } from '@/types';

/**
 * Result of a remove character operation
 */
interface RemoveCharacterResult {
  success: boolean;
  error?: string;
}


/**
 * Return type for useCharacters hook
 */
interface UseCharactersReturn {
  characters: Character[];
  createCharacter: () => string;
  duplicateCharacter: (characterId: string) => string | null;
  removeCharacter: (characterId: string) => RemoveCharacterResult;
  updateCharacter: (updated: Character) => void;
  getCharacterById: (characterId: string) => Character | null;
  isNameTaken: (name: string, excludeId?: string | null) => boolean;
}

/**
 * Unified Characters Hook
 *
 * Centralizes all character CRUD operations with:
 * - Performance optimization (useCallback)
 * - System character protection
 * - Consistent error handling
 *
 * @returns Character management functions
 *
 * @example
 * const { characters, createCharacter, removeCharacter } = useCharacters();
 * const newId = createCharacter();
 */
export const useCharacters = (): UseCharactersReturn => {
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);

  /**
   * Create a new character with default values
   * @returns The ID of the newly created character
   */
  const createCharacter = useCallback((): string => {
    // addCharacter in store doesn't take arguments - it creates character internally
    return addCharacter();
  }, [addCharacter]);

  /**
   * Duplicate an existing character
   * @param characterId - The ID of the character to duplicate
   * @returns The ID of the duplicated character, or null if failed
   */
  const duplicateCharacter = useCallback((characterId: string): string | null => {
    const original = characters.find(c => c.id === characterId);
    if (!original) return null;

    // Create new character, then update it with duplicated data
    const newId = addCharacter();

    updateCharacter({
      id: newId,
      name: `${original.name} (Copy)`,
      description: original.description,
      sprites: { ...(original.sprites || {}) },
      moods: [...(original.moods || DEFAULTS.CHARACTER_MOODS_LIST)]
    });

    return newId;
  }, [characters, addCharacter, updateCharacter]);

  /**
   * Remove a character with validation
   * @param characterId - The ID of the character to remove
   * @returns Result object with success status and optional error message
   */
  const removeCharacter = useCallback((characterId: string): RemoveCharacterResult => {
    const character = characters.find(c => c.id === characterId);

    if (!character) {
      return {
        success: false,
        error: 'Character not found'
      };
    }

    // Protection: cannot delete system characters
    if (SYSTEM_CHARACTERS.includes(characterId)) {
      return {
        success: false,
        error: `Cannot delete system character: ${characterId}`
      };
    }

    deleteCharacter(characterId);
    return { success: true };
  }, [characters, deleteCharacter]);

  /**
   * Get a character by ID
   * @param characterId - The character ID
   * @returns The character or null if not found
   */
  const getCharacterById = useCallback((characterId: string): Character | null => {
    return characters.find(c => c.id === characterId) || null;
  }, [characters]);

  /**
   * Check if a character name already exists (case-insensitive)
   * @param name - The name to check
   * @param excludeId - ID to exclude from check (for editing)
   * @returns True if name exists
   */
  const isNameTaken = useCallback((name: string, excludeId: string | null = null): boolean => {
    return characters.some(c =>
      c.id !== excludeId &&
      c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }, [characters]);

  return {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter,
    getCharacterById,
    isNameTaken,
  };
};
