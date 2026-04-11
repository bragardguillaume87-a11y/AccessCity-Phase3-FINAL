/**
 * Map Editor Config — constantes centralisées pour l'éditeur topdown 2D
 *
 * Source unique de vérité pour :
 * - Les couleurs de couche (MapCanvas + LayerPanel partagent le même objet)
 * - Les couleurs du canvas Konva (fond, grille, zones de sortie, hover)
 * - Les limites de zoom
 * - Les contraintes de validation des cartes
 *
 * @module config/mapEditorConfig
 */

import type { LayerType } from '@/types/map';

// ============================================================================
// MAP CONSTRAINTS — limites de validation (MapSettingsDialog, mapsStore)
// ============================================================================

export const MAP_CONSTRAINTS = {
  WIDTH: { MIN: 4, MAX: 500 },
  HEIGHT: { MIN: 4, MAX: 500 },
  TILE_SIZE: { MIN: 8, MAX: 128 },
} as const;

// ============================================================================
// MAP ZOOM — limites et facteur de zoom (MapCanvas)
// ============================================================================

export const MAP_ZOOM = {
  MIN: 0.25,
  MAX: 4,
  FACTOR: 1.1,
} as const;

// ============================================================================
// MAP LAYER COLORS — source unique (MapCanvas + LayerPanel)
//
// fill   : semi-transparent pour l'overlay Konva
// stroke : bordure Konva (opaque)
// panel  : couleur opaque pour l'indicateur carré du LayerPanel
// ============================================================================

export const MAP_LAYER_COLORS: Record<LayerType, { fill: string; stroke: string; panel: string }> =
  {
    tiles: { fill: 'transparent', stroke: 'transparent', panel: 'rgba(100,149,237,0.8)' },
    collision: {
      fill: 'rgba(255,60,60,0.55)',
      stroke: 'rgba(255,60,60,0.8)',
      panel: 'rgba(255,60,60,0.8)',
    },
    triggers: {
      fill: 'rgba(60,220,100,0.45)',
      stroke: 'rgba(60,220,100,0.8)',
      panel: 'rgba(60,220,100,0.8)',
    },
  } as const;

// ============================================================================
// MAP CANVAS COLORS — couleurs Konva non liées aux couches
// ============================================================================

export const MAP_CANVAS_COLORS = {
  /** Fond de la zone de carte (hors canvas Konva) */
  MAP_BACKGROUND: '#1a1a2e',
  /** Trait de grille */
  GRID_LINE: 'rgba(255,255,255,0.45)',
  /** Zone de sortie (exit) */
  EXIT_FILL: 'rgba(100,160,255,0.4)',
  EXIT_STROKE: 'rgba(100,160,255,0.8)',
  /** Zone sonore (audio zone) */
  AUDIO_FILL: 'rgba(251,146,60,0.35)',
  AUDIO_STROKE: 'rgba(251,146,60,0.85)',
  /** Prévisualisation hover selon l'outil actif */
  HOVER_ERASE_FILL: 'rgba(255,60,60,0.35)',
  HOVER_ERASE_STROKE: 'rgba(255,60,60,0.8)',
  HOVER_FILL_FILL: 'rgba(255,200,50,0.35)',
  HOVER_FILL_STROKE: 'rgba(255,200,50,0.9)',
  HOVER_DEFAULT_FILL: 'rgba(255,255,255,0.2)',
  HOVER_DEFAULT_STROKE: 'rgba(255,255,255,0.6)',
  /** Outil sélection — teinte bleue cohérente avec la sélection */
  HOVER_SELECTION_FILL: 'rgba(99,179,237,0.15)',
  HOVER_SELECTION_STROKE: 'rgba(99,179,237,0.7)',
  /** Aperçu pinceau multi-tuiles (bordure externe du motif) */
  HOVER_BRUSH_FILL: 'rgba(255,255,255,0.08)',
  HOVER_BRUSH_STROKE: 'rgba(255,255,255,0.5)',
} as const;

// ============================================================================
// MAP DIM FACTOR — opacité des couches inactives (style LDtk)
// ============================================================================

/** Multiplicateur d'opacité pour les couches non actives (0 = invisible, 1 = pleine opacité) */
export const MAP_DIM_FACTOR = 0.3;

// ============================================================================
// MAP WARNING COLORS — warning dialog (MapSettingsDialog)
// ============================================================================

export const MAP_WARNING_COLORS = {
  TEXT: '#f0a030',
  FILL: 'rgba(255,160,50,0.12)',
  BORDER: 'rgba(255,160,50,0.35)',
} as const;

// ============================================================================
// SPRITE DIRECTION COLORS — SpriteImportDialog (4 directions : ↓ ← → ↑)
//
// Convention issue des éditeurs open source (LDtk MIT, Tiled GPL) :
// couleurs distinctes par axe pour identifier visuellement les rangées assignées.
// Ordre : [0]=↓ Bas, [1]=← Gauche, [2]=→ Droite, [3]=↑ Haut
// fill   : fond semi-transparent du sélecteur de rangée
// stroke : bordure de la rangée + indicateur de direction
// text   : couleur du label badge
// ============================================================================

export const SPRITE_DIR_COLORS = [
  { fill: 'rgba(100,149,237,0.28)', stroke: 'rgba(100,149,237,0.9)', text: '#7ba7e8' }, // ↓ Bas
  { fill: 'rgba(60,220,100,0.28)', stroke: 'rgba(60,220,100,0.9)', text: '#3cd464' }, // ← Gauche
  { fill: 'rgba(255,200,50,0.28)', stroke: 'rgba(255,200,50,0.9)', text: '#ffc832' }, // → Droite
  { fill: 'rgba(220,100,255,0.28)', stroke: 'rgba(220,100,255,0.9)', text: '#d664ff' }, // ↑ Haut
] as const;

// ============================================================================
// SPRITE PREVIEW CANVAS SIZE — taille de la canvas d'aperçu animé (px)
// ============================================================================

/** Dimension max (px) de la canvas d'aperçu animé — le sprite est proportionné dans ce carré */
export const SPRITE_PREVIEW_CANVAS_SIZE = 180;

/** Dimension (px) des mini-canvas d'aperçu par direction (dans la liste des directions) */
export const SPRITE_MINI_CANVAS_SIZE = 42;
