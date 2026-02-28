import { useMemo, useEffect } from 'react';
import type { ISheet } from '@theatre/core';
import { getSceneSheet, initTheatreStudio } from '@/lib/theatre';

/**
 * Retourne le Sheet Theatre.js pour une scène donnée.
 *
 * - Référence stable : même Sheet réutilisé à chaque render tant que sceneId ne change pas.
 * - En mode DEV : initialise Theatre Studio au premier montage (caché par défaut).
 *   Utiliser le bouton TopBar "Timeline" pour afficher/masquer le panel Studio.
 *
 * @param sceneId - ID de la scène AccessCity (undefined → retourne null)
 * @returns Sheet Theatre.js ou null si sceneId absent
 *
 * @example
 * const sheet = useTheatreScene(selectedSceneId);
 * const obj = sheet?.object('player', { x: types.number(0), y: types.number(0) });
 */
export function useTheatreScene(sceneId: string | undefined): ISheet | null {
  // Initialise Studio une seule fois au premier montage (dev only, idempotent)
  useEffect(() => {
    if (import.meta.env.DEV) {
      initTheatreStudio();
    }
  }, []);

  return useMemo(
    () => (sceneId ? getSceneSheet(sceneId) : null),
    [sceneId]
  );
}
