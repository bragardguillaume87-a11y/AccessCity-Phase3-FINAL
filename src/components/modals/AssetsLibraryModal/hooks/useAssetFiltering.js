import { useMemo } from 'react';

/**
 * Hook for filtering assets by category, search query, tags, and favorites
 *
 * Applies multiple filters in sequence:
 * 1. Category filter (or favorites)
 * 2. Search query (name or category)
 * 3. Tag filter (AND logic - must have ALL selected tags)
 *
 * @param {Object} params
 * @param {Array} params.assets - All available assets
 * @param {string} params.activeCategory - Active category filter
 * @param {string} params.searchQuery - Search query string
 * @param {Set} params.filterTags - Set of tags to filter by
 * @param {Map} params.assetTags - Map of asset IDs to their tags
 * @param {Function} params.isFavorite - Function to check if asset is favorite
 * @returns {Array} Filtered assets
 */
export function useAssetFiltering({
  assets,
  activeCategory,
  searchQuery,
  filterTags,
  assetTags,
  isFavorite
}) {
  return useMemo(() => {
    let filtered = assets;

    // Filter by favorites (Phase 2)
    if (activeCategory === 'favorites') {
      filtered = filtered.filter(a => isFavorite(a.path));
    } else if (activeCategory !== 'all') {
      // Filter by category
      filtered = filtered.filter(a => a.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      );
    }

    // Filter by tags (Phase 5)
    if (filterTags.size > 0) {
      filtered = filtered.filter(asset => {
        const tags = assetTags.get(asset.id);
        if (!tags || tags.size === 0) return false;
        // Asset must have ALL selected filter tags
        return Array.from(filterTags).every(tag => tags.has(tag));
      });
    }

    return filtered;
  }, [assets, activeCategory, searchQuery, filterTags, assetTags, isFavorite]);
}
