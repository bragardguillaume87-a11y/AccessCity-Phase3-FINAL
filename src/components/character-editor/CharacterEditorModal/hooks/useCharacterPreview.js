import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing character preview mood navigation
 * Extracted from CharacterEditorModal for better organization
 *
 * Features:
 * - Manages preview mood state
 * - Auto-updates when moods list changes
 * - Provides navigation helpers (next/previous)
 *
 * @param {Array} moods - Array of mood names
 * @returns {Object} { previewMood, setPreviewMood, navigateMood }
 */
export function useCharacterPreview(moods) {
  const [previewMood, setPreviewMood] = useState('neutral');

  // Set preview mood to first available mood when moods change
  useEffect(() => {
    if (moods.length > 0 && !moods.includes(previewMood)) {
      setPreviewMood(moods[0]);
    }
  }, [moods, previewMood]);

  // Navigate to next/previous mood
  const navigateMood = useCallback((direction) => {
    const currentIndex = moods.indexOf(previewMood);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % moods.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + moods.length) % moods.length;
    } else {
      return;
    }

    setPreviewMood(moods[newIndex]);
  }, [moods, previewMood]);

  return {
    previewMood,
    setPreviewMood,
    navigateMood
  };
}
