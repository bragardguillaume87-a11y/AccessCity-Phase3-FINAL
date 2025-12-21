import { useCharactersStore } from '../../../../stores/index.js';

/**
 * Hook personnalisé pour gérer les personnages
 * Encapsule toute la logique CRUD des personnages
 */
export const useCharacters = () => {
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);

  /**
   * Crée un nouveau personnage avec des valeurs par défaut
   * @returns {string} L'ID du nouveau personnage créé
   */
  const createCharacter = () => {
    const newCharacter = {
      name: 'Nouveau personnage',
      description: '',
      sprites: {},
      moods: ['neutral']
    };

    const id = addCharacter(newCharacter);
    return id;
  };

  /**
   * Duplique un personnage existant
   * @param {string} characterId - L'ID du personnage à dupliquer
   * @returns {string|null} L'ID du personnage dupliqué ou null si échec
   */
  const duplicateCharacter = (characterId) => {
    const original = characters.find(c => c.id === characterId);
    if (!original) return null;

    // Créer une copie avec un nouveau nom
    const duplicate = {
      ...original,
      name: `${original.name} (copie)`,
      sprites: { ...original.sprites },
      moods: [...(original.moods || [])]
    };

    const newId = addCharacter(duplicate);
    return newId;
  };

  /**
   * Supprime un personnage avec validation
   * @param {string} characterId - L'ID du personnage à supprimer
   * @returns {object} { success: boolean, error?: string }
   */
  const removeCharacter = (characterId) => {
    const character = characters.find(c => c.id === characterId);

    if (!character) {
      return { success: false, error: 'Personnage introuvable' };
    }

    // Vérification : ne pas supprimer les personnages système
    const systemCharacters = ['player', 'narrator'];
    if (systemCharacters.includes(characterId)) {
      return {
        success: false,
        error: 'Impossible de supprimer un personnage système (Joueur ou Narrateur)'
      };
    }

    deleteCharacter(characterId);
    return { success: true };
  };

  return {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter
  };
};
