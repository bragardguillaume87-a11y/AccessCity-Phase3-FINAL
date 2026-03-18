/**
 * Sprite types — spritesheets de personnages/monstres pour l'éditeur 2D
 *
 * @module types/sprite
 */

// ============================================================================
// SPRITE CATEGORIES
// ============================================================================

export const SPRITE_CATEGORIES = [
  { id: 'hero', emoji: '🦸', label: 'Héros' },
  { id: 'npc', emoji: '🧑', label: 'PNJ' },
  { id: 'monster', emoji: '👾', label: 'Monstre' },
  { id: 'object', emoji: '📦', label: 'Objet' },
  { id: 'plant', emoji: '🌿', label: 'Plante' },
  { id: 'environment', emoji: '🏔', label: 'Environnement' },
] as const;

export type SpriteCategoryId = (typeof SPRITE_CATEGORIES)[number]['id'];

// ============================================================================
// ANIMATION TAGS + GROUPS
// ============================================================================

export type SpriteAnimationTag =
  | 'walk_down'
  | 'walk_left'
  | 'walk_right'
  | 'walk_up'
  | 'idle_down'
  | 'idle_left'
  | 'idle_right'
  | 'idle_up'
  | 'run_down'
  | 'run_left'
  | 'run_right'
  | 'run_up'
  | 'attack';

/** Groupes d'animations pour l'UI (tabs dans SpriteImportDialog) */
export const SPRITE_ANIM_GROUPS = [
  {
    id: 'walk' as const,
    emoji: '🚶',
    label: 'Marche',
    tags: ['walk_down', 'walk_left', 'walk_right', 'walk_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'idle' as const,
    emoji: '💤',
    label: 'Repos',
    tags: ['idle_down', 'idle_left', 'idle_right', 'idle_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'run' as const,
    emoji: '🏃',
    label: 'Sprint',
    tags: ['run_down', 'run_left', 'run_right', 'run_up'] as SpriteAnimationTag[],
    dirs: ['↓ Bas', '← Gauche', '→ Droite', '↑ Haut'],
  },
  {
    id: 'attack' as const,
    emoji: '⚔',
    label: 'Attaque',
    tags: ['attack'] as SpriteAnimationTag[],
    dirs: ['— Omnidirectionnel'],
  },
];

export type SpriteAnimGroupId = (typeof SPRITE_ANIM_GROUPS)[number]['id'];

// ============================================================================
// ANIMATION RANGE
// ============================================================================

export interface AnimationRange {
  /**
   * Indices de frames (0-indexed, linéaire : row × cols + col).
   * Permet des sélections non-contigues (ex: [0, 2, 4, 6]).
   */
  frames: number[];
  /** Frames par seconde */
  fps: number;
  /**
   * Miroir horizontal — true = animation déduite par flipX d'une autre direction.
   * Utilisé par GameScene (actor.graphics.flipHorizontal) et SpriteImportDialog (preview).
   */
  flipX?: boolean;
}

/** Convertit une plage contiguë start→end en tableau de frames. */
export function expandRange(start: number, end: number): number[] {
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

// ============================================================================
// PLAYER COLLIDER CONFIG (défini ici — utilisé par SpriteSheetConfig + MapMetadata)
// ============================================================================

/**
 * Box collider défini comme fraction de tileSize.
 * widthPct=1.0 → largeur = tileSize. offsetYPct=0.25 → décalé de 25% vers le bas.
 */
export interface PlayerColliderBox {
  mode: 'box';
  /** Largeur en fraction de tileSize (0.1–2.0, défaut 0.875) */
  widthPct: number;
  /** Hauteur en fraction de tileSize (0.1–2.0, défaut 0.875) */
  heightPct: number;
  /** Décalage X en fraction de tileSize, origine centrée (défaut 0) */
  offsetXPct: number;
  /** Décalage Y en fraction de tileSize, origine centrée (défaut 0) */
  offsetYPct: number;
}

/**
 * Polygone convexe — points en espace normalisé demi-tileSize.
 * x, y dans [-1, 1] où 1.0 = demi-tileSize depuis le centre de l'acteur.
 * Doit former un polygone convexe (contrainte Excalibur).
 */
export interface PlayerColliderPolygon {
  mode: 'polygon';
  /** Points en espace normalisé [-1, 1]. Convertis en pixels monde au runtime. */
  points: { x: number; y: number }[];
}

/** Union discriminante — box (défaut) ou polygone (convexe). */
export type PlayerColliderConfig = PlayerColliderBox | PlayerColliderPolygon;

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
  /**
   * Hitbox du joueur pour ce sprite.
   * Absent → box par défaut : (tileSize-4) × (tileSize-4), centrée.
   * Prioritaire sur MapMetadata.playerCollider.
   */
  playerCollider?: PlayerColliderConfig;
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
    walk_down: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], fps: 10 },
    walk_left: { frames: [9, 10, 11, 12, 13, 14, 15, 16, 17], fps: 10 },
    walk_right: { frames: [18, 19, 20, 21, 22, 23, 24, 25, 26], fps: 10 },
    walk_up: { frames: [27, 28, 29, 30, 31, 32, 33, 34, 35], fps: 10 },
  },
};

