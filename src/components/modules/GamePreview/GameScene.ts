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
import type { MapData, TileInstance } from '@/types/map';
import type { SpriteSheetConfig, AnimationRange, EntityInstance } from '@/types/sprite';
import type { DialogueBridge } from './DialogueBridge';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  floor:    ex.Color.fromHex('#2a2a3e'),
  floorAlt: ex.Color.fromHex('#252538'),
  player:   ex.Color.fromHex('#7c3aed'),
  npc:      ex.Color.fromHex('#e87d0d'),
};

const PLAYER_SPEED     = 150;
const NPC_PATROL_SPEED = 60;
const LPC_COLS         = 9;
const LPC_FRAME_SIZE   = 64;

// ============================================================================
// MODULE-LEVEL HELPERS (shared by player and NPCs)
// ============================================================================

/** Construit une Animation depuis une AnimationRange ou des frames fallback. */
function makeAnim(
  sheet: ex.SpriteSheet,
  range: AnimationRange | undefined,
  fallbackStart: number,
  fallbackEnd: number,
): ex.Animation {
  if (range) {
    const ms = Math.round(1000 / Math.max(1, range.fps));
    return ex.Animation.fromSpriteSheet(sheet, ex.range(range.startFrame, range.endFrame), ms);
  }
  return ex.Animation.fromSpriteSheet(sheet, ex.range(fallbackStart, fallbackEnd), 100);
}

