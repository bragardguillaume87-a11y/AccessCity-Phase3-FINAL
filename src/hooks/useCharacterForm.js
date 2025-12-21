import { useState, useCallback } from 'react';
import { useCharacterValidation } from './useCharacterValidation.js';

/**
 * useCharacterForm - Manage character editor form state
 *
 * @param {Object} initialCharacter - The character to edit
 * @param {Array} characters - All characters (for validation)
 * @param {Function} onSave - Callback when form is saved
 * @returns {Object} Form state and handlers
 */
export function useCharacterForm(initialCharacter, characters, onSave) {
  // Ensure moods and sprites are initialized
  const [formData, setFormData] = useState({
    ...initialCharacter,
    moods: initialCharacter.moods || ['neutral'],
    sprites: initialCharacter.sprites || {}
  });

  const [activeTab, setActiveTab] = useState('identity');
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { validateAll } = useCharacterValidation(characters, initialCharacter);

  // Update a form field
  const updateField = useCallback((field, value) => {
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

  // Add a new mood
  const addMood = useCallback((moodId) => {
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

  // Remove a mood
  const removeMood = useCallback((moodId) => {
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

  // Update sprite for a mood
  const updateSprite = useCallback((mood, spritePath) => {
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

  // Rename a mood
  const renameMood = useCallback((oldMoodId, newMoodId) => {
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

  // Validate and save the form
  const handleSave = useCallback(() => {
    const validation = validateAll(formData);

    if (!validation.isValid) {
      setErrors(validation.errors || {});
      setWarnings(validation.warnings || {});
      return false;
    }

    // Show warnings but allow save
    setWarnings(validation.warnings || {});

    onSave(formData);
    setHasChanges(false);
    return true;
  }, [formData, validateAll, onSave]);

  // Reset form to original values
  const resetForm = useCallback(() => {
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
