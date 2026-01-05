import { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '../utils/logger';
import type { AssetManifest } from '../types';

/**
 * Hook to load and filter assets from JSON manifest
 */

// ============================================================================
// TYPES
// ============================================================================

interface UseAssetsOptions {
  category?: string | null;
  autoLoad?: boolean;
}

interface Asset {
  name: string;
  path: string;
  category: string;
  [key: string]: unknown;
}

interface UseAssetsReturn {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  categories: string[];
  manifest: AssetManifest | null;
  reloadManifest: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAssets(options: UseAssetsOptions = {}): UseAssetsReturn {
  const { category = null, autoLoad = true } = options;
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadManifest = useCallback(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    fetch('/assets-manifest.json?t=' + Date.now()) // Cache bust
      .then(res => {
        if (!isMounted) return null;

        if (!res.ok) {
          // Fallback: empty manifest if 404 or other HTTP error
          logger.warn('[useAssets] Manifest not found (HTTP ' + res.status + '), using empty fallback');
          return {
            generated: new Date().toISOString(),
            version: '1.0.0',
            totalAssets: 0,
            categories: [],
            assets: {}
          };
        }
        return res.json();
      })
      .then(data => {
        if (!isMounted || !data) return;

        setManifest(data);
        setLoading(false);

        // Warning if manifest is empty
        if (data.totalAssets === 0) {
          logger.warn('[useAssets] Assets manifest is empty. Add files to /public/assets/ and regenerate manifest.');
        }
      })
      .catch(err => {
        if (!isMounted) return;

        logger.error('[useAssets] Error loading manifest:', err);

        // Fallback: empty manifest if network error
        setManifest({
          generated: new Date().toISOString(),
          version: '1.0.0',
          totalAssets: 0,
          categories: [],
          assets: {}
        });

        setError('Unable to load assets manifest. Using empty library.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    const cleanup = loadManifest();
    return cleanup;
  }, [autoLoad, reloadTrigger, loadManifest]);

  const reloadManifest = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
  }, []);

  const assets = useMemo(() => {
    if (!manifest || !manifest.assets) return [];

    let filtered: string[] = [];

    if (category && manifest.assets[category]) {
      // Filter by category
      filtered = manifest.assets[category] as string[];
    } else {
      // All assets, all categories combined
      filtered = Object.values(manifest.assets).flat() as string[];
    }

    // Convert to Asset objects and sort
    return filtered
      .map(path => ({
        name: path.split('/').pop() || path,
        path,
        category: category || 'unknown'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [manifest, category]);

  const categories = useMemo(() => {
    if (!manifest) return [];
    return manifest.categories || [];
  }, [manifest]);

  return {
    assets,
    loading,
    error,
    categories,
    manifest,
    reloadManifest
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get recently used assets from localStorage
 */
export function getRecentAssets(type: string, maxItems = 6): string[] {
  try {
    const stored = localStorage.getItem(`accesscity-recent-${type}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('[useAssets] Error loading recent assets:', error);
    return [];
  }
}

/**
 * Add asset to recently used list
 */
export function addToRecentAssets(type: string, assetPath: string, maxItems = 6): string[] {
  try {
    const history = getRecentAssets(type, maxItems);
    const newHistory = [
      assetPath,
      ...history.filter(path => path !== assetPath)
    ].slice(0, maxItems);

    localStorage.setItem(`accesscity-recent-${type}`, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    logger.error('[useAssets] Error saving recent assets:', error);
    return [];
  }
}
