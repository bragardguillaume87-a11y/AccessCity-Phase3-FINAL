/**
 * Map Types — LDtk-compatible format
 *
 * AccessCity topdown map editor outputs JSON compatible with Excalibur's @excaliburjs/plugin-ldtk.
 * Custom _ac_ fields extend the format with dialogue triggers and scene exits.
 *
 * @module types/map
 */

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
  /** Source asset path/url for the tile sprite */
  src: string;
  /** Flip flags: 0 = none, 1 = X, 2 = Y, 3 = XY */
  f: 0 | 1 | 2 | 3;
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
}

// ============================================================================
// DIALOGUE TRIGGERS & EXITS (AccessCity extensions)
// ============================================================================

/** Triggers a VN dialogue when the player enters the zone */
export interface DialogueTrigger {
  id: string;
  /** Zone in grid pixels (world space) */
  zone: Rect;
  /** Scene ID in the VN editor to trigger */
  dialogueSceneId: string;
  /** Only trigger once per session? */
  once: boolean;
  /** Label shown in the editor (e.g. "Talk to Mayor") */
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
}
