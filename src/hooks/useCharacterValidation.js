/**
 * useCharacterValidation - Comprehensive validation hook for character data
 *
 * @param {Array} characters - All existing characters
 * @param {Object} currentCharacter - The character being edited (null for new)
 * @returns {Object} Validation functions
 */
export function useCharacterValidation(characters, currentCharacter) {
  /**
   * Validate all character fields
   * @param {Object} formData - The character data to validate
   * @returns {Object} { isValid: boolean, errors: {}, warnings: {} }
   */
  const validateAll = (formData) => {
    const errors = {};
    const warnings = {};

    // Validate name (required, min length, unique)
    if (!formData.name || !formData.name.trim()) {
      errors.name = ['Character name is required'];
    } else if (formData.name.trim().length < 1) {
      errors.name = ['Name must be at least 1 character'];
    } else if (formData.name.trim().length > 50) {
      errors.name = ['Name must be less than 50 characters'];
    } else {
      // Check for duplicate names (case-insensitive)
      const isDuplicate = characters.some(char =>
        char.id !== currentCharacter?.id &&
        char.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );

      if (isDuplicate) {
        errors.name = ['A character with this name already exists'];
      }
    }

    // Validate moods (at least one required)
    if (!formData.moods || formData.moods.length === 0) {
      errors.moods = ['Character must have at least one mood'];
    } else {
      // Check for duplicate moods
      const uniqueMoods = new Set(formData.moods.map(m => m.toLowerCase()));
      if (uniqueMoods.size < formData.moods.length) {
        errors.moods = ['Duplicate moods are not allowed'];
      }

      // Check for empty mood names
      if (formData.moods.some(m => !m || !m.trim())) {
        errors.moods = ['Mood names cannot be empty'];
      }
    }

    // Validate description (optional, but check length if provided)
    if (formData.description && formData.description.length > 500) {
      errors.description = ['Description must be less than 500 characters'];
    }

    // Check for sprites (warnings, not errors)
    if (formData.moods && formData.moods.length > 0) {
      const moodsWithoutSprites = formData.moods.filter(mood =>
        !formData.sprites || !formData.sprites[mood]
      );

      if (moodsWithoutSprites.length > 0) {
        warnings.sprites = [
          `${moodsWithoutSprites.length} mood(s) don't have sprites assigned: ${moodsWithoutSprites.join(', ')}`
        ];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  };

  /**
   * Validate a specific field
   * @param {string} field - Field name to validate
   * @param {*} value - Field value
   * @param {Object} formData - Full form data for context
   * @returns {Array|null} Array of error messages or null
   */
  const validateField = (field, value, formData) => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          return ['Character name is required'];
        }
        if (value.trim().length < 1) {
          return ['Name must be at least 1 character'];
        }
        if (value.trim().length > 50) {
          return ['Name must be less than 50 characters'];
        }

        const isDuplicate = characters.some(char =>
          char.id !== currentCharacter?.id &&
          char.name.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (isDuplicate) {
          return ['A character with this name already exists'];
        }
        return null;

      case 'description':
        if (value && value.length > 500) {
          return ['Description must be less than 500 characters'];
        }
        return null;

      case 'moods':
        if (!value || value.length === 0) {
          return ['Character must have at least one mood'];
        }
        return null;

      default:
        return null;
    }
  };

  return {
    validateAll,
    validateField
  };
}
