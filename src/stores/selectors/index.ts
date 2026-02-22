/**
 * Composed Selectors
 *
 * **Pattern**: Facade Pattern - Selectors composés multi-stores
 * **Objectif**: Faciliter la migration scenesStore → 3 stores séparés
 *
 * Ce fichier fournit des selectors qui combinent les données de:
 * - scenesStore (métadonnées scènes)
 * - dialoguesStore (dialogues par scène)
 * - sceneElementsStore (characters, textBoxes, props)
 *
 * Usage: Importer ces selectors au lieu d'accéder directement aux stores
 *
 * @example
 * // ❌ Ancien: Accès direct scenesStore
 * const scene = useScenesStore(s => s.scenes.find(sc => sc.id === sceneId));
 *
 * // ✅ Nouveau: Selector composé
 * const scene = useSceneWithElements(sceneId);
 */

import { useMemo } from 'react';
import { useScenesStore } from '../scenesStore';
import { useDialoguesStore } from '../dialoguesStore';
import { useSceneElementsStore } from '../sceneElementsStore';
import type { Scene, Dialogue, SceneCharacter, TextBox, Prop } from '../../types';

/** Stable empty references to avoid infinite re-render loops in useSyncExternalStore */
const EMPTY_DIALOGUES: Dialogue[] = [];
const EMPTY_CHARACTERS: SceneCharacter[] = [];
const EMPTY_TEXTBOXES: TextBox[] = [];
const EMPTY_PROPS: Prop[] = [];
const EMPTY_ELEMENTS = { characters: EMPTY_CHARACTERS, textBoxes: EMPTY_TEXTBOXES, props: EMPTY_PROPS };

// Re-export all selectors from sceneSelectors and characterSelectors
export * from './sceneSelectors';
export * from './characterSelectors';

// ============================================================================
// COMPOSED SELECTORS
// ============================================================================

/**
 * Récupère une scène complète avec tous ses éléments
 *
 * Combine:
 * - scenesStore.getSceneById()
 * - dialoguesStore.getDialoguesByScene()
 * - sceneElementsStore.getElementsForScene()
 *
 * @returns Scene avec dialogues[], characters[], textBoxes[], props[]
 */
export function useSceneWithElements(sceneId: string | undefined): Scene | undefined {
  const id = sceneId ?? '';

  // Use raw store data with stable empty fallbacks to avoid infinite re-render loops.
  // Calling store methods like getElementsForScene() inside selectors creates new objects
  // on each call, which useSyncExternalStore interprets as tearing → infinite loop.
  const sceneMetadata = useScenesStore((s) => id ? s.getSceneById(id) : undefined);
  const dialogues = useDialoguesStore((s) => (id && s.dialoguesByScene[id]) || EMPTY_DIALOGUES);
  const characters = useSceneElementsStore((s) => (id && s.elementsByScene[id]?.characters) || EMPTY_CHARACTERS);
  const textBoxes = useSceneElementsStore((s) => (id && s.elementsByScene[id]?.textBoxes) || EMPTY_TEXTBOXES);
  const props = useSceneElementsStore((s) => (id && s.elementsByScene[id]?.props) || EMPTY_PROPS);

  return useMemo(() => {
    if (!sceneMetadata) return undefined;
    return { ...sceneMetadata, dialogues, characters, textBoxes, props };
  }, [sceneMetadata, dialogues, characters, textBoxes, props]);
}

/**
 * Récupère toutes les scènes avec leurs éléments
 *
 * @returns Scene[] complètes
 */
export function useAllScenesWithElements(): Scene[] {
  const scenes = useScenesStore((s) => s.scenes);
  const dialoguesByScene = useDialoguesStore((s) => s.dialoguesByScene);
  const elementsByScene = useSceneElementsStore((s) => s.elementsByScene);

  return useMemo(() => scenes.map((scene) => ({
    ...scene,
    dialogues: dialoguesByScene[scene.id] || [],
    characters: elementsByScene[scene.id]?.characters || [],
    textBoxes: elementsByScene[scene.id]?.textBoxes || [],
    props: elementsByScene[scene.id]?.props || [],
  })), [scenes, dialoguesByScene, elementsByScene]);
}

