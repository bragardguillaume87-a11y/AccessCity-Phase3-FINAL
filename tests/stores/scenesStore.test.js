/**
 * ScenesStore Tests
 *
 * Post-Phase 3 architecture: scenesStore gère uniquement les métadonnées
 * (id, title, description, backgroundUrl). Les dialogues sont dans
 * dialoguesStore, les éléments dans sceneElementsStore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useScenesStore } from '../../src/stores/scenesStore.js';
import { useDialoguesStore } from '../../src/stores/dialoguesStore.js';

describe('ScenesStore', () => {
  beforeEach(() => {
    useScenesStore.setState({ scenes: [] });
    useDialoguesStore.setState({ dialoguesByScene: {} });
  });

  describe('addScene()', () => {
    it('should add a new scene with default metadata', () => {
      const { addScene } = useScenesStore.getState();
      const sceneId = addScene();

      const scenes = useScenesStore.getState().scenes;
      expect(scenes).toHaveLength(1);
      expect(scenes[0]).toMatchObject({
        id: sceneId,
        title: 'Nouvelle Scène',
        description: '',
        backgroundUrl: '',
      });
    });

    it('should NOT have element arrays (SceneMetadata — data lives in other stores)', () => {
      const { addScene } = useScenesStore.getState();
      addScene();

      const scene = useScenesStore.getState().scenes[0];
      // Post-Phase 3 (type split) : SceneMetadata n'a PLUS ces champs
      // - dialogues → dialoguesStore
      // - characters/textBoxes/props → sceneElementsStore
      expect(scene.dialogues).toBeUndefined();
      expect(scene.characters).toBeUndefined();
      expect(scene.textBoxes).toBeUndefined();
      expect(scene.props).toBeUndefined();
    });

    it('should generate unique IDs', () => {
      const { addScene } = useScenesStore.getState();
      const id1 = addScene();
      const id2 = addScene();

      expect(id1).not.toBe(id2);
      expect(useScenesStore.getState().scenes).toHaveLength(2);
    });
  });

  describe('updateScene()', () => {
    it('should update scene metadata', () => {
      const { addScene, updateScene } = useScenesStore.getState();
      const sceneId = addScene();

      updateScene(sceneId, {
        title: 'Titre mis à jour',
        description: 'Description mise à jour',
      });

      const scene = useScenesStore.getState().scenes[0];
      expect(scene.title).toBe('Titre mis à jour');
      expect(scene.description).toBe('Description mise à jour');
    });

    it('should not affect other scenes', () => {
      const { addScene, updateScene } = useScenesStore.getState();
      const id1 = addScene();
      addScene();

      updateScene(id1, { title: 'Scène 1' });

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].title).toBe('Scène 1');
      expect(scenes[1].title).toBe('Nouvelle Scène');
    });

    it('should update backgroundUrl', () => {
      const { addScene, updateScene } = useScenesStore.getState();
      const sceneId = addScene();

      updateScene(sceneId, { backgroundUrl: '/backgrounds/city.jpg' });

      const scene = useScenesStore.getState().scenes[0];
      expect(scene.backgroundUrl).toBe('/backgrounds/city.jpg');
    });
  });

  describe('deleteScene()', () => {
    it('should remove scene by ID', () => {
      const { addScene, deleteScene } = useScenesStore.getState();
      const id1 = addScene();
      const id2 = addScene();

      deleteScene(id1);

      const scenes = useScenesStore.getState().scenes;
      expect(scenes).toHaveLength(1);
      expect(scenes[0].id).toBe(id2);
    });

    it('should be a no-op for unknown ID', () => {
      const { addScene, deleteScene } = useScenesStore.getState();
      addScene();

      deleteScene('unknown-id');

      expect(useScenesStore.getState().scenes).toHaveLength(1);
    });
  });

  describe('getSceneById()', () => {
    it('should return the scene for a known ID', () => {
      const { addScene, getSceneById } = useScenesStore.getState();
      const sceneId = addScene();

      const scene = getSceneById(sceneId);
      expect(scene).toBeDefined();
      expect(scene.id).toBe(sceneId);
    });

    it('should return undefined for unknown ID', () => {
      const { getSceneById } = useScenesStore.getState();
      expect(getSceneById('unknown')).toBeUndefined();
    });
  });

  // ── addScene — cinematic ───────────────────────────────────────────────────

  describe('addScene() — type cinematic', () => {
    it('crée une scène cinématique avec le bon titre et les bons champs', () => {
      const sceneId = useScenesStore.getState().addScene('cinematic');
      const scene = useScenesStore.getState().scenes[0];

      expect(scene.id).toBe(sceneId);
      expect(scene.title).toBe('Nouvelle Cinématique');
      expect(scene.sceneType).toBe('cinematic');
      expect(scene.cinematicEvents).toEqual([]);
    });
  });

  // ── updateScene — patch function ───────────────────────────────────────────

  describe('updateScene() — patch fonction', () => {
    it('accepte un callback qui reçoit la scène courante', () => {
      const sceneId = useScenesStore.getState().addScene();
      useScenesStore.getState().updateScene(sceneId, (s) => ({ title: s.title + ' (modifié)' }));

      const scene = useScenesStore.getState().scenes[0];
      expect(scene.title).toBe('Nouvelle Scène (modifié)');
    });

    it("est no-op si la scène n'existe pas", () => {
      useScenesStore.getState().addScene();
      expect(() => {
        useScenesStore.getState().updateScene('inexistant', { title: 'Ghost' });
      }).not.toThrow();
      expect(useScenesStore.getState().scenes).toHaveLength(1);
    });
  });

  // ── setSceneBackground ─────────────────────────────────────────────────────

  describe('setSceneBackground()', () => {
    it('met à jour le fond de la scène', () => {
      const sceneId = useScenesStore.getState().addScene();
      useScenesStore.getState().setSceneBackground(sceneId, '/backgrounds/city.jpg');

      const scene = useScenesStore.getState().scenes[0];
      expect(scene.backgroundUrl).toBe('/backgrounds/city.jpg');
    });

    it("n'affecte pas les autres scènes", () => {
      useScenesStore.setState({
        scenes: [
          { id: 'sc-A', title: 'A', description: '', backgroundUrl: '' },
          { id: 'sc-B', title: 'B', description: '', backgroundUrl: '' },
        ],
      });
      useScenesStore.getState().setSceneBackground('sc-A', '/bg.jpg');

      expect(useScenesStore.getState().scenes[1].backgroundUrl).toBe('');
    });
  });

  // ── reorderScenes ──────────────────────────────────────────────────────────

  describe('reorderScenes()', () => {
    it('remplace la liste des scènes dans le nouvel ordre', () => {
      useScenesStore.setState({
        scenes: [
          { id: 'sc-1', title: 'Première', description: '', backgroundUrl: '' },
          { id: 'sc-2', title: 'Deuxième', description: '', backgroundUrl: '' },
          { id: 'sc-3', title: 'Troisième', description: '', backgroundUrl: '' },
        ],
      });

      const { scenes } = useScenesStore.getState();
      useScenesStore.getState().reorderScenes([scenes[2], scenes[0], scenes[1]]);

      const ids = useScenesStore.getState().scenes.map((s) => s.id);
      expect(ids).toEqual(['sc-3', 'sc-1', 'sc-2']);
    });
  });

  // ── batchUpdateScenes ──────────────────────────────────────────────────────

  describe('batchUpdateScenes()', () => {
    it('met à jour plusieurs scènes en une opération', () => {
      useScenesStore.setState({
        scenes: [
          { id: 'sc-A', title: 'A', description: '', backgroundUrl: '' },
          { id: 'sc-B', title: 'B', description: '', backgroundUrl: '' },
        ],
      });

      useScenesStore.getState().batchUpdateScenes([
        { sceneId: 'sc-A', patch: { title: 'A updated' } },
        { sceneId: 'sc-B', patch: { description: 'desc B' } },
      ]);

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].title).toBe('A updated');
      expect(scenes[1].description).toBe('desc B');
    });
  });

  // ── updateCinematicTracks ──────────────────────────────────────────────────

  describe('updateCinematicTracks()', () => {
    it('met à jour les pistes cinématiques', () => {
      const sceneId = useScenesStore.getState().addScene('cinematic');
      const tracks = { videoTrack: [{ id: 'block-1', startFrame: 0, endFrame: 10 }] };

      useScenesStore.getState().updateCinematicTracks(sceneId, tracks);

      const scene = useScenesStore.getState().scenes[0];
      expect(scene.cinematicTracks).toEqual(tracks);
    });
  });

  // ── getAllScenes ───────────────────────────────────────────────────────────

  describe('getAllScenes()', () => {
    it('retourne toutes les scènes', () => {
      useScenesStore.getState().addScene();
      useScenesStore.getState().addScene();
      expect(useScenesStore.getState().getAllScenes()).toHaveLength(2);
    });

    it('retourne [] si aucune scène', () => {
      expect(useScenesStore.getState().getAllScenes()).toHaveLength(0);
    });
  });

  // ── deleteScene — cascade ──────────────────────────────────────────────────

  describe('deleteScene() — cascade delete', () => {
    it('supprime aussi les dialogues de la scène dans dialoguesStore', () => {
      const sceneId = useScenesStore.getState().addScene();
      useDialoguesStore
        .getState()
        .addDialogue(sceneId, { id: 'd1', speaker: 'narrator', text: 'Test', choices: [] });
      useDialoguesStore
        .getState()
        .addDialogue('autre-scene', { id: 'd2', speaker: 'narrator', text: 'Autre', choices: [] });

      useScenesStore.getState().deleteScene(sceneId);

      expect(useDialoguesStore.getState().getDialoguesByScene(sceneId)).toHaveLength(0);
      expect(useDialoguesStore.getState().getDialoguesByScene('autre-scene')).toHaveLength(1);
    });
  });

  // ── importScenes ───────────────────────────────────────────────────────────

  describe('importScenes()', () => {
    it('remplace toutes les scènes', () => {
      useScenesStore.getState().addScene();
      const imported = [
        { id: 'imported-1', title: 'Importée 1', description: '', backgroundUrl: '' },
        { id: 'imported-2', title: 'Importée 2', description: '', backgroundUrl: '' },
      ];
      useScenesStore.getState().importScenes(imported);

      const scenes = useScenesStore.getState().scenes;
      expect(scenes).toHaveLength(2);
      expect(scenes[0].title).toBe('Importée 1');
    });
  });
});
