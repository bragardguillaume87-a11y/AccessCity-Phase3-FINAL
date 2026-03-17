/**
 * SceneElementsStore Tests
 *
 * Couvre le CRUD des éléments visuels par scène :
 *   - SceneCharacters (add, remove, update, updateAnimation, updatePosition)
 *   - TextBoxes (add, remove, update)
 *   - Props (add, remove, update)
 *   - deleteAllElementsForScene
 *   - importElementsByScene
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneElementsStore } from '../../src/stores/sceneElementsStore.js';

const SCENE_ID = 'test-scene-01';

describe('SceneElementsStore', () => {
  beforeEach(() => {
    useSceneElementsStore.setState({ elementsByScene: {} });
  });

  // ─── helpers ─────────────────────────────────────────────────────────────

  function addCharacter(overrides = {}) {
    const { addCharacterToScene } = useSceneElementsStore.getState();
    addCharacterToScene(SCENE_ID, 'char-abc', 'neutral', { x: 50, y: 70 }, 'fadeIn');
    const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID]?.characters ?? [];
    return chars.at(-1);
  }

  function addTextBox(overrides = {}) {
    const { addTextBoxToScene } = useSceneElementsStore.getState();
    addTextBoxToScene(SCENE_ID, {
      text: 'Hello',
      position: { x: 10, y: 20 },
      ...overrides,
    });
    const tbs = useSceneElementsStore.getState().elementsByScene[SCENE_ID]?.textBoxes ?? [];
    return tbs.at(-1);
  }

  function addProp(overrides = {}) {
    const { addPropToScene } = useSceneElementsStore.getState();
    addPropToScene(SCENE_ID, {
      name: 'prop-test',
      imageUrl: '/props/chair.png',
      position: { x: 0, y: 0 },
      ...overrides,
    });
    const props = useSceneElementsStore.getState().elementsByScene[SCENE_ID]?.props ?? [];
    return props.at(-1);
  }

  // ─── getElementsForScene ─────────────────────────────────────────────────

  describe('getElementsForScene()', () => {
    it('retourne des tableaux vides pour une scène inconnue', () => {
      const { getElementsForScene } = useSceneElementsStore.getState();
      const elements = getElementsForScene('unknown');
      expect(elements.characters).toEqual([]);
      expect(elements.textBoxes).toEqual([]);
      expect(elements.props).toEqual([]);
    });

    it('retourne les éléments existants pour une scène connue', () => {
      addCharacter();
      const { getElementsForScene } = useSceneElementsStore.getState();
      const elements = getElementsForScene(SCENE_ID);
      expect(elements.characters).toHaveLength(1);
    });
  });

  // ─── SceneCharacters ─────────────────────────────────────────────────────

  describe('addCharacterToScene()', () => {
    it('ajoute un personnage avec les propriétés attendues', () => {
      const char = addCharacter();
      expect(char).toBeDefined();
      expect(char.characterId).toBe('char-abc');
      expect(char.mood).toBe('neutral');
      expect(char.position).toEqual({ x: 50, y: 70 });
      expect(char.entranceAnimation).toBe('fadeIn');
      expect(char.id).toMatch(/^scene-char/);
    });

    it('génère des IDs uniques pour chaque personnage ajouté', () => {
      const { addCharacterToScene } = useSceneElementsStore.getState();
      addCharacterToScene(SCENE_ID, 'char-1');
      addCharacterToScene(SCENE_ID, 'char-2');
      const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      expect(chars).toHaveLength(2);
      expect(chars[0].id).not.toBe(chars[1].id);
    });

    it('peut ajouter le même personnage plusieurs fois (positionnement multiple)', () => {
      const { addCharacterToScene } = useSceneElementsStore.getState();
      addCharacterToScene(SCENE_ID, 'char-abc');
      addCharacterToScene(SCENE_ID, 'char-abc');
      const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      expect(chars).toHaveLength(2);
    });
  });

  describe('removeCharacterFromScene()', () => {
    it('supprime uniquement le personnage ciblé', () => {
      const { addCharacterToScene, removeCharacterFromScene } = useSceneElementsStore.getState();
      addCharacterToScene(SCENE_ID, 'char-1');
      addCharacterToScene(SCENE_ID, 'char-2');
      const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      const idToRemove = chars[0].id;

      removeCharacterFromScene(SCENE_ID, idToRemove);

      const remaining = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].characterId).toBe('char-2');
    });

    it('est un no-op pour un ID inconnu', () => {
      addCharacter();
      const { removeCharacterFromScene } = useSceneElementsStore.getState();
      removeCharacterFromScene(SCENE_ID, 'unknown-id');
      const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      expect(chars).toHaveLength(1);
    });
  });

  describe('updateSceneCharacter()', () => {
    it('met à jour le mood du personnage', () => {
      const char = addCharacter();
      const { updateSceneCharacter } = useSceneElementsStore.getState();
      updateSceneCharacter(SCENE_ID, char.id, { mood: 'happy' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters[0];
      expect(updated.mood).toBe('happy');
    });

    it('ne modifie pas les autres personnages', () => {
      const { addCharacterToScene, updateSceneCharacter } = useSceneElementsStore.getState();
      addCharacterToScene(SCENE_ID, 'char-1');
      addCharacterToScene(SCENE_ID, 'char-2');
      const chars = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      updateSceneCharacter(SCENE_ID, chars[0].id, { mood: 'sad' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters;
      expect(updated[0].mood).toBe('sad');
      expect(updated[1].mood).not.toBe('sad');
    });
  });

  describe('updateCharacterAnimation()', () => {
    it('met à jour entranceAnimation uniquement si fournie', () => {
      const char = addCharacter();
      const { updateCharacterAnimation } = useSceneElementsStore.getState();
      updateCharacterAnimation(SCENE_ID, char.id, { entranceAnimation: 'slideInLeft' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters[0];
      expect(updated.entranceAnimation).toBe('slideInLeft');
    });

    it('met à jour exitAnimation uniquement si fournie', () => {
      const char = addCharacter();
      const { updateCharacterAnimation } = useSceneElementsStore.getState();
      updateCharacterAnimation(SCENE_ID, char.id, { exitAnimation: 'fadeOut' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters[0];
      expect(updated.exitAnimation).toBe('fadeOut');
    });
  });

  describe('updateCharacterPosition()', () => {
    it('met à jour la position', () => {
      const char = addCharacter();
      const { updateCharacterPosition } = useSceneElementsStore.getState();
      updateCharacterPosition(SCENE_ID, char.id, { position: { x: 10, y: 90 } });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].characters[0];
      expect(updated.position).toEqual({ x: 10, y: 90 });
    });
  });

  // ─── TextBoxes ────────────────────────────────────────────────────────────

  describe('addTextBoxToScene()', () => {
    it('ajoute une textbox avec les données fournies', () => {
      const tb = addTextBox({ text: 'Bonjour !', position: { x: 5, y: 15 } });
      expect(tb).toBeDefined();
      expect(tb.text).toBe('Bonjour !');
      expect(tb.position).toEqual({ x: 5, y: 15 });
      expect(tb.id).toMatch(/^textbox/);
    });
  });

  describe('removeTextBoxFromScene()', () => {
    it('supprime la textbox ciblée', () => {
      const tb = addTextBox();
      const { removeTextBoxFromScene } = useSceneElementsStore.getState();
      removeTextBoxFromScene(SCENE_ID, tb.id);
      const tbs = useSceneElementsStore.getState().elementsByScene[SCENE_ID].textBoxes;
      expect(tbs).toHaveLength(0);
    });
  });

  describe('updateTextBox()', () => {
    it('met à jour le texte de la textbox', () => {
      const tb = addTextBox();
      const { updateTextBox } = useSceneElementsStore.getState();
      updateTextBox(SCENE_ID, tb.id, { text: 'Modifié' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].textBoxes[0];
      expect(updated.text).toBe('Modifié');
    });
  });

  // ─── Props ────────────────────────────────────────────────────────────────

  describe('addPropToScene()', () => {
    it('ajoute un prop avec les données fournies', () => {
      const prop = addProp({ name: 'Chaise', imageUrl: '/props/chair.png' });
      expect(prop).toBeDefined();
      expect(prop.name).toBe('Chaise');
      expect(prop.imageUrl).toBe('/props/chair.png');
      expect(prop.id).toMatch(/^prop/);
    });
  });

  describe('removePropFromScene()', () => {
    it('supprime le prop ciblé', () => {
      const prop = addProp();
      const { removePropFromScene } = useSceneElementsStore.getState();
      removePropFromScene(SCENE_ID, prop.id);
      const props = useSceneElementsStore.getState().elementsByScene[SCENE_ID].props;
      expect(props).toHaveLength(0);
    });
  });

  describe('updateProp()', () => {
    it('met à jour le nom du prop', () => {
      const prop = addProp();
      const { updateProp } = useSceneElementsStore.getState();
      updateProp(SCENE_ID, prop.id, { name: 'Table' });
      const updated = useSceneElementsStore.getState().elementsByScene[SCENE_ID].props[0];
      expect(updated.name).toBe('Table');
    });
  });

  // ─── deleteAllElementsForScene ────────────────────────────────────────────

  describe('deleteAllElementsForScene()', () => {
    it('supprime tous les éléments de la scène', () => {
      addCharacter();
      addTextBox();
      addProp();
      const { deleteAllElementsForScene } = useSceneElementsStore.getState();
      deleteAllElementsForScene(SCENE_ID);
      const state = useSceneElementsStore.getState();
      expect(state.elementsByScene[SCENE_ID]).toBeUndefined();
    });

    it('ne touche pas aux autres scènes', () => {
      const OTHER_SCENE = 'other-scene';
      useSceneElementsStore.getState().addCharacterToScene(OTHER_SCENE, 'char-x');
      addCharacter();
      const { deleteAllElementsForScene } = useSceneElementsStore.getState();
      deleteAllElementsForScene(SCENE_ID);
      const otherChars = useSceneElementsStore.getState().elementsByScene[OTHER_SCENE]?.characters;
      expect(otherChars).toHaveLength(1);
    });
  });

  // ─── importElementsByScene ────────────────────────────────────────────────

  describe('importElementsByScene()', () => {
    it('remplace complètement l\'état par les données importées', () => {
      addCharacter();
      const importData = {
        'imported-scene': {
          characters: [
            { id: 'c1', characterId: 'hero', mood: 'happy', position: { x: 0, y: 0 }, size: { width: 200, height: 300 }, entranceAnimation: 'none', exitAnimation: 'none' }
          ],
          textBoxes: [],
          props: [],
        }
      };
      const { importElementsByScene } = useSceneElementsStore.getState();
      importElementsByScene(importData);
      const state = useSceneElementsStore.getState().elementsByScene;
      expect(state[SCENE_ID]).toBeUndefined();
      expect(state['imported-scene']?.characters).toHaveLength(1);
    });
  });

  // ─── getCharactersForScene ────────────────────────────────────────────────

  describe('getCharactersForScene()', () => {
    it('retourne les personnages de la scène', () => {
      addCharacter();
      const { getCharactersForScene } = useSceneElementsStore.getState();
      const chars = getCharactersForScene(SCENE_ID);
      expect(chars).toHaveLength(1);
    });

    it('retourne [] pour une scène inconnue', () => {
      const { getCharactersForScene } = useSceneElementsStore.getState();
      expect(getCharactersForScene('unknown')).toEqual([]);
    });
  });
});
