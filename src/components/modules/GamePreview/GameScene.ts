/**
 * GameScene — Scène Excalibur topdown (hors React)
 *
 * Construit la scène depuis MapData :
 * - TileMap avec couche décor (cases colorées) et couche collision (solide)
 * - Player actor : carré bleu, WASD/flèches, caméra centrée
 * - Trigger zones : acteurs passifs qui détectent la collision avec le joueur
 *
 * Design : LDtk plugin ignoré — construction manuelle depuis MapData.
 * Les sprites seront ajoutés en Sprint 6 (polish).
 *
 * @module components/modules/GamePreview/GameScene
 */

import * as ex from 'excalibur';
import type { MapData } from '@/types/map';
import type { DialogueBridge } from './DialogueBridge';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  floor: ex.Color.fromHex('#2a2a3e'),
  floorAlt: ex.Color.fromHex('#252538'),
  collision: ex.Color.fromHex('#5a1a1a'),
  trigger: ex.Color.fromRGB(60, 220, 100, 0.7),
  exit: ex.Color.fromRGB(100, 160, 255, 0.7),
  player: ex.Color.fromHex('#7c3aed'),
  playerOutline: ex.Color.fromHex('#a78bfa'),
};

const PLAYER_SPEED = 150; // px/s

// ============================================================================
// TOPDOWN SCENE
// ============================================================================

export class TopdownScene extends ex.Scene {
  private mapData: MapData;
  private bridge: DialogueBridge;
  private player!: ex.Actor;

  constructor(mapData: MapData, bridge: DialogueBridge) {
    super();
    this.mapData = mapData;
    this.bridge = bridge;
  }

  onInitialize(engine: ex.Engine): void {
    this.buildTileMap();
    this.buildTriggerZones();
    this.buildExitZones();
    this.addPlayer(engine);
  }

  // ── TileMap (décor + collision) ──────────────────────────────────────────

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

    // Collect collision cells set
    const collisionLayer = this.mapData.layerInstances.find(l => l.__type === 'collision');
    const collisionSet = new Set<number>(collisionLayer?.intGrid ?? []);

    // Fill tiles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tile = tilemap.getTile(col, row);
        if (!tile) continue;

        const idx = row * columns + col;
        const isCollision = collisionSet.has(idx);

        if (isCollision) {
          tile.solid = true;
          tile.addGraphic(new ex.Rectangle({
            width: tileSize,
            height: tileSize,
            color: COLORS.collision,
          }));
        } else {
          // Checkerboard floor pattern
          const isAlt = (row + col) % 2 === 0;
          tile.addGraphic(new ex.Rectangle({
            width: tileSize,
            height: tileSize,
            color: isAlt ? COLORS.floor : COLORS.floorAlt,
          }));
        }
      }
    }

    // If we have tile images, overlay them
    const tilesLayer = this.mapData.layerInstances.find(l => l.__type === 'tiles');
    if (tilesLayer?.gridTiles.length) {
      for (const tileInst of tilesLayer.gridTiles) {
        const tile = tilemap.getTile(tileInst.cx, tileInst.cy);
        if (!tile) continue;
        // TODO Sprint 6 : charger le sprite depuis tileInst.src
        // Pour Sprint 3, on garde le fond coloré
      }
    }

    this.add(tilemap);
  }

  // ── Trigger zones (dialogue) ─────────────────────────────────────────────

  private buildTriggerZones(): void {
    for (const zone of this.mapData._ac_dialogue_triggers) {
      const actor = new ex.Actor({
        name: `trigger-${zone.id}`,
        pos: ex.vec(
          zone.zone.x + zone.zone.width / 2,
          zone.zone.y + zone.zone.height / 2
        ),
        width: zone.zone.width,
        height: zone.zone.height,
        collisionType: ex.CollisionType.Passive,
        color: COLORS.trigger,
        opacity: 0.5,
      });

      const sceneId = zone.dialogueSceneId;
      actor.on('collisionstart', (evt) => {
        if (evt.other.owner === this.player) {
          this.bridge.triggerDialogue(sceneId);
        }
      });

      this.add(actor);
    }
  }

  // ── Exit zones (map transitions) ─────────────────────────────────────────

  private buildExitZones(): void {
    for (const zone of this.mapData._ac_scene_exits) {
      const actor = new ex.Actor({
        name: `exit-${zone.id}`,
        pos: ex.vec(
          zone.zone.x + zone.zone.width / 2,
          zone.zone.y + zone.zone.height / 2
        ),
        width: zone.zone.width,
        height: zone.zone.height,
        collisionType: ex.CollisionType.Passive,
        color: COLORS.exit,
        opacity: 0.5,
      });

      const targetMapId = zone.targetMapId;
      actor.on('collisionstart', (evt) => {
        if (evt.other.owner === this.player) {
          this.bridge.triggerMapExit(targetMapId);
        }
      });

      this.add(actor);
    }
  }

  // ── Player ────────────────────────────────────────────────────────────────

  private addPlayer(engine: ex.Engine): void {
    const tileSize = this.mapData.__gridSize || 32;
    const startX = tileSize * 2;
    const startY = tileSize * 2;

    this.player = new ex.Actor({
      name: 'Player',
      pos: ex.vec(startX, startY),
      width: Math.max(16, tileSize - 4),
      height: Math.max(16, tileSize - 4),
      color: COLORS.player,
      collisionType: ex.CollisionType.Active,
      z: 10,
    });

    // WASD + arrow keys movement via postupdate
    this.player.on('postupdate', () => {
      const kb = engine.input.keyboard;
      let vx = 0;
      let vy = 0;

      if (kb.isHeld(ex.Keys.W) || kb.isHeld(ex.Keys.Up))    vy = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.S) || kb.isHeld(ex.Keys.Down))  vy =  PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.A) || kb.isHeld(ex.Keys.Left))  vx = -PLAYER_SPEED;
      if (kb.isHeld(ex.Keys.D) || kb.isHeld(ex.Keys.Right)) vx =  PLAYER_SPEED;

      // Normalize diagonal movement
      if (vx !== 0 && vy !== 0) {
        const factor = 1 / Math.SQRT2;
        vx *= factor;
        vy *= factor;
      }

      this.player.vel = ex.vec(vx, vy);
    });

    this.add(this.player);

    // Camera follows player with elasticity
    this.camera.strategy.elasticToActor(this.player, 0.15, 0.1);
    this.camera.zoom = 1.5;
  }
}