/** Anim idle : 1 frame figée sur le premier frame walk si aucune idle configurée. */
function makeIdleAnim(
  sheet: ex.SpriteSheet,
  idleRange: AnimationRange | undefined,
  walkFirstFrame: number,
): ex.Animation {
  if (idleRange) {
    const ms = Math.round(1000 / Math.max(1, idleRange.fps));
    return ex.Animation.fromSpriteSheet(sheet, ex.range(idleRange.startFrame, idleRange.endFrame), ms);
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
  cfg: SpriteSheetConfig,
): { walkAnims: DirAnims; idleAnims: DirAnims; dirFlipX: DirFlipX } {
  const sheet = ex.SpriteSheet.fromImageSource({
    image: imgSrc,
    grid: { rows: cfg.rows, columns: cfg.cols, spriteWidth: cfg.frameW, spriteHeight: cfg.frameH },
  });
  const a = cfg.animations;
  const c = cfg.cols;

  const walkAnims: DirAnims = {
    down:  makeAnim(sheet, a['walk_down'],  0 * c, 1 * c - 1),
    left:  makeAnim(sheet, a['walk_left'],  1 * c, 2 * c - 1),
    right: makeAnim(sheet, a['walk_right'], 2 * c, 3 * c - 1),
    up:    makeAnim(sheet, a['walk_up'],    3 * c, 4 * c - 1),
  };

  const idleAnims: DirAnims = {
    down:  makeIdleAnim(sheet, a['idle_down'],  a['walk_down']?.startFrame  ?? 0 * c),
    left:  makeIdleAnim(sheet, a['idle_left'],  a['walk_left']?.startFrame  ?? 1 * c),
    right: makeIdleAnim(sheet, a['idle_right'], a['walk_right']?.startFrame ?? 2 * c),
    up:    makeIdleAnim(sheet, a['idle_up'],    a['walk_up']?.startFrame    ?? 3 * c),
  };

  const dirFlipX: DirFlipX = {
    down:  a['walk_down']?.flipX  ?? false,
    left:  a['walk_left']?.flipX  ?? false,
    right: a['walk_right']?.flipX ?? false,
    up:    a['walk_up']?.flipX    ?? false,
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
  private imageCache: Map<string, ex.ImageSource>;

  // Player animation state
  private walkAnims: DirAnims | null = null;
  private idleAnims: DirAnims | null = null;
  private dirFlipX: DirFlipX = { down: false, left: false, right: false, up: false };
  private lastDir: 'down' | 'left' | 'right' | 'up' = 'down';

  constructor(
    mapData: MapData,
    bridge: DialogueBridge,
    playerSpritePath?: string,
    imageCache?: Map<string, ex.ImageSource>,
    playerSpriteConfig?: SpriteSheetConfig,
    spriteSheetConfigs?: Record<string, SpriteSheetConfig>,
  ) {
    super();
    this.mapData             = mapData;
    this.bridge              = bridge;
    this.playerSpritePath    = playerSpritePath;
    this.playerSpriteConfig  = playerSpriteConfig;
    this.imageCache          = imageCache ?? new Map();
    this.spriteSheetConfigs  = spriteSheetConfigs ?? {};
  }

  onInitialize(engine: ex.Engine): void {
    this.buildTileMap();
    this.buildTriggerZones();
    this.buildExitZones();
    this.addPlayer(engine);
    this.applyPlayerSprite();
    this.buildEntities();
  }

  // ── TileMap ────────────────────────────────────────────────────────────────

  private buildTileMap(): void {
    const { __gridSize: tileSize, pxWid, pxHei } = this.mapData;
    if (!tileSize) return;

    const columns = Math.floor(pxWid / tileSize);
    const rows    = Math.floor(pxHei / tileSize);

    const tilemap = new ex.TileMap({ pos: ex.vec(0, 0), tileWidth: tileSize, tileHeight: tileSize, rows, columns });

    // ── Pass 1 : collision (gameplay only, no visual) ──────────────────────
    const collisionLayer = this.mapData.layerInstances.find(l => l.__type === 'collision');
    for (const cellIdx of collisionLayer?.intGrid ?? []) {
      const tile = tilemap.getTile(cellIdx % columns, Math.floor(cellIdx / columns));
      if (tile) tile.solid = true;
    }

    // ── Pass 2 : visuals (tiles layer → fallback checkerboard) ─────────────
    // Stack-per-cell map preserves stackMode layering (floor under transparent tiles).
    const tilesLayer   = this.mapData.layerInstances.find(l => l.__type === 'tiles');
    const tileStackMap = new Map<string, TileInstance[]>();
    for (const ti of tilesLayer?.gridTiles ?? []) {
      const key   = `${ti.cx},${ti.cy}`;
      const stack = tileStackMap.get(key);
      if (stack) stack.push(ti);
      else tileStackMap.set(key, [ti]);
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tile = tilemap.getTile(col, row);
        if (!tile) continue;

        // Floor base first — transparent tile pixels composite over this, not the WebGL clear color.
        const isAlt = (row + col) % 2 === 0;
        tile.addGraphic(new ex.Rectangle({ width: tileSize, height: tileSize, color: isAlt ? COLORS.floor : COLORS.floorAlt }));

        for (const tileInst of tileStackMap.get(`${col},${row}`) ?? []) {
          const imgSrc = this.imageCache.get(tileInst.src);
          if (!imgSrc) continue;

          let sprite: ex.Sprite;
          if (tileInst.tileW && tileInst.tileW > 0) {
            sprite = new ex.Sprite({
              image: imgSrc,
              sourceView: { x: tileInst.tileX ?? 0, y: tileInst.tileY ?? 0, width: tileInst.tileW, height: tileInst.tileH ?? tileInst.tileW },
              destSize: { width: tileSize, height: tileSize },
            });
          } else {
            sprite = imgSrc.toSprite();
            sprite.scale = ex.vec(tileSize / (imgSrc.width || tileSize), tileSize / (imgSrc.height || tileSize));
          }
          sprite.flipHorizontal = (tileInst.f & 1) !== 0;
          sprite.flipVertical   = (tileInst.f & 2) !== 0;
          tile.addGraphic(sprite);
        }
      }
    }

    this.add(tilemap);
  }

  // ── Trigger / exit zones ───────────────────────────────────────────────────

  private buildTriggerZones(): void {
    for (const zone of this.mapData._ac_dialogue_triggers) {
      const actor = new ex.Actor({
        name: `trigger-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width, height: zone.zone.height,
        collisionType: ex.CollisionType.Passive, color: ex.Color.Transparent,
      });
      const sceneId = zone.dialogueSceneId;
      actor.on('collisionstart', (evt) => { if (evt.other.owner === this.player) this.bridge.triggerDialogue(sceneId); });
      this.add(actor);
    }
  }

  private buildExitZones(): void {
    for (const zone of this.mapData._ac_scene_exits) {
      const actor = new ex.Actor({
        name: `exit-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width, height: zone.zone.height,
        collisionType: ex.CollisionType.Passive, color: ex.Color.Transparent,
      });
      const targetMapId = zone.targetMapId;
      actor.on('collisionstart', (evt) => { if (evt.other.owner === this.player) this.bridge.triggerMapExit(targetMapId); });
      this.add(actor);
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  private addPlayer(engine: ex.Engine): void {
    const tileSize = this.mapData.__gridSize || 32;

    this.player = new ex.Actor({
      name: 'Player',
      pos: ex.vec(tileSize * 2, tileSize * 2),
      width:  Math.max(16, tileSize - 4),
      height: Math.max(16, tileSize - 4),
      color: COLORS.player,
      collisionType: ex.CollisionType.Active,
      z: 10,
    });

    this.player.on('postupdate', () => {
      const kb = engine.input.keyboard;
      let vx = 0, vy = 0;

      if (kb.isHeld(ex.Keys.W) || kb.isHeld(ex.Keys.Up))    vy = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.S) || kb.isHeld(ex.Keys.Down))  vy =  PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.A) || kb.isHeld(ex.Keys.Left))  vx = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.D) || kb.isHeld(ex.Keys.Right)) vx =  PLAYER_SPEED;

      if (vx !== 0 && vy !== 0) { const f = 1 / Math.SQRT2; vx *= f; vy *= f; }
      this.player.vel = ex.vec(vx, vy);

      if      (vy > 0)  this.lastDir = 'down';
      else if (vy < 0)  this.lastDir = 'up';
      else if (vx < 0)  this.lastDir = 'left';
      else if (vx > 0)  this.lastDir = 'right';

      if (this.walkAnims) {
        const moving = vx !== 0 || vy !== 0;
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
    this.camera.strategy.limitCameraBounds(new ex.BoundingBox({
      left: 0, top: 0,
      right: this.mapData.pxWid, bottom: this.mapData.pxHei,
    }));
    this.camera.zoom = 1.5;
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
      this.dirFlipX  = dirFlipX;
    } else {
      // Fallback LPC hardcodé (4 rangées × 9 colonnes, 64×64px)
      const sheet = ex.SpriteSheet.fromImageSource({
        image: imgSrc,
        grid: { rows: 4, columns: LPC_COLS, spriteWidth: LPC_FRAME_SIZE, spriteHeight: LPC_FRAME_SIZE },
      });
      this.walkAnims = {
        down:  ex.Animation.fromSpriteSheet(sheet, ex.range(0,  8),  100),
        left:  ex.Animation.fromSpriteSheet(sheet, ex.range(9,  17), 100),
        right: ex.Animation.fromSpriteSheet(sheet, ex.range(18, 26), 100),
        up:    ex.Animation.fromSpriteSheet(sheet, ex.range(27, 35), 100),
      };
      // No idle in LPC fallback — freeze on first walk frame
      this.idleAnims = {
        down:  ex.Animation.fromSpriteSheet(sheet, [0],  1000),
        left:  ex.Animation.fromSpriteSheet(sheet, [9],  1000),
        right: ex.Animation.fromSpriteSheet(sheet, [18], 1000),
        up:    ex.Animation.fromSpriteSheet(sheet, [27], 1000),
      };
      this.dirFlipX = { down: false, left: false, right: false, up: false };
    }

    this.player.graphics.add('walkDown',  this.walkAnims.down);
    this.player.graphics.add('walkLeft',  this.walkAnims.left);
    this.player.graphics.add('walkRight', this.walkAnims.right);
    this.player.graphics.add('walkUp',    this.walkAnims.up);
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
        width:  Math.max(16, tileSize - 4),
        height: Math.max(16, tileSize - 4),
        color: COLORS.npc,
        // Passive: detectable via collisionstart but non-blocking (avoids NPC getting stuck on walls)
        collisionType: ex.CollisionType.Passive,
        z: 5,
      });

      // Build animations if spritesheet config is available
      const imgSrc = this.imageCache.get(entity.spriteAssetUrl);
      const cfg    = this.spriteSheetConfigs[entity.spriteAssetUrl];

      let npcWalkAnims: DirAnims | null = null;
      let npcIdleAnims: DirAnims | null = null;
      let npcFlipX: DirFlipX = { down: false, left: false, right: false, up: false };

      if (imgSrc && cfg) {
        const built = buildCharacterAnims(imgSrc, cfg);
        npcWalkAnims = built.walkAnims;
        npcIdleAnims = built.idleAnims;
        npcFlipX     = built.dirFlipX;
        npc.color    = ex.Color.Transparent;
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

      // ── Behaviors ───────────────────────────────────────────────────────────

      if (entity.behavior === 'patrol'
          && entity.patrolTargetCx !== undefined
          && entity.patrolTargetCy !== undefined) {
        const targetX = entity.patrolTargetCx * tileSize + tileSize / 2;
        const targetY = entity.patrolTargetCy * tileSize + tileSize / 2;

        // Patrol: loop back and forth between spawn and target
        npc.actions.repeatForever(ctx => {
          ctx.moveTo(targetX, targetY, NPC_PATROL_SPEED);
          ctx.moveTo(px, py, NPC_PATROL_SPEED);
        });

        // Update walk animation direction each frame during patrol
        if (npcWalkAnims) {
          npc.on('postupdate', () => {
            if (npc.vel.x === 0 && npc.vel.y === 0) return;
            const dir  = velToDir(npc.vel);
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

      this.add(npc);
    }
  }
}
