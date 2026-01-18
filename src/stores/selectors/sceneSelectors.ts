/**
 * Scene Selectors
 *
 * Memoized selectors for the scenes store.
 * Prevents unnecessary re-renders by returning stable references.
 *
 * Based on: https://tkdodo.eu/blog/working-with-zustand
 */

import { useCallback, useMemo } from 'react';
import { useScenesStore } from '../scenesStore';
import type { Scene, Dialogue, SceneCharacter } from '../../types';

// ============================================================================
// SCENE SELECTORS
// ============================================================================

/**
 * Select a single scene by ID.
 * Memoized to prevent re-renders when other scenes change.
 *
 * @example
 * ```typescript
 * const scene = useSceneById('scene-123');
 * ```
 */
export function useSceneById(sceneId: string | null | undefined): Scene | undefined {
  return useScenesStore(
    useCallback(
      (state) => (sceneId ? state.scenes.find((s) => s.id === sceneId) : undefined),
      [sceneId]
    )
  );
}

/**
 * Select all scenes (stable reference).
 * Use this instead of inline selectors for better performance.
 */
export function useScenes(): Scene[] {
  return useScenesStore((state) => state.scenes);
}

/**
 * Select scenes count (optimized - doesn't re-render on scene content changes).
 */
export function useScenesCount(): number {
  return useScenesStore((state) => state.scenes.length);
}

/**
 * Select scene IDs only (lightweight selector for lists).
 */
export function useSceneIds(): string[] {
  return useScenesStore(
    useCallback((state) => state.scenes.map((s) => s.id), [])
  );
}

// ============================================================================
// DIALOGUE SELECTORS
// ============================================================================

/**
 * Select dialogues for a specific scene.
 * Memoized to prevent re-renders when other scenes change.
 */
export function useDialoguesBySceneId(sceneId: string | null | undefined): Dialogue[] {
  return useScenesStore(
    useCallback(
      (state) => {
        if (!sceneId) return [];
        const scene = state.scenes.find((s) => s.id === sceneId);
        return scene?.dialogues ?? [];
      },
      [sceneId]
    )
  );
}

/**
 * Select a single dialogue by scene ID and index.
 */
export function useDialogueByIndex(
  sceneId: string | null | undefined,
  index: number | undefined
): Dialogue | undefined {
  return useScenesStore(
    useCallback(
      (state) => {
        if (!sceneId || index === undefined || index < 0) return undefined;
        const scene = state.scenes.find((s) => s.id === sceneId);
        return scene?.dialogues?.[index];
      },
      [sceneId, index]
    )
  );
}

/**
 * Select dialogues count for a scene.
 */
export function useDialoguesCount(sceneId: string | null | undefined): number {
  return useScenesStore(
    useCallback(
      (state) => {
        if (!sceneId) return 0;
        const scene = state.scenes.find((s) => s.id === sceneId);
        return scene?.dialogues?.length ?? 0;
      },
      [sceneId]
    )
  );
}

// ============================================================================
// SCENE CHARACTERS SELECTORS
// ============================================================================

/**
 * Select characters placed in a specific scene.
 */
export function useSceneCharacters(sceneId: string | null | undefined): SceneCharacter[] {
  return useScenesStore(
    useCallback(
      (state) => {
        if (!sceneId) return [];
        const scene = state.scenes.find((s) => s.id === sceneId);
        return scene?.characters ?? [];
      },
      [sceneId]
    )
  );
}

/**
 * Select a scene character by its instance ID.
 */
export function useSceneCharacterById(
  sceneId: string | null | undefined,
  sceneCharId: string | null | undefined
): SceneCharacter | undefined {
  return useScenesStore(
    useCallback(
      (state) => {
        if (!sceneId || !sceneCharId) return undefined;
        const scene = state.scenes.find((s) => s.id === sceneId);
        return scene?.characters?.find((c) => c.id === sceneCharId);
      },
      [sceneId, sceneCharId]
    )
  );
}

// ============================================================================
// ACTIONS SELECTORS (stable references)
// ============================================================================

/**
 * Select scene actions (stable references).
 * Use object destructuring for specific actions.
 */
export function useSceneActions() {
  const addScene = useScenesStore((state) => state.addScene);
  const updateScene = useScenesStore((state) => state.updateScene);
  const deleteScene = useScenesStore((state) => state.deleteScene);
  const reorderScenes = useScenesStore((state) => state.reorderScenes);
  const setSceneBackground = useScenesStore((state) => state.setSceneBackground);

  return useMemo(
    () => ({
      addScene,
      updateScene,
      deleteScene,
      reorderScenes,
      setSceneBackground,
    }),
    [addScene, updateScene, deleteScene, reorderScenes, setSceneBackground]
  );
}

/**
 * Select dialogue actions (stable references).
 */
export function useDialogueActions() {
  const addDialogue = useScenesStore((state) => state.addDialogue);
  const addDialogues = useScenesStore((state) => state.addDialogues);
  const updateDialogue = useScenesStore((state) => state.updateDialogue);
  const deleteDialogue = useScenesStore((state) => state.deleteDialogue);
  const reorderDialogues = useScenesStore((state) => state.reorderDialogues);
  const duplicateDialogue = useScenesStore((state) => state.duplicateDialogue);

  return useMemo(
    () => ({
      addDialogue,
      addDialogues,
      updateDialogue,
      deleteDialogue,
      reorderDialogues,
      duplicateDialogue,
    }),
    [addDialogue, addDialogues, updateDialogue, deleteDialogue, reorderDialogues, duplicateDialogue]
  );
}

/**
 * Select scene character actions (stable references).
 */
export function useSceneCharacterActions() {
  const addCharacterToScene = useScenesStore((state) => state.addCharacterToScene);
  const removeCharacterFromScene = useScenesStore((state) => state.removeCharacterFromScene);
  const updateSceneCharacter = useScenesStore((state) => state.updateSceneCharacter);
  const updateCharacterAnimation = useScenesStore((state) => state.updateCharacterAnimation);
  const updateCharacterPosition = useScenesStore((state) => state.updateCharacterPosition);

  return useMemo(
    () => ({
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter,
      updateCharacterAnimation,
      updateCharacterPosition,
    }),
    [
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter,
      updateCharacterAnimation,
      updateCharacterPosition,
    ]
  );
}
