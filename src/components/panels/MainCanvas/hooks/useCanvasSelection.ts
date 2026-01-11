import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { Scene, SceneCharacter, SelectedElementType } from '@/types';

/**
 * Selected element metadata type
 */
export interface SelectedElementMetadata {
  type: 'sceneCharacter';
  sceneCharacterId: string;
}

/**
 * Props for useCanvasSelection hook
 */
export interface UseCanvasSelectionProps {
  selectedScene: Scene | undefined;
  selectedElement: SelectedElementType;
  onSelectDialogue?: (sceneId: string, index: number | null, metadata?: SelectedElementMetadata) => void;
}

/**
 * Return type for useCanvasSelection hook
 */
export interface UseCanvasSelectionReturn {
  selectedCharacterId: string | null;
  setSelectedCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
  handleCharacterClick: (sceneChar: SceneCharacter) => void;
  handleDialogueClick: (sceneId: string, dialogueIndex: number) => void;
  handleDialogueNavigate: (direction: 'prev' | 'next') => void;
}

/**
 * useCanvasSelection - Manage selection state and navigation for canvas elements
 *
 * This hook centralizes all selection logic for the MainCanvas, including:
 * - Character selection tracking
 * - Dialogue click handling
 * - Dialogue navigation (prev/next)
 *
 * @param props - Selection configuration and callbacks
 * @returns Selection state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   selectedCharacterId,
 *   handleCharacterClick,
 *   handleDialogueClick,
 *   handleDialogueNavigate
 * } = useCanvasSelection({ selectedScene, selectedElement, onSelectDialogue });
 * ```
 */
export function useCanvasSelection({
  selectedScene,
  selectedElement,
  onSelectDialogue
}: UseCanvasSelectionProps): UseCanvasSelectionReturn {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  /**
   * Handle character click - Select character and notify parent
   */
  const handleCharacterClick = useCallback((sceneChar: SceneCharacter) => {
    setSelectedCharacterId(sceneChar.id);
    if (onSelectDialogue && selectedScene) {
      onSelectDialogue(selectedScene.id, null, { type: 'sceneCharacter', sceneCharacterId: sceneChar.id });
    }
  }, [onSelectDialogue, selectedScene]);

  /**
   * Handle dialogue click - Notify parent component
   */
  const handleDialogueClick = useCallback((sceneId: string, dialogueIndex: number) => {
    if (onSelectDialogue) {
      onSelectDialogue(sceneId, dialogueIndex);
    }
    logger.debug(`[MainCanvas] Dialogue ${dialogueIndex} clicked`);
  }, [onSelectDialogue]);

  /**
   * Handle dialogue navigation - Move to previous or next dialogue
   */
  const handleDialogueNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedElement || !selectedScene || selectedElement.type !== 'dialogue') return;

    const currentIndex = selectedElement.index;
    const totalDialogues = selectedScene.dialogues.length;

    if (direction === 'prev' && currentIndex > 0) {
      onSelectDialogue?.(selectedScene.id, currentIndex - 1);
    } else if (direction === 'next' && currentIndex < totalDialogues - 1) {
      onSelectDialogue?.(selectedScene.id, currentIndex + 1);
    }
  }, [selectedElement, selectedScene, onSelectDialogue]);

  return {
    selectedCharacterId,
    setSelectedCharacterId,
    handleCharacterClick,
    handleDialogueClick,
    handleDialogueNavigate,
  };
}
