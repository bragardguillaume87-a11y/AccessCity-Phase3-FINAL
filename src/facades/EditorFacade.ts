/**
 * Editor Facade — Unified interface to editor subsystems
 * (Scenes, Characters, Selection, Factories, Builders)
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
  const scenesStore = useScenesStore();
  const dialoguesStore = useDialoguesStore();
  const elementsStore = useSceneElementsStore();
  const charactersStore = useCharactersStore();
  const scenes = useScenesStore((s) => s.scenes);
  const selection = useSelection();

  const createScene = useCallback(
    (title: string, description: string = ''): string => {
      const sceneId = scenesStore.addScene();
      scenesStore.updateScene(sceneId, { title, description });
      return sceneId;
    },
    [scenesStore]
  );

  const createSceneWithBackground = useCallback(
    (title: string, description: string, backgroundUrl: string): string => {
      const sceneId = scenesStore.addScene();
      scenesStore.updateScene(sceneId, { title, description, backgroundUrl });
      return sceneId;
    },
    [scenesStore]
  );

  const getScene = useCallback(
    (sceneId: string): SceneMetadata | undefined => scenesStore.scenes.find((s) => s.id === sceneId),
    [scenesStore.scenes]
  );

  const getAllScenes = useCallback((): SceneMetadata[] => scenesStore.scenes, [scenesStore.scenes]);

  const updateScene = useCallback(
    (sceneId: string, updates: Partial<SceneMetadata>): void => {
      scenesStore.updateScene(sceneId, updates);
    },
    [scenesStore]
  );

  const deleteScene = useCallback(
    (sceneId: string): void => { scenesStore.deleteScene(sceneId); },
    [scenesStore]
  );

  const duplicateScene = useCallback(
    (sceneId: string, newTitle?: string): string => {
      const originalScene = getScene(sceneId);
      if (!originalScene) {
        throw new Error(`[EditorFacade] Cannot duplicate - scene not found: ${sceneId}`);
      }
      const newSceneId = scenesStore.addScene();
      // Copy metadata only — dialogues/characters are in their own stores
      scenesStore.updateScene(newSceneId, {
        title: newTitle || `${originalScene.title} (Copy)`,
        description: originalScene.description,
        backgroundUrl: originalScene.backgroundUrl,
        audio: originalScene.audio,
      });
      return newSceneId;
    },
    [scenesStore, getScene]
  );

  const addDialogueToScene = useCallback(
    (sceneId: string, speaker: string, text: string, sfxUrl?: string): void => {
      const dialogue = DialogueFactory.create({
        speaker,
        text,
        ...(sfxUrl && { sfx: { url: sfxUrl, volume: AUDIO_DEFAULTS.SFX_VOLUME } }),
      });
      dialoguesStore.addDialogue(sceneId, dialogue);
    },
    [dialoguesStore]
  );

  const updateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>): void => {
      dialoguesStore.updateDialogue(sceneId, dialogueIndex, updates);
    },
    [dialoguesStore]
  );

  const deleteDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      dialoguesStore.deleteDialogue(sceneId, dialogueIndex);
    },
    [dialoguesStore]
  );

  const duplicateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      dialoguesStore.duplicateDialogue(sceneId, dialogueIndex);
    },
    [dialoguesStore]
  );

  const reorderDialogues = useCallback(
    (sceneId: string, oldIndex: number, newIndex: number): void => {
      dialoguesStore.reorderDialogues(sceneId, oldIndex, newIndex);
    },
    [dialoguesStore]
  );

  const createCharacter = useCallback(
    (name: string, description: string = ''): string => {
      const characterId = charactersStore.addCharacter();
      charactersStore.updateCharacter({ id: characterId, name, description });
      return characterId;
    },
    [charactersStore]
  );

  const getCharacter = useCallback(
    (characterId: string): Character | undefined => charactersStore.getCharacterById(characterId),
    [charactersStore]
  );

  const getAllCharacters = useCallback((): Character[] => charactersStore.characters, [charactersStore.characters]);

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>): void => {
      charactersStore.updateCharacter({ id: characterId, ...updates });
    },
    [charactersStore]
  );

  const deleteCharacter = useCallback(
    (characterId: string): void => { charactersStore.deleteCharacter(characterId); },
    [charactersStore]
  );

  const addCharacterToScene = useCallback(
    (sceneId: string, characterId: string, position?: Position, mood: string = 'neutral'): void => {
      elementsStore.addCharacterToScene(sceneId, characterId, mood, position);
    },
    [elementsStore]
  );

  const removeCharacterFromScene = useCallback(
    (sceneId: string, sceneCharacterId: string): void => {
      elementsStore.removeCharacterFromScene(sceneId, sceneCharacterId);
    },
    [elementsStore]
  );

  const updateSceneCharacter = useCallback(
    (sceneId: string, sceneCharacterId: string, position?: Position, scale?: number): void => {
      const updates: { x?: number; y?: number; scale?: number } = {};
      if (position) { updates.x = position.x; updates.y = position.y; }
      if (scale !== undefined) { updates.scale = scale; }
      elementsStore.updateCharacterPosition(sceneId, sceneCharacterId, updates);
    },
    [elementsStore]
  );

  const getSceneBuilder = useCallback(
    (title: string, description?: string): SceneBuilder => new SceneBuilder(title, description),
    []
  );

  const buildAndAddScene = useCallback(
    (builder: SceneBuilder): string => {
      const builtScene = builder.build();
      const sceneId = scenesStore.addScene();
      scenesStore.updateScene(sceneId, {
        title: builtScene.title,
        description: builtScene.description,
        backgroundUrl: builtScene.backgroundUrl,
        audio: builtScene.audio,
      });
      if (builtScene.dialogues?.length) {
        dialoguesStore.addDialogues(sceneId, builtScene.dialogues);
      }
      if (builtScene.characters?.length) {
        for (const char of builtScene.characters) {
          elementsStore.addCharacterToScene(sceneId, char.characterId, char.mood, char.position, char.entranceAnimation);
        }
      }
      if (builtScene.props?.length) {
        for (const prop of builtScene.props) { elementsStore.addPropToScene(sceneId, prop); }
      }
      if (builtScene.textBoxes?.length) {
        for (const textBox of builtScene.textBoxes) { elementsStore.addTextBoxToScene(sceneId, textBox); }
      }
      return sceneId;
    },
    [scenesStore, dialoguesStore, elementsStore]
  );

  const selectSceneWithAutoDialogue = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        logger.warn(`[EditorFacade] Scene not found: ${sceneId}`);
        return;
      }
      // Lire les dialogues depuis dialoguesStore (scenesStore a des tableaux vides)
      const sceneDialogues = dialoguesStore.getDialoguesByScene(sceneId);
      if (sceneDialogues.length > 0) {
        selection.selectDialogue(sceneId, 0);
      } else {
        selection.selectScene(sceneId);
      }
    },
    [scenes, dialoguesStore, selection]
  );

  return useMemo(
    () => ({
      createScene, createSceneWithBackground, getScene, getAllScenes,
      updateScene, deleteScene, duplicateScene,
      addDialogueToScene, updateDialogue, deleteDialogue, duplicateDialogue, reorderDialogues,
      createCharacter, getCharacter, getAllCharacters, updateCharacter, deleteCharacter,
      addCharacterToScene, removeCharacterFromScene, updateSceneCharacter,
      selectSceneWithAutoDialogue,
      selectScene: selection.selectScene,
      selectDialogue: selection.selectDialogue,
      selectCharacter: selection.selectCharacter,
      clearSelection: selection.clearSelection,
      getSceneBuilder, buildAndAddScene,
    }),
    [
      createScene, createSceneWithBackground, getScene, getAllScenes,
      updateScene, deleteScene, duplicateScene,
      addDialogueToScene, updateDialogue, deleteDialogue, duplicateDialogue, reorderDialogues,
      createCharacter, getCharacter, getAllCharacters, updateCharacter, deleteCharacter,
      addCharacterToScene, removeCharacterFromScene, updateSceneCharacter,
      selectSceneWithAutoDialogue, selection, getSceneBuilder, buildAndAddScene,
    ]
  );
}