// ============================================================================
// ENTITY INSTANCE (entité placée sur la carte)
// @deprecated — utiliser ObjectInstance + ObjectDefinition (système Phase 4)
// Conservé pour la migration automatique des données existantes.
// ============================================================================

/** @deprecated Utiliser les composants ObjectComponent à la place */
export type EntityBehavior = 'static' | 'patrol' | 'dialogue';
export type FacingDir = 'down' | 'left' | 'right' | 'up';

/** @deprecated Utiliser ObjectInstance + ObjectDefinition */
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
  /** Son joué une fois quand le joueur entre en contact (SOUND_BRICKS[].id) */
  entrySoundId?: string;
}

// ============================================================================
// OBJECT COMPONENT SYSTEM (Phase 4 — modulaire, style GDevelop)
//
// Un objet = un ObjectDefinition (blueprint partagé entre les cartes)
//           + N composants ObjectComponent (sprite, collider, comportement…)
// Une instance = un ObjectInstance (placé sur la carte, référence la définition)
//
// Règle de design (RPG Maker / LDtk / Stardew Valley) :
//   → Si ça ne bouge pas et ne déclenche rien → couche de tuiles
//   → Si ça a un comportement → ObjectInstance
// ============================================================================

// ── Sprite statique ────────────────────────────────────────────────────────
export interface SpriteComponent {
  type: 'sprite';
  /** URL display-ready de l'image source */
  spriteAssetUrl: string;
  /** Coordonnées de crop dans le spritesheet (px) */
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
}

// ── Sprite animé (spritesheet) ─────────────────────────────────────────────
export interface AnimatedSpriteComponent {
  type: 'animatedSprite';
  /** URL display-ready du spritesheet */
  spriteAssetUrl: string;
  /**
   * Clé dans settingsStore.spriteSheetConfigs.
   * Identique à spriteAssetUrl dans la plupart des cas.
   */
  spriteSheetConfigUrl: string;
}

// ── Collider ───────────────────────────────────────────────────────────────
export interface ColliderComponent {
  type: 'collider';
  shape: 'box' | 'circle' | 'none';
  /** Décalage du centre du collider vs centre de la tuile (en px monde) */
  offsetX: number;
  offsetY: number;
  /** Largeur (shape === 'box') en px monde */
  w: number;
  /** Hauteur (shape === 'box') en px monde */
  h: number;
  /** Rayon (shape === 'circle') en px monde */
  radius: number;
}

// ── Dialogue ────────────────────────────────────────────────────────────────
export interface DialogueComponent {
  type: 'dialogue';
  /** ID de la scène VN à ouvrir */
  sceneId: string;
  /** Texte de dialogue de base (peut être surchargé par instance) */
  text?: string;
  /** Condition Lua/JS pour déclencher (ex: "var.flag_met === true") */
  condition?: string;
}

