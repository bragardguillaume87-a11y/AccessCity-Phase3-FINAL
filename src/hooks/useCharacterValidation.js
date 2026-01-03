import { useMemo } from 'react';
import { VALIDATION_RULES } from '@/config/constants';

/**
 * Unified Character Validation Hook
 *
 * Consolidates all character validation logic with:
 * - Performance optimization (useMemo)
 * - Comprehensive validation (name, moods, description, sprites)
 * - i18n support (messages can be translated)
 * - Warnings for missing sprites
 *
 * @param {Array} characters - All existing characters
 * @param {Object} currentCharacter - The character being edited (null for new)
 * @param {Object} options - Configuration options
 * @param {string} options.locale - Locale for messages ('en' | 'fr'), default 'en'
 * @returns {Object} Validation functions
 *
 * @example
 * const { validateAll, validateField } = useCharacterValidation(characters, editingChar);
 * const result = validateAll(formData);
 * // { isValid: false, errors: { name: ['Name is required'] }, warnings: {} }
 */
export function useCharacterValidation(characters = [], currentCharacter = null, options = {}) {
  const { locale = 'en' } = options;

  // Validation messages (i18n ready)
  const messages = useMemo(() => {
    const i18n = {
      en: {
        nameRequired: 'Character name is required',
        nameMinLength: `Name must be at least ${VALIDATION_RULES.CHARACTER_NAME_MIN_LENGTH} character`,
        nameMaxLength: `Name must be less than ${VALIDATION_RULES.CHARACTER_NAME_MAX_LENGTH} characters`,
        nameDuplicate: 'A character with this name already exists',

        descriptionMaxLength: `Description must be less than ${VALIDATION_RULES.CHARACTER_DESCRIPTION_MAX_LENGTH} characters`,

        moodsRequired: `Character must have at least ${VALIDATION_RULES.CHARACTER_MOODS_MIN} mood`,
        moodsDuplicate: 'Duplicate moods are not allowed',
        moodsEmpty: 'Mood names cannot be empty',

        spritesWarning: (count, moods) => `${count} mood(s) don't have sprites assigned: ${moods}`,
      },
      fr: {
        nameRequired: 'Le nom du personnage est obligatoire',
        nameMinLength: `Le nom doit contenir au moins ${VALIDATION_RULES.CHARACTER_NAME_MIN_LENGTH} caractère`,
        nameMaxLength: `Le nom ne peut pas dépasser ${VALIDATION_RULES.CHARACTER_NAME_MAX_LENGTH} caractères`,
        nameDuplicate: 'Un personnage avec ce nom existe déjà',

        descriptionMaxLength: `La description ne peut pas dépasser ${VALIDATION_RULES.CHARACTER_DESCRIPTION_MAX_LENGTH} caractères`,

        moodsRequired: `Le personnage doit avoir au moins ${VALIDATION_RULES.CHARACTER_MOODS_MIN} humeur`,
        moodsDuplicate: 'Les humeurs en double ne sont pas autorisées',
        moodsEmpty: 'Les noms d\'humeur ne peuvent pas être vides',

        spritesWarning: (count, moods) => `${count} humeur(s) n'ont pas de sprites assignés : ${moods}`,
      }
    };

    return i18n[locale] || i18n.en;
  }, [locale]);

  /**
   * Validate name field
   */
  const validateName = useMemo(() => {
    return (value) => {
      const errors = [];

      if (!value || !value.trim()) {
        errors.push(messages.nameRequired);
        return errors;
      }

      if (value.trim().length < VALIDATION_RULES.CHARACTER_NAME_MIN_LENGTH) {
        errors.push(messages.nameMinLength);
      }

      if (value.trim().length > VALIDATION_RULES.CHARACTER_NAME_MAX_LENGTH) {
        errors.push(messages.nameMaxLength);
      }

      // Check for duplicate names (case-insensitive)
      const isDuplicate = characters.some(char =>
        char.id !== currentCharacter?.id &&
        char.name.trim().toLowerCase() === value.trim().toLowerCase()
      );

      if (isDuplicate) {
        errors.push(messages.nameDuplicate);
      }

      return errors;
    };
  }, [characters, currentCharacter, messages]);

  /**
   * Validate description field
   */
  const validateDescription = useMemo(() => {
    return (value) => {
      const errors = [];

      if (value && value.length > VALIDATION_RULES.CHARACTER_DESCRIPTION_MAX_LENGTH) {
        errors.push(messages.descriptionMaxLength);
      }

      return errors;
    };
  }, [messages]);

  /**
   * Validate moods field
   */
  const validateMoods = useMemo(() => {
    return (value) => {
      const errors = [];

      if (!value || value.length < VALIDATION_RULES.CHARACTER_MOODS_MIN) {
        errors.push(messages.moodsRequired);
        return errors;
      }

      // Check for duplicate moods (case-insensitive)
      const uniqueMoods = new Set(value.map(m => m.toLowerCase()));
      if (uniqueMoods.size < value.length) {
        errors.push(messages.moodsDuplicate);
      }

      // Check for empty mood names
      if (value.some(m => !m || !m.trim())) {
        errors.push(messages.moodsEmpty);
      }

      return errors;
    };
  }, [messages]);

  /**
   * Validate a specific field
   * @param {string} field - Field name ('name' | 'description' | 'moods')
   * @param {*} value - Field value
   * @returns {Array} Array of error messages (empty if valid)
   */
  const validateField = useMemo(() => {
    return (field, value) => {
      switch (field) {
        case 'name':
          return validateName(value);
        case 'description':
          return validateDescription(value);
        case 'moods':
          return validateMoods(value);
        default:
          return [];
      }
    };
  }, [validateName, validateDescription, validateMoods]);

  /**
   * Validate all character fields
   * @param {Object} formData - The character data to validate
   * @returns {Object} { isValid: boolean, errors: {}, warnings: {} }
   */
  const validateAll = useMemo(() => {
    return (formData) => {
      const errors = {};
      const warnings = {};

      // Validate name
      const nameErrors = validateName(formData.name);
      if (nameErrors.length > 0) {
        errors.name = nameErrors;
      }

      // Validate description
      const descErrors = validateDescription(formData.description);
      if (descErrors.length > 0) {
        errors.description = descErrors;
      }

      // Validate moods
      const moodsErrors = validateMoods(formData.moods);
      if (moodsErrors.length > 0) {
        errors.moods = moodsErrors;
      }

      // Check for sprites (warnings, not errors)
      if (formData.moods && formData.moods.length > 0) {
        const moodsWithoutSprites = formData.moods.filter(mood =>
          !formData.sprites || !formData.sprites[mood]
        );

        if (moodsWithoutSprites.length > 0) {
          warnings.sprites = [
            messages.spritesWarning(
              moodsWithoutSprites.length,
              moodsWithoutSprites.join(', ')
            )
          ];
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      };
    };
  }, [validateName, validateDescription, validateMoods, messages]);

  return {
    validateAll,
    validateField,
    validateName,
    validateDescription,
    validateMoods,
  };
}
