import { useStore } from 'zustand';
import { useScenesStore } from '../stores/scenesStore';
import { useCharactersStore } from '../stores/charactersStore';

/**
 * useUndoRedo - Unified hook for undo/redo functionality
 *
 * Uses zundo's temporal middleware to provide undo/redo for both
 * scenes and characters stores with proper keyboard shortcuts.
 *
 * REACTIVE: Subscribes to temporal state changes to update UI in real-time.
 *
 * @returns Object with undo, redo functions and state
 */

interface UndoRedoState {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  stats: {
    scenes: { past: number; future: number };
    characters: { past: number; future: number };
  };
}

export function useUndoRedo(): UndoRedoState {
  // REACTIVE: Subscribe to scenes temporal state
  const scenesPastStates = useStore(useScenesStore.temporal, (state) => state.pastStates);
  const scenesFutureStates = useStore(useScenesStore.temporal, (state) => state.futureStates);

  // REACTIVE: Subscribe to characters temporal state
  const charsPastStates = useStore(useCharactersStore.temporal, (state) => state.pastStates);
  const charsFutureStates = useStore(useCharactersStore.temporal, (state) => state.futureStates);

  /**
   * Undo the last action in both stores
   */
  const undo = () => {
    const scenesState = useScenesStore.temporal.getState();
    const charsState = useCharactersStore.temporal.getState();

    if (scenesState.pastStates.length > 0) scenesState.undo();
    if (charsState.pastStates.length > 0) charsState.undo();
  };

  /**
   * Redo the last undone action in both stores
   */
  const redo = () => {
    const scenesState = useScenesStore.temporal.getState();
    const charsState = useCharactersStore.temporal.getState();

    if (scenesState.futureStates.length > 0) scenesState.redo();
    if (charsState.futureStates.length > 0) charsState.redo();
  };

  /**
   * Clear undo/redo history for both stores
   */
  const clear = () => {
    useScenesStore.temporal.getState().clear();
    useCharactersStore.temporal.getState().clear();
  };

  return {
    undo,
    redo,
    // REACTIVE: These values update automatically when undo/redo state changes
    canUndo: scenesPastStates.length > 0 || charsPastStates.length > 0,
    canRedo: scenesFutureStates.length > 0 || charsFutureStates.length > 0,
    clear,
    // Expose individual store states for debugging
    stats: {
      scenes: { past: scenesPastStates.length, future: scenesFutureStates.length },
      characters: { past: charsPastStates.length, future: charsFutureStates.length },
    },
  };
}
