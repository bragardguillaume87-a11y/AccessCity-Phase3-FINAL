/**
 * Selection Store - Centralized Selection Management
 *
 * Replaces local useState in EditorShell with a global Zustand store.
 * Manages all selection state (scene/dialogue/character/sceneCharacter).
 *
 * Features:
 * - DevTools integration for debugging
 * - Immer middleware for immutable updates
 * - SubscribeWithSelector for granular subscriptions
 * - Selection history (back/forward navigation)
 * - Multi-selection ready (architecture prepared)
 * - Comprehensive logging
 *
 * @module stores/selectionStore
 * @example
 * ```typescript
 * // In a component
 * import { useSelectionStore } from '@/stores/selectionStore';
 *
 * const selectedElement = useSelectionStore((state) => state.selectedElement);
 * const selectScene = useSelectionStore((state) => state.selectScene);
 *
 * // Select a scene
 * selectScene('scene-1');
 * ```
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/utils/logger';
import type {
  SelectionStore,
  SelectionState,
  SelectedElement,
  SelectionMode,
  NoSelection,
  DialogueSelection,
  SceneSelection,
  CharacterSelection,
  SceneCharacterSelection,
} from './selectionStore.types';
import { describeSelection } from './selectionStore.types';

/**
 * Maximum number of history entries to keep
 * Prevents memory leaks from unbounded history growth
 */
const MAX_HISTORY = 50;

/**
 * Initial state for the selection store
 */
const initialState: SelectionState = {
  selectedElement: null,
  selectedIds: new Set(),
  mode: 'single',
  locked: false,
  history: [],
  historyIndex: -1,
};

/**
 * Selection Store
 *
 * Global state management for element selection in the editor.
 * Uses Zustand with DevTools, Immer, and SubscribeWithSelector middlewares.
 */
