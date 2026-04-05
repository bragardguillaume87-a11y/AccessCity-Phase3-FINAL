/**
 * GameScene — Scène Excalibur topdown (hors React)
 *
 * Construit la scène depuis MapData :
 * - TileMap avec couche décor (images réelles ou damier fallback) + collision solide
 * - Player actor : spritesheet animé (walk + idle) ou carré violet (fallback)
 * - NPC actors : static / patrol / dialogue — depuis mapData._ac_entities
 * - Trigger zones : acteurs passifs détectant la collision avec le joueur
 *
 * @module components/modules/GamePreview/GameScene
 */

import * as ex from 'excalibur';
import jsfxrLib, { sfxr } from 'jsfxr';
const Params = jsfxrLib.Params;
import type { MapData, TileInstance, LayerInstance, PlayerColliderConfig } from '@/types/map';
import type {
  SpriteSheetConfig,
  AnimationRange,
  EntityInstance,
  ObjectDefinition,
  WindComponent,
} from '@/types/sprite';
import type { TilesetConfig } from '@/types/tileset';
import type { SceneEffectConfig } from '@/types/sceneEffect';
import type { DialogueBridge } from './DialogueBridge';
import { SOUND_BRICKS, childParamsToJsfxr } from '@/config/soundBricks';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  floor: ex.Color.fromHex('#2a2a3e'),
  floorAlt: ex.Color.fromHex('#252538'),
  player: ex.Color.fromHex('#7c3aed'),
  npc: ex.Color.fromHex('#e87d0d'),
};

const PLAYER_SPEED = 150;
const NPC_PATROL_SPEED = 60;
const LPC_COLS = 9;
const LPC_FRAME_SIZE = 64;

// ============================================================================
// MODULE-LEVEL HELPERS (shared by player and NPCs)
// ============================================================================

/** Construit une Animation depuis une AnimationRange ou des frames fallback. */
function makeAnim(
  sheet: ex.SpriteSheet,
  range: AnimationRange | undefined,
  fallbackStart: number,
  fallbackEnd: number
): ex.Animation {
  if (range) {
    const ms = Math.round(1000 / Math.max(1, range.fps));
    return ex.Animation.fromSpriteSheet(sheet, range.frames, ms);
  }
  return ex.Animation.fromSpriteSheet(sheet, ex.range(fallbackStart, fallbackEnd), 100);
}

/** Anim idle : 1 frame figée sur le premier frame walk si aucune idle configurée. */
function makeIdleAnim(
  sheet: ex.SpriteSheet,
  idleRange: AnimationRange | undefined,
  walkFirstFrame: number
): ex.Animation {
  if (idleRange) {
    const ms = Math.round(1000 / Math.max(1, idleRange.fps));
    return ex.Animation.fromSpriteSheet(sheet, idleRange.frames, ms);
  }
  // Pas d'idle configuré : 1 frame figée sur la première pose walk
  return ex.Animation.fromSpriteSheet(sheet, [walkFirstFrame], 1000);
}

/** Détermine la direction dominante d'un vecteur de vélocité. */
function velToDir(vel: ex.Vector): 'down' | 'left' | 'right' | 'up' {
  if (Math.abs(vel.y) >= Math.abs(vel.x)) return vel.y >= 0 ? 'down' : 'up';
  return vel.x > 0 ? 'right' : 'left';
}

type DirAnims = Record<'down' | 'left' | 'right' | 'up', ex.Animation>;
type DirFlipX = Record<'down' | 'left' | 'right' | 'up', boolean>;

/** Construit walk + idle anims et le flipX par direction depuis une SpriteSheetConfig. */
function buildCharacterAnims(
  imgSrc: ex.ImageSource,
  cfg: SpriteSheetConfig
): { walkAnims: DirAnims; idleAnims: DirAnims; dirFlipX: DirFlipX } {
  const sheet = ex.SpriteSheet.fromImageSource({
    image: imgSrc,
    grid: { rows: cfg.rows, columns: cfg.cols, spriteWidth: cfg.frameW, spriteHeight: cfg.frameH },
  });
  const a = cfg.animations;
  const c = cfg.cols;

  const walkAnims: DirAnims = {
    down: makeAnim(sheet, a['walk_down'], 0 * c, 1 * c - 1),
    left: makeAnim(sheet, a['walk_left'], 1 * c, 2 * c - 1),
    right: makeAnim(sheet, a['walk_right'], 2 * c, 3 * c - 1),
    up: makeAnim(sheet, a['walk_up'], 3 * c, 4 * c - 1),
  };

  const idleAnims: DirAnims = {
    down: makeIdleAnim(sheet, a['idle_down'], a['walk_down']?.frames?.[0] ?? 0 * c),
    left: makeIdleAnim(sheet, a['idle_left'], a['walk_left']?.frames?.[0] ?? 1 * c),
    right: makeIdleAnim(sheet, a['idle_right'], a['walk_right']?.frames?.[0] ?? 2 * c),
    up: makeIdleAnim(sheet, a['idle_up'], a['walk_up']?.frames?.[0] ?? 3 * c),
  };

  const dirFlipX: DirFlipX = {
    down: a['walk_down']?.flipX ?? false,
    left: a['walk_left']?.flipX ?? false,
    right: a['walk_right']?.flipX ?? false,
    up: a['walk_up']?.flipX ?? false,
  };

  return { walkAnims, idleAnims, dirFlipX };
}

// ============================================================================
// SCENE
// ============================================================================

export class TopdownScene extends ex.Scene {
  private mapData: MapData;
  private bridge: DialogueBridge;
  private player!: ex.Actor;
  private playerSpritePath?: string;
  private playerSpriteConfig?: SpriteSheetConfig;
  private spriteSheetConfigs: Record<string, SpriteSheetConfig>;
  private tilesetConfigs: Record<string, TilesetConfig>;
  private imageCache: Map<string, ex.ImageSource>;

  // Player animation state
  private walkAnims: DirAnims | null = null;
  private idleAnims: DirAnims | null = null;
  private dirFlipX: DirFlipX = { down: false, left: false, right: false, up: false };
  private lastDir: 'down' | 'left' | 'right' | 'up' = 'down';

  // Object definitions (Phase 4) — resolved from mapsStore before scene construction
  private objectDefinitions: ObjectDefinition[] = [];

  // Input velocity — set in preupdate (before physics), read in postupdate (for animation)
  private inputVx = 0;
  private inputVy = 0;

  // NPC actors list — used for key-E interaction
  private npcActors: Array<{ actor: ex.Actor; entity: EntityInstance }> = [];

