/**
 * useSelection Hook - Simplified Selection API
 *
 * Provides a clean, type-safe API for working with the SelectionStore.
 * Encapsulates common selection patterns and business logic.
 *
 * @module hooks/useSelection
 * @example
 * ```typescript
 * const {
 *   selectedElement,
 *   selectScene,
 *   isSceneSelected,
 *   navigateToNextDialogue
 * } = useSelection();
 *
 * // Select a scene
 * selectScene('scene-1');
 *
 * // Navigate dialogues
 * navigateToNextDialogue();
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useSelectionStore, selectionSelectors } from '@/stores/selectionStore';
import type { SelectedElement } from '@/stores/selectionStore.types';
import {
  isSceneSelection,
  isDialogueSelection,
  isCharacterSelection,
  isSceneCharacterSelection,
  describeSelection,
} from '@/stores/selectionStore.types';
import { useScenes } from '@/stores';
import { logger } from '@/utils/logger';

/**
 * Return type for useSelection hook
 */
export interface UseSelectionReturn {
  // === STATE ===
  /**
   * Currently selected element
   */
  selectedElement: SelectedElement;

  /**
   * Whether a scene is selected
   */
  isSceneSelected: boolean;

  /**
   * Whether a dialogue is selected
   */
  isDialogueSelected: boolean;

  /**
   * Whether a character is selected
   */
  isCharacterSelected: boolean;

  /**
   * Whether selection is locked
   */
  isLocked: boolean;

  /**
   * Selection mode (single/multi/range)
   */
  mode: 'single' | 'multi' | 'range';

  // === BASIC ACTIONS ===
  /**
   * Select a scene
   */
  selectScene: (id: string) => void;

  /**
   * Select a dialogue
   */
  selectDialogue: (sceneId: string, index: number) => void;

  /**
   * Select a character
   */
  selectCharacter: (id: string) => void;

  /**
   * Select a scene character
   */
  selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => void;

  /**
   * Clear selection
   */
  clearSelection: () => void;

  // === NAVIGATION ACTIONS ===
  /**
   * Navigate to previous dialogue in current scene
   * Checks bounds automatically
   */
  navigateToPreviousDialogue: () => void;

  /**
   * Navigate to next dialogue in current scene
   * Checks bounds automatically
   */
  navigateToNextDialogue: () => void;

  /**
   * Check if can navigate to previous dialogue
   */
  canNavigatePrevious: boolean;

  /**
   * Check if can navigate to next dialogue
   */
  canNavigateNext: boolean;

  /**
   * Go back in selection history
   */
  goBack: () => void;

  /**
   * Go forward in selection history
   */
  goForward: () => void;

  /**
   * Check if can go back in history
   */
  canGoBack: boolean;

  /**
   * Check if can go forward in history
   */
  canGoForward: boolean;

  // === UTILITY ===
  /**
   * Toggle selection lock
   */
  toggleLock: () => void;

  /**
   * Get human-readable description of current selection
   */
  getSelectionDescription: () => string;
}

/**
 * useSelection Hook
 *
 * Simplified API for working with the SelectionStore.
 * Adds business logic on top of raw store actions.
 *
 * @returns Selection state and actions with enhanced logic
 */
