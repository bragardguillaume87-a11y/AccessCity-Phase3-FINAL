import { useCallback } from 'react';
import { useCharactersStore } from '@/stores/index';
import { SYSTEM_CHARACTERS, DEFAULTS } from '@/config/constants';

/**
 * Unified Characters Hook
 *
 * Centralizes all character CRUD operations with:
 * - Performance optimization (useCallback)
 * - System character protection
 * - Consistent error handling
 *
 * @returns {Object} Character management functions
 *
 * @example
 * const { characters, createCharacter, removeCharacter } = useCharacters();
 * const newId = createCharacter();
 */
export const useCharacters = () => {
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);

  /**
   * Create a new character with default values
   * @returns {string} The ID of the newly created character
   */
  const createCharacter = useCallback(() => {
    const newCharacter = {
      name: 'New Character',
      description: '',
      sprites: {},
      moods: DEFAULTS.CHARACTER_MOODS_LIST
    };

    return addCharacter(newCharacter);
  }, [addCharacter]);

  /**
   * Duplicate an existing character
   * @param {string} characterId - The ID of the character to duplicate
   * @returns {string|null} The ID of the duplicated character, or null if failed
   */
  const duplicateCharacter = useCallback((characterId) => {
    const original = characters.find(c => c.id === characterId);
    if (!original) return null;

    // Remove ID so addCharacter generates a new one
    const { id, ...rest } = original;

    const duplicate = {
      ...rest,
      name: `${original.name} (Copy)`,
      sprites: { ...(original.sprites || {}) },
      moods: [...(original.moods || DEFAULTS.CHARACTER_MOODS_LIST)]
    };

    return addCharacter(duplicate);
  }, [characters, addCharacter]);

  /**
   * Remove a character with validation
   * @param {string} characterId - The ID of the character to remove
   * @returns {Object} { success: boolean, error?: string }
   */
  const removeCharacter = useCallback((characterId) => {
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
   * @param {string} characterId - The character ID
   * @returns {Object|null} The character or null if not found
   */
  const getCharacterById = useCallback((characterId) => {
    return characters.find(c => c.id === characterId) || null;
  }, [characters]);

  /**
   * Check if a character name already exists (case-insensitive)
   * @param {string} name - The name to check
   * @param {string} excludeId - ID to exclude from check (for editing)
   * @returns {boolean} True if name exists
   */
  const isNameTaken = useCallback((name, excludeId = null) => {
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
