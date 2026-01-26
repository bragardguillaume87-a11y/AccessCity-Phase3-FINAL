/**
 * Editor Facade - Facade Pattern
 *
 * Provides a unified, simplified interface to the editor's complex subsystems.
 * Implements the Facade pattern from Gang of Four.
 *
 * Benefits:
 * - Single entry point for common editor operations
 * - Hides complexity of multiple stores and hooks
 * - Consistent API across the application
 * - Easy to mock for testing
 * - Reduces coupling between components and stores
 *
 * Subsystems unified:
 * - Scenes Store (scene CRUD)
 * - Characters Store (character CRUD)
 * - Selection Store (selection management)
 * - Factories (object creation with consistent defaults)
 * - Builders (complex construction)
 *
 * @module facades/EditorFacade
 * @example
 * ```typescript
 * const editor = useEditorFacade();
 *
 * // Scene operations
 * const sceneId = editor.createScene('Living Room', 'A cozy room');
 * editor.addDialogueToScene(sceneId, 'Character1', 'Hello!');
 *
 * // Selection operations
 * editor.selectScene(sceneId);
 * editor.selectDialogue(sceneId, 0);
 * ```
 */

import { useMemo, useCallback } from 'react';
import { useScenesStore, useCharactersStore, useScenes } from '@/stores';
import { useSelection } from '@/hooks/useSelection';
import { SceneFactory } from '@/factories/SceneFactory';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { SceneBuilder } from '@/builders/SceneBuilder';
import type { Scene, Character, Dialogue, Position, Size } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Editor Facade Interface
 * Complete API for common editor operations
 */
export interface EditorFacadeAPI {
  // === SCENE OPERATIONS ===

  /**
   * Create a new scene with title and description
   * Returns the new scene ID
   */
  createScene: (title: string, description?: string) => string;

  /**
   * Create a scene with background
   * Returns the new scene ID
   */
  createSceneWithBackground: (title: string, description: string, backgroundUrl: string) => string;

  /**
   * Get scene by ID
   */
  getScene: (sceneId: string) => Scene | undefined;

  /**
   * Get all scenes
   */
  getAllScenes: () => Scene[];

  /**
   * Update scene properties
   */
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;

  /**
   * Delete scene
   */
  deleteScene: (sceneId: string) => void;

  /**
   * Duplicate scene with optional new title
   */
  duplicateScene: (sceneId: string, newTitle?: string) => string;

  // === DIALOGUE OPERATIONS ===

  /**
   * Add dialogue to scene
   */
  addDialogueToScene: (sceneId: string, speaker: string, text: string, sfxUrl?: string) => void;

  /**
   * Update dialogue in scene
   */
  updateDialogue: (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>) => void;

  /**
   * Delete dialogue from scene
   */
  deleteDialogue: (sceneId: string, dialogueIndex: number) => void;

  /**
   * Duplicate dialogue in scene
   */
  duplicateDialogue: (sceneId: string, dialogueIndex: number) => void;

  /**
   * Reorder dialogues in scene
   */
  reorderDialogues: (sceneId: string, oldIndex: number, newIndex: number) => void;

  // === CHARACTER OPERATIONS ===

  /**
   * Create a new character
   * Returns the new character ID
   */
  createCharacter: (name: string, description?: string) => string;

  /**
   * Get character by ID
   */
  getCharacter: (characterId: string) => Character | undefined;

  /**
   * Get all characters
   */
  getAllCharacters: () => Character[];

  /**
   * Update character properties
   */
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;

  /**
   * Delete character
   */
  deleteCharacter: (characterId: string) => void;

  /**
   * Add character to scene
   */
  addCharacterToScene: (
    sceneId: string,
    characterId: string,
    position?: Position,
    mood?: string
  ) => void;

  /**
   * Remove character from scene
   */
  removeCharacterFromScene: (sceneId: string, sceneCharacterId: string) => void;

  /**
   * Update scene character properties
   */
  updateSceneCharacter: (
    sceneId: string,
    sceneCharacterId: string,
    position?: Position,
    scale?: number
  ) => void;

  // === SELECTION OPERATIONS ===

  /**
   * Select a scene intelligently:
   * - If scene has dialogues, auto-selects first dialogue
   * - If scene has no dialogues, selects scene (shows UnifiedPanel)
   */
  selectSceneWithAutoDialogue: (sceneId: string) => void;

