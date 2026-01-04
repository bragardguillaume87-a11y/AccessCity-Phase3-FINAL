import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger.js';
import { TIMING } from '@/config/timing';

/**
 * useDialogueSync - Synchronize dialogue selection with typewriter, timeline and auto-scroll
 *
 * @param {Object} selectedElement - Currently selected element
 * @param {Object} selectedScene - Currently selected scene
 * @returns {{ currentDialogueText: string, setCurrentDialogueText: Function, currentTime: number, setCurrentTime: Function }}
 */
export function useDialogueSync(selectedElement, selectedScene) {
  const [currentDialogueText, setCurrentDialogueText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  // Update typewriter text when selected dialogue changes
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedScene) {
      const dialogue = selectedScene.dialogues?.[selectedElement.index];
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
      const dialogueTime = selectedElement.index * dialogueDuration;
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
