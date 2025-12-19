import { useContext, useCallback } from 'react';
// Ajustement du chemin pour remonter à la racine src/
import { AppContext } from '../../../../AppContext';

export const useCharacters = () => {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useContext(AppContext);

  const createCharacter = useCallback(() => {
    const newChar = {
      name: 'New Character',
      description: '',
      sprites: {
        neutral: 'assets/characters/default/neutral.svg',
        professional: 'assets/characters/default/professional.svg',
        helpful: 'assets/characters/default/helpful.svg'
      },
      moods: ['neutral', 'professional', 'helpful']
    };
    
    return addCharacter(newChar);
  }, [addCharacter]);

  const duplicateCharacter = useCallback((charId) => {
    const original = characters.find(c => c.id === charId);
    if (!original) return null;

    // On retire l'ID pour que addCharacter en génère un nouveau
    const { id, ...rest } = original;
    
    const duplicate = {
      ...rest,
      name: `${original.name} (Copy)`
    };

    return addCharacter(duplicate);
  }, [characters, addCharacter]);

  const removeCharacter = useCallback((charId) => {
    // Protection contre la suppression des personnages système
    if (charId === 'player' || charId === 'counsellor') {
      return { success: false, error: 'Cannot delete core characters' };
    }

    deleteCharacter(charId);
    return { success: true };
  }, [deleteCharacter]);

  return {
    characters,
    createCharacter,
    duplicateCharacter,
    removeCharacter,
    updateCharacter
  };
};
