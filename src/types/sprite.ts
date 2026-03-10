/**
 * Sprite types — spritesheets de personnages/monstres pour l'éditeur 2D
 *
 * @module types/sprite
 */

// ============================================================================
// SPRITE CATEGORIES
// ============================================================================

export const SPRITE_CATEGORIES = [
  { id: 'hero',    emoji: '🦸', label: 'Héros' },
  { id: 'npc',     emoji: '🧑', label: 'PNJ' },
  { id: 'monster', emoji: '👾', label: 'Monstre' },
  { id: 'object',  emoji: '📦', label: 'Objet' },
] as const;

export type SpriteCategoryId = typeof SPRITE_CATEGORIES[number]['id'];

// ============================================================================
// ANIMATION TAGS + GROUPS
// ============================================================================

export type SpriteAnimationTag =
  | 'walk_down' | 'walk_left' | 'walk_right' | 'walk_up'
  | 'idle_down' | 'idle_left' | 'idle_right' | 'idle_up'
  | 'run_down'  | 'run_left'  | 'run_right'  | 'run_up'
  | 'attack';

/** Groupes d'animations pour l'UI (tabs dans SpriteImportDialog) */
export const SPRITE_ANIM_GROUPS = [
  {
    id: 'walk'   as const,
    emoji: '🚶', label: 'Marche',
    tags: ['walk_down', 'walk_left', 'walk_right', 'walk_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'idle'   as const,
    emoji: '💤', label: 'Repos',
    tags: ['idle_down', 'idle_left', 'idle_right', 'idle_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'run'    as const,
    emoji: '🏃', label: 'Sprint',
    tags: ['run_down', 'run_left', 'run_right', 'run_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'attack' as const,
    emoji: '⚔',  label: 'Attaque',
    tags: ['attack'] as SpriteAnimationTag[],
    dirs: ['— Omnidirectionnel'],
  },
];

export type SpriteAnimGroupId = typeof SPRITE_ANIM_GROUPS[number]['id'];

// ============================================================================
// ANIMATION RANGE
// ============================================================================

export interface AnimationRange {
  /** 0-indexed linear frame index (row × cols + col) */
  startFrame: number;
  /** Inclusive */
  endFrame: number;
  /** Frames par seconde */
  fps: number;
  /**
   * Miroir horizontal — true = animation déduite par flipX d'une autre direction.
   * Utilisé par GameScene (actor.graphics.flipHorizontal) et SpriteImportDialog (preview).
   */
  flipX?: boolean;
}

// ============================================================================
// SPRITE SHEET CONFIG
// ============================================================================

/**
 * Configuration d'un spritesheet de personnage.
 * Stockée dans settingsStore.spriteSheetConfigs, clé = asset URL display-ready.
 */
export interface SpriteSheetConfig {
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  category: SpriteCategoryId | string;
  displayName?: string;
  animations: Partial<Record<SpriteAnimationTag, AnimationRange>>;
}

// ============================================================================
// LPC PRESET (Liberated Pixel Cup : 4 rangées × 9 colonnes, 64×64px)
// ============================================================================

/** Preset LPC standard — walk uniquement (4 directions × 9 frames) */
export const LPC_PRESET: Omit<SpriteSheetConfig, 'displayName' | 'category'> = {
  frameW: 64,
  frameH: 64,
  cols: 9,
  rows: 4,
  animations: {
    walk_down:  { startFrame: 0,  endFrame: 8,  fps: 10 },
    walk_left:  { startFrame: 9,  endFrame: 17, fps: 10 },
    walk_right: { startFrame: 18, endFrame: 26, fps: 10 },
    walk_up:    { startFrame: 27, endFrame: 35, fps: 10 },
  },
};

// ============================================================================
// ENTITY INSTANCE (entité placée sur la carte)
// ============================================================================

export type EntityBehavior = 'static' | 'patrol' | 'dialogue';
export type FacingDir = 'down' | 'left' | 'right' | 'up';

export interface EntityInstance {
  id: string;
  /** URL display-ready — clé dans settingsStore.spriteSheetConfigs */
  spriteAssetUrl: string;
  /** Colonne de la grille */
  cx: number;
  /** Rangée de la grille */
  cy: number;
  facing: FacingDir;
  behavior: EntityBehavior;
  displayName?: string;
  // Comportement patrol
  patrolTargetCx?: number;
  patrolTargetCy?: number;
  // Comportement dialogue
  dialogueSceneId?: string;
  dialogueText?: string;
}
