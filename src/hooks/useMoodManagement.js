import { useState, useEffect } from 'react';

/**
 * Custom hook for managing character moods
 *
 * Handles mood creation, deletion, and validation.
 * Prevents duplicate moods, enforces character limits, and protects the "neutral" mood.
 *
 * @param {Object} params
 * @param {Object|null} params.character - Current character object
 * @param {Array} params.characters - All available characters
 * @param {Object|null} params.selectedElement - Current selected element {type, id}
 * @param {Function} params.updateCharacter - Callback to update character in store
 * @returns {Object} Mood state and handlers
 *
 * @example
 * const {
 *   newMood,
 *   setNewMood,
 *   activeMood,
 *   setActiveMood,
 *   moodError,
 *   setMoodError,
 *   handleAddMood,
 *   handleRemoveMood
 * } = useMoodManagement({ character, characters, selectedElement, updateCharacter });
 */
export function useMoodManagement({ character, characters, selectedElement, updateCharacter }) {
  const [newMood, setNewMood] = useState('');
  const [activeMood, setActiveMood] = useState('neutral');
  const [moodError, setMoodError] = useState('');

  // Sync activeMood when character changes
  useEffect(() => {
    if (selectedElement?.type === 'character') {
      const char = characters.find(c => c.id === selectedElement.id);
      if (char && char.moods && char.moods.length > 0) {
        setActiveMood(char.moods[0]);
      } else {
        setActiveMood('neutral');
      }
    }
  }, [selectedElement, characters]);

  const handleAddMood = () => {
    const trimmed = newMood.trim();

    // Validation
    if (!trimmed) {
      setMoodError('Mood name cannot be empty');
      return;
    }

    if (trimmed.length > 20) {
      setMoodError('Mood name too long (20 chars max)');
      return;
    }

    const moods = character.moods || [];
    if (moods.includes(trimmed)) {
      setMoodError('This mood already exists');
      return;
    }

    // Success
    updateCharacter({
      ...character,
      moods: [...moods, trimmed],
      sprites: { ...character.sprites, [trimmed]: '' }
    });
    setNewMood('');
    setMoodError('');
    setActiveMood(trimmed);
  };

  const handleRemoveMood = (moodToRemove) => {
    if (moodToRemove === 'neutral') {
      alert('Cannot remove the "neutral" mood');
      return;
    }
    const moods = (character.moods || []).filter(m => m !== moodToRemove);
    const sprites = { ...character.sprites };
    delete sprites[moodToRemove];
    updateCharacter({ ...character, moods, sprites });
    if (activeMood === moodToRemove) {
      setActiveMood(moods[0] || 'neutral');
    }
  };

  return {
    newMood,
    setNewMood,
    activeMood,
    setActiveMood,
    moodError,
    setMoodError,
    handleAddMood,
    handleRemoveMood
  };
}
