/**
 * Sound Bricks — Briques sonores procédurales pour l'éditeur topdown
 *
 * Chaque brique correspond à un preset jsfxr avec des paramètres
 * exposés en termes simples pour les enfants (8-12 ans) :
 *   - Hauteur   : pitch de base (grave ↔ aigu)
 *   - Longueur  : durée du son (court ↔ long)
 *   - Glissement : le pitch monte ou descend pendant le son
 *
 * Pas de Hz, pas d'ADSR, pas de jargon technique.
 *
 * @module config/soundBricks
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type SoundBrickAlgorithm =
  | 'pickupCoin'
  | 'laserShoot'
  | 'explosion'
  | 'powerUp'
  | 'hitHurt'
  | 'jump'
  | 'blipSelect';

export type SoundBrickCategory = 'action' | 'magie' | 'interface';

export interface SoundBrickParams {
  /** Hauteur du son — 0.0 (très grave) à 1.0 (très aigu) */
  pitch: number;
  /** Longueur du son — 0.0 (très court) à 1.0 (très long) */
  length: number;
  /** Glissement — −1.0 (descend) à +1.0 (monte) */
  slide: number;
}

export interface SoundBrick {
  id: string;
  emoji: string;
  label: string;
  category: SoundBrickCategory;
  /** Couleur CSS de la brique */
  color: string;
  /** Algorithme jsfxr utilisé comme base */
  algorithm: SoundBrickAlgorithm;
  /** Paramètres enfants par défaut */
  defaults: SoundBrickParams;
}

// ── Briques prédéfinies ───────────────────────────────────────────────────────

export const SOUND_BRICKS: SoundBrick[] = [
  {
    id: 'coin',
    emoji: '🪙',
    label: 'Pièce',
    category: 'action',
    color: '#f59e0b',
    algorithm: 'pickupCoin',
    defaults: { pitch: 0.55, length: 0.35, slide: 0.25 },
  },
  {
    id: 'saut',
    emoji: '🦘',
    label: 'Saut',
    category: 'action',
    color: '#3b82f6',
    algorithm: 'jump',
    defaults: { pitch: 0.40, length: 0.30, slide: 0.35 },
  },
  {
    id: 'touche',
    emoji: '💢',
    label: 'Touché',
    category: 'action',
    color: '#ef4444',
    algorithm: 'hitHurt',
    defaults: { pitch: 0.30, length: 0.40, slide: -0.15 },
  },
  {
    id: 'laser',
    emoji: '🔫',
    label: 'Laser',
    category: 'action',
    color: '#8b5cf6',
    algorithm: 'laserShoot',
    defaults: { pitch: 0.65, length: 0.25, slide: -0.35 },
  },
  {
    id: 'powerup',
    emoji: '⚡',
    label: 'Power-up',
    category: 'magie',
    color: '#10b981',
    algorithm: 'powerUp',
    defaults: { pitch: 0.38, length: 0.55, slide: 0.45 },
  },
  {
    id: 'explosion',
    emoji: '💥',
    label: 'Explosion',
    category: 'action',
    color: '#f97316',
    algorithm: 'explosion',
    defaults: { pitch: 0.18, length: 0.60, slide: -0.20 },
  },
  {
    id: 'selection',
    emoji: '✅',
    label: 'Sélection',
    category: 'interface',
    color: '#06b6d4',
    algorithm: 'blipSelect',
    defaults: { pitch: 0.52, length: 0.18, slide: 0.10 },
  },
];

// ── Catégories (pour l'affichage groupé) ─────────────────────────────────────

export const SOUND_BRICK_CATEGORIES: Array<{
  id: SoundBrickCategory;
  emoji: string;
  label: string;
}> = [
  { id: 'action',    emoji: '⚔️',  label: 'Action'    },
  { id: 'magie',     emoji: '✨',  label: 'Magie'     },
  { id: 'interface', emoji: '🎮',  label: 'Interface' },
];

// ── Utilitaire : mapping params enfants → params jsfxr ───────────────────────

/**
 * Convertit les paramètres enfants (pitch/length/slide 0–1)
 * vers les champs techniques jsfxr.
 *
 * @param params  Paramètres enfants normalisés
 * @returns       Overrides à appliquer sur un objet Params jsfxr
 */
export function childParamsToJsfxr(params: SoundBrickParams): {
  p_base_freq: number;
  p_env_decay: number;
  p_freq_ramp: number;
} {
  return {
    // Hauteur → fréquence de base (plage utile 0.1–0.85)
    p_base_freq: 0.10 + params.pitch * 0.75,
    // Longueur → durée d'extinction (plage utile 0.10–0.80)
    p_env_decay:  0.10 + params.length * 0.70,
    // Glissement → ramp fréquence (−1→1 enfant = −0.5→+0.5 jsfxr)
    p_freq_ramp:  params.slide * 0.5,
  };
}
