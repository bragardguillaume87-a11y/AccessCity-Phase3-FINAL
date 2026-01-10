import { useMemo } from 'react';
import type { Character } from '@/types';
import type { CharacterStats } from './useCharacterStats';

/**
 * Sort options for character filtering
 */
export type CharacterSortBy = 'name' | 'name-desc' | 'completeness';

/**
 * Custom hook for filtering and sorting characters
 *
 * Provides filtering by search query and mood, with sorting by name or completeness.
 * All filtering logic is memoized for optimal performance.
 *
 * @param characters - Array of character objects to filter
 * @param searchQuery - Search query string (filters by name, description, or ID)
 * @param filterMood - Mood to filter by ('all' shows all moods, or specific mood name)
 * @param sortBy - Sort criteria ('name', 'name-desc', 'completeness')
 * @param getCharacterStats - Function to calculate character stats (for completeness sorting)
 * @returns Filtered and sorted array of characters
 *
 * @example
 * ```tsx
 * const filteredCharacters = useCharacterFiltering(
 *   characters,
 *   'hero',
 *   'all',
 *   'name',
 *   getCharacterStats
 * );
 * ```
 */
export function useCharacterFiltering(
  characters: Character[],
  searchQuery: string,
  filterMood: string,
  sortBy: CharacterSortBy,
  getCharacterStats: (character: Character) => CharacterStats
): Character[] {
  const filteredCharacters = useMemo(() => {
    let filtered = [...characters];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    // Mood filter
    if (filterMood && filterMood !== 'all') {
      filtered = filtered.filter(c =>
        c.moods && c.moods.includes(filterMood)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'completeness') {
        const statsA = getCharacterStats(a);
        const statsB = getCharacterStats(b);
        return statsB.completeness - statsA.completeness;
      }
      return 0;
    });

    return filtered;
  }, [characters, searchQuery, filterMood, sortBy, getCharacterStats]);

  return filteredCharacters;
}
