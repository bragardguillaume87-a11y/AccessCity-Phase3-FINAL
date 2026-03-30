/**
 * Editor Facade — Unified interface to editor subsystems
 * (Scenes, Characters, Selection, Factories, Builders)
 *
 * ARCHITECTURE NOTE:
 * All mutation callbacks use `.getState()` internally (never the reactive store objects).
 * This keeps every callback dep list empty ([]) → editor useMemo is a stable singleton.
 *
 * Cascade prevented:
 *   Before: useScenesStore() (whole obj) → any mutation → new scenesStore ref
 *           → all useCallback([scenesStore]) recreated → useMemo reruns → new editor
 *           → handleDialogueSelect recreated → onSelectDialogue prop changes in MainCanvas
 *           → auto-select effect fires → setState → re-render → infinite loop
 *
 *   After: getState() inside callbacks → [] deps → editor never recreated → no cascade
 */

import { useMemo, useCallback } from 'react';
import { useScenesStore, useCharactersStore } from '@/stores';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useSelection } from '@/hooks/useSelection';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { SceneBuilder } from '@/builders/SceneBuilder';
import type { SceneMetadata, Character, Dialogue, Position } from '@/types';
import { AUDIO_DEFAULTS } from '@/config/constants';
import { logger } from '@/utils/logger';

/** Editor Facade Interface */
export interface EditorFacadeAPI {
  createScene: (title: string, description?: string) => string;
  createSceneWithBackground: (title: string, description: string, backgroundUrl: string) => string;
  getScene: (sceneId: string) => SceneMetadata | undefined;
  getAllScenes: () => SceneMetadata[];
  updateScene: (sceneId: string, updates: Partial<SceneMetadata>) => void;
  deleteScene: (sceneId: string) => void;
  duplicateScene: (sceneId: string, newTitle?: string) => string;
  addDialogueToScene: (sceneId: string, speaker: string, text: string, sfxUrl?: string) => void;
  updateDialogue: (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>) => void;
  deleteDialogue: (sceneId: string, dialogueIndex: number) => void;
  duplicateDialogue: (sceneId: string, dialogueIndex: number) => void;
  reorderDialogues: (sceneId: string, oldIndex: number, newIndex: number) => void;
  createCharacter: (name: string, description?: string) => string;
  getCharacter: (characterId: string) => Character | undefined;
  getAllCharacters: () => Character[];
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  addCharacterToScene: (sceneId: string, characterId: string, position?: Position, mood?: string) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharacterId: string) => void;
  updateSceneCharacter: (sceneId: string, sceneCharacterId: string, position?: Position, scale?: number) => void;
  /** If scene has dialogues, auto-selects first dialogue; otherwise selects scene */
  selectSceneWithAutoDialogue: (sceneId: string) => void;
  selectScene: (sceneId: string) => void;
  selectDialogue: (sceneId: string, dialogueIndex: number) => void;
  selectCharacter: (characterId: string) => void;
  clearSelection: () => void;
  getSceneBuilder: (title: string, description?: string) => SceneBuilder;
  buildAndAddScene: (builder: SceneBuilder) => string;
}

