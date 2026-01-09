import { useState, useEffect, useCallback } from 'react';
import type { Character, SelectedElementType } from '@/types';

/**
 * Parameters for useMoodManagement hook
 */
interface UseMoodManagementParams {
  /** Current character object */
  character: Character | null;
  /** All available characters */
  characters: Character[];
  /** Current selected element {type, id} */
  selectedElement: SelectedElementType;
  /** Callback to update character in store */
  updateCharacter: (updated: Character) => void;
}

/**
 * Return type for useMoodManagement hook
 */
interface UseMoodManagementReturn {
  /** Current input value for new mood */
  newMood: string;
  /** Set new mood input value */
  setNewMood: (mood: string) => void;
  /** Currently active mood being edited/displayed */
  activeMood: string;
  /** Set active mood */
  setActiveMood: (mood: string) => void;
  /** Current mood validation error message */
  moodError: string;
  /** Set mood error message */
  setMoodError: (error: string) => void;
  /** Handler to add a new mood to the character */
  handleAddMood: () => void;
  /** Handler to remove a mood from the character */
  handleRemoveMood: (moodToRemove: string) => void;
}

/**
 * Custom hook for managing character moods
 *
 * Handles mood creation, deletion, and validation.
 * Prevents duplicate moods, enforces character limits, and protects the "neutral" mood.
 *
 * @param params - Hook parameters
 * @param params.character - Current character object
 * @param params.characters - All available characters
 * @param params.selectedElement - Current selected element {type, id}
 * @param params.updateCharacter - Callback to update character in store
 * @returns Mood state and handlers
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
export function useMoodManagement({
  character,
  characters,
  selectedElement,
  updateCharacter
}: UseMoodManagementParams): UseMoodManagementReturn {
  const [newMood, setNewMood] = useState<string>('');
  const [activeMood, setActiveMood] = useState<string>('neutral');
  const [moodError, setMoodError] = useState<string>('');

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

  const handleAddMood = useCallback((): void => {
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

    if (!character) {
      setMoodError('No character selected');
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
  }, [newMood, character, updateCharacter]);

  const handleRemoveMood = useCallback((moodToRemove: string): void => {
    if (moodToRemove === 'neutral') {
      alert('Cannot remove the "neutral" mood');
      return;
    }

    if (!character) {
      return;
    }

    const moods = (character.moods || []).filter(m => m !== moodToRemove);
    const sprites = { ...character.sprites };
    delete sprites[moodToRemove];
    updateCharacter({ ...character, moods, sprites });
    if (activeMood === moodToRemove) {
      setActiveMood(moods[0] || 'neutral');
    }
  }, [character, activeMood, updateCharacter]);

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
