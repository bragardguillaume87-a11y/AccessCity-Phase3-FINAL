/**
 * SelectionStore Tests
 *
 * Couvre la gestion centralisée des sélections :
 *   - selectScene / selectDialogue / selectCharacter / selectSceneCharacter
 *   - clearSelection / setSelectedElement
 *   - selectionSelectors (isSceneSelected, isDialogueSelected, isCharacterSelected)
 *   - Type guards exportés (isSceneSelection, isDialogueSelection, etc.)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore, selectionSelectors } from '../../src/stores/selectionStore.js';
import {
  isSceneSelection,
  isDialogueSelection,
  isCharacterSelection,
  isSceneCharacterSelection,
  isNoSelection,
  describeSelection,
} from '../../src/stores/selectionStore.types.js';

describe('SelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({ selectedElement: null });
  });

  // ─── selectScene ──────────────────────────────────────────────────────────

  describe('selectScene()', () => {
    it('sélectionne une scène par ID', () => {
      const { selectScene } = useSelectionStore.getState();
      selectScene('scene-01');
      const el = useSelectionStore.getState().selectedElement;
      expect(el).toMatchObject({ type: 'scene', id: 'scene-01' });
    });

    it('remplace toute sélection précédente', () => {
      const { selectScene } = useSelectionStore.getState();
      selectScene('scene-01');
      selectScene('scene-02');
      const el = useSelectionStore.getState().selectedElement;
      expect(el.id).toBe('scene-02');
    });
  });

  // ─── selectDialogue ───────────────────────────────────────────────────────

  describe('selectDialogue()', () => {
    it('sélectionne un dialogue avec sceneId + index', () => {
      const { selectDialogue } = useSelectionStore.getState();
      selectDialogue('scene-01', 3);
      const el = useSelectionStore.getState().selectedElement;
      expect(el).toMatchObject({ type: 'dialogue', sceneId: 'scene-01', index: 3 });
    });

    it('accepte l\'index 0', () => {
      const { selectDialogue } = useSelectionStore.getState();
      selectDialogue('scene-abc', 0);
      const el = useSelectionStore.getState().selectedElement;
      expect(el.index).toBe(0);
    });
  });

  // ─── selectCharacter ──────────────────────────────────────────────────────

  describe('selectCharacter()', () => {
    it('sélectionne un personnage par ID', () => {
      const { selectCharacter } = useSelectionStore.getState();
      selectCharacter('char-hero');
      const el = useSelectionStore.getState().selectedElement;
      expect(el).toMatchObject({ type: 'character', id: 'char-hero' });
    });
  });

  // ─── selectSceneCharacter ─────────────────────────────────────────────────

  describe('selectSceneCharacter()', () => {
    it('sélectionne une instance de personnage sur la scène', () => {
      const { selectSceneCharacter } = useSelectionStore.getState();
      selectSceneCharacter('scene-01', 'scene-char-42');
      const el = useSelectionStore.getState().selectedElement;
      expect(el).toMatchObject({
        type: 'sceneCharacter',
        sceneId: 'scene-01',
        sceneCharacterId: 'scene-char-42',
      });
    });
  });

  // ─── clearSelection ───────────────────────────────────────────────────────

  describe('clearSelection()', () => {
    it('remet selectedElement à null', () => {
      const { selectScene, clearSelection } = useSelectionStore.getState();
      selectScene('scene-01');
      clearSelection();
      expect(useSelectionStore.getState().selectedElement).toBeNull();
    });

    it('est idempotent (no-op si déjà null)', () => {
      const { clearSelection } = useSelectionStore.getState();
      expect(() => clearSelection()).not.toThrow();
      expect(useSelectionStore.getState().selectedElement).toBeNull();
    });
  });

  // ─── setSelectedElement ───────────────────────────────────────────────────

  describe('setSelectedElement()', () => {
    it('accepte une sélection arbitraire', () => {
      const { setSelectedElement } = useSelectionStore.getState();
      setSelectedElement({ type: 'scene', id: 'scene-custom' });
      expect(useSelectionStore.getState().selectedElement).toMatchObject({ type: 'scene', id: 'scene-custom' });
    });

    it('accepte null pour effacer la sélection', () => {
      const { selectScene, setSelectedElement } = useSelectionStore.getState();
      selectScene('scene-01');
      setSelectedElement(null);
      expect(useSelectionStore.getState().selectedElement).toBeNull();
    });
  });

  // ─── selectionSelectors ───────────────────────────────────────────────────

  describe('selectionSelectors', () => {
    it('isSceneSelected — true quand une scène est sélectionnée', () => {
      const { selectScene } = useSelectionStore.getState();
      selectScene('scene-01');
      const state = useSelectionStore.getState();
      expect(selectionSelectors.isSceneSelected(state)).toBe(true);
    });

    it('isSceneSelected — false sinon', () => {
      const state = useSelectionStore.getState();
      expect(selectionSelectors.isSceneSelected(state)).toBe(false);
    });

    it('isDialogueSelected — true quand un dialogue est sélectionné', () => {
      const { selectDialogue } = useSelectionStore.getState();
      selectDialogue('scene-01', 0);
      const state = useSelectionStore.getState();
      expect(selectionSelectors.isDialogueSelected(state)).toBe(true);
    });

    it('isCharacterSelected — true quand un personnage est sélectionné', () => {
      const { selectCharacter } = useSelectionStore.getState();
      selectCharacter('char-01');
      const state = useSelectionStore.getState();
      expect(selectionSelectors.isCharacterSelected(state)).toBe(true);
    });
  });

  // ─── Type guards ──────────────────────────────────────────────────────────

  describe('Type guards', () => {
    it('isSceneSelection — true pour type:scene', () => {
      expect(isSceneSelection({ type: 'scene', id: 'x' })).toBe(true);
    });

    it('isSceneSelection — false pour type:character', () => {
      expect(isSceneSelection({ type: 'character', id: 'x' })).toBe(false);
    });

    it('isSceneSelection — false pour null', () => {
      expect(isSceneSelection(null)).toBe(false);
    });

    it('isDialogueSelection — true pour type:dialogue', () => {
      expect(isDialogueSelection({ type: 'dialogue', sceneId: 's', index: 0 })).toBe(true);
    });

    it('isCharacterSelection — true pour type:character', () => {
      expect(isCharacterSelection({ type: 'character', id: 'c' })).toBe(true);
    });

    it('isSceneCharacterSelection — true pour type:sceneCharacter', () => {
      expect(isSceneCharacterSelection({ type: 'sceneCharacter', sceneId: 's', sceneCharacterId: 'sc' })).toBe(true);
    });

    it('isNoSelection — true pour null', () => {
      expect(isNoSelection(null)).toBe(true);
    });

    it('isNoSelection — true pour { type: null }', () => {
      expect(isNoSelection({ type: null })).toBe(true);
    });

    it('isNoSelection — false pour une sélection réelle', () => {
      expect(isNoSelection({ type: 'scene', id: 'x' })).toBe(false);
    });
  });

  // ─── describeSelection ────────────────────────────────────────────────────

  describe('describeSelection()', () => {
    it('retourne "No selection" pour null', () => {
      expect(describeSelection(null)).toBe('No selection');
    });

    it('décrit une sélection de scène', () => {
      expect(describeSelection({ type: 'scene', id: 'scene-42' })).toContain('scene-42');
    });

    it('décrit une sélection de dialogue', () => {
      const desc = describeSelection({ type: 'dialogue', sceneId: 'scene-1', index: 5 });
      expect(desc).toContain('5');
      expect(desc).toContain('scene-1');
    });

    it('décrit une sélection de personnage', () => {
      expect(describeSelection({ type: 'character', id: 'char-hero' })).toContain('char-hero');
    });

    it('décrit une sélection de sceneCharacter', () => {
      const desc = describeSelection({ type: 'sceneCharacter', sceneId: 's', sceneCharacterId: 'sc-1' });
      expect(desc).toContain('sc-1');
    });
  });
});
