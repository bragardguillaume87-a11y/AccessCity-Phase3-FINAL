import { useStore } from 'zustand';
import { useScenesStore } from '../stores/scenesStore';
import { useCharactersStore } from '../stores/charactersStore';
import { useDialoguesStore } from '../stores/dialoguesStore';
import { useSceneElementsStore } from '../stores/sceneElementsStore';

/**
 * useUndoRedo - Unified hook for undo/redo functionality
 *
 * Uses zundo's temporal middleware to provide undo/redo for all four stores:
 * scenes, characters, dialogues, sceneElements.
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
    dialogues: { past: number; future: number };
    elements: { past: number; future: number };
  };
}

export function useUndoRedo(): UndoRedoState {
  // REACTIVE: Subscribe to scenes temporal state with defensive fallbacks
  const scenesPastStates = useStore(useScenesStore.temporal, (state) => state?.pastStates ?? []);
  const scenesFutureStates = useStore(
    useScenesStore.temporal,
    (state) => state?.futureStates ?? []
  );

  // REACTIVE: Subscribe to characters temporal state with defensive fallbacks
  const charsPastStates = useStore(useCharactersStore.temporal, (state) => state?.pastStates ?? []);
  const charsFutureStates = useStore(
    useCharactersStore.temporal,
    (state) => state?.futureStates ?? []
  );

  // REACTIVE: Subscribe to dialogues temporal state with defensive fallbacks
  const dialoguesPastStates = useStore(
    useDialoguesStore.temporal,
    (state) => state?.pastStates ?? []
  );
  const dialoguesFutureStates = useStore(
    useDialoguesStore.temporal,
    (state) => state?.futureStates ?? []
  );

  // REACTIVE: Subscribe to sceneElements temporal state with defensive fallbacks
  const elementsPastStates = useStore(
    useSceneElementsStore.temporal,
    (state) => state?.pastStates ?? []
  );
  const elementsFutureStates = useStore(
    useSceneElementsStore.temporal,
    (state) => state?.futureStates ?? []
  );

  /**
   * Undo the last action across all four stores (with defensive wrappers)
   */
  const undo = () => {
    const scenesState = useScenesStore.temporal.getState?.();
    const charsState = useCharactersStore.temporal.getState?.();
    const dialoguesState = useDialoguesStore.temporal.getState?.();
    const elementsState = useSceneElementsStore.temporal.getState?.();

    if (scenesState?.pastStates?.length > 0) scenesState.undo?.();
    if (charsState?.pastStates?.length > 0) charsState.undo?.();
    if (dialoguesState?.pastStates?.length > 0) dialoguesState.undo?.();
    if (elementsState?.pastStates?.length > 0) elementsState.undo?.();
  };

  /**
   * Redo the last undone action across all four stores (with defensive wrappers)
   */
  const redo = () => {
    const scenesState = useScenesStore.temporal.getState?.();
    const charsState = useCharactersStore.temporal.getState?.();
    const dialoguesState = useDialoguesStore.temporal.getState?.();
    const elementsState = useSceneElementsStore.temporal.getState?.();

    if (scenesState?.futureStates?.length > 0) scenesState.redo?.();
    if (charsState?.futureStates?.length > 0) charsState.redo?.();
    if (dialoguesState?.futureStates?.length > 0) dialoguesState.redo?.();
    if (elementsState?.futureStates?.length > 0) elementsState.redo?.();
  };

  /**
   * Clear undo/redo history for all four stores (with defensive wrappers)
   */
  const clear = () => {
    useScenesStore.temporal.getState?.()?.clear?.();
    useCharactersStore.temporal.getState?.()?.clear?.();
    useDialoguesStore.temporal.getState?.()?.clear?.();
    useSceneElementsStore.temporal.getState?.()?.clear?.();
  };

  return {
    undo,
    redo,
    // REACTIVE: These values update automatically when undo/redo state changes
    canUndo:
      scenesPastStates.length > 0 ||
      charsPastStates.length > 0 ||
      dialoguesPastStates.length > 0 ||
      elementsPastStates.length > 0,
    canRedo:
      scenesFutureStates.length > 0 ||
      charsFutureStates.length > 0 ||
      dialoguesFutureStates.length > 0 ||
      elementsFutureStates.length > 0,
    clear,
    // Expose individual store states for debugging
    stats: {
      scenes: { past: scenesPastStates.length, future: scenesFutureStates.length },
      characters: { past: charsPastStates.length, future: charsFutureStates.length },
      dialogues: { past: dialoguesPastStates.length, future: dialoguesFutureStates.length },
      elements: { past: elementsPastStates.length, future: elementsFutureStates.length },
    },
  };
}
