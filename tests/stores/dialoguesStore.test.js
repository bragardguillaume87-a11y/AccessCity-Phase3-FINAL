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

  // ── addDialogues ───────────────────────────────────────────────────────────

  describe('addDialogues()', () => {
    it('ajoute plusieurs dialogues en une opération', () => {
      const { addDialogues, getDialoguesByScene } = useDialoguesStore.getState();
      const batch = [
        makeDialogue({ text: 'A' }),
        makeDialogue({ text: 'B' }),
        makeDialogue({ text: 'C' }),
      ];

      addDialogues(MOCK_SCENE_ID, batch);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(3);
      expect(dialogues.map((d) => d.text)).toEqual(['A', 'B', 'C']);
    });

    it('append après les dialogues existants', () => {
      const { addDialogue, addDialogues, getDialoguesByScene } = useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Existant' }));
      addDialogues(MOCK_SCENE_ID, [makeDialogue({ text: 'Nouveau' })]);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(2);
      expect(dialogues[0].text).toBe('Existant');
      expect(dialogues[1].text).toBe('Nouveau');
    });
  });

  // ── insertDialoguesAfter ───────────────────────────────────────────────────

  describe('insertDialoguesAfter()', () => {
    it("insère après l'index donné", () => {
      const { addDialogue, insertDialoguesAfter, getDialoguesByScene } =
        useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D3' }));

      insertDialoguesAfter(MOCK_SCENE_ID, 0, [makeDialogue({ text: 'D2' })]);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(3);
      expect(dialogues[0].text).toBe('D1');
      expect(dialogues[1].text).toBe('D2');
      expect(dialogues[2].text).toBe('D3');
    });

    it("insère plusieurs éléments d'un coup", () => {
      const { addDialogue, insertDialoguesAfter, getDialoguesByScene } =
        useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'A' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D' }));

      insertDialoguesAfter(MOCK_SCENE_ID, 0, [
        makeDialogue({ text: 'B' }),
        makeDialogue({ text: 'C' }),
      ]);

      const texts = getDialoguesByScene(MOCK_SCENE_ID).map((d) => d.text);
      expect(texts).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  // ── batchUpdateDialogues ───────────────────────────────────────────────────

  describe('batchUpdateDialogues()', () => {
    it('met à jour plusieurs dialogues en une opération', () => {
      const { addDialogue, batchUpdateDialogues, getDialoguesByScene } =
        useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D3' }));

      batchUpdateDialogues(MOCK_SCENE_ID, [
        { index: 0, patch: { text: 'D1 updated' } },
        { index: 2, patch: { speaker: 'player' } },
      ]);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues[0].text).toBe('D1 updated');
      expect(dialogues[1].text).toBe('D2'); // inchangé
      expect(dialogues[2].speaker).toBe('player');
    });

    it('ignore les indices hors-bornes', () => {
      const { addDialogue, batchUpdateDialogues, getDialoguesByScene } =
        useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));

      expect(() => {
        batchUpdateDialogues(MOCK_SCENE_ID, [{ index: 99, patch: { text: 'ghost' } }]);
      }).not.toThrow();

      expect(getDialoguesByScene(MOCK_SCENE_ID)[0].text).toBe('D1');
    });
  });

  // ── duplicateDialogue ──────────────────────────────────────────────────────

  describe('duplicateDialogue()', () => {
    it("insère un clone après l'original", () => {
      const { addDialogue, duplicateDialogue, getDialoguesByScene } = useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Original' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Suivant' }));

      duplicateDialogue(MOCK_SCENE_ID, 0);

      const dialogues = getDialoguesByScene(MOCK_SCENE_ID);
      expect(dialogues).toHaveLength(3);
      expect(dialogues[0].text).toBe('Original');
      expect(dialogues[1].text).toBe('Original'); // clone
      expect(dialogues[2].text).toBe('Suivant');
    });

    it('le clone a un ID différent', () => {
      const { addDialogue, duplicateDialogue, getDialoguesByScene } = useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ id: 'dlg-fixed-id', text: 'Original' }));
      duplicateDialogue(MOCK_SCENE_ID, 0);

      const [original, clone] = getDialoguesByScene(MOCK_SCENE_ID);
      expect(clone.id).not.toBe(original.id);
    });

    it('les choices du clone ont de nouveaux IDs', () => {
      const { addDialogue, duplicateDialogue, getDialoguesByScene } = useDialoguesStore.getState();
      const withChoices = makeDialogue({
        choices: [{ id: 'choice-original-A', text: 'Option A' }],
      });
      addDialogue(MOCK_SCENE_ID, withChoices);
      duplicateDialogue(MOCK_SCENE_ID, 0);

      const [original, clone] = getDialoguesByScene(MOCK_SCENE_ID);
      expect(clone.choices[0].id).not.toBe(original.choices[0].id);
      expect(clone.choices[0].text).toBe('Option A'); // contenu préservé
    });

    it('ne plante pas sur un index inexistant', () => {
      expect(() => {
        useDialoguesStore.getState().duplicateDialogue(MOCK_SCENE_ID, 99);
      }).not.toThrow();
    });
  });

  // ── reorderDialogues — edge cases ─────────────────────────────────────────

  describe('reorderDialogues() — edge cases', () => {
    it('ne modifie pas si oldIndex hors-bornes', () => {
      const { addDialogue, reorderDialogues, getDialoguesByScene } = useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D1' }));
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'D2' }));

      reorderDialogues(MOCK_SCENE_ID, 99, 0);

      const texts = getDialoguesByScene(MOCK_SCENE_ID).map((d) => d.text);
      expect(texts).toEqual(['D1', 'D2']);
    });
  });

  // ── importDialoguesByScene ─────────────────────────────────────────────────

  describe('importDialoguesByScene()', () => {
    it('remplace tout le state', () => {
      const { addDialogue, importDialoguesByScene, getDialoguesByScene } =
        useDialoguesStore.getState();
      addDialogue(MOCK_SCENE_ID, makeDialogue({ text: 'Ancien' }));

      const imported = {
        'scene-imported': [makeDialogue({ text: 'Importé' })],
      };
      importDialoguesByScene(imported);

      expect(getDialoguesByScene(MOCK_SCENE_ID)).toHaveLength(0);
      expect(getDialoguesByScene('scene-imported')).toHaveLength(1);
      expect(getDialoguesByScene('scene-imported')[0].text).toBe('Importé');
    });
  });
});
