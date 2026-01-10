import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../../utils/logger';

const FAVORITES_STORAGE_KEY = 'accesscity-favorite-assets';

/**
 * Return value of useFavorites hook
 */
export interface UseFavoritesReturn {
  /** Array of favorite asset URLs */
  favorites: string[];
  /** Toggle favorite status of an asset */
  toggleFavorite: (assetUrl: string) => void;
  /** Check if an asset is favorited */
  isFavorite: (assetUrl: string) => boolean;
}

/**
 * Hook for managing favorite assets with localStorage persistence
 *
 * Provides functionality to:
 * - Load favorites from localStorage
 * - Toggle favorite status
 * - Check if asset is favorited
 * - Auto-persist changes to localStorage
 *
 * @returns Favorites state and management functions
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useFavorites();
 *
 * // Check if asset is favorite
 * if (isFavorite('/assets/bg1.png')) {
 *   // Show filled star
 * }
 *
 * // Toggle favorite
 * toggleFavorite('/assets/bg1.png');
 * ```
 */
export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to load favorites:', error);
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      logger.error('Failed to save favorites:', error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((assetUrl: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(assetUrl);
      if (isFav) {
        return prev.filter((url) => url !== assetUrl);
      } else {
        return [...prev, assetUrl];
      }
    });
  }, []);

  const isFavorite = useCallback((assetUrl: string): boolean => {
    return favorites.includes(assetUrl);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
