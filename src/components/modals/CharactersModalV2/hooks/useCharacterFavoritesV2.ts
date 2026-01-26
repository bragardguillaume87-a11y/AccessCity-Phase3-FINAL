import { useLocalStorageFavorites } from '@/hooks/useLocalStorageFavorites';
import { STORAGE_KEYS } from '@/config/storageKeys';

/**
 * Return type for useCharacterFavoritesV2 hook
 */
export interface UseCharacterFavoritesV2Return {
  /** Set of favorite character IDs */
  favorites: Set<string>;
  /** Check if a character is favorited */
  isFavorite: (id: string) => boolean;
  /** Toggle favorite status for a character */
  toggleFavorite: (id: string) => void;
}

/**
 * useCharacterFavoritesV2 - Character favorites with localStorage persistence
 *
 * Pattern: AssetsLibraryModal useFavorites pattern
 *
 * Thin wrapper around useLocalStorageFavorites that provides character-specific
 * favorites management with automatic localStorage persistence.
 *
 * Features:
 * - localStorage persistence: Favorites persist across sessions
 * - Set-based storage: O(1) lookup for favorite checks
 * - Automatic sync: Changes immediately saved to localStorage
 * - Type-safe: Scoped to character favorites specifically
 */
export function useCharacterFavoritesV2(): UseCharacterFavoritesV2Return {
  const { favorites, isFavorite, toggle } = useLocalStorageFavorites(
    STORAGE_KEYS.FAVORITES_CHARACTERS
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite: toggle,
  };
}

export default useCharacterFavoritesV2;
