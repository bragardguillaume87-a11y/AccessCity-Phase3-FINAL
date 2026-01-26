/**
 * Asset favorites hook
 *
 * Thin wrapper around useLocalStorageFavorites for backward compatibility.
 * Use useLocalStorageFavorites directly for new code.
 *
 * @module components/modals/AssetsLibraryModal/hooks/useFavorites
 */

import { useMemo } from 'react';
import { useLocalStorageFavorites } from '@/hooks/useLocalStorageFavorites';
import { STORAGE_KEYS } from '@/config/storageKeys';

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
 * @deprecated Use useLocalStorageFavorites from '@/hooks/useLocalStorageFavorites' directly
 *
 * @returns Favorites state and management functions
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useFavorites();
 * ```
 */
export function useFavorites(): UseFavoritesReturn {
  const { favorites: favoritesSet, toggle, isFavorite } = useLocalStorageFavorites<string>(
    STORAGE_KEYS.FAVORITES_ASSETS
  );

  // Convert Set to Array for backward compatibility
  const favorites = useMemo(() => [...favoritesSet], [favoritesSet]);

  return {
    favorites,
    toggleFavorite: toggle,
    isFavorite,
  };
}
