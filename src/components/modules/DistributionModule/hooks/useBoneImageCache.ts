/**
 * useBoneImageCache — copie directe de useTileset.ts, adaptée pour SpritePart[].
 * Charge les images des parts d'un rig et retourne une Map<url, HTMLImageElement>.
 * Flag cancelled dans cleanup (konva-patterns §15).
 */
import { useState, useEffect, useRef } from 'react';
import type { BonePose, SpritePart } from '@/types/bone';

export function useBoneImageCache(
  parts: SpritePart[],
  poses?: BonePose[]
): Map<string, HTMLImageElement> {
  const [cache, setCache] = useState<Map<string, HTMLImageElement>>(new Map());
  // Référence stable pour la liste des URLs — évite de relancer l'effect si la référence change
  // mais le contenu est identique (konva-patterns §16)
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    // Dédupliquer les URLs (parts + variants de poses)
    const variantUrls = poses ? poses.flatMap((p) => Object.values(p.spriteVariants ?? {})) : [];
    const urls = [...new Set([...parts.map((p) => p.assetUrl), ...variantUrls].filter(Boolean))];

    // Vérification stabilité : ne recharger que si les URLs ont vraiment changé
    const prev = urlsRef.current;
    if (urls.length === prev.length && urls.every((u, i) => u === prev[i])) return;
    urlsRef.current = urls;

    if (urls.length === 0) {
      setCache(new Map());
      return;
    }

    let cancelled = false;
    const newCache = new Map<string, HTMLImageElement>();
    let loaded = 0;

    for (const url of urls) {
      const img = new window.Image();
      img.onload = () => {
        if (cancelled) return;
        newCache.set(url, img);
        loaded++;
        if (loaded === urls.length) {
          setCache(new Map(newCache));
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        loaded++;
        if (loaded === urls.length) {
          setCache(new Map(newCache));
        }
      };
      img.src = url;
    }

    return () => {
      cancelled = true;
    };
  }, [parts, poses]);

  return cache;
}