export const useSelectionStore = create<SelectionStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // === STATE ===
        ...initialState,

        // === BASIC SELECTION ACTIONS ===

        /**
         * Select a scene
         * Shows UnifiedPanel ("Add Element")
         */
        selectScene: (id: string) => {
          const current = get();

          // Check lock
          if (current.locked) {
            logger.warn('[SelectionStore] Cannot select - selection is locked');
            return;
          }

          logger.info(`[SelectionStore] Selecting scene: ${id}`);

          set((state) => {
            const newSelection: SelectedElement = { type: 'scene', id };

            // Add to history
            addToHistory(state, newSelection);

            // Update selection
            state.selectedElement = newSelection;
            state.selectedIds = new Set([id]);
          });
        },

        /**
         * Select a dialogue
         * Shows DialoguePropertiesForm
         */
        selectDialogue: (sceneId: string, index: number) => {
          const current = get();

          // Check lock
          if (current.locked) {
            logger.warn('[SelectionStore] Cannot select - selection is locked');
            return;
          }

          logger.info(`[SelectionStore] Selecting dialogue ${index} in scene ${sceneId}`);

          set((state) => {
            const newSelection: SelectedElement = {
              type: 'dialogue',
              sceneId,
              index,
            };

            // Add to history
            addToHistory(state, newSelection);

            // Update selection
            state.selectedElement = newSelection;
            state.selectedIds = new Set([`${sceneId}-dialogue-${index}`]);
          });
        },

        /**
         * Select a character
         * Shows CharacterPropertiesForm
         */
        selectCharacter: (id: string) => {
          const current = get();

          // Check lock
          if (current.locked) {
            logger.warn('[SelectionStore] Cannot select - selection is locked');
            return;
          }

          logger.info(`[SelectionStore] Selecting character: ${id}`);

          set((state) => {
            const newSelection: SelectedElement = { type: 'character', id };

            // Add to history
            addToHistory(state, newSelection);

            // Update selection
            state.selectedElement = newSelection;
            state.selectedIds = new Set([id]);
          });
        },

        /**
         * Select a scene character (placement)
         * Shows SceneCharacterPlacementForm
         */
        selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => {
          const current = get();

          // Check lock
          if (current.locked) {
            logger.warn('[SelectionStore] Cannot select - selection is locked');
            return;
          }

          logger.info(
            `[SelectionStore] Selecting scene character ${sceneCharacterId} in scene ${sceneId}`
          );

          set((state) => {
            const newSelection: SelectedElement = {
              type: 'sceneCharacter',
              sceneId,
              sceneCharacterId,
            };

            // Add to history
            addToHistory(state, newSelection);

            // Update selection
            state.selectedElement = newSelection;
            state.selectedIds = new Set([sceneCharacterId]);
          });
        },

        /**
         * Clear selection
         * Shows EmptySelectionState
         */
        clearSelection: () => {
          logger.info('[SelectionStore] Clearing selection');

          set((state) => {
            // Add to history
            addToHistory(state, null);

            // Clear selection
            state.selectedElement = null;
            state.selectedIds = new Set();
          });
        },

        /**
         * Set selection directly (advanced use case)
         */
        setSelectedElement: (element: SelectedElement) => {
          const current = get();

          // Check lock
          if (current.locked) {
            logger.warn('[SelectionStore] Cannot set selection - locked');
            return;
          }

          logger.debug('[SelectionStore] Setting selection:', describeSelection(element));

          set((state) => {
            // Add to history
            addToHistory(state, element);

            // Update selection
            state.selectedElement = element;

            // Update selectedIds based on element type
            if (!element || element.type === null) {
              state.selectedIds = new Set();
            } else {
              // TypeScript narrowing: element is not NoSelection here
              const elem = element as Exclude<SelectedElement, NoSelection | null>;

              if (elem.type === 'scene') {
                state.selectedIds = new Set([elem.id]);
              } else if (elem.type === 'dialogue') {
                state.selectedIds = new Set([`${elem.sceneId}-dialogue-${elem.index}`]);
              } else if (elem.type === 'character') {
                state.selectedIds = new Set([elem.id]);
              } else if (elem.type === 'sceneCharacter') {
                state.selectedIds = new Set([elem.sceneCharacterId]);
              }
            }
          });
        },

        // === MULTI-SELECTION ACTIONS (Future Feature) ===

        /**
         * Add ID to selection set
         * Future feature for multi-selection
         */
        addToSelection: (id: string) => {
          logger.debug(`[SelectionStore] Adding to selection: ${id}`);

          set((state) => {
            state.selectedIds.add(id);
            // Note: mode should be 'multi' for this to work properly
            if (state.mode !== 'multi') {
              logger.warn('[SelectionStore] Adding to selection but mode is not "multi"');
            }
          });
        },

        /**
         * Remove ID from selection set
         */
        removeFromSelection: (id: string) => {
          logger.debug(`[SelectionStore] Removing from selection: ${id}`);

          set((state) => {
            state.selectedIds.delete(id);
          });
        },

        /**
         * Select all elements of a type
         * Future feature - currently not implemented
         */
        selectAll: (type) => {
          logger.warn(`[SelectionStore] selectAll not implemented for type: ${type}`);
          // TODO: Implement when multi-selection is needed
        },

        // === NAVIGATION ACTIONS ===

        /**
         * Navigate to previous dialogue in scene
         * Requires access to scenes store to get dialogue count
         */
        selectPreviousDialogue: () => {
          const current = get();
          const { selectedElement } = current;

          // Type guard to ensure it's a dialogue selection
          if (!selectedElement || selectedElement.type !== 'dialogue') {
            logger.debug('[SelectionStore] Cannot navigate - not a dialogue selected');
            return;
          }

          // Explicit type assertion: we know it's DialogueSelection after the guard
          const dialogueSelection = selectedElement as DialogueSelection;

          if (dialogueSelection.index > 0) {
            get().selectDialogue(dialogueSelection.sceneId, dialogueSelection.index - 1);
          } else {
            logger.debug('[SelectionStore] Already at first dialogue');
          }
        },

        /**
         * Navigate to next dialogue in scene
         * Note: This method doesn't know the max index without scenes store
         * Caller should check bounds before calling
         */
        selectNextDialogue: () => {
          const current = get();
          const { selectedElement } = current;

          // Type guard to ensure it's a dialogue selection
          if (!selectedElement || selectedElement.type !== 'dialogue') {
            logger.debug('[SelectionStore] Cannot navigate - not a dialogue selected');
            return;
          }

          // Explicit type assertion: we know it's DialogueSelection after the guard
          const dialogueSelection = selectedElement as DialogueSelection;

          // Note: Caller should ensure index + 1 is valid
          get().selectDialogue(dialogueSelection.sceneId, dialogueSelection.index + 1);
        },

        /**
         * Go back in selection history
         */
        goBack: () => {
          const current = get();

          if (current.historyIndex <= 0) {
            logger.debug('[SelectionStore] Cannot go back - at start of history');
            return;
          }

          logger.info('[SelectionStore] Going back in history');

          set((state) => {
            state.historyIndex -= 1;
            state.selectedElement = state.history[state.historyIndex];
          });
        },

        /**
         * Go forward in selection history
         */
        goForward: () => {
          const current = get();

          if (current.historyIndex >= current.history.length - 1) {
            logger.debug('[SelectionStore] Cannot go forward - at end of history');
            return;
          }

          logger.info('[SelectionStore] Going forward in history');

          set((state) => {
            state.historyIndex += 1;
            state.selectedElement = state.history[state.historyIndex];
          });
        },

        // === UTILITY ACTIONS ===

        /**
         * Toggle selection lock
         * Locked selections prevent accidental changes
         */
        toggleLock: () => {
          set((state) => {
            state.locked = !state.locked;
            logger.info(`[SelectionStore] Selection ${state.locked ? 'locked' : 'unlocked'}`);
          });
        },

        /**
         * Set selection mode (single/multi/range)
         */
        setMode: (mode: SelectionMode) => {
          logger.info(`[SelectionStore] Setting mode to: ${mode}`);

          set((state) => {
            state.mode = mode;

            // If switching to single mode, clear multi-selection
            if (mode === 'single' && state.selectedIds.size > 1) {
              const elem = state.selectedElement;

              // Keep only the primary selection
              if (elem && elem.type !== null) {
                // Type assertion after null check
                const typedElem = elem as Exclude<SelectedElement, NoSelection | null>;

                if (typedElem.type === 'scene') {
                  state.selectedIds = new Set([typedElem.id]);
                } else if (typedElem.type === 'character') {
                  state.selectedIds = new Set([typedElem.id]);
                } else {
                  state.selectedIds = new Set();
                }
              } else {
                state.selectedIds = new Set();
              }
            }
          });
        },

        /**
         * Clear selection history
         */
        clearHistory: () => {
          logger.info('[SelectionStore] Clearing selection history');

          set((state) => {
            state.history = [];
            state.historyIndex = -1;
          });
        },
      }))
    ),
    {
      name: 'SelectionStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Helper function to add a selection to history
 * Manages history size and index
 *
 * @param state - Current state (draft from Immer)
 * @param newSelection - Selection to add to history
 */
function addToHistory(state: SelectionState, newSelection: SelectedElement): void {
  // Don't add duplicate of current selection
  const currentSelection = state.history[state.historyIndex];
  if (isSameSelection(currentSelection, newSelection)) {
    return;
  }

  // Remove any forward history if we're not at the end
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  // Add new selection
  state.history.push(newSelection);
  state.historyIndex = state.history.length - 1;

  // Trim history if too long
  if (state.history.length > MAX_HISTORY) {
    state.history.shift();
    state.historyIndex -= 1;
  }
}

/**
 * Check if two selections are the same
 * Used to avoid duplicate history entries
 */
function isSameSelection(a: SelectedElement | undefined, b: SelectedElement | undefined): boolean {
  // Handle undefined and null cases
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;

  // Handle NoSelection cases
  if (a.type === null || b.type === null) {
    return a.type === b.type;
  }

  // Types must match
  if (a.type !== b.type) return false;

  // At this point both a and b have the same non-null type
  // Type assertion to exclude NoSelection
  const aTyped = a as Exclude<SelectedElement, NoSelection | null>;
  const bTyped = b as Exclude<SelectedElement, NoSelection | null>;

  // Use explicit checks for each type
  if (aTyped.type === 'scene' && bTyped.type === 'scene') {
    return aTyped.id === bTyped.id;
  }

  if (aTyped.type === 'dialogue' && bTyped.type === 'dialogue') {
    return aTyped.sceneId === bTyped.sceneId && aTyped.index === bTyped.index;
  }

  if (aTyped.type === 'character' && bTyped.type === 'character') {
    return aTyped.id === bTyped.id;
  }

  if (aTyped.type === 'sceneCharacter' && bTyped.type === 'sceneCharacter') {
    return aTyped.sceneId === bTyped.sceneId && aTyped.sceneCharacterId === bTyped.sceneCharacterId;
  }

  return false;
}

/**
 * Selectors - Memoized accessors for common patterns
 * Use these for better performance
 */
export const selectionSelectors = {
  /**
   * Get selected element
   */
  selectedElement: (state: SelectionStore) => state.selectedElement,

  /**
   * Check if a scene is selected
   */
  isSceneSelected: (state: SelectionStore) => state.selectedElement?.type === 'scene',

  /**
   * Check if a dialogue is selected
   */
  isDialogueSelected: (state: SelectionStore) => state.selectedElement?.type === 'dialogue',

  /**
   * Check if a character is selected
   */
  isCharacterSelected: (state: SelectionStore) => state.selectedElement?.type === 'character',

  /**
   * Check if selection is locked
   */
  isLocked: (state: SelectionStore) => state.locked,

  /**
   * Check if can go back in history
   */
  canGoBack: (state: SelectionStore) => state.historyIndex > 0,

  /**
   * Check if can go forward in history
   */
  canGoForward: (state: SelectionStore) => state.historyIndex < state.history.length - 1,
};

/**
 * Subscribe to selection changes
 * Useful for triggering side effects when selection changes
 *
 * @example
 * ```typescript
 * useEffect(() => {
 *   const unsubscribe = subscribeToSelectionChanges((selection) => {
 *     console.log('Selection changed:', selection);
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */
export function subscribeToSelectionChanges(
  callback: (selection: SelectedElement) => void
): () => void {
  return useSelectionStore.subscribe(
    (state) => state.selectedElement,
    callback,
    {
      fireImmediately: false,
      equalityFn: isSameSelection,
    }
  );
}
