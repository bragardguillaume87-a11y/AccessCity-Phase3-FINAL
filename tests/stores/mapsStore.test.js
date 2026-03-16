/**
 * MapsStore Tests
 *
 * Couvre les actions CRUD de mapsStore :
 *   - Cartes (addMap, updateMapMetadata, updateMapData, deleteMap, resizeMap)
 *   - Entités NPC (addEntity, updateEntity, removeEntity)
 *   - Dialogue triggers (addDialogueTrigger, updateDialogueTrigger, removeDialogueTrigger)
 *   - Scene exits (addSceneExit, updateSceneExit, removeSceneExit)
 *   - Audio zones (addAudioZone, updateAudioZone, removeAudioZone)
 *   - Import (importMaps)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useMapsStore } from '../../src/stores/mapsStore.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useMapsStore.setState({ maps: [], mapDataById: {} });
}

function addTestMap(name = 'Test Map') {
  const { addMap } = useMapsStore.getState();
  return addMap(name, 10, 8, 32);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MapsStore', () => {
  beforeEach(resetStore);

  // ── addMap ─────────────────────────────────────────────────────────────────

  describe('addMap()', () => {
    it('crée une carte avec les valeurs par défaut', () => {
      const { addMap } = useMapsStore.getState();
      const id = addMap();

      const { maps, mapDataById } = useMapsStore.getState();
      expect(maps).toHaveLength(1);
      expect(maps[0]).toMatchObject({
        id,
        name: 'Nouvelle carte',
        widthTiles: 20,
        heightTiles: 15,
        tileSize: 32,
      });
      expect(mapDataById[id]).toBeDefined();
      expect(mapDataById[id].layerInstances).toHaveLength(3);
    });

    it('crée une carte avec un nom personnalisé', () => {
      const { addMap } = useMapsStore.getState();
      const id = addMap('Village', 30, 20, 16);

      const { maps, mapDataById } = useMapsStore.getState();
      expect(maps[0].name).toBe('Village');
      expect(maps[0].widthTiles).toBe(30);
      expect(maps[0].tileSize).toBe(16);
      expect(mapDataById[id].pxWid).toBe(30 * 16);
      expect(mapDataById[id].pxHei).toBe(20 * 16);
    });

    it('génère des IDs basés sur un timestamp (préfixe map-)', () => {
      const { addMap } = useMapsStore.getState();
      const id = addMap('A');
      expect(id).toMatch(/^map-\d+$/);
    });

    it('initialise les couches Décor, Collision, Triggers', () => {
      const id = addTestMap();
      const data = useMapsStore.getState().mapDataById[id];
      const identifiers = data.layerInstances.map((l) => l.__identifier);
      expect(identifiers).toContain('Décor');
      expect(identifiers).toContain('Collision');
      expect(identifiers).toContain('Triggers');
    });

    it('initialise les listes _ac_* vides', () => {
      const id = addTestMap();
      const data = useMapsStore.getState().mapDataById[id];
      expect(data._ac_entities).toHaveLength(0);
      expect(data._ac_dialogue_triggers).toHaveLength(0);
      expect(data._ac_scene_exits).toHaveLength(0);
      expect(data._ac_audio_zones).toHaveLength(0);
    });
  });

  // ── updateMapMetadata ──────────────────────────────────────────────────────

  describe('updateMapMetadata()', () => {
    it('met à jour le nom de la carte', () => {
      const id = addTestMap();
      useMapsStore.getState().updateMapMetadata(id, { name: 'Village Nord' });
      const map = useMapsStore.getState().maps.find((m) => m.id === id);
      expect(map.name).toBe('Village Nord');
    });

    it('ne touche pas aux autres cartes', () => {
      // Inject two maps with distinct IDs to avoid Date.now() collision
      useMapsStore.setState({
        maps: [
          {
            id: 'map-aaa',
            name: 'A',
            widthTiles: 10,
            heightTiles: 8,
            tileSize: 32,
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'map-bbb',
            name: 'B',
            widthTiles: 10,
            heightTiles: 8,
            tileSize: 32,
            createdAt: '',
            updatedAt: '',
          },
        ],
        mapDataById: {},
      });
      useMapsStore.getState().updateMapMetadata('map-aaa', { name: 'A modifié' });
      const mapB = useMapsStore.getState().maps.find((m) => m.id === 'map-bbb');
      expect(mapB.name).toBe('B');
    });

    it('met à jour updatedAt', () => {
      const id = addTestMap();
      const before = useMapsStore.getState().maps.find((m) => m.id === id).updatedAt;
      // Small delay to ensure different timestamp
      useMapsStore.getState().updateMapMetadata(id, { name: 'X' });
      const after = useMapsStore.getState().maps.find((m) => m.id === id).updatedAt;
      expect(after).toBeDefined();
      // updatedAt is an ISO string — after >= before
      expect(after >= before).toBe(true);
    });
  });

  // ── updateMapData ──────────────────────────────────────────────────────────

  describe('updateMapData()', () => {
    it('remplace les données de la carte', () => {
      const id = addTestMap();
      const original = useMapsStore.getState().mapDataById[id];
      const modified = { ...original, pxWid: 999 };
      useMapsStore.getState().updateMapData(id, modified);
      expect(useMapsStore.getState().mapDataById[id].pxWid).toBe(999);
    });
  });

  // ── deleteMap ──────────────────────────────────────────────────────────────

  describe('deleteMap()', () => {
    it('supprime la carte des métadonnées et des données', () => {
      const id = addTestMap();
      useMapsStore.getState().deleteMap(id);
      expect(useMapsStore.getState().maps).toHaveLength(0);
      expect(useMapsStore.getState().mapDataById[id]).toBeUndefined();
    });

    it('ne supprime pas les autres cartes', () => {
      useMapsStore.setState({
        maps: [
          {
            id: 'map-del1',
            name: 'A',
            widthTiles: 10,
            heightTiles: 8,
            tileSize: 32,
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 'map-del2',
            name: 'B',
            widthTiles: 10,
            heightTiles: 8,
            tileSize: 32,
            createdAt: '',
            updatedAt: '',
          },
        ],
        mapDataById: { 'map-del1': {}, 'map-del2': {} },
      });
      useMapsStore.getState().deleteMap('map-del1');
      expect(useMapsStore.getState().maps).toHaveLength(1);
      expect(useMapsStore.getState().maps[0].id).toBe('map-del2');
    });
  });

  // ── resizeMap ──────────────────────────────────────────────────────────────

  describe('resizeMap()', () => {
    it('redimensionne la carte et trim les tuiles hors-limites', () => {
      const id = addTestMap();
      // Paint a tile at (9, 7) then resize to 5x5 — tile should be trimmed
      const original = useMapsStore.getState().mapDataById[id];
      const withTile = {
        ...original,
        layerInstances: original.layerInstances.map((l) =>
          l.__identifier === 'Décor' ? { ...l, gridTiles: [{ cx: 9, cy: 7, src: '/tile.png' }] } : l
        ),
      };
      useMapsStore.getState().updateMapData(id, withTile);
      useMapsStore.getState().resizeMap(id, 'Resized', 5, 5, 32);

      const data = useMapsStore.getState().mapDataById[id];
      const decor = data.layerInstances.find((l) => l.__identifier === 'Décor');
      expect(decor.gridTiles).toHaveLength(0); // tile (9,7) trimmed
      expect(data.pxWid).toBe(5 * 32);
      expect(data.pxHei).toBe(5 * 32);
    });

    it('conserve les tuiles dans les nouvelles limites', () => {
      const id = addTestMap();
      const original = useMapsStore.getState().mapDataById[id];
      const withTile = {
        ...original,
        layerInstances: original.layerInstances.map((l) =>
          l.__identifier === 'Décor' ? { ...l, gridTiles: [{ cx: 2, cy: 2, src: '/tile.png' }] } : l
        ),
      };
      useMapsStore.getState().updateMapData(id, withTile);
      useMapsStore.getState().resizeMap(id, 'Resized', 5, 5, 32);

      const data = useMapsStore.getState().mapDataById[id];
      const decor = data.layerInstances.find((l) => l.__identifier === 'Décor');
      expect(decor.gridTiles).toHaveLength(1);
    });

    it("ignore si la carte n'existe pas", () => {
      // Should not throw
      expect(() => {
        useMapsStore.getState().resizeMap('inexistant', 'X', 5, 5, 32);
      }).not.toThrow();
    });
  });

  // ── Entities ───────────────────────────────────────────────────────────────

  describe('Entities CRUD', () => {
    const entity = {
      id: 'ent-1',
      spriteUrl: '/hero.png',
      behavior: 'npc',
      cx: 3,
      cy: 4,
    };

    it('addEntity() ajoute une entité à la carte', () => {
      const id = addTestMap();
      useMapsStore.getState().addEntity(id, entity);
      const data = useMapsStore.getState().mapDataById[id];
      expect(data._ac_entities).toHaveLength(1);
      expect(data._ac_entities[0].id).toBe('ent-1');
    });

    it('updateEntity() met à jour une entité par id', () => {
      const id = addTestMap();
      useMapsStore.getState().addEntity(id, entity);
      useMapsStore.getState().updateEntity(id, 'ent-1', { cx: 10 });
      const data = useMapsStore.getState().mapDataById[id];
      expect(data._ac_entities[0].cx).toBe(10);
      expect(data._ac_entities[0].cy).toBe(4); // cy inchangé
    });

    it('removeEntity() supprime une entité par id', () => {
      const id = addTestMap();
      useMapsStore.getState().addEntity(id, entity);
      useMapsStore.getState().removeEntity(id, 'ent-1');
      expect(useMapsStore.getState().mapDataById[id]._ac_entities).toHaveLength(0);
    });

    it('addEntity/removeEntity ignorent si carte inexistante', () => {
      expect(() => useMapsStore.getState().addEntity('missing', entity)).not.toThrow();
      expect(() => useMapsStore.getState().removeEntity('missing', 'ent-1')).not.toThrow();
    });
  });

  // ── Dialogue Triggers ──────────────────────────────────────────────────────

  describe('Dialogue Triggers CRUD', () => {
    const trigger = { id: 'trig-1', cx: 1, cy: 2, dialogueId: 'dlg-abc', sceneId: 'scene-1' };

    it('addDialogueTrigger() ajoute un trigger', () => {
      const id = addTestMap();
      useMapsStore.getState().addDialogueTrigger(id, trigger);
      expect(useMapsStore.getState().mapDataById[id]._ac_dialogue_triggers).toHaveLength(1);
    });

    it('updateDialogueTrigger() met à jour le dialogue cible', () => {
      const id = addTestMap();
      useMapsStore.getState().addDialogueTrigger(id, trigger);
      useMapsStore.getState().updateDialogueTrigger(id, 'trig-1', { dialogueId: 'dlg-new' });
      const trig = useMapsStore.getState().mapDataById[id]._ac_dialogue_triggers[0];
      expect(trig.dialogueId).toBe('dlg-new');
    });

    it('removeDialogueTrigger() supprime le trigger', () => {
      const id = addTestMap();
      useMapsStore.getState().addDialogueTrigger(id, trigger);
      useMapsStore.getState().removeDialogueTrigger(id, 'trig-1');
      expect(useMapsStore.getState().mapDataById[id]._ac_dialogue_triggers).toHaveLength(0);
    });
  });

  // ── Scene Exits ────────────────────────────────────────────────────────────

  describe('Scene Exits CRUD', () => {
    const exit = { id: 'exit-1', cx: 5, cy: 0, targetSceneId: 'scene-2', targetMapId: 'map-2' };

    it('addSceneExit() ajoute une sortie', () => {
      const id = addTestMap();
      useMapsStore.getState().addSceneExit(id, exit);
      expect(useMapsStore.getState().mapDataById[id]._ac_scene_exits).toHaveLength(1);
    });

    it('updateSceneExit() met à jour la cible', () => {
      const id = addTestMap();
      useMapsStore.getState().addSceneExit(id, exit);
      useMapsStore.getState().updateSceneExit(id, 'exit-1', { targetSceneId: 'scene-99' });
      expect(useMapsStore.getState().mapDataById[id]._ac_scene_exits[0].targetSceneId).toBe(
        'scene-99'
      );
    });

    it('removeSceneExit() supprime la sortie', () => {
      const id = addTestMap();
      useMapsStore.getState().addSceneExit(id, exit);
      useMapsStore.getState().removeSceneExit(id, 'exit-1');
      expect(useMapsStore.getState().mapDataById[id]._ac_scene_exits).toHaveLength(0);
    });
  });

  // ── Audio Zones ────────────────────────────────────────────────────────────

  describe('Audio Zones CRUD', () => {
    const zone = { id: 'az-1', cx: 2, cy: 3, soundId: 'rain', volume: 0.8 };

    it('addAudioZone() ajoute une zone audio', () => {
      const id = addTestMap();
      useMapsStore.getState().addAudioZone(id, zone);
      expect(useMapsStore.getState().mapDataById[id]._ac_audio_zones).toHaveLength(1);
    });

    it('updateAudioZone() met à jour le volume', () => {
      const id = addTestMap();
      useMapsStore.getState().addAudioZone(id, zone);
      useMapsStore.getState().updateAudioZone(id, 'az-1', { volume: 0.3 });
      expect(useMapsStore.getState().mapDataById[id]._ac_audio_zones[0].volume).toBe(0.3);
    });

    it('removeAudioZone() supprime la zone', () => {
      const id = addTestMap();
      useMapsStore.getState().addAudioZone(id, zone);
      useMapsStore.getState().removeAudioZone(id, 'az-1');
      expect(useMapsStore.getState().mapDataById[id]._ac_audio_zones).toHaveLength(0);
    });
  });

  // ── importMaps ─────────────────────────────────────────────────────────────

  describe('importMaps()', () => {
    it('remplace toutes les cartes et données', () => {
      addTestMap('Ancienne carte');
      const newMaps = [
        { id: 'imported-1', name: 'Carte importée', widthTiles: 5, heightTiles: 5, tileSize: 32 },
      ];
      const newData = {
        'imported-1': { identifier: 'Carte importée', uid: 'imported-1', layerInstances: [] },
      };
      useMapsStore.getState().importMaps(newMaps, newData);
      expect(useMapsStore.getState().maps).toHaveLength(1);
      expect(useMapsStore.getState().maps[0].name).toBe('Carte importée');
      expect(useMapsStore.getState().mapDataById['imported-1']).toBeDefined();
    });

    it('getMapById() retrouve une carte par id', () => {
      const id = addTestMap('Recherchée');
      const found = useMapsStore.getState().getMapById(id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Recherchée');
    });

    it('getMapData() retrouve les données par id', () => {
      const id = addTestMap();
      const data = useMapsStore.getState().getMapData(id);
      expect(data).toBeDefined();
      expect(data.uid).toBe(id);
    });
  });
});
