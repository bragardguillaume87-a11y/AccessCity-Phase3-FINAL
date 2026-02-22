/**
 * useSelection Hook - Simplified Selection API
 *
 * Provides a clean, type-safe API for working with the SelectionStore.
 *
 * @module hooks/useSelection
 */

import { useCallback } from 'react';
import { useSelectionStore, selectionSelectors } from '@/stores/selectionStore';
import type { SelectedElement } from '@/stores/selectionStore.types';
import {
  isSceneSelection,
  isDialogueSelection,
  isCharacterSelection,
  describeSelection,
} from '@/stores/selectionStore.types';
import { logger } from '@/utils/logger';

export interface UseSelectionReturn {
  selectedElement: SelectedElement;
  isSceneSelected: boolean;
  isDialogueSelected: boolean;
  isCharacterSelected: boolean;
  selectScene: (id: string) => void;
  selectDialogue: (sceneId: string, index: number) => void;
  selectCharacter: (id: string) => void;
  selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => void;
  clearSelection: () => void;
  getSelectionDescription: () => string;
}

export function useSelection(): UseSelectionReturn {
  const selectedElement = useSelectionStore(selectionSelectors.selectedElement);

  const {
    selectScene: storeSelectScene,
    selectDialogue: storeSelectDialogue,
    selectCharacter: storeSelectCharacter,
    selectSceneCharacter: storeSelectSceneCharacter,
    clearSelection: storeClearSelection,
  } = useSelectionStore();

  const isSceneSelected = isSceneSelection(selectedElement);
  const isDialogueSelected = isDialogueSelection(selectedElement);
  const isCharacterSelected = isCharacterSelection(selectedElement);

  const selectScene = useCallback(
    (id: string) => {
      logger.debug(`[useSelection] Selecting scene: ${id}`);
      storeSelectScene(id);
    },
    [storeSelectScene]
  );

  const selectDialogue = useCallback(
    (sceneId: string, index: number) => {
      logger.debug(`[useSelection] Selecting dialogue ${index} in scene ${sceneId}`);
      storeSelectDialogue(sceneId, index);
    },
    [storeSelectDialogue]
  );

  const selectCharacter = useCallback(
    (id: string) => {
      logger.debug(`[useSelection] Selecting character: ${id}`);
      storeSelectCharacter(id);
    },
    [storeSelectCharacter]
  );

  const selectSceneCharacter = useCallback(
    (sceneId: string, sceneCharacterId: string) => {
      logger.debug(`[useSelection] Selecting scene character ${sceneCharacterId} in scene ${sceneId}`);
      storeSelectSceneCharacter(sceneId, sceneCharacterId);
    },
    [storeSelectSceneCharacter]
  );

  const clearSelection = useCallback(() => {
    logger.debug('[useSelection] Clearing selection');
    storeClearSelection();
  }, [storeClearSelection]);

  const getSelectionDescription = useCallback(() => {
    return describeSelection(selectedElement);
  }, [selectedElement]);

  return {
    selectedElement,
    isSceneSelected,
    isDialogueSelected,
    isCharacterSelected,
    selectScene,
    selectDialogue,
    selectCharacter,
    selectSceneCharacter,
    clearSelection,
    getSelectionDescription,
  };
}

/**
 * Convert SelectedElement to SelectedElementType (backward compatibility)
 */
export function toSelectedElementType(
  element: SelectedElement
): import('@/types').SelectedElementType {
  if (!element || element.type === null) return null;
  return element as import('@/types').SelectedElementType;
}