  // Interact-mode trigger zones — used for Enter key interaction
  private interactZoneActors: Array<{
    trigger: import('@/types/map').DialogueTrigger;
    hasPlayed: boolean;
  }> = [];
  // IDs of interact zones the player is currently inside
  private playerInteractZoneIds = new Set<string>();

  /** Spawn position when entering this map (grid pixels). Defaults to (tileSize*2, tileSize*2). */
  private initialPlayerPos?: { x: number; y: number };

  /** BGM sound brick ID (SOUND_BRICKS[].id). Looped via HTMLAudioElement. */
  private bgmBrickId?: string;
  /** BGM audio file URL (user-uploaded MP3/OGG/WAV). Priority over bgmBrickId. */
  private bgmAudioUrl?: string;
  /** BGM audio element — stopped in onDeactivate. */
  private bgmAudio: HTMLAudioElement | null = null;
  /** Camera zoom resolved by useGameEngine (auto or manual). */
  private cameraZoom: number = 1.5;
  /** Player collider config — box or polygon override. Absent = default Excalibur box. */
  private playerColliderConfig?: PlayerColliderConfig;

  constructor(
    mapData: MapData,
    bridge: DialogueBridge,
    playerSpritePath?: string,
    imageCache?: Map<string, ex.ImageSource>,
    playerSpriteConfig?: SpriteSheetConfig,
    spriteSheetConfigs?: Record<string, SpriteSheetConfig>,
    initialPlayerPos?: { x: number; y: number },
    bgmBrickId?: string,
    bgmAudioUrl?: string,
    tilesetConfigs?: Record<string, TilesetConfig>,
    _sceneEffect?: SceneEffectConfig,
    cameraZoom?: number,
    playerColliderConfig?: PlayerColliderConfig,
    objectDefinitions?: ObjectDefinition[]
  ) {
    super();
    this.mapData = mapData;
    this.bridge = bridge;
    this.playerSpritePath = playerSpritePath;
    this.playerSpriteConfig = playerSpriteConfig;
    this.imageCache = imageCache ?? new Map();
    this.spriteSheetConfigs = spriteSheetConfigs ?? {};
    this.tilesetConfigs = tilesetConfigs ?? {};
    this.initialPlayerPos = initialPlayerPos;
    this.bgmBrickId = bgmBrickId;
    this.bgmAudioUrl = bgmAudioUrl;
    this.cameraZoom = cameraZoom ?? 1.5;
    this.playerColliderConfig = playerColliderConfig;
    this.objectDefinitions = objectDefinitions ?? [];
  }

  onInitialize(engine: ex.Engine): void {
    this.buildTileMap();
    this.buildHitboxActors();
    this.buildTriggerZones();
    this.buildExitZones();
    this.buildAudioZones();
    this.addPlayer(engine);
    this.applyPlayerSprite();
    this.buildEntities();
    this.buildObjects();
    this.startBgm();
  }

