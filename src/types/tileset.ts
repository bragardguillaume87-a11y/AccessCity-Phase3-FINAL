/**
 * Tileset types — configuration et sélection de tuile pour l'éditeur 2D
 *
 * @module types/tileset
 */

import type { Asset } from '@/types/assets';

// ============================================================================
// TILESET CATEGORIES — catégories prédéfinies (extensibles côté utilisateur)
// ============================================================================

export const TILESET_CATEGORIES = [
  { id: 'terrain', emoji: '🌿', label: 'Terrain' },
  { id: 'structures', emoji: '🧱', label: 'Structures' },
  { id: 'vegetation', emoji: '🌳', label: 'Végétation' },
  { id: 'mobilier', emoji: '🪑', label: 'Mobilier' },
  { id: 'water', emoji: '💧', label: 'Eau & Nature' },
  { id: 'effects', emoji: '✨', label: 'Effets' },
  { id: 'divers', emoji: '📦', label: 'Divers' },
] as const;

export type TilesetCategoryId = (typeof TILESET_CATEGORIES)[number]['id'];

// ============================================================================
// TILESET CONFIG — per-asset slicing metadata
// ============================================================================

/**
 * Configuration de découpe d'un tileset sheet.
 * Stockée dans settingsStore.tilesetConfigs, clé = asset URL display-ready.
 */
export interface TilesetConfig {
  /** Largeur d'une tuile en pixels */
  tileW: number;
  /** Hauteur d'une tuile en pixels */
  tileH: number;
  /** Espace vide autour du bord de l'image (défaut: 0) */
  margin: number;
  /** Espace vide entre les tuiles (défaut: 0) */
  spacing: number;
  /** Catégorie organisationnelle dans la TilePalette (défaut: 'divers') */
  category?: TilesetCategoryId | string;
  /** Nom d'affichage personnalisé dans la palette (défaut: nom du fichier) */
  displayName?: string;
  /**
   * Carte de hitbox de collision par tuile du sheet.
   * Clé = `"${tileX}_${tileY}"` (coords pixel dans le sheet, "0_0" pour image entière).
   * Valeur = rectangle de collision en pourcentage des dimensions de la tuile.
   *
   * À la lecture de la carte (GameScene), chaque tuile présente dans "Objets"
   * ayant une entrée ici génère un Actor invisible Fixed au bon offset monde.
   */
  hitboxMap?: Record<string, HitboxDef>;
}

/**
 * Rectangle de collision en % de la tuile (0–100 pour chaque axe).
 * Indépendant de la grille — précision sub-pixel.
 *
 * @example tronc d'arbre : { xPct: 30, yPct: 70, wPct: 40, hPct: 30 }
 */
export interface HitboxDef {
  /** Décalage gauche en % de la largeur de la tuile */
  xPct: number;
  /** Décalage haut en % de la hauteur de la tuile */
  yPct: number;
  /** Largeur en % de la largeur de la tuile */
  wPct: number;
  /** Hauteur en % de la hauteur de la tuile */
  hPct: number;
}

// ============================================================================
// SELECTED TILE — résultat d'une sélection dans la TilePalette
// ============================================================================

/**
 * Référence à une tuile spécifique — image entière OU région d'un sheet.
 *
 * Convention : tileW === 0 → image entière (tuile unique, pas de découpe)
 *              tileW  > 0 → tuile extraite du sheet à (tileX, tileY)
 */
export interface SelectedTile {
  asset: Asset;
  /** Offset X px dans le sheet (0 si image entière) */
  tileX: number;
  /** Offset Y px dans le sheet (0 si image entière) */
  tileY: number;
  /** Largeur de la tuile en px (0 = image entière) */
  tileW: number;
  /** Hauteur de la tuile en px (0 = image entière) */
  tileH: number;
  /**
   * Sélection multi-tuiles (optionnel — sélection rectangle dans le sheet).
   * Si > 1, paintCell applique un motif regionCols × regionRows à partir de la cellule cible.
   */
  regionCols?: number;
  regionRows?: number;
  /**
   * Stride en pixels entre tuiles adjacentes = tileW + spacing (horizontal) / tileH + spacing (vertical).
   * Nécessaire pour peindre correctement les régions multi-tuiles sur des tilesets avec spacing > 0.
   * Absent → fallback sur tileW/tileH (spacing = 0).
   */
  tileStepX?: number;
  tileStepY?: number;
}
