import { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '../utils/logger';
import { isTauriEditor, convertFileSrcIfNeeded } from '../utils/tauri';
import type { Asset } from '@/types';

/**
 * Hook to load and filter assets from JSON manifest.
 *
 * Supports two backends :
 *  - Web  : fetch('/assets-manifest.json') + Express server (localhost:3001)
 *  - Tauri: invoke('list_user_assets') + native Rust commands
 *
 * ⚠️ Source of truth for Asset type: @/types/assets.ts
 * id = asset.path (unique key, computed here — not in consumers)
 */

// ============================================================================
// TYPES
// ============================================================================

interface UseAssetsOptions {
  category?: string | null;
  autoLoad?: boolean;
}

/** Raw asset from manifest (before id/url enrichment) */
interface RawAsset {
  name: string;
  path: string;
  category: string;
  source?: string;
}

interface AssetsManifest {
  generated: string;
  version: string;
  totalAssets: number;
  categories: string[];
  assets: Record<string, RawAsset[]>;
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
// HELPERS
// ============================================================================

const ASSET_SERVER_URL = 'http://localhost:3001';

function emptyManifest(): AssetsManifest {
  return {
    generated: new Date().toISOString(),
    version: '1.0.0',
    totalAssets: 0,
    categories: [],
    assets: {},
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useAssets(options: UseAssetsOptions = {}): UseAssetsReturn {
  const { category = null, autoLoad = true } = options;
  const [manifest, setManifest] = useState<AssetsManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // ── Load manifest ─────────────────────────────────────────────────────────

  const loadManifest = useCallback(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    if (isTauriEditor()) {
      // ── Tauri mode : merge bundled assets + user AppData assets ───────────
      // 1. fetch() lit le manifest des assets embarqués dans le bundle Tauri
      // 2. invoke() lit les assets uploadés par l'utilisateur dans AppData
      Promise.all([
        fetch('/assets-manifest.json?t=' + Date.now())
          .then(r => r.ok ? r.json() as Promise<AssetsManifest> : emptyManifest() as AssetsManifest)
          .catch(() => emptyManifest() as AssetsManifest),
        invoke<string>('list_user_assets')
          .then(json => JSON.parse(json) as AssetsManifest)
          .catch(() => emptyManifest() as AssetsManifest),
      ])
        .then(([bundled, user]) => {
          if (!isMounted) return;
          // Fusionner : combiner les assets des deux sources par catégorie
          const merged: AssetsManifest = { ...bundled };
          const allCategories = new Set([
            ...(bundled.categories || []),
            ...(user.categories || []),
          ]);
          merged.categories = Array.from(allCategories);
          merged.assets = { ...bundled.assets };
          for (const [cat, assets] of Object.entries(user.assets || {})) {
            merged.assets[cat] = [...(merged.assets[cat] || []), ...assets];
          }
          merged.totalAssets = Object.values(merged.assets).reduce((n, a) => n + a.length, 0);
          setManifest(merged);
          setLoading(false);
        })
        .catch(err => {
          if (!isMounted) return;
          logger.error('[useAssets] Tauri load error:', err);
          setManifest(emptyManifest());
          setError('Impossible de lire les assets. ' + String(err));
          setLoading(false);
        });

      return () => { isMounted = false; };
    }

    // ── Web mode : fetch static manifest ────────────────────────────────────
    const abortController = new AbortController();

    fetch('/assets-manifest.json?t=' + Date.now(), {
      signal: abortController.signal,
    })
      .then(res => {
        if (!isMounted) return null;
        if (!res.ok) {
          logger.warn('[useAssets] Manifest not found (HTTP ' + res.status + '), using empty fallback');
          return emptyManifest();
        }
        return res.json();
      })
      .then(data => {
        if (!isMounted || !data) return;
        setManifest(data);
        setLoading(false);
        if (data.totalAssets === 0) {
          logger.warn('[useAssets] Assets manifest is empty. Add files to /public/assets/ and regenerate manifest.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        if (err.name === 'AbortError') return;
        logger.error('[useAssets] Error loading manifest:', err);
        setManifest(emptyManifest());
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

  // ── Delete assets ─────────────────────────────────────────────────────────

  const deleteAssets = useCallback(async (paths: string[]): Promise<DeleteAssetsResult> => {
    if (paths.length === 0) {
      return { success: false, deleted: [], count: 0, message: 'No paths provided' };
    }

    setDeleting(true);
    setError(null);

    try {
      let result: DeleteAssetsResult;

      if (isTauriEditor()) {
        // Tauri : invoke Rust command (paths = absolute filesystem paths)
        const json = await invoke<string>('delete_assets_editor', { paths });
        result = JSON.parse(json);
      } else {
        // Web : Express server
        const response = await fetch(`${ASSET_SERVER_URL}/api/assets`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        result = await response.json();
      }

      if (result.count > 0) {
        logger.info(`[useAssets] Deleted ${result.count} asset(s), reloading manifest...`);
        setTimeout(() => setReloadTrigger(prev => prev + 1), 300);
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
        message: errorMessage,
      };
    }
  }, []);

  // ── Move asset ────────────────────────────────────────────────────────────

  const moveAsset = useCallback(async (assetPath: string, newCategory: string): Promise<MoveAssetResult> => {
    if (!assetPath || !newCategory) {
      return { success: false, message: 'Asset path and new category are required' };
    }

    setMoving(true);
    setError(null);

    try {
      let result: MoveAssetResult;

      if (isTauriEditor()) {
        // Tauri : invoke Rust command (oldPath = absolute filesystem path)
        const json = await invoke<string>('move_asset_editor', {
          oldPath: assetPath,
          newCategory,
        });
        result = JSON.parse(json);
      } else {
        // Web : Express server
        const response = await fetch(`${ASSET_SERVER_URL}/api/assets/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: assetPath, newCategory }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }
        result = await response.json();
      }

      if (result.success) {
        logger.info(`[useAssets] Moved asset to ${newCategory}, reloading manifest...`);
        setTimeout(() => setReloadTrigger(prev => prev + 1), 300);
      }

      setMoving(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move asset';
      logger.error('[useAssets] Move error:', err);
      setError(errorMessage);
      setMoving(false);
      return { success: false, message: errorMessage, error: errorMessage };
    }
  }, []);

  // ── Derived assets list ───────────────────────────────────────────────────

  const assets = useMemo((): Asset[] => {
    if (!manifest || !manifest.assets) return [];

    let filtered: RawAsset[];

    if (category && manifest.assets[category]) {
      filtered = manifest.assets[category];
    } else {
      filtered = Object.values(manifest.assets).flat();
    }

    // Enrichir chaque asset avec id + url (source unique de ces champs)
    return filtered
      .map(asset => ({
        ...asset,
        id: asset.path,
        url: convertFileSrcIfNeeded(asset.path),
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
    reloadManifest,
    deleteAssets,
    deleting,
    moveAsset,
    moving,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get recently used assets from localStorage
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
 */
export function addToRecentAssets(type: string, assetPath: string, maxItems: number = 6): string[] {
  try {
    const history = getRecentAssets(type, maxItems);
    const newHistory = [
      assetPath,
      ...history.filter(path => path !== assetPath),
    ].slice(0, maxItems);

    localStorage.setItem(`accesscity-recent-${type}`, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    logger.error('[useAssets] Error saving recent assets:', error);
    return [];
  }
}
