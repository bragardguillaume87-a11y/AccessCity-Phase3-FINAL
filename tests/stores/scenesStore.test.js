import { describe, it, expect, beforeEach } from 'vitest';
import { useScenesStore } from '../../src/stores/scenesStore.js';

describe('ScenesStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const store = useScenesStore.getState();
    useScenesStore.setState({
      scenes: [],
    });
  });

  describe('addScene()', () => {
    it('should add a new scene with default values', () => {
      const { addScene, scenes } = useScenesStore.getState();

      const sceneId = addScene();

      const updatedScenes = useScenesStore.getState().scenes;
      expect(updatedScenes).toHaveLength(1);
      expect(updatedScenes[0]).toMatchObject({
        id: sceneId,
        title: 'New scene',
        description: '',
        dialogues: [],
        textBoxes: [],
        props: [],
      });
    });

    it('should add player character by default', () => {
      const { addScene } = useScenesStore.getState();

      addScene();

      const updatedScenes = useScenesStore.getState().scenes;
      const newScene = updatedScenes[0];

      expect(newScene.characters).toHaveLength(1);
      expect(newScene.characters[0]).toMatchObject({
        characterId: 'player',
        mood: 'neutral',
      });
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
    it('should update scene properties', () => {
      const { addScene, updateScene } = useScenesStore.getState();

      const sceneId = addScene();
      updateScene(sceneId, {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      const updatedScenes = useScenesStore.getState().scenes;
      expect(updatedScenes[0]).toMatchObject({
        title: 'Updated Title',
        description: 'Updated Description',
      });
    });

    it('should not affect other scenes', () => {
      const { addScene, updateScene } = useScenesStore.getState();

      const id1 = addScene();
      const id2 = addScene();

      updateScene(id1, { title: 'Scene 1' });

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].title).toBe('Scene 1');
      expect(scenes[1].title).toBe('New scene');
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
  });

  describe('addDialogue()', () => {
    it('should add dialogue to scene', () => {
      const { addScene, addDialogue } = useScenesStore.getState();

      const sceneId = addScene();
      const dialogue = {
        speaker: 'narrator',
        text: 'Test dialogue',
        choices: [],
      };

      addDialogue(sceneId, dialogue);

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].dialogues).toHaveLength(1);
      expect(scenes[0].dialogues[0]).toMatchObject(dialogue);
    });
  });

  describe('updateDialogue()', () => {
    it('should update dialogue at index', () => {
      const { addScene, addDialogue, updateDialogue } = useScenesStore.getState();

      const sceneId = addScene();
      addDialogue(sceneId, { speaker: 'narrator', text: 'Original', choices: [] });

      updateDialogue(sceneId, 0, { text: 'Updated' });

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].dialogues[0].text).toBe('Updated');
      expect(scenes[0].dialogues[0].speaker).toBe('narrator');
    });
  });

  describe('deleteDialogue()', () => {
    it('should remove dialogue at index', () => {
      const { addScene, addDialogue, deleteDialogue } = useScenesStore.getState();

      const sceneId = addScene();
      addDialogue(sceneId, { speaker: 'narrator', text: 'D1', choices: [] });
      addDialogue(sceneId, { speaker: 'player', text: 'D2', choices: [] });

      deleteDialogue(sceneId, 0);

      const scenes = useScenesStore.getState().scenes;
      expect(scenes[0].dialogues).toHaveLength(1);
      expect(scenes[0].dialogues[0].text).toBe('D2');
    });
  });

  describe('reorderDialogues()', () => {
    it('should reorder dialogues', () => {
      const { addScene, addDialogue, reorderDialogues } = useScenesStore.getState();

      const sceneId = addScene();
      addDialogue(sceneId, { speaker: 'narrator', text: 'D1', choices: [] });
      addDialogue(sceneId, { speaker: 'player', text: 'D2', choices: [] });
      addDialogue(sceneId, { speaker: 'narrator', text: 'D3', choices: [] });

      reorderDialogues(sceneId, 0, 2);

      const scenes = useScenesStore.getState().scenes;
      const dialogues = scenes[0].dialogues;

      expect(dialogues[0].text).toBe('D2');
      expect(dialogues[1].text).toBe('D3');
      expect(dialogues[2].text).toBe('D1');
    });
  });
});
