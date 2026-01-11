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

  // Update typewriter text when selected dialogue changes
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedScene) {
      const dialogue = selectedScene.dialogues?.[selectedElement.index ?? 0];
      setCurrentDialogueText(dialogue?.text || '');
    } else {
      setCurrentDialogueText('');
    }
  }, [selectedElement, selectedScene]);

  // Update timeline playhead when dialogue selection changes
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedScene && selectedScene.dialogues) {
      const duration = Math.max(60, selectedScene.dialogues.length * 5);
      const dialogueDuration = duration / Math.max(1, selectedScene.dialogues.length);
      const dialogueTime = (selectedElement.index ?? 0) * dialogueDuration;
      setCurrentTime(dialogueTime);
    }
  }, [selectedElement, selectedScene]);

  // Auto-scroll to dialogue in DialoguesPanel when selected
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedElement?.sceneId && selectedElement?.index !== undefined) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const dialogueElement = document.querySelector(
          `[data-dialogue-id="${selectedElement.sceneId}-${selectedElement.index}"]`
        );
        if (dialogueElement) {
          dialogueElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          logger.debug(`[useDialogueSync] Auto-scroll to dialogue ${selectedElement.index}`);
        }
      }, TIMING.ANIMATION_FAST);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedElement]);

  return {
    currentDialogueText,
    setCurrentDialogueText,
    currentTime,
    setCurrentTime
  };
}
