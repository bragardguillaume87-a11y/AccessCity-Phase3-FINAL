import { useState, useMemo, useCallback } from 'react';

/**
 * Return value of useAssetTagging hook
 */
export interface UseAssetTaggingReturn {
  /** Map of asset IDs to their tag sets */
  assetTags: Map<string, Set<string>>;
  /** Set of currently active filter tags */
  filterTags: Set<string>;
  /** Array of all unique tags across all assets (sorted alphabetically) */
  allTags: string[];
  /** Add a tag to an asset */
  addTagToAsset: (assetId: string, tag: string) => void;
  /** Remove a tag from an asset */
  removeTagFromAsset: (assetId: string, tag: string) => void;
  /** Toggle a tag in the active filter */
  toggleFilterTag: (tag: string) => void;
  /** Set filter tags directly */
  setFilterTags: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * Hook for managing asset tags and tag filtering
 *
 * Provides comprehensive tag management features:
 * - Add/remove tags to/from individual assets
 * - Toggle tags in active filter
 * - Get all unique tags across all assets
 * - Automatic alphabetical sorting of tags
 *
 * Tags are stored in memory (not persisted). For persistence,
 * integrate with backend or localStorage in parent component.
 *
 * @returns Tag state and management functions
 *
 * @example
 * ```tsx
 * const { assetTags, filterTags, allTags, addTagToAsset, removeTagFromAsset, toggleFilterTag } = useAssetTagging();
 *
 * // Add tag to asset
 * addTagToAsset('asset-123', 'nature');
 *
 * // Check if asset has tag
 * const tags = assetTags.get('asset-123');
 * if (tags?.has('nature')) {
 *   // Asset is tagged with 'nature'
 * }
 *
 * // Toggle tag filter
 * toggleFilterTag('nature'); // Show only assets with 'nature' tag
 * ```
 */
export function useAssetTagging(): UseAssetTaggingReturn {
  const [assetTags, setAssetTags] = useState<Map<string, Set<string>>>(new Map());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());

  /**
   * Add a tag to an asset
   */
  const addTagToAsset = useCallback((assetId: string, tag: string) => {
    if (!tag.trim()) return;
    setAssetTags(prev => {
      const newMap = new Map(prev);
      const tags = newMap.get(assetId) || new Set<string>();
      tags.add(tag.trim());
      newMap.set(assetId, tags);
      return newMap;
    });
  }, []);

  /**
   * Remove a tag from an asset
   */
  const removeTagFromAsset = useCallback((assetId: string, tag: string) => {
    setAssetTags(prev => {
      const newMap = new Map(prev);
      const tags = newMap.get(assetId);
      if (tags) {
        tags.delete(tag);
        if (tags.size === 0) {
          newMap.delete(assetId);
        } else {
          newMap.set(assetId, tags);
        }
      }
      return newMap;
    });
  }, []);

  /**
   * Toggle a tag in the active filter
   */
  const toggleFilterTag = useCallback((tag: string) => {
    setFilterTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  /**
   * Get all unique tags across all assets (sorted alphabetically)
   */
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    assetTags.forEach(tags => {
      tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [assetTags]);

  return {
    assetTags,
    filterTags,
    allTags,
    addTagToAsset,
    removeTagFromAsset,
    toggleFilterTag,
    setFilterTags
  };
}
