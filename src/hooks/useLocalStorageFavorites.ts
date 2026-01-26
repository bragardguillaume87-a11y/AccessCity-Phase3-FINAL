/**
 * Generic hook for managing favorites with localStorage persistence
 *
 * Replaces duplicate implementations in:
 * - useFavorites (assets)
 * - useCharacterFavorites (characters)
 *
 * @module hooks/useLocalStorageFavorites
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for useLocalStorageFavorites hook
 */
export interface UseLocalStorageFavoritesReturn<T extends string> {
  /** Set of favorited item IDs */
  favorites: Set<T>;
  /** Toggle favorite status for an item */
  toggle: (id: T) => void;
  /** Add an item to favorites */
  add: (id: T) => void;
  /** Remove an item from favorites */
  remove: (id: T) => void;
  /** Check if an item is favorited */
  isFavorite: (id: T) => boolean;
  /** Clear all favorites */
  clear: () => void;
  /** Number of favorites */
  count: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Generic hook for managing favorites with localStorage persistence
 *
 * Features:
 * - Type-safe with TypeScript generics
 * - Automatic localStorage persistence
 * - Memoized callbacks to prevent re-renders
 * - Error handling with logging
 *
 * @param storageKey - localStorage key for persistence
 * @returns Object with favorites Set and management functions
 *
 * @example
 * // For character favorites
 * const { favorites, toggle, isFavorite } = useLocalStorageFavorites<string>(
 *   STORAGE_KEYS.FAVORITES_CHARACTERS
 * );
 *
 * // Toggle favorite
 * <button onClick={() => toggle(character.id)}>
 *   {isFavorite(character.id) ? '★' : '☆'}
 * </button>
 *
 * @example
 * // For asset favorites
 * const { favorites, toggle, isFavorite } = useLocalStorageFavorites<string>(
 *   STORAGE_KEYS.FAVORITES_ASSETS
 * );
 */
export function useLocalStorageFavorites<T extends string>(
  storageKey: string
): UseLocalStorageFavoritesReturn<T> {
  // Initialize state from localStorage
  const [favorites, setFavorites] = useState<Set<T>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return new Set();

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        logger.warn(`Invalid favorites data in "${storageKey}": not an array`);
        return new Set();
      }

      // Filter to ensure all items are strings
      const validItems = parsed.filter((item): item is T => typeof item === 'string');
      return new Set(validItems);
    } catch (error) {
      logger.warn(`Failed to load favorites from "${storageKey}":`, error);
      return new Set();
    }
  });

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]));
    } catch (error) {
      logger.warn(`Failed to save favorites to "${storageKey}":`, error);
    }
  }, [favorites, storageKey]);

  /**
   * Toggle favorite status for an item
   */
  const toggle = useCallback((id: T) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Add an item to favorites
   */
  const add = useCallback((id: T) => {
    setFavorites(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Remove an item from favorites
   */
  const remove = useCallback((id: T) => {
    setFavorites(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Check if an item is favorited
   */
  const isFavorite = useCallback((id: T): boolean => {
    return favorites.has(id);
  }, [favorites]);

  /**
   * Clear all favorites
   */
  const clear = useCallback(() => {
    setFavorites(new Set());
  }, []);

  return {
    favorites,
    toggle,
    add,
    remove,
    isFavorite,
    clear,
    count: favorites.size,
  };
}

export default useLocalStorageFavorites;
