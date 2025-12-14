import { useState, useEffect, useMemo } from 'react';

/**
 * Hook pour charger et filtrer les assets depuis le manifeste JSON
 * @param {Object} options - Options de configuration
 * @param {string} options.category - Categorie a filtrer (backgrounds, characters, etc.)
 * @param {boolean} options.autoLoad - Charger automatiquement (defaut: true)
 * @returns {Object} { assets, loading, error, categories }
 */
export function useAssets(options = {}) {
  const { category = null, autoLoad = true } = options;
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autoLoad) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/assets-manifest.json', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Unable to load assets manifest`);
        }
        return res.json();
      })
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[useAssets] Error loading manifest:', err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [autoLoad]);

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
    manifest
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
    console.error('[useAssets] Error loading recent assets:', error);
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
    console.error('[useAssets] Error saving recent assets:', error);
    return [];
  }
}
