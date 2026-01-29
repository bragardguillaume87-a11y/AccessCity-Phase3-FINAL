import { useState, useCallback, useEffect } from 'react';
import { useCharacterValidation } from './useCharacterValidation';
import type { Character } from '@/types';

/**
 * Form data structure for character editing
 */
interface CharacterFormData {
  /** Unique character identifier */
  id: string;
  /** Character display name */
  name: string;
  /** Character description */
  description: string;
  /** List of mood identifiers (e.g., ['neutral', 'happy', 'sad']) */
  moods: string[];
  /** Mapping of mood IDs to sprite file paths */
  sprites: Record<string, string>;
}

/**
 * Union type for all possible field values in CharacterFormData
 */
type CharacterFormFieldValue = string | string[] | Record<string, string>;

/**
 * Validation result structure
 */
interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Validation errors by field */
  errors?: Record<string, string[]>;
  /** Validation warnings by field */
  warnings?: Record<string, string[]>;
}

/**
 * Return type for useCharacterForm hook
 */
interface UseCharacterFormReturn {
  /** Current form data state */
  formData: CharacterFormData;
  /** Currently active tab in the form */
  activeTab: string;
  /** Set active tab */
  setActiveTab: (tab: string) => void;
  /** Current validation errors by field */
  errors: Record<string, string[]>;
  /** Current validation warnings by field */
  warnings: Record<string, string[]>;
  /** Whether the form has unsaved changes */
  hasChanges: boolean;
  /** Update a single form field */
  updateField: (field: keyof CharacterFormData, value: CharacterFormFieldValue) => void;
  /** Add a new mood to the character */
  addMood: (moodId: string) => boolean;
  /** Remove a mood from the character */
  removeMood: (moodId: string) => boolean;
  /** Update sprite path for a specific mood */
  updateSprite: (mood: string, spritePath: string) => void;
  /** Rename an existing mood */
  renameMood: (oldMoodId: string, newMoodId: string) => boolean;
  /** Validate and save the form */
  handleSave: () => boolean;
  /** Reset form to initial values */
  resetForm: () => void;
}

/**
 * useCharacterForm - Manage character editor form state
 *
 * Provides comprehensive form state management for character editing,
 * including field updates, mood management, sprite assignment, and validation.
 *
 * @param initialCharacter - The character to edit
 * @param characters - All characters (for validation)
 * @param onSave - Callback when form is saved successfully
 * @returns Form state and handlers
 *
 * @example
 * const {
 *   formData,
 *   activeTab,
 *   errors,
 *   updateField,
 *   addMood,
 *   handleSave
 * } = useCharacterForm(character, allCharacters, (updated) => {
 *   console.log('Character saved:', updated);
 * });
 */
export function useCharacterForm(
  initialCharacter: Character,
  characters: Character[],
  onSave: (character: Character) => void
): UseCharacterFormReturn {
  // Ensure moods and sprites are initialized
  const [formData, setFormData] = useState<CharacterFormData>({
    ...initialCharacter,
    moods: initialCharacter.moods || ['neutral'],
    sprites: initialCharacter.sprites || {}
  });

  const [activeTab, setActiveTab] = useState<string>('identity');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const { validateAll } = useCharacterValidation(characters, initialCharacter);

  // Reset form when initialCharacter changes (different character selected)
  useEffect(() => {
    setFormData({
      ...initialCharacter,
      moods: initialCharacter.moods || ['neutral'],
      sprites: initialCharacter.sprites || {}
    });
    setErrors({});
    setWarnings({});
    setHasChanges(false);
  }, [initialCharacter.id]);

  /**
   * Update a form field
   */
  const updateField = useCallback((field: keyof CharacterFormData, value: CharacterFormFieldValue): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Add a new mood
   */
  const addMood = useCallback((moodId: string): boolean => {
    if (!moodId || !moodId.trim()) return false;

    const trimmedMood = moodId.trim().toLowerCase();

    // Check if mood already exists
    if (formData.moods.includes(trimmedMood)) {
      setErrors(prev => ({ ...prev, moods: [`Mood "${trimmedMood}" already exists`] }));
      return false;
    }

    setFormData(prev => ({
      ...prev,
      moods: [...prev.moods, trimmedMood],
      sprites: { ...prev.sprites, [trimmedMood]: '' }
    }));
    setHasChanges(true);
    return true;
  }, [formData.moods]);

  /**
   * Remove a mood
   */
  const removeMood = useCallback((moodId: string): boolean => {
    // Prevent removing the last mood
    if (formData.moods.length === 1) {
      setErrors(prev => ({ ...prev, moods: ['Character must have at least one mood'] }));
      return false;
    }

    setFormData(prev => {
      const newMoods = prev.moods.filter(m => m !== moodId);
      const newSprites = { ...prev.sprites };
      delete newSprites[moodId];

      return {
        ...prev,
        moods: newMoods,
        sprites: newSprites
      };
    });
    setHasChanges(true);
    return true;
  }, [formData.moods]);

  /**
   * Update sprite for a mood
   */
  const updateSprite = useCallback((mood: string, spritePath: string): void => {
    setFormData(prev => ({
      ...prev,
      sprites: { ...prev.sprites, [mood]: spritePath }
    }));
    setHasChanges(true);

    // Clear sprite warnings if we just assigned a sprite
    if (spritePath && warnings.sprites) {
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings.sprites;
        return newWarnings;
      });
    }
  }, [warnings.sprites]);

  /**
   * Rename a mood
   */
  const renameMood = useCallback((oldMoodId: string, newMoodId: string): boolean => {
    if (!newMoodId || !newMoodId.trim()) return false;

    const trimmedNewMood = newMoodId.trim().toLowerCase();

    // Check if new name already exists (and is not the same mood)
    if (trimmedNewMood !== oldMoodId && formData.moods.includes(trimmedNewMood)) {
      setErrors(prev => ({ ...prev, moods: [`Mood "${trimmedNewMood}" already exists`] }));
      return false;
    }

    setFormData(prev => {
      const newMoods = prev.moods.map(m => m === oldMoodId ? trimmedNewMood : m);
      const newSprites = { ...prev.sprites };

      // Transfer sprite from old mood to new mood
      if (newSprites[oldMoodId] !== undefined) {
        newSprites[trimmedNewMood] = newSprites[oldMoodId];
        delete newSprites[oldMoodId];
      }

      return {
        ...prev,
        moods: newMoods,
        sprites: newSprites
      };
    });
    setHasChanges(true);
    return true;
  }, [formData.moods]);

  /**
   * Validate and save the form
   */
  const handleSave = useCallback((): boolean => {
    const validation = validateAll(formData) as ValidationResult;

    if (!validation.isValid) {
      setErrors(validation.errors || {});
      setWarnings(validation.warnings || {});
      return false;
    }

    // Show warnings but allow save
    setWarnings(validation.warnings || {});

    onSave(formData as Character);
    setHasChanges(false);
    return true;
  }, [formData, validateAll, onSave]);

  /**
   * Reset form to original values
   */
  const resetForm = useCallback((): void => {
    setFormData({
      ...initialCharacter,
      moods: initialCharacter.moods || ['neutral'],
      sprites: initialCharacter.sprites || {}
    });
    setErrors({});
    setWarnings({});
    setHasChanges(false);
  }, [initialCharacter]);

  return {
    formData,
    activeTab,
    setActiveTab,
    errors,
    warnings,
    hasChanges,
    updateField,
    addMood,
    removeMood,
    updateSprite,
    renameMood,
    handleSave,
    resetForm
  };
}
