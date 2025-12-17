import { useMemo } from 'react';
export const useCharacterValidation = (characters, currentCharacter) => {
  return useMemo(() => {
    if (!currentCharacter) return { isValid: false, errors: {} };
    const errors = {};
    if (!currentCharacter.name?.trim()) errors.name = "Le nom est requis.";
    return { isValid: Object.keys(errors).length === 0, errors };
  }, [characters, currentCharacter]);
};
