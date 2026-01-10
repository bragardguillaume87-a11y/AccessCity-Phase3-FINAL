import { useState, useEffect, useCallback } from 'react';

/**
 * Navigation direction for mood preview
 */
export type MoodNavigationDirection = 'next' | 'prev';

/**
 * Character preview hook return value
 */
export interface UseCharacterPreviewReturn {
  /** Current preview mood */
  previewMood: string;
  /** Set preview mood */
  setPreviewMood: (mood: string) => void;
  /** Navigate to next/previous mood */
  navigateMood: (direction: MoodNavigationDirection) => void;
}

/**
 * Custom hook for managing character preview mood navigation
 *
 * Features:
 * - Manages preview mood state
 * - Auto-updates when moods list changes
 * - Provides navigation helpers (next/previous)
 *
 * Extracted from CharacterEditorModal for better organization.
 *
 * @param moods - Array of mood names
 * @returns Preview mood state and navigation helpers
 *
 * @example
 * ```typescript
 * const { previewMood, setPreviewMood, navigateMood } = useCharacterPreview(
 *   ['neutral', 'happy', 'sad']
 * );
 * navigateMood('next'); // Switch to next mood
 * ```
 */
export function useCharacterPreview(moods: string[]): UseCharacterPreviewReturn {
  const [previewMood, setPreviewMood] = useState<string>('neutral');

  // Set preview mood to first available mood when moods change
  useEffect(() => {
    if (moods.length > 0 && !moods.includes(previewMood)) {
      setPreviewMood(moods[0]);
    }
  }, [moods, previewMood]);

  // Navigate to next/previous mood
  const navigateMood = useCallback((direction: MoodNavigationDirection) => {
    const currentIndex = moods.indexOf(previewMood);
    if (currentIndex === -1) return;

    let newIndex: number;
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
