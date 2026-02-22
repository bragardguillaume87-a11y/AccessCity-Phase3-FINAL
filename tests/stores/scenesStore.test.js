/**
 * ScenesStore Tests
 *
 * Post-Phase 3 architecture: scenesStore gère uniquement les métadonnées
 * (id, title, description, backgroundUrl). Les dialogues sont dans
 * dialoguesStore, les éléments dans sceneElementsStore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useScenesStore } from '../../src/stores/scenesStore.js';

describe('ScenesStore', () => {
  beforeEach(() => {
    useScenesStore.setState({ scenes: [] });
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
      const id2 = addScene();

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
});
