import { useEffect } from 'react';
import type { Scene, Character, SceneCharacter } from '@/types';

/** Keyboard nudge amounts (percentage of canvas) */
const NUDGE = { NORMAL: 0.5, SHIFT: 1 } as const;
const POSITION_BOUNDS = { MIN: 0, MAX: 100 } as const;

/**
 * Options for useCanvasKeyboard hook
 */
interface UseCanvasKeyboardOptions {
  selectedCharacterId: string | null;
  selectedScene: Scene | null;
  sceneCharacters: SceneCharacter[];
  characters: Character[];
  removeCharacterFromScene: (sceneId: string, sceneCharacterId: string) => void;
  updateSceneCharacter: (sceneId: string, sceneCharacterId: string, updates: Partial<SceneCharacter>) => void;
  setSelectedCharacterId: (characterId: string | null) => void;
}

/**
 * Custom hook for canvas keyboard navigation
 *
 * Handles keyboard shortcuts for character manipulation:
 * - Arrow keys: Nudge character position (Shift = 1%, normal = 0.5%)
 * - Delete key: Remove character from scene with confirmation
 *
 * @param options - Configuration object with scene and character data
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
}: UseCanvasKeyboardOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
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
      const nudgeAmount = e.shiftKey ? NUDGE.SHIFT : NUDGE.NORMAL;
      const currentPosition = selectedChar.position || { x: 50, y: 50 };
      const newPosition = { ...currentPosition };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newPosition.x = Math.max(POSITION_BOUNDS.MIN, currentPosition.x - nudgeAmount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newPosition.x = Math.min(POSITION_BOUNDS.MAX, currentPosition.x + nudgeAmount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newPosition.y = Math.max(POSITION_BOUNDS.MIN, currentPosition.y - nudgeAmount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newPosition.y = Math.min(POSITION_BOUNDS.MAX, currentPosition.y + nudgeAmount);
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
