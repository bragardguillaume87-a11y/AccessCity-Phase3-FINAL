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
import { useDialoguesStore } from '../dialoguesStore';
import { useSceneElementsStore } from '../sceneElementsStore';
import type { SceneMetadata } from '../../types';

// ============================================================================
// SCENE SELECTORS
// ============================================================================

/**
 * Select a single scene by ID — métadonnées uniquement.
 * Memoized to prevent re-renders when other scenes change.
 *
 * ⚠️ Retourne SceneMetadata (pas Scene) — dialogues/characters ABSENTS.
 * Pour une scène complète → useSceneWithElements(sceneId)
 *
 * @example
 * ```typescript
 * const meta = useSceneById('scene-123'); // SceneMetadata | undefined
 * const scene = useSceneWithElements('scene-123'); // Scene | undefined (avec dialogues)
 * ```
 */
export function useSceneById(sceneId: string | null | undefined): SceneMetadata | undefined {
  return useScenesStore(
    useCallback(
      (state) => (sceneId ? state?.scenes?.find((s) => s.id === sceneId) : undefined),
      [sceneId]
    )
  );
}

/**
 * Select all scenes — métadonnées uniquement (stable reference).
 *
 * ⚠️ Retourne SceneMetadata[] (pas Scene[]) — dialogues/characters ABSENTS.
 * Pour toutes les scènes complètes → useAllScenesWithElements()
 */
// ⚠️ Module-level constant — évite créer un [] inline (instabilité de référence zundo/Zustand 5).
const EMPTY_SCENES_ARRAY: SceneMetadata[] = [];

export function useScenes(): SceneMetadata[] {
  return useScenesStore((state) => state?.scenes ?? EMPTY_SCENES_ARRAY);
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
// ACTIONS SELECTORS (stable references)
// ============================================================================

/**
 * Select dialogue actions (stable references).
 */
export function useDialogueActions() {
  const addDialogue = useDialoguesStore((state) => state.addDialogue);
  const addDialogues = useDialoguesStore((state) => state.addDialogues);
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);
  const deleteDialogue = useDialoguesStore((state) => state.deleteDialogue);
  const reorderDialogues = useDialoguesStore((state) => state.reorderDialogues);
  const duplicateDialogue = useDialoguesStore((state) => state.duplicateDialogue);

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
  const addCharacterToScene = useSceneElementsStore((state) => state.addCharacterToScene);
  const removeCharacterFromScene = useSceneElementsStore((state) => state.removeCharacterFromScene);
  const updateSceneCharacter = useSceneElementsStore((state) => state.updateSceneCharacter);
  const updateCharacterAnimation = useSceneElementsStore((state) => state.updateCharacterAnimation);
  const updateCharacterPosition = useSceneElementsStore((state) => state.updateCharacterPosition);

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
