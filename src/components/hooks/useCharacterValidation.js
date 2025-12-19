import { useMemo } from 'react';

export const useCharacterValidation = (characters, currentCharacter) => {
  const validate = useMemo(() => {
    return (field, value) => {
      const errors = [];

      switch (field) {
        case 'name':
          if (!value || value.trim() === '') {
            errors.push('Name is required');
          }
          
          // Vérification d'unicité (excluant le personnage en cours d'édition)
          const isDuplicate = characters.some(
            c => c.id !== currentCharacter?.id && 
                 c.name.toLowerCase() === value.toLowerCase()
          );
          
          if (isDuplicate) {
            errors.push('A character with this name already exists');
          }
          break;

        case 'description':
          if (value && value.length > 500) {
            errors.push('Description must be less than 500 characters');
          }
          break;

        default:
          break;
      }

      return errors;
    };
  }, [characters, currentCharacter]);

  const validateAll = useMemo(() => {
    return (character) => {
      const allErrors = {};
      
      const nameErrors = validate('name', character.name);
      if (nameErrors.length > 0) allErrors.name = nameErrors;

      const descErrors = validate('description', character.description);
      if (descErrors.length > 0) allErrors.description = descErrors;

      return {
        isValid: Object.keys(allErrors).length === 0,
        errors: allErrors
      };
    };
  }, [validate]);

  return { validate, validateAll };
};