  /** Arrête la BGM — appelé explicitement à l'arrêt du moteur (engine.stop() ne déclenche pas onDeactivate). */
  public stopBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
  }

  /** Relance la BGM après un dialogue 'replace'/'silence' — appelé par DialogueBridge.resumeAfterDialogue(). */
  public resumeBgm(): void {
    if (!this.bgmAudio) this.startBgm();
  }

  override onDeactivate(): void {
    this.stopBgm();
  }

  // ── TileMap ────────────────────────────────────────────────────────────────

  private buildTileMap(): void {
    const { __gridSize: tileSize, pxWid, pxHei } = this.mapData;
    if (!tileSize) return;

    const columns = Math.floor(pxWid / tileSize);
    const rows = Math.floor(pxHei / tileSize);

    const tilemap = new ex.TileMap({
      pos: ex.vec(0, 0),
      tileWidth: tileSize,
      tileHeight: tileSize,
      rows,
      columns,
    });

    // ── Pass 1 : collision (gameplay only, no visual) ──────────────────────
    const collisionLayer = this.mapData.layerInstances.find((l) => l.__type === 'collision');
    for (const cellIdx of collisionLayer?.intGrid ?? []) {
      const tile = tilemap.getTile(cellIdx % columns, Math.floor(cellIdx / columns));
      if (tile) tile.solid = true;
    }

    // ── Pass 2 : floor base (checkerboard) ────────────────────────────────
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tile = tilemap.getTile(col, row);
        if (!tile) continue;
        // Transparent tile pixels composite over this, not the WebGL clear color.
        const isAlt = (row + col) % 2 === 0;
        tile.addGraphic(
          new ex.Rectangle({
            width: tileSize,
            height: tileSize,
            color: isAlt ? COLORS.floor : COLORS.floorAlt,
          })
        );
      }
    }

    // ── Pass 3 : tile layers — split into ground (below player) and canopy (above player) ──
    // Ground = all layers except the last → z=0 (always behind player/NPCs)
    // Canopy = last tile layer only       → z=9999 (always in front of player/NPCs)
    //
    // "Split-canopy" technique (Zelda ALTTP, Pokémon, Stardew Valley):
    //   - Put tree TRUNKS on Layer 1 → rendered behind the player
    //   - Put tree TOPS (leaves/canopy) on Layer 2 → rendered in front of the player
    //   - Player/NPCs use Y-sort (z = 100 + pos.y) to sort depth between themselves
    //   → Player walking north of a tree: canopy covers player (behind tree) ✓
    //   → Player walking south of a tree: player overlaps trunk (in front of tree) ✓
    const tileLayers = this.mapData.layerInstances.filter((l) => l.__type === 'tiles');
    const groundLayers = tileLayers.length > 1 ? tileLayers.slice(0, -1) : tileLayers;
    const canopyLayer = tileLayers.length > 1 ? tileLayers[tileLayers.length - 1] : null;

    for (const layer of groundLayers) {
      this.paintTileLayer(tilemap, layer, tileSize);
    }
    this.add(tilemap); // z=0 (default) — always behind player

    // Canopy — acteurs individuels Y-sortés (pas de TileMap fixe à z=9999)
    // Chaque tuile du dernier calque reçoit z = 100 + (cy+1)*tileSize.
    // Le joueur (z = 100 + pos.y) passe DEVANT quand il marche au sud de la tuile
    // et DERRIÈRE quand il marche au nord → tri-Y fidèle au style Zelda/Pokémon.
    if (canopyLayer) {
      this.buildCanopyActors(canopyLayer, tileSize);
    }
  }

  /** Paints all gridTiles from a tile layer onto the given TileMap. */
  private paintTileLayer(tilemap: ex.TileMap, layer: LayerInstance, tileSize: number): void {
    if (layer._ac_visible === false) return;
    const opacity = layer._ac_opacity ?? 1.0;

    const layerStackMap = new Map<string, TileInstance[]>();
    for (const ti of layer.gridTiles) {
      const key = `${ti.cx},${ti.cy}`;
      const stack = layerStackMap.get(key);
      if (stack) stack.push(ti);
      else layerStackMap.set(key, [ti]);
    }

    for (const [key, tileInsts] of layerStackMap) {
      const [col, row] = key.split(',').map(Number);
      const tile = tilemap.getTile(col, row);
      if (!tile) continue;

      for (const tileInst of tileInsts) {
        const imgSrc = this.imageCache.get(tileInst.src);
        if (!imgSrc) continue;

        let sprite: ex.Sprite;
        if (tileInst.tileW && tileInst.tileW > 0) {
          sprite = new ex.Sprite({
            image: imgSrc,
            sourceView: {
              x: tileInst.tileX ?? 0,
              y: tileInst.tileY ?? 0,
              width: tileInst.tileW,
              height: tileInst.tileH ?? tileInst.tileW,
            },
            destSize: { width: tileSize, height: tileSize },
          });
        } else {
          sprite = imgSrc.toSprite();
          sprite.scale = ex.vec(
            tileSize / (imgSrc.width || tileSize),
            tileSize / (imgSrc.height || tileSize)
          );
        }
        sprite.flipHorizontal = (tileInst.f & 1) !== 0;
        sprite.flipVertical = (tileInst.f & 2) !== 0;
        if (opacity < 1) sprite.opacity = opacity;
        tile.addGraphic(sprite);
      }
    }
  }

  /**
   * Canopy layer : crée un acteur Excalibur par cellule unique du dernier calque.
   * z = 100 + (cy + 1) * tileSize  → tri-Y correct avec le joueur (z = 100 + pos.y).
   * CollisionType.PreventCollision : purement visuel, la collision reste dans le
   * TileMap intGrid et les hitbox actors (buildHitboxActors).
   */
  private buildCanopyActors(layer: LayerInstance, tileSize: number): void {
    if (layer._ac_visible === false) return;
    const opacity = layer._ac_opacity ?? 1.0;

    // Regrouper les tuiles par cellule (stacking — même logique que paintTileLayer)
    const stackMap = new Map<string, TileInstance[]>();
    for (const ti of layer.gridTiles) {
      const key = `${ti.cx},${ti.cy}`;
      const existing = stackMap.get(key);
      if (existing) existing.push(ti);
      else stackMap.set(key, [ti]);
    }

    for (const [key, tileInsts] of stackMap) {
      const [col, row] = key.split(',').map(Number);

      // Construire les sprites pour cette cellule
      const members: Array<{ graphic: ex.Graphic; offset: ex.Vector }> = [];
      for (const ti of tileInsts) {
        const imgSrc = this.imageCache.get(ti.src);
        if (!imgSrc) continue;

        let sprite: ex.Sprite;
        if (ti.tileW && ti.tileW > 0) {
          sprite = new ex.Sprite({
            image: imgSrc,
            sourceView: {
              x: ti.tileX ?? 0,
              y: ti.tileY ?? 0,
              width: ti.tileW,
              height: ti.tileH ?? ti.tileW,
            },
            destSize: { width: tileSize, height: tileSize },
          });
        } else {
          sprite = imgSrc.toSprite();
          sprite.scale = ex.vec(
            tileSize / (imgSrc.width || tileSize),
            tileSize / (imgSrc.height || tileSize)
          );
        }
        sprite.flipHorizontal = (ti.f & 1) !== 0;
        sprite.flipVertical = (ti.f & 2) !== 0;
        if (opacity < 1) sprite.opacity = opacity;
        members.push({ graphic: sprite, offset: ex.Vector.Zero });
      }
      if (members.length === 0) continue;

      const graphic = members.length === 1 ? members[0].graphic : new ex.GraphicsGroup({ members });

      const actor = new ex.Actor({
        name: `canopy-${col}-${row}`,
        pos: ex.vec(col * tileSize + tileSize / 2, row * tileSize + tileSize / 2),
        width: tileSize,
        height: tileSize,
        // Pas de collision physique — purement visuel
        collisionType: ex.CollisionType.PreventCollision,
        // Tri-Y : en avant quand joueur.pos.y > (row+1)*tileSize, derrière sinon
        z: 100 + (row + 1) * tileSize,
      });
      actor.color = ex.Color.Transparent;
      actor.graphics.use(graphic);
      this.add(actor);
    }
  }

  // ── Hitbox actors (AABB sub-tile collision) ───────────────────────────────

  /**
   * Pour chaque tuile sur les couches de type 'tiles' qui a une entrée dans le
   * hitboxMap de son TilesetConfig, crée un Actor Fixed invisible avec le rectangle
   * de collision AABB défini en pourcentage de la tuile.
   *
   * Permet des collisions précises (ex: tronc d'arbre) indépendantes de la grille.
   */
  private buildHitboxActors(): void {
    if (Object.keys(this.tilesetConfigs).length === 0) return;
    const tileSize = this.mapData.__gridSize || 32;
    const tileLayers = this.mapData.layerInstances.filter((l) => l.__type === 'tiles');

    for (const layer of tileLayers) {
      for (const ti of layer.gridTiles) {
        const cfg = this.tilesetConfigs[ti.src];
        if (!cfg?.hitboxMap) continue;

        // Clé dans la hitboxMap = "${tileX}_${tileY}" (pixels dans le sheet)
        const key = ti.tileW && ti.tileW > 0 ? `${ti.tileX ?? 0}_${ti.tileY ?? 0}` : '0_0';
        const hitbox = cfg.hitboxMap[key];
        if (!hitbox) continue;

        // Coin supérieur-gauche de la cellule en coordonnées monde
        const cellLeft = ti.cx * tileSize;
        const cellTop = ti.cy * tileSize;

        // Dimensions de la hitbox en pixels monde
        const hitW = (hitbox.wPct / 100) * tileSize;
        const hitH = (hitbox.hPct / 100) * tileSize;

        // Centre de la hitbox en coordonnées monde
        const posX = cellLeft + (hitbox.xPct / 100) * tileSize + hitW / 2;
        const posY = cellTop + (hitbox.yPct / 100) * tileSize + hitH / 2;

        const actor = new ex.Actor({
          name: `hitbox-${ti.cx}-${ti.cy}`,
          pos: ex.vec(posX, posY),
          width: Math.max(1, hitW),
          height: Math.max(1, hitH),
          collisionType: ex.CollisionType.Fixed,
          color: ex.Color.Transparent,
        });
        this.add(actor);
      }
    }
  }

  // ── Trigger / exit zones ───────────────────────────────────────────────────

  private buildTriggerZones(): void {
    for (const zone of this.mapData._ac_dialogue_triggers) {
      const actor = new ex.Actor({
        name: `trigger-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width,
        height: zone.zone.height,
        collisionType: ex.CollisionType.Passive,
        color: ex.Color.Transparent,
      });

      const mode = zone.interactionMode ?? 'auto';

      if (mode === 'auto') {
        // Auto mode: fire immediately when player enters the zone
        const sceneId = zone.dialogueSceneId;
        const bgmBehavior = zone.bgmBehavior;
        const transitionType = zone.transitionType;
        const once = zone.once;
        const triggerType = zone.triggerType ?? 'dialogue';
        const signText = zone.signText ?? '';
        let hasPlayed = false;
        actor.on('collisionstart', (evt) => {
          if (evt.other.owner !== this.player) return;
          if (once && hasPlayed) return;
          if (once) hasPlayed = true;
          if (triggerType === 'sign') {
            this.bridge.showSignPopup(signText);
          } else {
            this.bridge.triggerDialogue(sceneId, bgmBehavior, transitionType);
          }
        });
      } else {
        // Interact mode: show "↵ Entrée" prompt when player enters, fire on Enter key
        const zoneId = zone.id;
        actor.on('collisionstart', (evt) => {
          if (evt.other.owner !== this.player) return;
          const wasEmpty = this.playerInteractZoneIds.size === 0;
          this.playerInteractZoneIds.add(zoneId);
          if (wasEmpty) this.bridge.showInteractPrompt();
        });
        actor.on('collisionend', (evt) => {
          if (evt.other.owner !== this.player) return;
          this.playerInteractZoneIds.delete(zoneId);
          if (this.playerInteractZoneIds.size === 0) this.bridge.hideInteractPrompt();
        });
        this.interactZoneActors.push({ trigger: zone, hasPlayed: false });
      }

      this.add(actor);
    }
  }

  private buildExitZones(): void {
    for (const zone of this.mapData._ac_scene_exits) {
      const actor = new ex.Actor({
        name: `exit-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width,
        height: zone.zone.height,
        collisionType: ex.CollisionType.Passive,
        color: ex.Color.Transparent,
      });
      const targetMapId = zone.targetMapId;
      const targetPos = zone.targetPos;
      let isExiting = false; // guard: prevent double-fire on multi-frame collision
      actor.on('collisionstart', (evt) => {
        if (evt.other.owner === this.player && !isExiting) {
          isExiting = true;
          this.bridge.triggerMapExit(targetMapId, targetPos);
        }
      });
      this.add(actor);
    }
  }

  private buildAudioZones(): void {
    const zones = this.mapData._ac_audio_zones ?? [];
    const played = new Set<string>();
    for (const zone of zones) {
      const actor = new ex.Actor({
        name: `audio-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width,
        height: zone.zone.height,
        collisionType: ex.CollisionType.Passive,
        color: ex.Color.Transparent,
      });
      const { soundBrickId, once, id } = zone;
      actor.on('collisionstart', (evt) => {
        if (evt.other.owner !== this.player) return;
        if (once && played.has(id)) return;
        if (once) played.add(id);
        this.playSoundBrick(soundBrickId);
      });
      this.add(actor);
    }
  }

  // ── Shared audio helpers ───────────────────────────────────────────────────

  /** Joue une brique sonore jsfxr (one-shot). Silencieux si brickId inconnu. */
  private playSoundBrick(brickId: string): void {
    try {
      const brick = SOUND_BRICKS.find((b) => b.id === brickId);
      if (!brick) return;
      const p = new Params();
      (p as unknown as Record<string, () => void>)[brick.algorithm]?.();
      const overrides = childParamsToJsfxr(brick.defaults);
      p.p_base_freq = overrides.p_base_freq;
      p.p_env_decay = overrides.p_env_decay;
      p.p_freq_ramp = overrides.p_freq_ramp;
      sfxr.play(p);
    } catch {
      // AudioContext non déverrouillé ou env sans audio — silencieux
    }
  }

  /** Démarre la BGM en boucle. Priorité : fichier audio uploadé > brique procédurale. */
  private startBgm(): void {
    // ── Cas 1 : fichier audio uploadé (MP3, OGG, WAV…) ────────────────────
    if (this.bgmAudioUrl) {
      try {
        const audio = new Audio(this.bgmAudioUrl);
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        this.bgmAudio = audio;
      } catch {
        // Environnement sans audio — silencieux
      }
      return;
    }

    // ── Cas 2 : brique sonore procédurale (jsfxr) ─────────────────────────
    if (!this.bgmBrickId) return;
    try {
      const brick = SOUND_BRICKS.find((b) => b.id === this.bgmBrickId);
      if (!brick) return;
      const p = new Params();
      (p as unknown as Record<string, () => void>)[brick.algorithm]?.();
      const overrides = childParamsToJsfxr(brick.defaults);
      p.p_base_freq = overrides.p_base_freq;
      p.p_env_decay = overrides.p_env_decay;
      p.p_freq_ramp = overrides.p_freq_ramp;
      const audio = sfxr.toAudio(p);
      audio.loop = true;
      audio.volume = 0.35;
      audio.play().catch(() => {});
      this.bgmAudio = audio;
    } catch {
      // AudioContext non déverrouillé — silencieux
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  private addPlayer(engine: ex.Engine): void {
    const tileSize = this.mapData.__gridSize || 32;
    const spawnX = this.initialPlayerPos?.x ?? tileSize * 2;
    const spawnY = this.initialPlayerPos?.y ?? tileSize * 2;

    // Default collision dimensions when no custom config
    const defaultSize = Math.max(16, tileSize - 4);

    this.player = new ex.Actor({
      name: 'Player',
      pos: ex.vec(spawnX, spawnY),
      width: defaultSize,
      height: defaultSize,
      color: COLORS.player,
      collisionType: ex.CollisionType.Active,
      z: 100 + spawnY, // initial value — updated each frame by Y-sort below
    });

    // ── Apply custom collider if configured ──────────────────────────────────
    if (this.playerColliderConfig) {
      const cfg = this.playerColliderConfig;
      if (cfg.mode === 'box') {
        const bW = Math.max(4, cfg.widthPct * tileSize);
        const bH = Math.max(4, cfg.heightPct * tileSize);
        const offX = cfg.offsetXPct * tileSize;
        const offY = cfg.offsetYPct * tileSize;
        this.player.collider.set(ex.Shape.Box(bW, bH, ex.Vector.Half, ex.vec(offX, offY)));
      } else if (cfg.mode === 'polygon') {
        const half = tileSize / 2;
        const points = cfg.points.map((p) => ex.vec(p.x * half, p.y * half));
        if (points.length >= 3) {
          this.player.collider.set(new ex.PolygonCollider({ points, offset: ex.vec(0, 0) }));
        }
      }
    }

    // ── preupdate : lecture input + vélocité (AVANT physique) ─────────────────
    // ⚠️ CRITIQUE : la vélocité DOIT être définie ici, pas dans postupdate.
    // Excalibur résout les collisions pendant la physique (entre preupdate et
    // postupdate). Si la vélocité est définie dans postupdate, elle écrase la
    // résolution physique → le joueur re-pénètre les murs chaque frame.
    this.player.on('preupdate', () => {
      const kb = engine.input.keyboard;
      this.inputVx = 0;
      this.inputVy = 0;

      if (kb.isHeld(ex.Keys.W) || kb.isHeld(ex.Keys.Up)) this.inputVy = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.S) || kb.isHeld(ex.Keys.Down)) this.inputVy = PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.A) || kb.isHeld(ex.Keys.Left)) this.inputVx = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.D) || kb.isHeld(ex.Keys.Right)) this.inputVx = PLAYER_SPEED;

      if (this.inputVx !== 0 && this.inputVy !== 0) {
        const f = 1 / Math.SQRT2;
        this.inputVx *= f;
        this.inputVy *= f;
      }
      this.player.vel = ex.vec(this.inputVx, this.inputVy);

      // Direction basée sur l'input (pour l'animation — indépendante de la physique)
      if (this.inputVy > 0) this.lastDir = 'down';
      else if (this.inputVy < 0) this.lastDir = 'up';
      else if (this.inputVx < 0) this.lastDir = 'left';
      else if (this.inputVx > 0) this.lastDir = 'right';

      // ── Key E — interact with nearest dialogue NPC ─────────────────────
      if (kb.wasPressed(ex.Keys.E)) {
        const interactRange = (this.mapData.__gridSize || 32) * 1.5;
        let nearest: { actor: ex.Actor; entity: EntityInstance } | null = null;
        let nearestDist = Infinity;
        for (const npcEntry of this.npcActors) {
          if (!npcEntry.entity.dialogueSceneId) continue;
          const dist = this.player.pos.distance(npcEntry.actor.pos);
          if (dist < interactRange && dist < nearestDist) {
            nearestDist = dist;
            nearest = npcEntry;
          }
        }
        if (nearest) {
          this.bridge.triggerDialogue(nearest.entity.dialogueSceneId!);
        }
      }

      // ── Key Enter — activate interact-mode trigger zone ─────────────────
      if (kb.wasPressed(ex.Keys.Enter) && this.playerInteractZoneIds.size > 0) {
        const activeId = [...this.playerInteractZoneIds][0];
        const entry = this.interactZoneActors.find((z) => z.trigger.id === activeId);
        if (entry) {
          if (entry.trigger.once && entry.hasPlayed) return;
          if (entry.trigger.once) entry.hasPlayed = true;

          if (entry.trigger.triggerType === 'sign') {
            this.bridge.showSignPopup(entry.trigger.signText ?? '');
          } else {
            this.bridge.triggerDialogue(
              entry.trigger.dialogueSceneId,
              entry.trigger.bgmBehavior,
              entry.trigger.transitionType
            );
          }
        }
      }
    });

    // ── postupdate : Y-sort + animation (APRÈS physique) ──────────────────
    this.player.on('postupdate', () => {
      // Y-sort: objects lower on screen appear in front (simulates 3D depth)
      this.player.z = 100 + this.player.pos.y;

      if (this.walkAnims) {
        const moving = this.inputVx !== 0 || this.inputVy !== 0;
        if (moving) {
          const walkAnim = this.walkAnims[this.lastDir];
          walkAnim.play();
          this.player.graphics.use(walkAnim);
          this.player.graphics.flipHorizontal = this.dirFlipX[this.lastDir];
        } else if (this.idleAnims) {
          // Switch to idle animation when stopped
          const idleAnim = this.idleAnims[this.lastDir];
          idleAnim.play();
          this.player.graphics.use(idleAnim);
          this.player.graphics.flipHorizontal = this.dirFlipX[this.lastDir];
        } else {
          this.walkAnims[this.lastDir].pause();
        }
      }
    });

    this.add(this.player);
    this.camera.strategy.elasticToActor(this.player, 0.15, 0.1);
    // Bound camera to map edges so it never shows void outside the map
    this.camera.strategy.limitCameraBounds(
      new ex.BoundingBox({
        left: 0,
        top: 0,
        right: this.mapData.pxWid,
        bottom: this.mapData.pxHei,
      })
    );
    this.camera.zoom = this.cameraZoom;
  }

  private applyPlayerSprite(): void {
    if (!this.playerSpritePath) return;
    const imgSrc = this.imageCache.get(this.playerSpritePath);
    if (!imgSrc) return;

    const cfg = this.playerSpriteConfig;

    if (cfg) {
      const { walkAnims, idleAnims, dirFlipX } = buildCharacterAnims(imgSrc, cfg);
      this.walkAnims = walkAnims;
      this.idleAnims = idleAnims;
      this.dirFlipX = dirFlipX;
    } else {
      // Fallback LPC hardcodé (4 rangées × 9 colonnes, 64×64px)
      const sheet = ex.SpriteSheet.fromImageSource({
        image: imgSrc,
        grid: {
          rows: 4,
          columns: LPC_COLS,
          spriteWidth: LPC_FRAME_SIZE,
          spriteHeight: LPC_FRAME_SIZE,
        },
      });
      this.walkAnims = {
        down: ex.Animation.fromSpriteSheet(sheet, ex.range(0, 8), 100),
        left: ex.Animation.fromSpriteSheet(sheet, ex.range(9, 17), 100),
        right: ex.Animation.fromSpriteSheet(sheet, ex.range(18, 26), 100),
        up: ex.Animation.fromSpriteSheet(sheet, ex.range(27, 35), 100),
      };
      // No idle in LPC fallback — freeze on first walk frame
      this.idleAnims = {
        down: ex.Animation.fromSpriteSheet(sheet, [0], 1000),
        left: ex.Animation.fromSpriteSheet(sheet, [9], 1000),
        right: ex.Animation.fromSpriteSheet(sheet, [18], 1000),
        up: ex.Animation.fromSpriteSheet(sheet, [27], 1000),
      };
      this.dirFlipX = { down: false, left: false, right: false, up: false };
    }

    this.player.graphics.add('walkDown', this.walkAnims.down);
    this.player.graphics.add('walkLeft', this.walkAnims.left);
    this.player.graphics.add('walkRight', this.walkAnims.right);
    this.player.graphics.add('walkUp', this.walkAnims.up);
    this.player.graphics.use(this.idleAnims?.down ?? this.walkAnims.down);
    this.player.color = ex.Color.Transparent;
  }

  // ── Entities (NPCs) ────────────────────────────────────────────────────────

  private buildEntities(): void {
    const tileSize = this.mapData.__gridSize || 32;
    const entities: EntityInstance[] = this.mapData._ac_entities ?? [];
    if (entities.length === 0) return;

    for (const entity of entities) {
      const px = entity.cx * tileSize + tileSize / 2;
      const py = entity.cy * tileSize + tileSize / 2;

      const npc = new ex.Actor({
        name: `entity-${entity.id}`,
        pos: ex.vec(px, py),
        width: Math.max(16, tileSize - 4),
        height: Math.max(16, tileSize - 4),
        color: COLORS.npc,
        // Passive: detectable via collisionstart but non-blocking (avoids NPC getting stuck on walls)
        collisionType: ex.CollisionType.Passive,
        z: 100 + py, // initial value — updated each frame by Y-sort below
      });

      // Build animations if spritesheet config is available
      const imgSrc = this.imageCache.get(entity.spriteAssetUrl);
      const cfg = this.spriteSheetConfigs[entity.spriteAssetUrl];

      let npcWalkAnims: DirAnims | null = null;
      let npcIdleAnims: DirAnims | null = null;
      let npcFlipX: DirFlipX = { down: false, left: false, right: false, up: false };

      if (imgSrc && cfg) {
        const built = buildCharacterAnims(imgSrc, cfg);
        npcWalkAnims = built.walkAnims;
        npcIdleAnims = built.idleAnims;
        npcFlipX = built.dirFlipX;
        npc.color = ex.Color.Transparent;
      }

      // Initial pose: idle facing direction
      const facing = entity.facing ?? 'down';
      if (npcIdleAnims) {
        npcIdleAnims[facing].play();
        npc.graphics.use(npcIdleAnims[facing]);
        npc.graphics.flipHorizontal = npcFlipX[facing];
      } else if (npcWalkAnims) {
        npcWalkAnims[facing].pause();
        npc.graphics.use(npcWalkAnims[facing]);
        npc.graphics.flipHorizontal = npcFlipX[facing];
      }

      // Y-sort: update z each frame based on vertical position (simulates 3D depth)
      npc.on('postupdate', () => {
        npc.z = 100 + npc.pos.y;
      });

      // ── Behaviors ───────────────────────────────────────────────────────────

      if (
        entity.behavior === 'patrol' &&
        entity.patrolTargetCx !== undefined &&
        entity.patrolTargetCy !== undefined
      ) {
        const targetX = entity.patrolTargetCx * tileSize + tileSize / 2;
        const targetY = entity.patrolTargetCy * tileSize + tileSize / 2;

        // Patrol: loop back and forth between spawn and target
        npc.actions.repeatForever((ctx) => {
          ctx.moveTo(targetX, targetY, NPC_PATROL_SPEED);
          ctx.moveTo(px, py, NPC_PATROL_SPEED);
        });

        // Update walk animation direction each frame during patrol
        if (npcWalkAnims) {
          npc.on('postupdate', () => {
            if (npc.vel.x === 0 && npc.vel.y === 0) return;
            const dir = velToDir(npc.vel);
            const anim = npcWalkAnims![dir];
            anim.play();
            npc.graphics.use(anim);
            npc.graphics.flipHorizontal = npcFlipX[dir];
          });
        }
      }

      // Dialogue trigger: fires when player makes contact
      if (entity.dialogueSceneId) {
        const sceneId = entity.dialogueSceneId;
        npc.on('collisionstart', (evt) => {
          if (evt.other.owner === this.player) this.bridge.triggerDialogue(sceneId);
        });
      }

      // Entry sound: played once on first player contact
      if (entity.entrySoundId) {
        const soundId = entity.entrySoundId;
        let entryPlayed = false;
        npc.on('collisionstart', (evt) => {
          if (evt.other.owner !== this.player) return;
          if (entryPlayed) return;
          entryPlayed = true;
          this.playSoundBrick(soundId);
        });
      }

      this.npcActors.push({ actor: npc, entity });
      this.add(npc);
    }
  }

  // ── Objects Phase 4 (ObjectInstance + ObjectDefinition) ───────────────────

  private buildObjects(): void {
    const tileSize = this.mapData.__gridSize || 32;
    const instances = this.mapData._ac_objects ?? [];
    if (instances.length === 0) return;

    for (const instance of instances) {
      const definition = this.objectDefinitions.find((d) => d.id === instance.definitionId);
      if (!definition) continue;

      // ── Les héros (category 'hero') sont déjà créés comme acteur joueur par buildPlayer.
      // Ne pas créer un second acteur ici — cela causerait un doublon visuellement superposé.
      if (definition.category === 'hero') continue;

      // ── Résoudre le spriteSheetConfig pour l'origine avant de calculer la position ─────
      const spriteUrlForOrigin =
        (
          definition.components.find((c) => c.type === 'animatedSprite') as
            | { spriteAssetUrl?: string }
            | undefined
        )?.spriteAssetUrl ??
        (
          definition.components.find((c) => c.type === 'sprite') as
            | { spriteAssetUrl?: string }
            | undefined
        )?.spriteAssetUrl;
      const cfgForOrigin = spriteUrlForOrigin
        ? this.spriteSheetConfigs[spriteUrlForOrigin]
        : undefined;
      const scaleXForOrigin = instance.overrides?.scaleX ?? instance.overrides?.scale ?? 1;
      const scaleYForOrigin = instance.overrides?.scaleY ?? instance.overrides?.scale ?? 1;
      const originXPct = cfgForOrigin?.originXPct ?? 0.5;
      const originYPct = cfgForOrigin?.originYPct ?? 0.5;
      // Taille monde de l'objet
      const objW = (cfgForOrigin?.frameW ?? tileSize) * scaleXForOrigin;
      const objH = (cfgForOrigin?.frameH ?? tileSize) * scaleYForOrigin;
      // Position du CENTRE du sprite = coin sup-gauche de la cellule + anchorOff
      // anchorOff = originPct*(ts - objSize) + objSize/2  (même formule que MapCanvas.tsx)
      const anchorOffX = originXPct * (tileSize - objW) + objW / 2;
      const anchorOffY = originYPct * (tileSize - objH) + objH / 2;
      const px = instance.cx * tileSize + anchorOffX;
      const py = instance.cy * tileSize + anchorOffY;

      // ── Resolve components ────────────────────────────────────────────────

      const animComp = definition.components.find(
        (
          c
        ): c is { type: 'animatedSprite'; spriteAssetUrl: string; spriteSheetConfigUrl: string } =>
          c.type === 'animatedSprite'
      );
      const spriteComp = definition.components.find(
        (
          c
        ): c is {
          type: 'sprite';
          spriteAssetUrl: string;
          srcX: number;
          srcY: number;
          srcW: number;
          srcH: number;
        } => c.type === 'sprite'
      );
      const colliderComp = definition.components.find(
        (
          c
        ): c is {
          type: 'collider';
          shape: 'box' | 'circle' | 'none';
          w: number;
          h: number;
          radius: number;
          offsetX: number;
          offsetY: number;
        } => c.type === 'collider'
      );
      const dialogueComp = definition.components.find(
        (c): c is { type: 'dialogue'; sceneId: string } => c.type === 'dialogue'
      );
      const patrolComp = definition.components.find(
        (
          c
        ): c is {
          type: 'patrol';
          targetCx: number;
          targetCy: number;
          speed: number;
          loop: boolean;
        } => c.type === 'patrol'
      );
      const portalComp = definition.components.find(
        (c): c is import('@/types/sprite').PortalComponent => c.type === 'portal'
      );
      const windComp = definition.components.find((c): c is WindComponent => c.type === 'wind');

      // ── Collider ──────────────────────────────────────────────────────────

      let actorCollider: ex.Collider | undefined;
      if (colliderComp && colliderComp.shape !== 'none') {
        if (colliderComp.shape === 'circle') {
          actorCollider = ex.Shape.Circle(
            colliderComp.radius || tileSize / 2,
            ex.vec(colliderComp.offsetX, colliderComp.offsetY)
          );
        } else {
          actorCollider = ex.Shape.Box(
            colliderComp.w || tileSize,
            colliderComp.h || tileSize,
            ex.Vector.Half,
            ex.vec(colliderComp.offsetX, colliderComp.offsetY)
          );
        }
      } else if (!colliderComp) {
        // Fallback : utiliser playerCollider du SpriteSheetConfig si configuré dans SpriteImportDialog.
        // Permet de définir la hitbox directement dans le dialog de sprite sans ajouter
        // un ColliderComponent explicite à la définition.
        const spriteUrl = animComp?.spriteAssetUrl ?? spriteComp?.spriteAssetUrl;
        const spriteCfg = spriteUrl ? this.spriteSheetConfigs[spriteUrl] : undefined;
        const pc = spriteCfg?.playerCollider;
        if (pc) {
          if (pc.mode === 'box') {
            actorCollider = ex.Shape.Box(
              pc.widthPct * tileSize,
              pc.heightPct * tileSize,
              ex.Vector.Half,
              ex.vec(pc.offsetXPct * tileSize, pc.offsetYPct * tileSize)
            );
          } else if (pc.mode === 'polygon' && pc.points.length >= 3) {
            actorCollider = ex.Shape.Polygon(
              pc.points.map((p) => ex.vec(p.x * tileSize * 0.5, p.y * tileSize * 0.5))
            );
          }
        }
      }

      // Fixed = immovable obstacle that blocks the player (ex: fence, barrel).
      // Passive = fires collision events without blocking (ex: patrol NPC, portal).
      const hasSolidCollider = !!(colliderComp && colliderComp.shape !== 'none');
      const isMovable = !!patrolComp;
      const collType =
        hasSolidCollider && !isMovable ? ex.CollisionType.Fixed : ex.CollisionType.Passive;

      // Z-sort: use bottom edge of occupied cell (cy+1)*tileSize — same convention as
      // canopy tiles. Ensures the object is rendered in front of the player when the
      // player is at the same row, and behind when the player is one row below.
      const actor = new ex.Actor({
        name: `object-${instance.id}`,
        pos: ex.vec(px, py),
        width: tileSize,
        height: tileSize,
        collisionType: collType,
        z: 100 + py + tileSize / 2,
      });
      actor.color = ex.Color.Transparent;
      if (actorCollider) {
        actor.collider.set(actorCollider);
      }

      // ── Graphics ──────────────────────────────────────────────────────────

      const scaleX = instance.overrides?.scaleX ?? instance.overrides?.scale ?? 1;
      const scaleY = instance.overrides?.scaleY ?? instance.overrides?.scale ?? 1;
      const rotationDeg = instance.overrides?.rotation ?? 0;
      if (rotationDeg !== 0) {
        // Excalibur rotation en radians (sens horaire)
        actor.rotation = (rotationDeg * Math.PI) / 180;
      }

      if (animComp) {
        const imgSrc = this.imageCache.get(animComp.spriteAssetUrl);
        const cfg =
          this.spriteSheetConfigs[animComp.spriteSheetConfigUrl ?? animComp.spriteAssetUrl];
        if (imgSrc && cfg) {
          const built = buildCharacterAnims(imgSrc, cfg);
          const facing = instance.facing ?? 'down';
          const anim = built.idleAnims?.[facing] ?? built.walkAnims?.[facing];
          if (anim) {
            anim.play();
            actor.graphics.use(anim);
            actor.graphics.flipHorizontal = built.dirFlipX[facing];
            if (scaleX !== 1 || scaleY !== 1) {
              actor.scale = ex.vec(scaleX, scaleY);
            }
          }
        }
      } else if (spriteComp) {
        const imgSrc = this.imageCache.get(spriteComp.spriteAssetUrl);
        if (imgSrc) {
          // destSize = source dimensions × scale (NOT tileSize) to preserve aspect ratio.
          // Forcing tileSize×tileSize was squishing non-square sprites (ex: 32×64 tree → 32×32).
          const sprite = new ex.Sprite({
            image: imgSrc,
            sourceView: {
              x: spriteComp.srcX,
              y: spriteComp.srcY,
              width: spriteComp.srcW,
              height: spriteComp.srcH,
            },
            destSize: { width: spriteComp.srcW * scaleX, height: spriteComp.srcH * scaleY },
          });
          actor.graphics.use(sprite);
        }
      } else {
        // Fallback: colored box so the object is visible even without a sprite
        actor.color = ex.Color.fromHex('#e87d0d');
      }

      // ── Wind effect (Stardew Valley style) ────────────────────────────────
      // Replaces the static spriteComp graphic with a procedural canvas that
      // draws the sprite in horizontal slices, each shifted by a sinusoidal
      // offset that increases linearly from 0 (bottom anchor) to full amplitude
      // at the top — simulating wind deformation without pre-baked animation frames.
      if (windComp && spriteComp) {
        const windImgSrc = this.imageCache.get(spriteComp.spriteAssetUrl);
        if (windImgSrc?.image) {
          const { amplitude, frequency } = windComp;
          // Per-instance phase offset so sibling trees don't sway in sync
          const phase = instance.overrides?.windPhaseOffset ?? windComp.phaseOffset ?? 0;
          // stiffness: exposant de la courbe d'influence verticale (shader-style)
          // 2 = tronc rigide (défaut), 3+ = seule la cime bouge
          const stiffness = windComp.stiffness ?? 2;
          const dW = spriteComp.srcW * scaleX;
          const dH = spriteComp.srcH * scaleY;
          // Horizontal padding prevents clipping at extreme sway positions
          const pad = Math.ceil(Math.abs(amplitude)) + 2;
          const canvasW = dW + pad * 2;
          // 20 slices = déformation nettement plus fluide que 10
          const SLICES = 20;

          const windGraphic = new ex.Canvas({
            width: canvasW,
            height: dH,
            cache: false, // re-draw each frame
            draw: (ctx) => {
              ctx.clearRect(0, 0, canvasW, dH);
              const t = Date.now() / 1000;
              const swayMax = amplitude * Math.sin(t * frequency * Math.PI * 2 + phase);

              for (let s = 0; s < SLICES; s++) {
                // tNorm: 0 au bas (ancré), 1 au sommet (balancement maximal)
                const tNorm = (SLICES - 1 - s) / (SLICES - 1);
                // Courbe d'influence configurable — équivalent shader: pow(uv.y, stiffness)
                const swayX = swayMax * Math.pow(tNorm, stiffness);

                // Approche clip : chaque tranche définit une zone de découpe.
                // On dessine le sprite ENTIER décalé horizontalement dans chaque tranche.
                // Le canvas API gère l'isolation pixel-perfect — aucun calcul de source,
                // aucun overlap, aucune déchirure possible.
                const clipY = Math.floor((s * dH) / SLICES);
                const clipH = Math.floor(((s + 1) * dH) / SLICES) - clipY;
                if (clipH <= 0) continue;

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, clipY, canvasW, clipH);
                ctx.clip();
                ctx.drawImage(
                  windImgSrc.image,
                  spriteComp.srcX,
                  spriteComp.srcY,
                  spriteComp.srcW,
                  spriteComp.srcH,
                  pad + swayX,
                  0,
                  dW,
                  dH
                );
                ctx.restore();
              }
            },
          });

          actor.graphics.use(windGraphic);
        }
      }

      // ── Ground shadow (Stardew Valley style) ──────────────────────────────
      // Flat semi-transparent ellipse drawn on the ground below the object.
      // z=1 keeps it above tile layers (z=0) but below all actors (z≥100).
      // cache:true → drawn once; patrol NPCs sync position in postupdate.

      let shadowActor: ex.Actor | null = null;
      let shadowOffsetY = 0;

      if (animComp || spriteComp) {
        let shadowDW = tileSize * scaleX;
        if (spriteComp) {
          shadowDW = spriteComp.srcW * scaleX;
        } else if (animComp) {
          const shadowCfg =
            this.spriteSheetConfigs[animComp.spriteSheetConfigUrl ?? animComp.spriteAssetUrl];
          if (shadowCfg) {
            shadowDW = shadowCfg.frameW * scaleX;
          }
        }
        // Ellipse dimensionnée sur la largeur du sprite (canopée / silhouette)
        const sRx = Math.max(10, shadowDW * 0.48);
        const sRy = Math.max(4, sRx * 0.28); // aplatie = ombre au sol crédible
        const sW = Math.ceil(sRx * 2 + 4);
        const sH = Math.ceil(sRy * 2 + 4);

        const shadowGraphic = new ex.Canvas({
          width: sW,
          height: sH,
          cache: true,
          draw: (ctx) => {
            ctx.clearRect(0, 0, sW, sH);
            ctx.save();
            // Dégradé radial : centre opaque → bord transparent (ombre douce)
            const grad = ctx.createRadialGradient(
              sW / 2,
              sH / 2,
              0,
              sW / 2,
              sH / 2,
              Math.max(sRx, sRy)
            );
            grad.addColorStop(0, 'rgba(10, 10, 20, 0.55)');
            grad.addColorStop(0.6, 'rgba(10, 10, 20, 0.30)');
            grad.addColorStop(1, 'rgba(10, 10, 20, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(sW / 2, sH / 2, sRx, sRy, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          },
        });

        // Position : base visuelle du sprite (indépendant de originYPct).
        // L'acteur est centré en py = cy*tileSize + anchorOffY.
        // Le bas visuel du sprite = py + objH/2.
        // → shadowOffsetY = objH/2 place l'ombre au sol sous le sprite.
        shadowOffsetY = objH / 2;
        shadowActor = new ex.Actor({
          pos: ex.vec(px, py + shadowOffsetY),
          z: 1,
          collisionType: ex.CollisionType.PreventCollision,
        });
        shadowActor.graphics.use(shadowGraphic);
        this.add(shadowActor);
      }

      // ── Y-sort ────────────────────────────────────────────────────────────

      actor.on('postupdate', () => {
        actor.z = 100 + actor.pos.y + tileSize / 2;
        if (isMovable && shadowActor) {
          shadowActor.pos.x = actor.pos.x;
          shadowActor.pos.y = actor.pos.y + shadowOffsetY;
        }
      });

      // ── Patrol ───────────────────────────────────────────────────────────

      if (patrolComp && patrolComp.loop) {
        const targetX = patrolComp.targetCx * tileSize + tileSize / 2;
        const targetY = patrolComp.targetCy * tileSize + tileSize / 2;
        const speed = patrolComp.speed || NPC_PATROL_SPEED;
        actor.actions.repeatForever((ctx) => {
          ctx.moveTo(targetX, targetY, speed);
          ctx.moveTo(px, py, speed);
        });
      }

      // ── Dialogue ─────────────────────────────────────────────────────────

      if (dialogueComp?.sceneId) {
        const sceneId = instance.overrides?.dialogueText ? '' : dialogueComp.sceneId;
        if (sceneId) {
          actor.on('collisionstart', (evt) => {
            if (evt.other.owner === this.player) this.bridge.triggerDialogue(sceneId);
          });
        }
      }

      // ── Portal ───────────────────────────────────────────────────────────

      if (portalComp?.targetMapId) {
        const { targetMapId, targetCx, targetCy, interactionMode } = portalComp;
        const targetPos = { x: targetCx * tileSize, y: targetCy * tileSize };
        if (interactionMode === 'auto') {
          actor.on('collisionstart', (evt) => {
            if (evt.other.owner === this.player) this.bridge.triggerMapExit(targetMapId, targetPos);
          });
        }
        // 'interact' mode handled by E-key via npcActors list — add to list for future support
      }

      this.add(actor);
    }
  }
}