export function useSelection(): UseSelectionReturn {
  // Subscribe to store slices
  const selectedElement = useSelectionStore(selectionSelectors.selectedElement);
  const isLocked = useSelectionStore(selectionSelectors.isLocked);
  const mode = useSelectionStore((state) => state.mode);
  const canGoBackHistory = useSelectionStore(selectionSelectors.canGoBack);
  const canGoForwardHistory = useSelectionStore(selectionSelectors.canGoForward);

  // Store actions
  const {
    selectScene: storeSelectScene,
    selectDialogue: storeSelectDialogue,
    selectCharacter: storeSelectCharacter,
    selectSceneCharacter: storeSelectSceneCharacter,
    clearSelection: storeClearSelection,
    selectPreviousDialogue,
    selectNextDialogue,
    goBack,
    goForward,
    toggleLock,
  } = useSelectionStore();

  // Get scenes for navigation logic
  const scenes = useScenes();

  // Derive booleans from selectedElement
  const isSceneSelected = isSceneSelection(selectedElement);
  const isDialogueSelected = isDialogueSelection(selectedElement);
  const isCharacterSelected = isCharacterSelection(selectedElement);

  // === NAVIGATION LOGIC ===

  /**
   * Check if can navigate to previous dialogue
   */
  const canNavigatePrevious = useMemo(() => {
    if (!isDialogueSelection(selectedElement)) return false;
    return selectedElement.index > 0;
  }, [selectedElement]);

  /**
   * Check if can navigate to next dialogue
   */
  const canNavigateNext = useMemo(() => {
    if (!isDialogueSelection(selectedElement)) return false;

    const scene = scenes.find((s) => s.id === selectedElement.sceneId);
    if (!scene) return false;

    return selectedElement.index < (scene.dialogues?.length || 0) - 1;
  }, [selectedElement, scenes]);

  /**
   * Navigate to previous dialogue (with bounds checking)
   */
  const navigateToPreviousDialogue = useCallback(() => {
    if (!canNavigatePrevious) {
      logger.debug('[useSelection] Cannot navigate to previous dialogue');
      return;
    }
    selectPreviousDialogue();
  }, [canNavigatePrevious, selectPreviousDialogue]);

  /**
   * Navigate to next dialogue (with bounds checking)
   */
  const navigateToNextDialogue = useCallback(() => {
    if (!canNavigateNext) {
      logger.debug('[useSelection] Cannot navigate to next dialogue');
      return;
    }
    selectNextDialogue();
  }, [canNavigateNext, selectNextDialogue]);

  // === WRAPPED ACTIONS (with logging) ===

  /**
   * Select scene (wrapped with logging)
   */
  const selectScene = useCallback(
    (id: string) => {
      logger.debug(`[useSelection] Selecting scene: ${id}`);
      storeSelectScene(id);
    },
    [storeSelectScene]
  );

  /**
   * Select dialogue (wrapped with logging)
   */
  const selectDialogue = useCallback(
    (sceneId: string, index: number) => {
      logger.debug(`[useSelection] Selecting dialogue ${index} in scene ${sceneId}`);
      storeSelectDialogue(sceneId, index);
    },
    [storeSelectDialogue]
  );

  /**
   * Select character (wrapped with logging)
   */
  const selectCharacter = useCallback(
    (id: string) => {
      logger.debug(`[useSelection] Selecting character: ${id}`);
      storeSelectCharacter(id);
    },
    [storeSelectCharacter]
  );

  /**
   * Select scene character (wrapped with logging)
   */
  const selectSceneCharacter = useCallback(
    (sceneId: string, sceneCharacterId: string) => {
      logger.debug(
        `[useSelection] Selecting scene character ${sceneCharacterId} in scene ${sceneId}`
      );
      storeSelectSceneCharacter(sceneId, sceneCharacterId);
    },
    [storeSelectSceneCharacter]
  );

  /**
   * Clear selection (wrapped with logging)
   */
  const clearSelection = useCallback(() => {
    logger.debug('[useSelection] Clearing selection');
    storeClearSelection();
  }, [storeClearSelection]);

  /**
   * Get description of current selection
   */
  const getSelectionDescription = useCallback(() => {
    return describeSelection(selectedElement);
  }, [selectedElement]);

  return {
    // State
    selectedElement,
    isSceneSelected,
    isDialogueSelected,
    isCharacterSelected,
    isLocked,
    mode,

    // Basic actions
    selectScene,
    selectDialogue,
    selectCharacter,
    selectSceneCharacter,
    clearSelection,

    // Navigation
    navigateToPreviousDialogue,
    navigateToNextDialogue,
    canNavigatePrevious,
    canNavigateNext,
    goBack,
    goForward,
    canGoBack: canGoBackHistory,
    canGoForward: canGoForwardHistory,

    // Utility
    toggleLock,
    getSelectionDescription,
  };
}

/**
 * Hook variant that only subscribes to selectedElement
 * Use this for components that only read the selection
 *
 * @returns Current selected element
 */
export function useSelectedElement(): SelectedElement {
  return useSelectionStore(selectionSelectors.selectedElement);
}

/**
 * Hook variant that only provides actions (no state)
 * Use this when you only need to change selection, not read it
 *
 * @returns Selection actions
 */
export function useSelectionActions() {
  return {
    selectScene: useSelectionStore((state) => state.selectScene),
    selectDialogue: useSelectionStore((state) => state.selectDialogue),
    selectCharacter: useSelectionStore((state) => state.selectCharacter),
    selectSceneCharacter: useSelectionStore((state) => state.selectSceneCharacter),
    clearSelection: useSelectionStore((state) => state.clearSelection),
  };
}

/**
 * Convert SelectedElement to SelectedElementType
 * Transforms NoSelection { type: null } to null for backward compatibility
 *
 * @param element - SelectedElement from SelectionStore
 * @returns SelectedElementType for legacy components
 */
export function toSelectedElementType(
  element: SelectedElement
): import('@/types').SelectedElementType {
  // Convert null or NoSelection to null
  if (!element || element.type === null) {
    return null;
  }

  // All other types are compatible
  return element as import('@/types').SelectedElementType;
}
