/**
 * Hook de validation pour les personnages
 * Fournit des fonctions de validation réutilisables
 */
export const useCharacterValidation = (allCharacters = [], currentCharacter = null) => {
  /**
   * Valide le nom d'un personnage
   * @param {string} name - Le nom à valider
   * @returns {array} Tableau d'erreurs (vide si valide)
   */
  const validateName = (name) => {
    const errors = [];

    if (!name || name.trim() === '') {
      errors.push('Le nom est obligatoire');
      return errors;
    }

    if (name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (name.trim().length > 50) {
      errors.push('Le nom ne peut pas dépasser 50 caractères');
    }

    // Vérifier les doublons (sauf pour le personnage en cours d'édition)
    const isDuplicate = allCharacters.some(
      c => c.id !== currentCharacter?.id && c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      errors.push('Un personnage avec ce nom existe déjà');
    }

    return errors;
  };

  /**
   * Valide la description d'un personnage
   * @param {string} description - La description à valider
   * @returns {array} Tableau d'erreurs (vide si valide)
   */
  const validateDescription = (description) => {
    const errors = [];

    if (description && description.length > 500) {
      errors.push('La description ne peut pas dépasser 500 caractères');
    }

    return errors;
  };

  /**
   * Valide tous les champs d'un personnage
   * @param {object} character - L'objet personnage à valider
   * @returns {object} { isValid: boolean, errors: { field: [error1, error2, ...] } }
   */
  const validateAll = (character) => {
    const errors = {};

    const nameErrors = validateName(character.name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    const descErrors = validateDescription(character.description);
    if (descErrors.length > 0) {
      errors.description = descErrors;
    }

    const isValid = Object.keys(errors).length === 0;

    return { isValid, errors };
  };

  return {
    validateName,
    validateDescription,
    validateAll
  };
};
