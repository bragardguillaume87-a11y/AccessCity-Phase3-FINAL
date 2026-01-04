import { useMemo } from 'react';

/**
 * Custom hook for filtering and sorting characters
 * Extracted from CharactersModal to improve code organization
 *
 * @param {Array} characters - Array of character objects
 * @param {string} searchQuery - Search query string
 * @param {string} filterMood - Mood to filter by ('all' or specific mood)
 * @param {string} sortBy - Sort criteria ('name', 'name-desc', 'completeness')
 * @param {Function} getCharacterStats - Function to calculate character stats
 * @returns {Array} Filtered and sorted characters
 */
export function useCharacterFiltering(
  characters,
  searchQuery,
  filterMood,
  sortBy,
  getCharacterStats
) {
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
        c.moods && Object.keys(c.moods).includes(filterMood)
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
