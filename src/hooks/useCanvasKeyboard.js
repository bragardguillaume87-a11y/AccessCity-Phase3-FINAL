import { useEffect } from 'react';

/**
 * Custom hook for canvas keyboard navigation
 *
 * Handles keyboard shortcuts for character manipulation:
 * - Arrow keys: Nudge character position (Shift = 1%, normal = 0.5%)
 * - Delete key: Remove character from scene with confirmation
 *
 * @param {Object} params
 * @param {string|null} params.selectedCharacterId - ID of selected scene character
 * @param {Object|null} params.selectedScene - Current scene object
 * @param {Array} params.sceneCharacters - Characters in the scene
 * @param {Array} params.characters - All available characters
 * @param {Function} params.removeCharacterFromScene - Callback to remove character
 * @param {Function} params.updateSceneCharacter - Callback to update character
 * @param {Function} params.setSelectedCharacterId - Callback to clear selection
 *
 * @example
 * useCanvasKeyboard({
 *   selectedCharacterId,
 *   selectedScene,
 *   sceneCharacters,
 *   characters,
 *   removeCharacterFromScene,
 *   updateSceneCharacter,
 *   setSelectedCharacterId
 * });
 */
export function useCanvasKeyboard({
  selectedCharacterId,
  selectedScene,
  sceneCharacters,
  characters,
  removeCharacterFromScene,
  updateSceneCharacter,
  setSelectedCharacterId
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCharacterId || !selectedScene) return;

      const selectedChar = sceneCharacters.find(sc => sc.id === selectedCharacterId);
      if (!selectedChar) return;

      // Delete key - remove character
      if (e.key === 'Delete') {
        e.preventDefault();
        const character = characters.find(c => c.id === selectedChar.characterId);
        const confirmed = window.confirm(`Remove ${character?.name || 'character'} from this scene?`);
        if (confirmed) {
          removeCharacterFromScene(selectedScene.id, selectedChar.id);
          setSelectedCharacterId(null);
        }
        return;
      }

      // Arrow keys - nudge character position
      const nudgeAmount = e.shiftKey ? 1 : 0.5; // 1% with Shift, 0.5% without
      const currentPosition = selectedChar.position || { x: 50, y: 50 };
      let newPosition = { ...currentPosition };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newPosition.x = Math.max(0, currentPosition.x - nudgeAmount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newPosition.x = Math.min(100, currentPosition.x + nudgeAmount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newPosition.y = Math.max(0, currentPosition.y - nudgeAmount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newPosition.y = Math.min(100, currentPosition.y + nudgeAmount);
          break;
        default:
          return;
      }

      updateSceneCharacter(selectedScene.id, selectedChar.id, { position: newPosition });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCharacterId, selectedScene, sceneCharacters, characters, removeCharacterFromScene, updateSceneCharacter, setSelectedCharacterId]);
}
