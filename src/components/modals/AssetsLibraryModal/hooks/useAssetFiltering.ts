import { useMemo } from 'react';
import type { Asset } from '@/types';

/**
 * Parameters for useAssetFiltering hook
 */
export interface UseAssetFilteringParams {
  /** All available assets */
  assets: Asset[];
  /** Active category filter ('all' | 'favorites' | 'backgrounds' | 'characters' | 'illustrations') */
  activeCategory: string;
  /** Search query string */
  searchQuery: string;
  /** Set of tags to filter by (AND logic - must have ALL selected tags) */
  filterTags: Set<string>;
  /** Map of asset IDs to their tag sets */
  assetTags: Map<string, Set<string>>;
  /** Function to check if asset is favorite */
  isFavorite: (assetPath: string) => boolean;
}

/**
 * Hook for filtering assets by category, search query, tags, and favorites
 *
 * Applies multiple filters in sequence:
 * 1. Category filter (or favorites filter)
 * 2. Search query (matches asset name or category)
 * 3. Tag filter (AND logic - asset must have ALL selected tags)
 *
 * All filters are applied using useMemo for performance optimization.
 * The hook recalculates only when dependencies change.
 *
 * @param params - Filtering parameters
 * @returns Filtered array of assets
 *
 * @example
 * ```tsx
 * const filteredAssets = useAssetFiltering({
 *   assets: allAssets,
 *   activeCategory: 'backgrounds',
 *   searchQuery: 'forest',
 *   filterTags: new Set(['nature', 'outdoor']),
 *   assetTags: assetTagsMap,
 *   isFavorite: (path) => favorites.includes(path)
 * });
 * ```
 */
export function useAssetFiltering({
  assets,
  activeCategory,
  searchQuery,
  filterTags,
  assetTags,
  isFavorite
}: UseAssetFilteringParams): Asset[] {
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
