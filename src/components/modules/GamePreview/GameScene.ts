/**
 * GameScene — Scène Excalibur topdown (hors React)
 *
 * Construit la scène depuis MapData :
 * - TileMap avec couche décor (images réelles ou damier fallback) + collision solide
 * - Player actor : spritesheet LPC animé ou carré violet (fallback)
 * - Trigger zones : acteurs passifs détectant la collision avec le joueur
 *
 * Sprites joueur (format LPC standard) :
 *   4 rangées × 9 colonnes, 64×64px par frame
 *   Rangée 0 = marche bas, 1 = gauche, 2 = droite, 3 = haut
 *
 * @module components/modules/GamePreview/GameScene
 */

import * as ex from 'excalibur';
import type { MapData, TileInstance } from '@/types/map';
import type { DialogueBridge } from './DialogueBridge';

const COLORS = {
  floor:     ex.Color.fromHex('#2a2a3e'),
  floorAlt:  ex.Color.fromHex('#252538'),
  collision: ex.Color.fromHex('#5a1a1a'),
  trigger:   ex.Color.fromRGB(60, 220, 100, 0.7),
  exit:      ex.Color.fromRGB(100, 160, 255, 0.7),
  player:    ex.Color.fromHex('#7c3aed'),
};

const PLAYER_SPEED  = 150;
const LPC_COLS      = 9;
const LPC_FRAME_SIZE = 64;

export class TopdownScene extends ex.Scene {
  private mapData: MapData;
  private bridge: DialogueBridge;
  private player!: ex.Actor;
  private playerSpritePath?: string;
  private imageCache: Map<string, ex.ImageSource>;
  private walkAnims: Record<'down' | 'left' | 'right' | 'up', ex.Animation> | null = null;
  private lastDir: 'down' | 'left' | 'right' | 'up' = 'down';

  constructor(
    mapData: MapData,
    bridge: DialogueBridge,
    playerSpritePath?: string,
    imageCache?: Map<string, ex.ImageSource>,
  ) {
    super();
    this.mapData = mapData;
    this.bridge = bridge;
    this.playerSpritePath = playerSpritePath;
    this.imageCache = imageCache ?? new Map();
  }

  onInitialize(engine: ex.Engine): void {
    this.buildTileMap();
    this.buildTriggerZones();
    this.buildExitZones();
    this.addPlayer(engine);
    this.applyPlayerSprite();
  }

  private buildTileMap(): void {
    const { __gridSize: tileSize, pxWid, pxHei } = this.mapData;
    if (!tileSize) return;

    const columns = Math.floor(pxWid / tileSize);
    const rows    = Math.floor(pxHei / tileSize);

    const tilemap = new ex.TileMap({ pos: ex.vec(0, 0), tileWidth: tileSize, tileHeight: tileSize, rows, columns });

    const collisionLayer = this.mapData.layerInstances.find(l => l.__type === 'collision');
    const collisionSet   = new Set<number>(collisionLayer?.intGrid ?? []);

    const tilesLayer  = this.mapData.layerInstances.find(l => l.__type === 'tiles');
    const tileInstMap = new Map<string, TileInstance>();
    for (const ti of tilesLayer?.gridTiles ?? []) tileInstMap.set(`${ti.cx},${ti.cy}`, ti);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tile = tilemap.getTile(col, row);
        if (!tile) continue;

        if (collisionSet.has(row * columns + col)) {
          tile.solid = true;
          tile.addGraphic(new ex.Rectangle({ width: tileSize, height: tileSize, color: COLORS.collision }));
          continue;
        }

        const tileInst = tileInstMap.get(`${col},${row}`);
        const imgSrc   = tileInst ? this.imageCache.get(tileInst.src) : undefined;

        if (imgSrc) {
          const sprite = imgSrc.toSprite();
          sprite.scale = ex.vec(tileSize / (imgSrc.width || tileSize), tileSize / (imgSrc.height || tileSize));
          tile.addGraphic(sprite);
        } else {
          const isAlt = (row + col) % 2 === 0;
          tile.addGraphic(new ex.Rectangle({ width: tileSize, height: tileSize, color: isAlt ? COLORS.floor : COLORS.floorAlt }));
        }
      }
    }

    this.add(tilemap);
  }

  private buildTriggerZones(): void {
    for (const zone of this.mapData._ac_dialogue_triggers) {
      const actor = new ex.Actor({
        name: `trigger-${zone.id}`,
        pos: ex.vec(zone.zone.x + zone.zone.width / 2, zone.zone.y + zone.zone.height / 2),
        width: zone.zone.width, height: zone.zone.height,
        collisionType: ex.CollisionType.Passive, color: COLORS.trigger, opacity: 0.5,
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
        collisionType: ex.CollisionType.Passive, color: COLORS.exit, opacity: 0.5,
      });
      const targetMapId = zone.targetMapId;
      actor.on('collisionstart', (evt) => { if (evt.other.owner === this.player) this.bridge.triggerMapExit(targetMapId); });
      this.add(actor);
    }
  }

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
        const anim = this.walkAnims[this.lastDir];
        if (vx !== 0 || vy !== 0) { this.player.graphics.use(anim); }
        else { anim.pause(); }
      }
    });

    this.add(this.player);
    this.camera.strategy.elasticToActor(this.player, 0.15, 0.1);
    this.camera.zoom = 1.5;
  }

  private applyPlayerSprite(): void {
    if (!this.playerSpritePath) return;
    const imgSrc = this.imageCache.get(this.playerSpritePath);
    if (!imgSrc) return;

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

    this.player.graphics.add('walkDown',  this.walkAnims.down);
    this.player.graphics.add('walkLeft',  this.walkAnims.left);
    this.player.graphics.add('walkRight', this.walkAnims.right);
    this.player.graphics.add('walkUp',    this.walkAnims.up);
    this.player.graphics.use(this.walkAnims.down);
    this.player.color = ex.Color.Transparent;
  }
}
