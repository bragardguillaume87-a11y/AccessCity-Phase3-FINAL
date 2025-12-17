import { useContext, useCallback } from 'react';
import { AppContext } from '../../AppContext';

export const useCharacters = () => {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useContext(AppContext);

  const createCharacter = useCallback(() => {
    const newChar = {
      name: "Nouveau Personnage",
      description: "",
      sprites: { neutral: "", professional: "", helpful: "" },
      moods: ["neutral", "professional", "helpful"]
    };
    return addCharacter(newChar);
  }, [addCharacter]);

  const removeCharacter = useCallback((charId) => {
    if (charId === 'player' || charId === 'counsellor') {
      return { success: false, error: "Impossible de supprimer les personnages système." };
    }
    deleteCharacter(charId);
    return { success: true };
  }, [deleteCharacter]);

  const duplicateCharacter = useCallback((charId) => {
    const original = characters.find(c => c.id === charId);
    if (!original) return null;
    const { id, ...rest } = original;
    return addCharacter({ ...rest, name: `${original.name} (Copie)` });
  }, [characters, addCharacter]);

  return { characters, createCharacter, duplicateCharacter, removeCharacter, updateCharacter };
};
