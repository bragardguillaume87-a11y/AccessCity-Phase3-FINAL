/**
 * animationEasing.ts
 * Fonctions d'easing pour le système d'animation FK cut-out d'AccessCity.
 *
 * Formules inspirées de DragonBonesJS (Apache 2.0)
 * Source : https://github.com/DragonBones/DragonBonesJS
 * Adaptées pour AccessCity — zéro dépendance runtime DragonBones.
 */

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

/**
 * Applique une courbe d'easing à un paramètre t normalisé [0, 1].
 *
 * @param t   - Position normalisée dans l'intervalle (0 = début, 1 = fin)
 * @param type - Type de courbe à appliquer
 * @returns    - t transformé selon la courbe
 */
export function applyEasing(t: number, type: EasingType): number {
  switch (type) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
};
