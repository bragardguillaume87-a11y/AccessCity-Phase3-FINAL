/**
 * useTileset — Précharge les images de tuiles dans un Map<url, HTMLImageElement>
 *
 * Pattern recommandé (Konva best practice 2024) :
 * - Préchargement unique par URL (pas de use-image en boucle de rendu)
 * - Mise à jour du cache à chaque changement d'assets
 *
 * @module components/modules/TopdownEditor/hooks/useTileset
 */

import { useState, useEffect } from 'react';
import type { Asset } from '@/types/assets';

export type TileImageCache = Map<string, HTMLImageElement>;

/**
 * Preloads images for a list of tile assets.
 * Returns a stable Map<url, HTMLImageElement> ready for use in Konva <Image>.
 */
export function useTileset(assets: Asset[]): TileImageCache {
  const [cache, setCache] = useState<TileImageCache>(() => new Map());

  useEffect(() => {
    if (assets.length === 0) return;

    const newCache = new Map<string, HTMLImageElement>(cache);
    let changed = false;
    let pending = 0;

    assets.forEach(asset => {
      const url = asset.url ?? asset.path;
      if (!url || newCache.has(url)) return;

      pending++;
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        newCache.set(url, img);
        pending--;
        if (pending === 0) {
          // All images loaded — trigger re-render with new cache
          setCache(new Map(newCache));
        }
        changed = true;
      };
      img.onerror = () => {
        pending--;
        if (pending === 0 && changed) {
          setCache(new Map(newCache));
        }
      };
    });

    // If nothing pending (all already cached), don't update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  return cache;
}
