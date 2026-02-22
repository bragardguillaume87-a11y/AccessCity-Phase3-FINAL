import { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '../utils/logger';

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

interface AssetsManifest {
  generated: string;
  version: string;
  totalAssets: number;
  categories: string[];
  assets: Record<string, Asset[]>;
}

interface DeleteAssetsResult {
  success: boolean;
  deleted: { path: string; deleted: boolean }[];
  errors?: { path: string; error: string }[];
  count: number;
  message: string;
}

interface MoveAssetResult {
  success: boolean;
  oldPath?: string;
  newPath?: string;
  newCategory?: string;
  message: string;
  error?: string;
}

interface UseAssetsReturn {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  categories: string[];
  manifest: AssetsManifest | null;
  reloadManifest: () => void;
  deleteAssets: (paths: string[]) => Promise<DeleteAssetsResult>;
  deleting: boolean;
  moveAsset: (assetPath: string, newCategory: string) => Promise<MoveAssetResult>;
  moving: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

// Server URL for asset operations (upload server)
const ASSET_SERVER_URL = 'http://localhost:3001';

export function useAssets(options: UseAssetsOptions = {}): UseAssetsReturn {
  const { category = null, autoLoad = true } = options;
  const [manifest, setManifest] = useState<AssetsManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadManifest = useCallback(() => {
    let isMounted = true;
    const abortController = new AbortController();

    setLoading(true);
    setError(null);

    fetch('/assets-manifest.json?t=' + Date.now(), {
      signal: abortController.signal
    })
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

        // Ignore abort errors (expected when component unmounts)
        if (err.name === 'AbortError') return;

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
      abortController.abort();
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

  /**
   * Delete assets from the server
   * @param paths - Array of asset paths to delete (e.g., ['/assets/backgrounds/image.png'])
   * @returns Promise with deletion results
   */
  const deleteAssets = useCallback(async (paths: string[]): Promise<DeleteAssetsResult> => {
    if (paths.length === 0) {
      return { success: false, deleted: [], count: 0, message: 'No paths provided' };
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${ASSET_SERVER_URL}/api/assets`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result: DeleteAssetsResult = await response.json();

      // Reload manifest after successful deletion
      if (result.count > 0) {
        logger.info(`[useAssets] Deleted ${result.count} asset(s), reloading manifest...`);
        // Small delay to allow server to regenerate manifest
        setTimeout(() => {
          setReloadTrigger(prev => prev + 1);
        }, 500);
      }

      setDeleting(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete assets';
      logger.error('[useAssets] Delete error:', err);
      setError(errorMessage);
      setDeleting(false);
      return {
        success: false,
        deleted: [],
        errors: [{ path: 'all', error: errorMessage }],
        count: 0,
        message: errorMessage
      };
    }
  }, []);

  /**
   * Move an asset to a different category
   * @param assetPath - Current asset path (e.g., '/assets/illustrations/image.png')
   * @param newCategory - Target category ('backgrounds', 'characters', 'illustrations')
   * @returns Promise with move result including new path
   */
  const moveAsset = useCallback(async (assetPath: string, newCategory: string): Promise<MoveAssetResult> => {
    if (!assetPath || !newCategory) {
      return { success: false, message: 'Asset path and new category are required' };
    }

    setMoving(true);
    setError(null);

    try {
      const response = await fetch(`${ASSET_SERVER_URL}/api/assets/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: assetPath, newCategory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result: MoveAssetResult = await response.json();

      // Reload manifest after successful move
      if (result.success) {
        logger.info(`[useAssets] Moved asset to ${newCategory}, reloading manifest...`);
        setTimeout(() => {
          setReloadTrigger(prev => prev + 1);
        }, 500);
      }

      setMoving(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move asset';
      logger.error('[useAssets] Move error:', err);
      setError(errorMessage);
      setMoving(false);
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }, []);

  const assets = useMemo(() => {
    if (!manifest || !manifest.assets) return [];

    let filtered: Asset[] = [];

    if (category && manifest.assets[category]) {
      // Filter by category
      filtered = manifest.assets[category];
    } else {
      // All assets, all categories combined
      filtered = Object.values(manifest.assets).flat();
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
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
    reloadManifest,
    deleteAssets,
    deleting,
    moveAsset,
    moving
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get recently used assets from localStorage
 * @param type - Asset type (backgrounds, characters, etc.)
 * @param maxItems - Maximum number of items to retrieve
 * @returns Array of recent asset paths
 */
export function getRecentAssets(type: string, _maxItems: number = 6): string[] {
  try {
    const stored = localStorage.getItem(`accesscity-recent-${type}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('[useAssets] Error loading recent assets:', error);
    return [];
  }
}

/**
 * Add an asset to the recent history
 * @param type - Asset type
 * @param assetPath - Path to the asset
 * @param maxItems - Maximum items to keep in history
 * @returns Updated history array
 */
export function addToRecentAssets(type: string, assetPath: string, maxItems: number = 6): string[] {
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