  /**
   * Select a scene (for UnifiedPanel)
   */
  selectScene: (sceneId: string) => void;

  /**
   * Select a dialogue
   */
  selectDialogue: (sceneId: string, dialogueIndex: number) => void;

  /**
   * Select a character
   */
  selectCharacter: (characterId: string) => void;

  /**
   * Clear selection
   */
  clearSelection: () => void;

  /**
   * Navigate to next dialogue
   */
  navigateToNextDialogue: () => void;

  /**
   * Navigate to previous dialogue
   */
  navigateToPreviousDialogue: () => void;

  // === BUILDER OPERATIONS ===

  /**
   * Get a scene builder for complex scene construction
   */
  getSceneBuilder: (title: string, description?: string) => SceneBuilder;

  /**
   * Build and add scene from builder
   * Returns the new scene ID
   */
  buildAndAddScene: (builder: SceneBuilder) => string;
}

/**
 * useEditorFacade Hook
 *
 * Provides the complete EditorFacade API.
 * This is the main entry point for common editor operations.
 *
 * @returns Editor Facade API
 */
export function useEditorFacade(): EditorFacadeAPI {
  // Access stores
  const scenesStore = useScenesStore();
  const charactersStore = useCharactersStore();
  const scenes = useScenes();
  const selection = useSelection();

  // === SCENE OPERATIONS ===

  const createScene = useCallback(
    (title: string, description: string = ''): string => {
      // Call store's addScene which creates an empty scene and returns ID
      const sceneId = scenesStore.addScene();

      // Update with our desired title and description
      scenesStore.updateScene(sceneId, { title, description });

      logger.info(`[EditorFacade] Created scene: ${sceneId} (title: ${title})`);
      return sceneId;
    },
    [scenesStore]
  );

  const createSceneWithBackground = useCallback(
    (title: string, description: string, backgroundUrl: string): string => {
      const sceneId = scenesStore.addScene();
      scenesStore.updateScene(sceneId, { title, description, backgroundUrl });

      logger.info(`[EditorFacade] Created scene with background: ${sceneId}`);
      return sceneId;
    },
    [scenesStore]
  );

  const getScene = useCallback(
    (sceneId: string): Scene | undefined => {
      return scenesStore.scenes.find((s) => s.id === sceneId);
    },
    [scenesStore.scenes]
  );

  const getAllScenes = useCallback((): Scene[] => {
    return scenesStore.scenes;
  }, [scenesStore.scenes]);

  const updateScene = useCallback(
    (sceneId: string, updates: Partial<Scene>): void => {
      scenesStore.updateScene(sceneId, updates);
      logger.info(`[EditorFacade] Updated scene: ${sceneId}`);
    },
    [scenesStore]
  );

  const deleteScene = useCallback(
    (sceneId: string): void => {
      scenesStore.deleteScene(sceneId);
      logger.info(`[EditorFacade] Deleted scene: ${sceneId}`);
    },
    [scenesStore]
  );

  const duplicateScene = useCallback(
    (sceneId: string, newTitle?: string): string => {
      const originalScene = getScene(sceneId);
      if (!originalScene) {
        throw new Error(`[EditorFacade] Cannot duplicate - scene not found: ${sceneId}`);
      }

      // Create a clone using SceneFactory
      const clonedScene = SceneFactory.clone(originalScene, {
        title: newTitle || `${originalScene.title} (Copy)`,
      });

      // Add the new scene
      const newSceneId = scenesStore.addScene();

      // Update with cloned data (except ID which was generated)
      scenesStore.updateScene(newSceneId, {
        title: clonedScene.title,
        description: clonedScene.description,
        backgroundUrl: clonedScene.backgroundUrl,
        audio: clonedScene.audio,
        // Note: We don't copy dialogues/characters automatically
        // as that might not be desired in all cases
      });

      logger.info(`[EditorFacade] Duplicated scene: ${sceneId} -> ${newSceneId}`);
      return newSceneId;
    },
    [scenesStore, getScene]
  );

  // === DIALOGUE OPERATIONS ===

  const addDialogueToScene = useCallback(
    (sceneId: string, speaker: string, text: string, sfxUrl?: string): void => {
      const dialogue = DialogueFactory.create({
        speaker,
        text,
        ...(sfxUrl && { sfx: { url: sfxUrl, volume: 0.7 } }),
      });

      scenesStore.addDialogue(sceneId, dialogue);
      logger.info(`[EditorFacade] Added dialogue to scene ${sceneId}`);
    },
    [scenesStore]
  );

  const updateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number, updates: Partial<Dialogue>): void => {
      scenesStore.updateDialogue(sceneId, dialogueIndex, updates);
      logger.info(`[EditorFacade] Updated dialogue ${dialogueIndex} in scene ${sceneId}`);
    },
    [scenesStore]
  );

  const deleteDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      scenesStore.deleteDialogue(sceneId, dialogueIndex);
      logger.info(`[EditorFacade] Deleted dialogue ${dialogueIndex} from scene ${sceneId}`);
    },
    [scenesStore]
  );

  const duplicateDialogue = useCallback(
    (sceneId: string, dialogueIndex: number): void => {
      scenesStore.duplicateDialogue(sceneId, dialogueIndex);
      logger.info(`[EditorFacade] Duplicated dialogue ${dialogueIndex} in scene ${sceneId}`);
    },
    [scenesStore]
  );

  const reorderDialogues = useCallback(
    (sceneId: string, oldIndex: number, newIndex: number): void => {
      scenesStore.reorderDialogues(sceneId, oldIndex, newIndex);
      logger.info(
        `[EditorFacade] Reordered dialogues in scene ${sceneId}: ${oldIndex} -> ${newIndex}`
      );
    },
    [scenesStore]
  );

  // === CHARACTER OPERATIONS ===

  const createCharacter = useCallback(
    (name: string, description: string = ''): string => {
      // Call store's addCharacter which creates an empty character and returns ID
      const characterId = charactersStore.addCharacter();

      // Update with our desired properties
      charactersStore.updateCharacter({ id: characterId, name, description });

      logger.info(`[EditorFacade] Created character: ${characterId} (name: ${name})`);
      return characterId;
    },
    [charactersStore]
  );

  const getCharacter = useCallback(
    (characterId: string): Character | undefined => {
      return charactersStore.getCharacterById(characterId);
    },
    [charactersStore]
  );

  const getAllCharacters = useCallback((): Character[] => {
    return charactersStore.characters;
  }, [charactersStore.characters]);

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>): void => {
      charactersStore.updateCharacter({ id: characterId, ...updates });
      logger.info(`[EditorFacade] Updated character: ${characterId}`);
    },
    [charactersStore]
  );

  const deleteCharacter = useCallback(
    (characterId: string): void => {
      charactersStore.deleteCharacter(characterId);
      logger.info(`[EditorFacade] Deleted character: ${characterId}`);
    },
    [charactersStore]
  );

  const addCharacterToScene = useCallback(
    (
      sceneId: string,
      characterId: string,
      position?: Position,
      mood: string = 'neutral'
    ): void => {
      scenesStore.addCharacterToScene(sceneId, characterId, mood, position);
      logger.info(`[EditorFacade] Added character ${characterId} to scene ${sceneId}`);
    },
    [scenesStore]
  );

  const removeCharacterFromScene = useCallback(
    (sceneId: string, sceneCharacterId: string): void => {
      scenesStore.removeCharacterFromScene(sceneId, sceneCharacterId);
      logger.info(`[EditorFacade] Removed character ${sceneCharacterId} from scene ${sceneId}`);
    },
    [scenesStore]
  );

  const updateSceneCharacter = useCallback(
    (
      sceneId: string,
      sceneCharacterId: string,
      position?: Position,
      scale?: number
    ): void => {
      const updates: { x?: number; y?: number; scale?: number } = {};

      if (position) {
        updates.x = position.x;
        updates.y = position.y;
      }

      if (scale !== undefined) {
        updates.scale = scale;
      }

      scenesStore.updateCharacterPosition(sceneId, sceneCharacterId, updates);
      logger.info(`[EditorFacade] Updated scene character ${sceneCharacterId} in scene ${sceneId}`);
    },
    [scenesStore]
  );

  // === BUILDER OPERATIONS ===

  const getSceneBuilder = useCallback((title: string, description?: string): SceneBuilder => {
    return new SceneBuilder(title, description);
  }, []);

  const buildAndAddScene = useCallback(
    (builder: SceneBuilder): string => {
      const builtScene = builder.build();

      // Create new scene
      const sceneId = scenesStore.addScene();

      // Update with built scene data
      scenesStore.updateScene(sceneId, {
        title: builtScene.title,
        description: builtScene.description,
        backgroundUrl: builtScene.backgroundUrl,
        audio: builtScene.audio,
      });

      // Add dialogues
      if (builtScene.dialogues && builtScene.dialogues.length > 0) {
        scenesStore.addDialogues(sceneId, builtScene.dialogues);
      }

      // Add characters (needs individual calls)
      if (builtScene.characters && builtScene.characters.length > 0) {
        for (const char of builtScene.characters) {
          scenesStore.addCharacterToScene(
            sceneId,
            char.characterId,
            char.mood,
            char.position,
            char.entranceAnimation
          );
        }
      }

      // Add props
      if (builtScene.props && builtScene.props.length > 0) {
        for (const prop of builtScene.props) {
          scenesStore.addPropToScene(sceneId, prop);
        }
      }

      // Add text boxes
      if (builtScene.textBoxes && builtScene.textBoxes.length > 0) {
        for (const textBox of builtScene.textBoxes) {
          scenesStore.addTextBoxToScene(sceneId, textBox);
        }
      }

      logger.info(`[EditorFacade] Built and added scene: ${sceneId}`);
      return sceneId;
    },
    [scenesStore]
  );

  // === SELECTION OPERATIONS ===

  /**
   * Select a scene intelligently with auto-dialogue selection
   * This is the proper way to navigate to a scene.
   *
   * Behavior:
   * - If scene has dialogues: auto-selects first dialogue
   * - If scene has no dialogues: selects scene (shows UnifiedPanel)
   */
  const selectSceneWithAutoDialogue = useCallback(
    (sceneId: string) => {
      // Find the scene
      const scene = scenes.find((s) => s.id === sceneId);

      if (!scene) {
        logger.warn(`[EditorFacade] Scene not found: ${sceneId}`);
        return;
      }

      // If scene has dialogues, auto-select first dialogue
      if (scene.dialogues && scene.dialogues.length > 0) {
        logger.info(
          `[EditorFacade] Selecting scene ${sceneId} with auto-select of first dialogue`
        );
        selection.selectDialogue(sceneId, 0);
      } else {
        // No dialogues, select scene to show UnifiedPanel
        logger.info(`[EditorFacade] Selecting scene ${sceneId} (no dialogues, showing UnifiedPanel)`);
        selection.selectScene(sceneId);
      }
    },
    [scenes, selection]
  );

  // Build and return the complete API
  return useMemo(
    () => ({
      // Scene operations
      createScene,
      createSceneWithBackground,
      getScene,
      getAllScenes,
      updateScene,
      deleteScene,
      duplicateScene,

      // Dialogue operations
      addDialogueToScene,
      updateDialogue,
      deleteDialogue,
      duplicateDialogue,
      reorderDialogues,

      // Character operations
      createCharacter,
      getCharacter,
      getAllCharacters,
      updateCharacter,
      deleteCharacter,
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter,

      // Selection operations
      selectSceneWithAutoDialogue,
      selectScene: selection.selectScene,
      selectDialogue: selection.selectDialogue,
      selectCharacter: selection.selectCharacter,
      clearSelection: selection.clearSelection,
      navigateToNextDialogue: selection.navigateToNextDialogue,
      navigateToPreviousDialogue: selection.navigateToPreviousDialogue,

      // Builder operations
      getSceneBuilder,
      buildAndAddScene,
    }),
    [
      createScene,
      createSceneWithBackground,
      getScene,
      getAllScenes,
      updateScene,
      deleteScene,
      duplicateScene,
      addDialogueToScene,
      updateDialogue,
      deleteDialogue,
      duplicateDialogue,
      reorderDialogues,
      createCharacter,
      getCharacter,
      getAllCharacters,
      updateCharacter,
      deleteCharacter,
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter,
      selectSceneWithAutoDialogue,
      selection,
      getSceneBuilder,
      buildAndAddScene,
    ]
  );
}
