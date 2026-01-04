import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'accesscity-favorite-characters';

/**
 * Custom hook for managing character favorites with localStorage persistence
 * Pattern copied from AssetsLibraryModal/hooks/useFavorites.js
 *
 * @returns {Object} { favorites, toggleFavorite, isFavorite }
 */
export function useCharacterFavorites() {
  const [favorites, setFavorites] = useState(() => {
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

  // Toggle favorite status for a character
  const toggleFavorite = useCallback((characterId) => {
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

  // Check if a character is favorited
  const isFavorite = useCallback((characterId) => {
    return favorites.has(characterId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
}
