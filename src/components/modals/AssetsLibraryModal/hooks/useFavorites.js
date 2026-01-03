import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'accesscity-favorite-assets';

/**
 * Hook pour gérer les assets favoris avec localStorage persistence
 *
 * @returns {Object} { favorites, toggleFavorite, isFavorite }
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((assetUrl) => {
    setFavorites((prev) => {
      const isFav = prev.includes(assetUrl);
      if (isFav) {
        return prev.filter((url) => url !== assetUrl);
      } else {
        return [...prev, assetUrl];
      }
    });
  }, []);

  const isFavorite = useCallback((assetUrl) => {
    return favorites.includes(assetUrl);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
