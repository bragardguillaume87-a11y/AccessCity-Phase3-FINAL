import { useState, useCallback } from 'react';

/**
 * Mood rename hook return value
 */
export interface UseMoodRenameReturn {
  /** Mood currently being renamed (null if not renaming) */
  renamingMood: string | null;
  /** Current value of rename input */
  renameInput: string;
  /** Set rename input value */
  setRenameInput: (value: string) => void;
  /** Start renaming a mood */
  startRename: (moodName: string) => void;
  /** Confirm rename (apply change) */
  confirmRename: () => void;
  /** Cancel rename (discard change) */
  cancelRename: () => void;
}

/**
 * Custom hook for managing mood rename state
 *
 * Features:
 * - Manages rename mode state (which mood is being renamed)
 * - Manages rename input value
 * - Provides helpers to start/confirm/cancel rename
 *
 * Extracted from CharacterEditorModal for better organization.
 *
 * @param onRenameMood - Callback function to rename a mood
 * @returns Rename state and control functions
 *
 * @example
 * ```typescript
 * const { renamingMood, renameInput, startRename, confirmRename } = useMoodRename(
 *   (oldName, newName) => updateMood(oldName, newName)
 * );
 * startRename('happy'); // Start renaming "happy" mood
 * confirmRename(); // Apply the rename
 * ```
 */
export function useMoodRename(
  onRenameMood: (oldMood: string, newMood: string) => void
): UseMoodRenameReturn {
  const [renamingMood, setRenamingMood] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  const startRename = useCallback((moodName: string) => {
    setRenamingMood(moodName);
    setRenameInput(moodName);
  }, []);

  const confirmRename = useCallback(() => {
    if (renamingMood && renameInput.trim() && renameInput !== renamingMood) {
      onRenameMood(renamingMood, renameInput.trim());
    }
    setRenamingMood(null);
    setRenameInput('');
  }, [renamingMood, renameInput, onRenameMood]);

  const cancelRename = useCallback(() => {
    setRenamingMood(null);
    setRenameInput('');
  }, []);

  return {
    renamingMood,
    renameInput,
    setRenameInput,
    startRename,
    confirmRename,
    cancelRename
  };
}
