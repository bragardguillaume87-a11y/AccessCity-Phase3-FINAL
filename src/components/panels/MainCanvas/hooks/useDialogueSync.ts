import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { TIMING } from '@/config/timing';
import type { Scene } from '@/types';

/**
 * Selected element type (from UI store)
 */
export interface SelectedElement {
  type: 'dialogue' | 'character' | 'scene' | 'sceneCharacter';
  sceneId?: string;
  index?: number;
  id?: string;
  sceneCharacterId?: string;
}

/**
 * Return type for useDialogueSync hook
 */
export interface UseDialogueSyncReturn {
  currentDialogueText: string;
  setCurrentDialogueText: React.Dispatch<React.SetStateAction<string>>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * useDialogueSync - Synchronize dialogue selection with typewriter, timeline and auto-scroll
 *
 * @param selectedElement - Currently selected element
 * @param selectedScene - Currently selected scene
 * @returns Dialogue sync state and setters
 */
export function useDialogueSync(
  selectedElement: SelectedElement | null,
  selectedScene: Scene | undefined
): UseDialogueSyncReturn {
  const [currentDialogueText, setCurrentDialogueText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  // Extract specific properties for stable dependencies
  const selectedElementType = selectedElement?.type;
  const selectedElementIndex = selectedElement?.index;
  const selectedElementSceneId = selectedElement?.sceneId;
  const selectedSceneId = selectedScene?.id;
  const dialoguesLength = selectedScene?.dialogues?.length ?? 0;
  // Get the specific dialogue text for dependency (only when type is dialogue)
  const currentDialogue = selectedElementType === 'dialogue' && selectedScene?.dialogues
    ? selectedScene.dialogues[selectedElementIndex ?? 0]
    : null;
  const dialogueText = currentDialogue?.text ?? '';

  // Update typewriter text when selected dialogue changes
  useEffect(() => {
    if (selectedElementType === 'dialogue' && selectedSceneId) {
      setCurrentDialogueText(dialogueText);
    } else {
      setCurrentDialogueText('');
    }
  }, [selectedElementType, selectedSceneId, dialogueText]);

  // Update timeline playhead when dialogue selection changes
  useEffect(() => {
    if (selectedElementType === 'dialogue' && selectedSceneId && dialoguesLength > 0) {
      const duration = Math.max(60, dialoguesLength * 5);
      const dialogueDuration = duration / Math.max(1, dialoguesLength);
      const dialogueTime = (selectedElementIndex ?? 0) * dialogueDuration;
      setCurrentTime(dialogueTime);
    }
  }, [selectedElementType, selectedElementIndex, selectedSceneId, dialoguesLength]);

  // Auto-scroll to dialogue in DialoguesPanel when selected
  useEffect(() => {
    if (selectedElementType === 'dialogue' && selectedElementSceneId && selectedElementIndex !== undefined) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const dialogueElement = document.querySelector(
          `[data-dialogue-id="${selectedElementSceneId}-${selectedElementIndex}"]`
        );
        if (dialogueElement) {
          dialogueElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          logger.debug(`[useDialogueSync] Auto-scroll to dialogue ${selectedElementIndex}`);
        }
      }, TIMING.ANIMATION_FAST);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedElementType, selectedElementSceneId, selectedElementIndex]);

  return {
    currentDialogueText,
    setCurrentDialogueText,
    currentTime,
    setCurrentTime
  };
}
