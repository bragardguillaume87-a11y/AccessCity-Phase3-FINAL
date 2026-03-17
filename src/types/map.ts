/**
 * Map Types — LDtk-compatible format + AccessCity extensions (entities)
 *
 * AccessCity topdown map editor outputs JSON compatible with Excalibur's @excaliburjs/plugin-ldtk.
 * Custom _ac_ fields extend the format with dialogue triggers and scene exits.
 *
 * @module types/map
 */

import type { EntityInstance } from './sprite';
import type { SceneEffectConfig } from './sceneEffect';
export type { EntityInstance };

// ============================================================================
// PRIMITIVES
// ============================================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// MAP METADATA (index / list view)
// ============================================================================

export interface MapMetadata {
  id: string;
  name: string;
  /** Width in tiles */
  widthTiles: number;
  /** Height in tiles */
  heightTiles: number;
  /** Tile size in pixels */
  tileSize: number;
  /** Base64 thumbnail (generated on save) */
  thumbnail?: string;
  /**
   * Brique sonore procédurale jouée en boucle comme BGM (SOUND_BRICKS[].id).
   * Priorité inférieure à bgmAudioUrl — ignorée si bgmAudioUrl est défini.
   */
  bgmBrickId?: string;
  /**
   * URL display-ready d'un fichier audio uploadé par l'utilisateur (MP3, OGG, WAV…).
   * Prioritaire sur bgmBrickId. Absent → fallback sur bgmBrickId ou silence.
   */
  bgmAudioUrl?: string;
  /**
   * Spritesheet du joueur (format LPC : 4 rangées × 9 colonnes, 64×64px/frame).
   * URL display-ready (asset.url ?? asset.path). Absent → carré violet (fallback).
   * Rangées : 0=bas, 1=gauche, 2=droite, 3=haut.
   */
  playerSpritePath?: string;
  /**
   * Position de départ du joueur sur la carte (en tuiles).
   * Absent → fallback (2, 2). Stocké comme col/rang entiers.
   * Référence : LDtk / Tiled — spawn point séparé des entités NPC.
   */
  playerStartCx?: number;
  playerStartCy?: number;
  /**
   * Effet atmosphérique de la carte (pluie, brouillard, neige…).
   * Rendu via GpuParticleEmitter + PostProcessor dans GameScene, et via
   * <SceneEffectCanvas> overlay dans l'aperçu éditeur.
   * Absent → pas d'effet (équivalent à { type: 'none' }).
   */
  sceneEffect?: SceneEffectConfig;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LAYER INSTANCES (LDtk-compatible)
// ============================================================================

export type LayerType = 'tiles' | 'collision' | 'triggers';

export interface TileInstance {
  /** Grid column */
  cx: number;
  /** Grid row */
  cy: number;
  /** Source asset path/url for the tile sprite (full image OR tileset sheet URL) */
  src: string;
  /** Flip flags: 0 = none, 1 = X, 2 = Y, 3 = XY */
  f: 0 | 1 | 2 | 3;
  /**
   * Sheet coordinates — présents uniquement si src est un tileset sheet (tileW > 0).
   * Absent (undefined) = image entière utilisée comme tuile unique.
   */
  tileX?: number;
  tileY?: number;
  tileW?: number;
  tileH?: number;
}

export interface LayerInstance {
  __identifier: string;
  __type: LayerType;
  __gridSize: number;
  __cWid: number;
  __cHei: number;
  gridTiles: TileInstance[];
  /** Collision cells: flat array of [cx, cy] pairs for solid tiles */
  intGrid?: number[];
  /**
   * Per-layer editor state — AccessCity extensions (_ac_ prefix, LDtk-compatible).
   * All optional, defaults applied at read time: visible=true, opacity=1.0, locked=false.
   */
  _ac_visible?: boolean;
  _ac_opacity?: number;
  _ac_locked?: boolean;
  /**
   * Auto-assigned color index (0–N) for the layer accent badge.
   * Used by LayerPanel to show a distinct color per tile layer.
   */
  _ac_colorIndex?: number;
}

// ============================================================================
// DIALOGUE TRIGGERS & EXITS (AccessCity extensions)
// ============================================================================

/** Triggers a VN dialogue or shows a text panel when the player enters/interacts with the zone */
export interface DialogueTrigger {
  id: string;
  /** Zone in grid pixels (world space) */
  zone: Rect;
  /** Scene ID in the VN editor to trigger (required when triggerType === 'dialogue') */
  dialogueSceneId: string;
  /** Only trigger once per session? */
  once: boolean;
  /** Label shown in the editor (e.g. "Talk to Mayor") */
  label: string;
  /**
   * What to do with the map BGM when this dialogue triggers.
   * - 'keep'    : map BGM keeps playing (default)
   * - 'replace' : stop map BGM; VN scene audio takes over
   * - 'silence' : stop map BGM; dialogue plays silently
   */
  bgmBehavior?: 'keep' | 'replace' | 'silence';
  /**
   * Visual transition when switching from the 2D map to the dialogue.
   * - 'fade-black' : fade to black (default, works on all PCs)
   * - 'fade-white' : flash white (impact effect)
   * - 'iris'       : circular iris close (Pokémon style, CSS clip-path)
   * - 'none'       : instant cut
   */
  transitionType?: 'fade-black' | 'fade-white' | 'iris' | 'none';
  /**
   * Sub-type of trigger:
   * - 'dialogue' : opens a VN scene (default)
   * - 'sign'     : shows a free-text panel (notice, road sign, book…)
   */
  triggerType?: 'dialogue' | 'sign';
  /**
   * How the trigger fires:
   * - 'auto'     : fires immediately when the player enters the zone (default)
   * - 'interact' : fires when the player presses Enter while inside the zone
   *                (shows a floating "↵ Entrée" tooltip)
   */
  interactionMode?: 'auto' | 'interact';
  /**
   * Text displayed when triggerType === 'sign'.
   * Shown in a popup card when the player interacts with the zone.
   */
  signText?: string;
}

/**
 * Joue une brique sonore procédurale quand le joueur entre dans la zone.
 * soundBrickId référence un SOUND_BRICKS[].id de src/config/soundBricks.ts.
 */
export interface AudioZone {
  id: string;
  /** Zone in grid pixels (world space) */
  zone: Rect;
  /** ID de la brique sonore (SOUND_BRICKS[].id) */
  soundBrickId: string;
  /** Jouer une seule fois par session ? */
  once: boolean;
  /** Label affiché dans l'éditeur */
  label: string;
}

/** Teleports the player to another map */
export interface SceneExit {
  id: string;
  /** Zone in grid pixels (world space) */
  zone: Rect;
  /** Target map ID */
  targetMapId: string;
  /** Spawn position in the target map (grid pixels) */
  targetPos: Vec2;
  /** Label shown in the editor */
  label: string;
}

// ============================================================================
// MAP DATA (full tilemap, LDtk-compatible root)
// ============================================================================

export interface MapData {
  /** LDtk-compatible fields */
  identifier: string;
  uid: string;
  worldX: number;
  worldY: number;
  pxWid: number;
  pxHei: number;
  __gridSize: number;
  layerInstances: LayerInstance[];

  /** AccessCity custom extensions */
  _ac_dialogue_triggers: DialogueTrigger[];
  _ac_scene_exits: SceneExit[];
  /** Zones sonores — jouent une brique jsfxr quand le joueur entre dedans */
  _ac_audio_zones: AudioZone[];
  /** Entités placées sur la carte (PNJ, monstres, objets…) */
  _ac_entities: EntityInstance[];
}
