import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Settings section configuration
 */
export interface SettingsSection {
  /** Unique identifier for the section */
  id: string;
  /** Display label for the section */
  label: string;
  /** Icon component for the section */
  icon: LucideIcon;
  /** Keywords for search filtering */
  keywords: string[];
}

/**
 * Custom hook for filtering settings sections based on search query
 *
 * Searches through section labels and keywords using case-insensitive matching.
 * Returns all sections when search query is empty.
 * Uses useMemo for performance optimization.
 *
 * @param sections - Array of section objects with id, label, icon, and keywords
 * @param searchQuery - Current search query string
 * @returns Filtered sections matching the search query
 *
 * @example
 * ```tsx
 * const filteredSections = useSettingsSearch(sections, searchQuery);
 * ```
 */
export function useSettingsSearch(
  sections: SettingsSection[],
  searchQuery: string
): SettingsSection[] {
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
