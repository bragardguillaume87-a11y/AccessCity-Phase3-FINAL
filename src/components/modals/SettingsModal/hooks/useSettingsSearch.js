import { useMemo } from 'react';

/**
 * Custom hook for filtering settings sections based on search query
 * Searches through section labels and keywords
 *
 * @param {Array} sections - Array of section objects with id, label, icon, and keywords
 * @param {string} searchQuery - Current search query string
 * @returns {Array} - Filtered sections matching the search query
 */
export function useSettingsSearch(sections, searchQuery) {
  const filteredSections = useMemo(() => {
    // Return all sections if no search query
    if (!searchQuery.trim()) {
      return sections;
    }

    // Normalize search query to lowercase for case-insensitive search
    const query = searchQuery.toLowerCase().trim();

    // Filter sections based on label or keywords match
    return sections.filter(section => {
      // Check if section label matches
      const labelMatch = section.label.toLowerCase().includes(query);

      // Check if any keyword matches
      const keywordMatch = section.keywords.some(keyword =>
        keyword.toLowerCase().includes(query)
      );

      // Return true if either label or keyword matches
      return labelMatch || keywordMatch;
    });
  }, [sections, searchQuery]);

  return filteredSections;
}