/**
 * Récupère les dialogues d'une scène (shortcut)
 */
export function useSceneDialogues(sceneId: string) {
  return useDialoguesStore((s) => s.dialoguesByScene[sceneId] || EMPTY_DIALOGUES);
}

/**
 * Récupère les personnages d'une scène (shortcut)
 */
export function useSceneCharacters(sceneId: string) {
  return useSceneElementsStore((s) => s.elementsByScene[sceneId]?.characters || EMPTY_CHARACTERS);
}

/**
 * Récupère les éléments visuels d'une scène (shortcut)
 */
export function useSceneElements(sceneId: string) {
  return useSceneElementsStore((s) => s.elementsByScene[sceneId] || EMPTY_ELEMENTS);
}

// ============================================================================
// ACTIONS COMPOSÉES (BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Actions combinées pour backward compatibility
 *
 * Permet aux composants d'utiliser une seule interface au lieu d'importer 3 stores
 */
export function useSceneActions() {
  // Scenes
  const addScene = useScenesStore((s) => s.addScene);
  const updateScene = useScenesStore((s) => s.updateScene);
  const deleteScene = useScenesStore((s) => s.deleteScene);
  const setSceneBackground = useScenesStore((s) => s.setSceneBackground);

  // Dialogues
  const addDialogue = useDialoguesStore((s) => s.addDialogue);
  const addDialogues = useDialoguesStore((s) => s.addDialogues);
  const updateDialogue = useDialoguesStore((s) => s.updateDialogue);
  const deleteDialogue = useDialoguesStore((s) => s.deleteDialogue);
  const duplicateDialogue = useDialoguesStore((s) => s.duplicateDialogue);
  const reorderDialogues = useDialoguesStore((s) => s.reorderDialogues);
  const insertDialoguesAfter = useDialoguesStore((s) => s.insertDialoguesAfter);

  // Scene Elements - Characters
  const addCharacterToScene = useSceneElementsStore((s) => s.addCharacterToScene);
  const removeCharacterFromScene = useSceneElementsStore((s) => s.removeCharacterFromScene);
  const updateSceneCharacter = useSceneElementsStore((s) => s.updateSceneCharacter);
  const updateCharacterPosition = useSceneElementsStore((s) => s.updateCharacterPosition);
  const updateCharacterAnimation = useSceneElementsStore((s) => s.updateCharacterAnimation);

  // Scene Elements - TextBoxes
  const addTextBoxToScene = useSceneElementsStore((s) => s.addTextBoxToScene);
  const removeTextBoxFromScene = useSceneElementsStore((s) => s.removeTextBoxFromScene);
  const updateTextBox = useSceneElementsStore((s) => s.updateTextBox);

  // Scene Elements - Props
  const addPropToScene = useSceneElementsStore((s) => s.addPropToScene);
  const removePropFromScene = useSceneElementsStore((s) => s.removePropFromScene);
  const updateProp = useSceneElementsStore((s) => s.updateProp);

  return {
    // Scenes
    addScene,
    updateScene,
    deleteScene,
    setSceneBackground,

    // Dialogues
    addDialogue,
    addDialogues,
    updateDialogue,
    deleteDialogue,
    duplicateDialogue,
    reorderDialogues,
    insertDialoguesAfter,

    // Characters
    addCharacterToScene,
    removeCharacterFromScene,
    updateSceneCharacter,
    updateCharacterPosition,
    updateCharacterAnimation,

    // TextBoxes
    addTextBoxToScene,
    removeTextBoxFromScene,
    updateTextBox,

    // Props
    addPropToScene,
    removePropFromScene,
    updateProp,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useSceneWithElements,
  useAllScenesWithElements,
  useSceneDialogues,
  useSceneCharacters,
  useSceneElements,
  useSceneActions,
};