// ── Patrouille ──────────────────────────────────────────────────────────────
export interface PatrolComponent {
  type: 'patrol';
  targetCx: number;
  targetCy: number;
  /** Vitesse en px/s */
  speed: number;
  /** Patrouille en aller-retour ? */
  loop: boolean;
}

// ── Animation vent (arbres, herbe — style Stardew Valley) ─────────────────
export interface WindComponent {
  type: 'wind';
  /** Amplitude du balancement en px (CSS animation éditeur) */
  amplitude: number;
  /** Fréquence du balancement en Hz */
  frequency: number;
  /** Décalage de phase pour varier entre les instances d'un même type */
  phaseOffset?: number;
}

// ── Son de proximité ────────────────────────────────────────────────────────
export interface SoundComponent {
  type: 'sound';
  /** URL display-ready du fichier audio */
  assetUrl: string;
  /** Rayon de détection en tuiles */
  radius: number;
  /** Volume (0–1) */
  volume: number;
  loop: boolean;
}

// ── Lumière dynamique (prévu pour Phase 5) ─────────────────────────────────
export interface LightComponent {
  type: 'light';
  color: string;
  /** Rayon en tuiles */
  radius: number;
  /** Intensité (0–1) */
  intensity: number;
}

/** Union discriminante de tous les composants disponibles */
export type ObjectComponent =
  | SpriteComponent
  | AnimatedSpriteComponent
  | ColliderComponent
  | DialogueComponent
  | PatrolComponent
  | WindComponent
  | SoundComponent
  | LightComponent;

export type ObjectComponentType = ObjectComponent['type'];

// ── ObjectDefinition — blueprint partagé entre les cartes ─────────────────

export interface ObjectDefinition {
  id: string;
  displayName: string;
  /**
   * Liste ordonnée de composants.
   * Premier composant Sprite ou AnimatedSprite = source de la miniature.
   */
  components: ObjectComponent[];
  /**
   * URL de miniature générée automatiquement depuis le premier composant Sprite/AnimatedSprite.
   * Peut être null si aucun composant visuel n'est encore ajouté.
   */
  thumbnailUrl?: string;
  /** Catégorie pour le regroupement dans l'ObjectsPanel */
  category: SpriteCategoryId | string;
}

// ── ObjectInstance — instance placée sur la carte ─────────────────────────

export interface ObjectInstance {
  id: string;
  /** Référence vers ObjectDefinition.id */
  definitionId: string;
  /** Colonne de la grille */
  cx: number;
  /** Rangée de la grille */
  cy: number;
  facing: FacingDir;
  /** Surcharges par instance (ne modifient pas la définition partagée) */
  overrides?: {
    /** Texte de dialogue spécifique à cette instance */
    dialogueText?: string;
    /** Facteur d'échelle visuel (0.5 – 2.0, défaut 1.0) */
    scale?: number;
    /** Décalage de phase pour l'animation vent (chaque arbre ondule différemment) */
    windPhaseOffset?: number;
  };
}

// ── Labels lisibles pour l'UI ──────────────────────────────────────────────

export const OBJECT_COMPONENT_META: Record<
  ObjectComponentType,
  { emoji: string; label: string; description: string }
> = {
  sprite: { emoji: '🖼', label: 'Sprite', description: 'Image statique, une frame' },
  animatedSprite: {
    emoji: '🎭',
    label: 'Sprite animé',
    description: 'Spritesheet avec animations',
  },
  collider: { emoji: '🧱', label: 'Collider', description: 'Boîte ou cercle de collision' },
  dialogue: { emoji: '💬', label: 'Dialogue', description: 'Déclenche une scène VN' },
  patrol: { emoji: '🔄', label: 'Patrouille', description: 'Se déplace entre deux points' },
  wind: { emoji: '💨', label: 'Vent', description: 'Animation balancement (arbre, herbe)' },
  sound: { emoji: '🔊', label: 'Son', description: 'Son de proximité' },
  light: { emoji: '💡', label: 'Lumière', description: 'Halo de lumière dynamique (Phase 5)' },
};
