/**
 * animationEasing.ts
 * Fonctions d'easing pour le système d'animation FK cut-out d'AccessCity.
 *
 * Presets inspirés de DragonBonesJS (Apache 2.0)
 * Source : https://github.com/DragonBones/DragonBonesJS
 *
 * Courbes Bézier cubiques via `bezier-easing` (MIT)
 * Source : https://github.com/gre/bezier-easing
 */

import BezierEasing from 'bezier-easing';

/** Les 4 presets quadratiques (DragonBones-style). */
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/** Points de contrôle Bézier cubique [x1, y1, x2, y2] ∈ [0,1]. */
export type BezierPoints = [number, number, number, number];

/** Type complet — preset ou bézier custom. */
export type EasingType = EasingPreset | 'bezier';

/** Cache des fonctions Bézier pour éviter les recalculs. Clé = "x1,y1,x2,y2". */
const _bezierCache = new Map<string, (t: number) => number>();

function _getCachedBezier(points: BezierPoints): (t: number) => number {
  const key = points.join(',');
  if (!_bezierCache.has(key)) {
    _bezierCache.set(key, BezierEasing(...points));
  }
  return _bezierCache.get(key)!;
}

/**
 * Applique une courbe d'easing à un paramètre t normalisé [0, 1].
 *
 * @param t            - Position normalisée (0 = début, 1 = fin)
 * @param type         - Type de courbe
 * @param bezierPoints - Points de contrôle (requis si type === 'bezier')
 * @returns              t transformé selon la courbe
 */
export function applyEasing(t: number, type: EasingType, bezierPoints?: BezierPoints): number {
  switch (type) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bezier':
      if (bezierPoints) {
        return _getCachedBezier(bezierPoints)(t);
      }
      return t; // fallback linear si pas de points
    default: // 'linear'
      return t;
  }
}

/** Labels affichables pour chaque preset — utilisés dans l'UI. */
export const EASING_LABELS: Record<EasingType, string> = {
  linear: '─ Linéaire',
  'ease-in': '↗ Ease In',
  'ease-out': '↘ Ease Out',
  'ease-in-out': '⤴ Ease In-Out',
  bezier: '◠ Bézier custom',
};

/** Presets Bézier communs (nommés pour l'UI Expert). */
export const BEZIER_PRESETS: Record<string, BezierPoints> = {
  Smooth: [0.25, 0.1, 0.25, 1.0],
  Bouncy: [0.34, 1.56, 0.64, 1.0],
  Snappy: [0.17, 0.67, 0.83, 0.67],
  Anticipate: [0.36, 0, 0.66, -0.56],
};