/** Main hook providing the complete EditorFacade API */
export function useEditorFacade(): EditorFacadeAPI {
  // Destructure stable function refs individually — the plain object returned by useSelection()
  // is a new reference on every render, which would cause editor (useMemo) to recompute on
  // every render and cascade into infinite effect loops. Each individual function is stable
  // (useCallback with stable Zustand action deps) and safe to use as a useMemo dep.
  const {
    selectScene: selectionSelectScene,
    selectDialogue: selectionSelectDialogue,
    selectCharacter: selectionSelectCharacter,
    clearSelection: selectionClearSelection,
  } = useSelection();

  // ── Scene reads ──
  // Use getState() for fresh data on each call without creating reactive subscriptions.
  // These functions are called in event handlers (not render), so getState() is correct
  // per CLAUDE.md §6.7 "getState() dans un handler/callback → lecture ponctuelle correcte".
  const getScene = useCallback(
    (sceneId: string): SceneMetadata | undefined =>
      useScenesStore.getState().scenes.find((s) => s.id === sceneId),
    []
  );

  const getAllScenes = useCallback(
    (): SceneMetadata[] => useScenesStore.getState().scenes,
    []
  );

  // ── Scene mutations ──
  const createScene = useCallback(
    (title: string, description: string = ''): string => {
      const store = useScenesStore.getState();
      const sceneId = store.addScene();
      store.updateScene(sceneId, { title, description });
      return sceneId;
    },
    []
  );

  const createSceneWithBackground = useCallback(
    (title: string, description: string, backgroundUrl: string): string => {
      const store = useScenesStore.getState();
      const sceneId = store.addScene();
      store.updateScene(sceneId, { title, description, backgroundUrl });
      return sceneId;
    },
    []
  );

  const updateScene = useCallback(
    (sceneId: string, updates: Partial<SceneMetadata>): void => {
      useScenesStore.getState().updateScene(sceneId, updates);
    },
    []
  );

  const deleteScene = useCallback(
    (sceneId: string): void => { useScenesStore.getState().deleteScene(sceneId); },
    []
  );

  const duplicateScene = useCallback(
    (sceneId: string, newTitle?: string): string => {
      const scenesState = useScenesStore.getState();
      const originalScene = scenesState.scenes.find((s) => s.id === sceneId);
      if (!originalScene) {
        throw new Error(`[EditorFacade] Cannot duplicate - scene not found: ${sceneId}`);
      }
      const newSceneId = scenesState.addScene();
      // Copy metadata only — dialogues/characters are in their own stores
      scenesState.updateScene(newSceneId, {
        title: newTitle || `${originalScene.title} (Copy)`,
        description: originalScene.description,
        backgroundUrl: originalScene.backgroundUrl,
        audio: originalScene.audio,
      });
      return newSceneId;
    },
    []
  );

  // ── Dialogue mutations ──
  const addDialogueToScene = useCallback(
    (sceneId: string, speaker: string, text: string, sfxUrl?: string): void => {
      const dialogue = DialogueFactory.create({
        speaker,
        text,
        ...(sfxUrl && { sfx: { url: sfxUrl, volume: AUDIO_DEFAULTS.SFX_VOLUME } }),
      });
      useDialoguesStore.getState().addDialogue(sceneId, dialogue);
    },
    []
  );

  const updateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>): void => {
      useDialoguesStore.getState().updateDialogue(sceneId, dialogueIndex, updates);
    },
    []
  );

  const deleteDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      useDialoguesStore.getState().deleteDialogue(sceneId, dialogueIndex);
    },
    []
  );

  const duplicateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      useDialoguesStore.getState().duplicateDialogue(sceneId, dialogueIndex);
    },
    []
  );

  const reorderDialogues = useCallback(
    (sceneId: string, oldIndex: number, newIndex: number): void => {
      useDialoguesStore.getState().reorderDialogues(sceneId, oldIndex, newIndex);
    },
    []
  );

  // ── Character operations ──
  const createCharacter = useCallback(
    (name: string, description: string = ''): string => {
      const store = useCharactersStore.getState();
      const characterId = store.addCharacter();
      store.updateCharacter({ id: characterId, name, description });
      return characterId;
    },
    []
  );

  const getCharacter = useCallback(
    (characterId: string): Character | undefined =>
      useCharactersStore.getState().getCharacterById(characterId),
    []
  );

  const getAllCharacters = useCallback(
    (): Character[] => useCharactersStore.getState().characters,
    []
  );

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>): void => {
      useCharactersStore.getState().updateCharacter({ id: characterId, ...updates });
    },
    []
  );

  const deleteCharacter = useCallback(
    (characterId: string): void => { useCharactersStore.getState().deleteCharacter(characterId); },
    []
  );

  const addCharacterToScene = useCallback(
    (sceneId: string, characterId: string, position?: Position, mood: string = 'neutral'): void => {
      useSceneElementsStore.getState().addCharacterToScene(sceneId, characterId, mood, position);
    },
    []
  );

  const removeCharacterFromScene = useCallback(
    (sceneId: string, sceneCharacterId: string): void => {
      useSceneElementsStore.getState().removeCharacterFromScene(sceneId, sceneCharacterId);
    },
    []
  );

  const updateSceneCharacter = useCallback(
    (sceneId: string, sceneCharacterId: string, position?: Position, scale?: number): void => {
      const updates: { x?: number; y?: number; scale?: number } = {};
      if (position) { updates.x = position.x; updates.y = position.y; }
      if (scale !== undefined) { updates.scale = scale; }
      useSceneElementsStore.getState().updateCharacterPosition(sceneId, sceneCharacterId, updates);
    },
    []
  );

  // ── Builder ──
  const getSceneBuilder = useCallback(
    (title: string, description?: string): SceneBuilder => new SceneBuilder(title, description),
    []
  );

  const buildAndAddScene = useCallback(
    (builder: SceneBuilder): string => {
      const builtScene = builder.build();
      const scenesState = useScenesStore.getState();
      const sceneId = scenesState.addScene();
      scenesState.updateScene(sceneId, {
        title: builtScene.title,
        description: builtScene.description,
        backgroundUrl: builtScene.backgroundUrl,
        audio: builtScene.audio,
      });
      const dialoguesState = useDialoguesStore.getState();
      const elementsState = useSceneElementsStore.getState();
      if (builtScene.dialogues?.length) {
        dialoguesState.addDialogues(sceneId, builtScene.dialogues);
      }
      if (builtScene.characters?.length) {
        for (const char of builtScene.characters) {
          elementsState.addCharacterToScene(sceneId, char.characterId, char.mood, char.position, char.entranceAnimation);
        }
      }
      if (builtScene.props?.length) {
        for (const prop of builtScene.props) { elementsState.addPropToScene(sceneId, prop); }
      }
      if (builtScene.textBoxes?.length) {
        for (const textBox of builtScene.textBoxes) { elementsState.addTextBoxToScene(sceneId, textBox); }
      }
      return sceneId;
    },
    []
  );

  // ── Selection ──
  const selectSceneWithAutoDialogue = useCallback(
    (sceneId: string) => {
      const scene = useScenesStore.getState().scenes.find((s) => s.id === sceneId);
      if (!scene) {
        logger.warn(`[EditorFacade] Scene not found: ${sceneId}`);
        return;
      }
      // Lire les dialogues depuis dialoguesStore (scenesStore a des tableaux vides)
      const sceneDialogues = useDialoguesStore.getState().getDialoguesByScene(sceneId);
      if (sceneDialogues.length > 0) {
        selectionSelectDialogue(sceneId, 0);
      } else {
        selectionSelectScene(sceneId);
      }
    },
    [selectionSelectDialogue, selectionSelectScene]
  );

  // CRITICAL: editor is now a stable singleton.
  // All callbacks have [] deps (mutations via getState) except selectSceneWithAutoDialogue
  // which only depends on the two stable Zustand selection action refs.
  // The editor useMemo will never recompute → no cascade → no infinite loop.
  return useMemo(
    () => ({
      createScene, createSceneWithBackground, getScene, getAllScenes,
      updateScene, deleteScene, duplicateScene,
      addDialogueToScene, updateDialogue, deleteDialogue, duplicateDialogue, reorderDialogues,
      createCharacter, getCharacter, getAllCharacters, updateCharacter, deleteCharacter,
      addCharacterToScene, removeCharacterFromScene, updateSceneCharacter,
      selectSceneWithAutoDialogue,
      selectScene: selectionSelectScene,
      selectDialogue: selectionSelectDialogue,
      selectCharacter: selectionSelectCharacter,
      clearSelection: selectionClearSelection,
      getSceneBuilder, buildAndAddScene,
    }),
    [
      createScene, createSceneWithBackground, getScene, getAllScenes,
      updateScene, deleteScene, duplicateScene,
      addDialogueToScene, updateDialogue, deleteDialogue, duplicateDialogue, reorderDialogues,
      createCharacter, getCharacter, getAllCharacters, updateCharacter, deleteCharacter,
      addCharacterToScene, removeCharacterFromScene, updateSceneCharacter,
      selectSceneWithAutoDialogue,
      selectionSelectScene, selectionSelectDialogue, selectionSelectCharacter, selectionClearSelection,
      getSceneBuilder, buildAndAddScene,
    ]
  );
}
