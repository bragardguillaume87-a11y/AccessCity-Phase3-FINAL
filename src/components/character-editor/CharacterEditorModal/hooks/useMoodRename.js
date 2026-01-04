import { useState, useCallback } from 'react';

/**
 * Custom hook for managing mood rename state
 * Extracted from CharacterEditorModal for better organization
 *
 * Features:
 * - Manages rename mode state (which mood is being renamed)
 * - Manages rename input value
 * - Provides helpers to start/confirm/cancel rename
 *
 * @param {Function} onRenameMood - Callback function to rename a mood
 * @returns {Object} { renamingMood, renameInput, startRename, confirmRename, cancelRename }
 */
export function useMoodRename(onRenameMood) {
  const [renamingMood, setRenamingMood] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  const startRename = useCallback((moodName) => {
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
