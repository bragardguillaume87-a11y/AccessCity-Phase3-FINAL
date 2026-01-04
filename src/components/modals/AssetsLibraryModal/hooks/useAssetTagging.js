import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for managing asset tags and tag filtering
 *
 * Provides tag management features:
 * - Add tag to asset
 * - Remove tag from asset
 * - Toggle tag filter
 * - Get all unique tags across all assets
 *
 * @returns {Object} Tag state and management functions
 */
export function useAssetTagging() {
  const [assetTags, setAssetTags] = useState(new Map()); // assetId -> Set of tags
  const [filterTags, setFilterTags] = useState(new Set()); // Set of active filter tags

  /**
   * Add a tag to an asset
   */
  const addTagToAsset = useCallback((assetId, tag) => {
    if (!tag.trim()) return;
    setAssetTags(prev => {
      const newMap = new Map(prev);
      const tags = newMap.get(assetId) || new Set();
      tags.add(tag.trim());
      newMap.set(assetId, tags);
      return newMap;
    });
  }, []);

  /**
   * Remove a tag from an asset
   */
  const removeTagFromAsset = useCallback((assetId, tag) => {
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
  const toggleFilterTag = useCallback((tag) => {
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
    const tagsSet = new Set();
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
    toggleFilterTag
  };
}
