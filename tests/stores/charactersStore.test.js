/**
 * CharactersStore Tests
 *
 * Couvre les opérations CRUD sur les personnages du projet :
 *   - addCharacter()
 *   - updateCharacter()
 *   - deleteCharacter()
 *   - getCharacterById()
 *   - importCharacters()
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCharactersStore } from '../../src/stores/charactersStore.js';

describe('CharactersStore', () => {
  beforeEach(() => {
    useCharactersStore.setState({ characters: [] });
  });

  // ─── addCharacter ─────────────────────────────────────────────────────────

  describe('addCharacter()', () => {
    it('crée un nouveau personnage avec des valeurs par défaut', () => {
      const { addCharacter } = useCharactersStore.getState();
      const id = addCharacter();

      const chars = useCharactersStore.getState().characters;
      expect(chars).toHaveLength(1);
      expect(chars[0].id).toBe(id);
      expect(chars[0].name).toBe('New character');
      expect(chars[0].moods).toContain('neutral');
    });

    it('retourne un ID de type string non vide', () => {
      const { addCharacter } = useCharactersStore.getState();
      const id = addCharacter();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('accumule les personnages dans le tableau', () => {
      const { addCharacter } = useCharactersStore.getState();
      addCharacter();
      addCharacter();
      addCharacter();
      expect(useCharactersStore.getState().characters).toHaveLength(3);
    });
  });

  // ─── updateCharacter ──────────────────────────────────────────────────────

  describe('updateCharacter()', () => {
    it('met à jour le nom du personnage', () => {
      const { addCharacter, updateCharacter } = useCharactersStore.getState();
      const id = addCharacter();
      updateCharacter({ id, name: 'Alice' });
      const char = useCharactersStore.getState().characters[0];
      expect(char.name).toBe('Alice');
    });

    it('met à jour la description', () => {
      const { addCharacter, updateCharacter } = useCharactersStore.getState();
      const id = addCharacter();
      updateCharacter({ id, description: 'Une héroïne courageuse.' });
      const char = useCharactersStore.getState().characters[0];
      expect(char.description).toBe('Une héroïne courageuse.');
    });

    it('met à jour les moods', () => {
      const { addCharacter, updateCharacter } = useCharactersStore.getState();
      const id = addCharacter();
      updateCharacter({ id, moods: ['neutral', 'happy', 'sad'] });
      const char = useCharactersStore.getState().characters[0];
      expect(char.moods).toEqual(['neutral', 'happy', 'sad']);
    });

    it('met à jour les sprites', () => {
      const { addCharacter, updateCharacter } = useCharactersStore.getState();
      const id = addCharacter();
      updateCharacter({ id, sprites: { neutral: '/alice/neutral.png', happy: '/alice/happy.png' } });
      const char = useCharactersStore.getState().characters[0];
      expect(char.sprites.happy).toBe('/alice/happy.png');
    });

    it('ne modifie pas les autres personnages', () => {
      // Pré-charge des personnages avec des IDs stables pour éviter la collision Date.now()
      useCharactersStore.setState({
        characters: [
          { id: 'char-stable-1', name: 'New character', description: '', sprites: { neutral: '' }, moods: ['neutral'] },
          { id: 'char-stable-2', name: 'New character', description: '', sprites: { neutral: '' }, moods: ['neutral'] },
        ]
      });
      const { updateCharacter } = useCharactersStore.getState();
      updateCharacter({ id: 'char-stable-1', name: 'Alice' });
      const chars = useCharactersStore.getState().characters;
      expect(chars.find(c => c.id === 'char-stable-2').name).toBe('New character');
    });

    it('est un no-op pour un ID inconnu', () => {
      const { addCharacter, updateCharacter } = useCharactersStore.getState();
      addCharacter();
      updateCharacter({ id: 'unknown-id', name: 'Ghost' });
      const chars = useCharactersStore.getState().characters;
      expect(chars[0].name).toBe('New character');
    });
  });

  // ─── deleteCharacter ──────────────────────────────────────────────────────

  describe('deleteCharacter()', () => {
    it('supprime le personnage ciblé par ID', () => {
      // Pré-charge des personnages avec des IDs stables
      useCharactersStore.setState({
        characters: [
          { id: 'char-del-1', name: 'Premier', description: '', sprites: {}, moods: ['neutral'] },
          { id: 'char-del-2', name: 'Second', description: '', sprites: {}, moods: ['neutral'] },
        ]
      });
      const { deleteCharacter } = useCharactersStore.getState();
      deleteCharacter('char-del-1');
      const chars = useCharactersStore.getState().characters;
      expect(chars).toHaveLength(1);
      expect(chars[0].id).toBe('char-del-2');
    });

    it('est un no-op pour un ID inconnu', () => {
      const { addCharacter, deleteCharacter } = useCharactersStore.getState();
      addCharacter();
      deleteCharacter('unknown-id');
      expect(useCharactersStore.getState().characters).toHaveLength(1);
    });

    it('fonctionne sur une liste vide sans erreur', () => {
      const { deleteCharacter } = useCharactersStore.getState();
      expect(() => deleteCharacter('any-id')).not.toThrow();
    });
  });

  // ─── getCharacterById ─────────────────────────────────────────────────────

  describe('getCharacterById()', () => {
    it('retourne le personnage correspondant', () => {
      const { addCharacter, updateCharacter, getCharacterById } = useCharactersStore.getState();
      const id = addCharacter();
      updateCharacter({ id, name: 'Bob' });
      const char = getCharacterById(id);
      expect(char).toBeDefined();
      expect(char.name).toBe('Bob');
    });

    it('retourne undefined pour un ID inconnu', () => {
      const { getCharacterById } = useCharactersStore.getState();
      expect(getCharacterById('unknown')).toBeUndefined();
    });
  });

  // ─── importCharacters ─────────────────────────────────────────────────────

  describe('importCharacters()', () => {
    it('remplace complètement les personnages existants', () => {
      const { addCharacter, importCharacters } = useCharactersStore.getState();
      addCharacter();
      addCharacter();
      const imported = [
        { id: 'hero', name: 'Héros', description: '', sprites: {}, moods: ['neutral'] },
      ];
      importCharacters(imported);
      const chars = useCharactersStore.getState().characters;
      expect(chars).toHaveLength(1);
      expect(chars[0].name).toBe('Héros');
    });

    it('accepte un tableau vide (reset complet)', () => {
      const { addCharacter, importCharacters } = useCharactersStore.getState();
      addCharacter();
      importCharacters([]);
      expect(useCharactersStore.getState().characters).toHaveLength(0);
    });
  });
});
