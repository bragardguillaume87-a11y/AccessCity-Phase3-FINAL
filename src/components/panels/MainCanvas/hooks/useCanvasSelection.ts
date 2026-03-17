import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { useSelectionStore } from '@/stores/selectionStore';
import { isDialogueSelection } from '@/stores/selectionStore.types';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import type { Scene, SceneCharacter } from '@/types';

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
 * } = useCanvasSelection({ selectedScene, onSelectDialogue });
 * ```
 */
export function useCanvasSelection({
  selectedScene,
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
   *
   * ✅ getState() dans un handler → lecture ponctuelle correcte (CLAUDE.md §6.7)
   * Évite les stale closures sur selectedElement.index lors de clics rapides :
   * si l'utilisateur clique avant le re-render React, la closure capturerait
   * l'ancien index et naviguerait vers le même dialogue.
   */
  const handleDialogueNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedScene) return;
    const currentElement = useSelectionStore.getState().selectedElement;
    if (!isDialogueSelection(currentElement)) return;

    const currentIndex = currentElement.index;
    // Lire le nombre de dialogues depuis le store à l'instant du clic
    const count = useDialoguesStore.getState().dialoguesByScene[selectedScene.id]?.length ?? 0;

    if (direction === 'prev' && currentIndex > 0) {
      onSelectDialogue?.(selectedScene.id, currentIndex - 1);
    } else if (direction === 'next' && currentIndex < count - 1) {
      onSelectDialogue?.(selectedScene.id, currentIndex + 1);
    }
  }, [selectedScene, onSelectDialogue]);

  return {
    selectedCharacterId,
    setSelectedCharacterId,
    handleCharacterClick,
    handleDialogueClick,
    handleDialogueNavigate,
  };
}
