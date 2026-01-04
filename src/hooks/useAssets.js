import { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Hook pour charger et filtrer les assets depuis le manifeste JSON
 * @param {Object} options - Options de configuration
 * @param {string} options.category - Categorie a filtrer (backgrounds, characters, etc.)
 * @param {boolean} options.autoLoad - Charger automatiquement (defaut: true)
 * @returns {Object} { assets, loading, error, categories, reloadManifest }
 */
export function useAssets(options = {}) {
  const { category = null, autoLoad = true } = options;
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadManifest = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch('/assets-manifest.json?t=' + Date.now()) // Cache bust
      .then(res => {
        if (!res.ok) {
          // Fallback: manifeste vide si 404 ou autre erreur HTTP
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
        setManifest(data);
        setLoading(false);

        // Warning si manifeste vide
        if (data.totalAssets === 0) {
          logger.warn('[useAssets] Assets manifest is empty. Add files to /public/assets/ and regenerate manifest.');
        }
      })
      .catch(err => {
        logger.error('[useAssets] Error loading manifest:', err);

        // Fallback: manifeste vide si erreur réseau
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
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    loadManifest();
  }, [autoLoad, reloadTrigger, loadManifest]);

  const reloadManifest = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
  }, []);

  const assets = useMemo(() => {
    if (!manifest || !manifest.assets) return [];

    let filtered = [];

    if (category && manifest.assets[category]) {
      // Filtrer par categorie
      filtered = manifest.assets[category];
    } else {
      // Tous les assets, toutes categories confondues
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
    reloadManifest
  };
}

/**
 * Gestion de l'historique des assets recemment utilises
 */
export function getRecentAssets(type, maxItems = 6) {
  try {
    const stored = localStorage.getItem(`accesscity-recent-${type}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('[useAssets] Error loading recent assets:', error);
    return [];
  }
}

export function addToRecentAssets(type, assetPath, maxItems = 6) {
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
