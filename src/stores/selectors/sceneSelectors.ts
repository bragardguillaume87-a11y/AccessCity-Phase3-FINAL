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
import type { SceneMetadata, SceneCharacter } from '../../types';

// Module-level fallback — référence stable pour React.memo et Zustand
const EMPTY_SCENE_CHARACTERS: SceneCharacter[] = [];

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
 * Récupère les personnages placés sur une scène.
 *
 * ⚠️ Retourne les SceneCharacter (positions, moods) — pas les Character du projet.
 * Pour les données de personnage (nom, sprites) → combiner avec useCharacters().
 *
 * Abonne uniquement à sceneElementsStore (pas de surcoût scenesStore/dialoguesStore).
 *
 * @example
 * const sceneChars = useSceneCharacters(sceneId);
 * // sceneChars[i].characterId → id dans charactersStore
 */
export function useSceneCharacters(sceneId: string | null | undefined): SceneCharacter[] {
  return useSceneElementsStore(
    useCallback(
      (s) =>
        sceneId
          ? (s?.elementsByScene[sceneId]?.characters ?? EMPTY_SCENE_CHARACTERS)
          : EMPTY_SCENE_CHARACTERS,
      [sceneId]
    )
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
