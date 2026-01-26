/**
 * Character favorites hook
 *
 * Thin wrapper around useLocalStorageFavorites for backward compatibility.
 * Use useLocalStorageFavorites directly for new code.
 *
 * @module components/modals/CharactersModal/hooks/useCharacterFavorites
 */

import { useLocalStorageFavorites } from '@/hooks/useLocalStorageFavorites';
import { STORAGE_KEYS } from '@/config/storageKeys';

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
 * Thin wrapper around useLocalStorageFavorites for backward compatibility.
 *
 * @deprecated Use useLocalStorageFavorites from '@/hooks/useLocalStorageFavorites' directly
 *
 * @returns Object containing favorites Set, toggleFavorite function, and isFavorite checker
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useCharacterFavorites();
 * ```
 */
export function useCharacterFavorites(): UseCharacterFavoritesReturn {
  const { favorites, toggle, isFavorite } = useLocalStorageFavorites<string>(
    STORAGE_KEYS.FAVORITES_CHARACTERS
  );

  return {
    favorites,
    toggleFavorite: toggle,
    isFavorite,
  };
}
