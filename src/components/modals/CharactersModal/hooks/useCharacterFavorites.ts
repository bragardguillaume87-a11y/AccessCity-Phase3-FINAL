import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'accesscity-favorite-characters';

/**
 * Return type for useCharacterFavorites hook
 */
export interface UseCharacterFavoritesReturn {
  /** Set of character IDs that are favorited */
  favorites: Set<string>;
  /** Toggle favorite status for a character */
  toggleFavorite: (characterId: string) => void;
  /** Check if a character is favorited */
  isFavorite: (characterId: string) => boolean;
}

/**
 * Custom hook for managing character favorites with localStorage persistence
 *
 * Provides favorite character management with automatic localStorage persistence.
 * Favorites are stored as a Set for efficient lookup and are persisted across sessions.
 *
 * Pattern inspired by AssetsLibraryModal/hooks/useFavorites.js
 *
 * @returns Object containing favorites Set, toggleFavorite function, and isFavorite checker
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useCharacterFavorites();
 *
 * // Check if character is favorite
 * if (isFavorite(character.id)) {
 *   // Show filled star
 * }
 *
 * // Toggle favorite status
 * <button onClick={() => toggleFavorite(character.id)}>
 *   Toggle Favorite
 * </button>
 * ```
 */
export function useCharacterFavorites(): UseCharacterFavoritesReturn {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.warn('Failed to load favorite characters:', error);
      return new Set();
    }
  });

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    } catch (error) {
      console.warn('Failed to save favorite characters:', error);
    }
  }, [favorites]);

  /**
   * Toggle favorite status for a character
   *
   * @param characterId - ID of the character to toggle
   */
  const toggleFavorite = useCallback((characterId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(characterId)) {
        newFavorites.delete(characterId);
      } else {
        newFavorites.add(characterId);
      }
      return newFavorites;
    });
  }, []);

  /**
   * Check if a character is favorited
   *
   * @param characterId - ID of the character to check
   * @returns true if character is favorited, false otherwise
   */
  const isFavorite = useCallback((characterId: string): boolean => {
    return favorites.has(characterId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
}
