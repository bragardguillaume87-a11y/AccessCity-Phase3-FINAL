/**
 * Selection Store - Centralized Selection Management
 *
 * Manages all selection state (scene/dialogue/character/sceneCharacter).
 * Uses DevTools + Immer + SubscribeWithSelector middlewares.
 *
 * @module stores/selectionStore
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/utils/logger';
import type {
  SelectionStore,
  SelectedElement,
} from './selectionStore.types';
import { describeSelection } from './selectionStore.types';
import { isSameSelection } from './selectionHelpers';

const initialState = {
  selectedElement: null as SelectedElement,
};

export const useSelectionStore = create<SelectionStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => {
        /** Internal helper to centralize selection logic */
        const _select = (newSelection: SelectedElement, description: string) => {
          logger.info(`[SelectionStore] ${description}`);
          set((state) => {
            state.selectedElement = newSelection;
          });
        };

        return {
          ...initialState,

          selectScene: (id: string) => {
            _select({ type: 'scene', id }, `Selecting scene: ${id}`);
          },

          selectDialogue: (sceneId: string, index: number) => {
            _select(
              { type: 'dialogue', sceneId, index },
              `Selecting dialogue ${index} in scene ${sceneId}`
            );
          },

          selectCharacter: (id: string) => {
            _select({ type: 'character', id }, `Selecting character: ${id}`);
          },

          selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => {
            _select(
              { type: 'sceneCharacter', sceneId, sceneCharacterId },
              `Selecting scene character ${sceneCharacterId} in scene ${sceneId}`
            );
          },

          clearSelection: () => {
            logger.info('[SelectionStore] Clearing selection');
            set((state) => {
              state.selectedElement = null;
            });
          },

          setSelectedElement: (element: SelectedElement) => {
            logger.debug('[SelectionStore] Setting selection:', describeSelection(element));
            set((state) => {
              state.selectedElement = element;
            });
          },
        };
      })
    ),
    {
      name: 'SelectionStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/** Memoized selectors */
export const selectionSelectors = {
  selectedElement: (state: SelectionStore) => state.selectedElement,
  isSceneSelected: (state: SelectionStore) => state.selectedElement?.type === 'scene',
  isDialogueSelected: (state: SelectionStore) => state.selectedElement?.type === 'dialogue',
  isCharacterSelected: (state: SelectionStore) => state.selectedElement?.type === 'character',
};

/** Subscribe to selection changes with equality check */
export function subscribeToSelectionChanges(
  callback: (selection: SelectedElement) => void
): () => void {
  return useSelectionStore.subscribe(
    (state) => state.selectedElement,
    callback,
    { fireImmediately: false, equalityFn: isSameSelection }
  );
}
