/**
 * DialoguesStore Tests
 *
 * Post-Phase 3 architecture: les dialogues sont gérés dans dialoguesStore,
 * séparé de scenesStore (qui ne garde que les métadonnées de scène).
 *
 * Structure: { dialoguesByScene: Record<sceneId, Dialogue[]> }
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDialoguesStore } from '../../src/stores/dialoguesStore.js';

const MOCK_SCENE_ID = 'scene-test-001';

const makeDialogue = (overrides = {}) => ({
  id: `dialogue-${Date.now()}-${Math.random()}`,
  speaker: 'narrator',
  text: 'Texte de test',
  choices: [],
  ...overrides,
});

describe('DialoguesStore', () => {
  beforeEach(() => {
    useDialoguesStore.setState({ dialoguesByScene: {} });
  });

  describe('addDialogue()', () => {
    it('should add a dialogue to a scene', () => {
      const { addDialogue, getDialoguesByScene } = useDialoguesStore.getState();
      const dialogue = makeDialogue({ text: 'Bonjour !' });

      addDialogue(MOCK_SCENE_ID, dialogue);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(1);
      expect(dialogues[0].text).toBe('Bonjour !');
    });

    it('should append dialogues in order', () => {
      const { addDialogue, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D3' }));

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(3);
      expect(dialogues[0].text).toBe('D1');
      expect(dialogues[2].text).toBe('D3');
    });

    it('should not affect dialogues of other scenes', () => {
      const { addDialogue, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Scene A' }));
      addDialogue('scene-other', makeDialogue({ text: 'Scene B' }));

      expect(getDialoguesByScene(MOCK_SCENE_ID)).toHaveLength(1);
      expect(getDialoguesByScene('scene-other')).toHaveLength(1);
    });
  });

  describe('updateDialogue()', () => {
    it('should update dialogue at index with a patch object', () => {
      const { addDialogue, updateDialogue, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ speaker: 'narrator', text: 'Original' }));
      updateDialogue(MOCK_SCENE_ID, 0, { text: 'Mis à jour' });

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues[0].text).toBe('Mis à jour');
      expect(dialogues[0].speaker).toBe('narrator');
    });

    it('should accept an updater function', () => {
      const { addDialogue, updateDialogue, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Original' }));
      updateDialogue(MOCK_SCENE_ID, 0, (d) => ({ text: d.text + ' — modifié' }));

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues[0].text).toBe('Original — modifié');
    });
  });

  describe('deleteDialogue()', () => {
    it('should remove dialogue at index', () => {
      const { addDialogue, deleteDialogue, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));

      deleteDialogue(MOCK_SCENE_ID, 0);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(1);
      expect(dialogues[0].text).toBe('D2');
    });
  });

  describe('reorderDialogues()', () => {
    it('should move a dialogue from oldIndex to newIndex', () => {
      const { addDialogue, reorderDialogues, getDialoguesByScene } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D3' }));

      reorderDialogues(MOCK_SCENE_ID, 0, 2);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues[0].text).toBe('D2');
      expect(dialogues[1].text).toBe('D3');
      expect(dialogues[2].text).toBe('D1');
    });
  });

  describe('deleteAllDialoguesForScene()', () => {
    it('should clear all dialogues for a scene (cascade delete)', () => {
      const { addDialogue, deleteAllDialoguesForScene, getDialoguesByScene } =
        useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));
      addDialogue('scene-other', makeDialogue({ text: 'Autre' }));

      deleteAllDialoguesForScene(MOCK_SCENE_ID);

      expect(getDialoguesByScene(MOCK_SCENE_ID)).toHaveLength(0);
      expect(getDialoguesByScene('scene-other')).toHaveLength(1);
    });
  });

  describe('getDialogueByIndex()', () => {
    it('should return the dialogue at the given index', () => {
      const { addDialogue, getDialogueByIndex } = useDialoguesStore.getState();

      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));

      const d = getDialogueByIndex(MOCK_SCENE_ID, 1);
      expect(d?.text).toBe('D2');
    });

    it('should return undefined for out-of-bounds index', () => {
      const { getDialogueByIndex } = useDialoguesStore.getState();
      expect(getDialogueByIndex(MOCK_SCENE_ID, 99)).toBeUndefined();
    });
  });
});
