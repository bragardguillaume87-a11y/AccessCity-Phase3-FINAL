import { useScenesStore, useCharactersStore, useUIStore } from '@/stores';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import type { Scene, SceneCharacter, Dialogue, Position } from '@/types';

/** Auto-positioning constants for characters placed without explicit position */
const AUTO_POSITION = {
  PLAYER_X: 20,
  CENTER_X: 50,
  RIGHT_X: 80,
  DEFAULT_Y: 50,
  CENTER_THRESHOLD: 10,
} as const;

export interface UseCanvasActionsProps {
  selectedScene: Scene | undefined;
  sceneCharacters: SceneCharacter[];
  setShowAddCharacterModal?: (show: boolean) => void;
}

/**
 * useCanvasActions - Facade for all canvas CRUD operations
 *
 * Provides both high-level handlers (handleAddDialogue, handleSetBackground)
 * and store action passthroughs for child components.
 */
export function useCanvasActions({
  selectedScene,
  sceneCharacters,
  setShowAddCharacterModal,
}: UseCanvasActionsProps) {
  // Store actions (granular selectors for minimal re-renders)
  const addDialogue = useDialoguesStore(s => s.addDialogue);
  const addCharacterToScene = useSceneElementsStore(s => s.addCharacterToScene);
  const removeCharacterFromScene = useSceneElementsStore(s => s.removeCharacterFromScene);
  const updateSceneCharacter = useSceneElementsStore(s => s.updateSceneCharacter);
  const setSceneBackground = useScenesStore(s => s.setSceneBackground);
  const addTextBoxToScene = useSceneElementsStore(s => s.addTextBoxToScene);
  const removeTextBoxFromScene = useSceneElementsStore(s => s.removeTextBoxFromScene);
  const updateTextBox = useSceneElementsStore(s => s.updateTextBox);
  const addPropToScene = useSceneElementsStore(s => s.addPropToScene);
  const removePropFromScene = useSceneElementsStore(s => s.removePropFromScene);
  const updateProp = useSceneElementsStore(s => s.updateProp);
  const characters = useCharactersStore(s => s.characters);

  // --- High-level handlers ---

  const handleAddDialogue = () => {
    if (!selectedScene) return;
    const newDialogue: Dialogue = {
      id: `dialogue-${Date.now()}`,
      speaker: '',
      text: 'New dialogue',
      choices: []
    };
    addDialogue(selectedScene.id, newDialogue);
  };

  const handleSetBackground = () => {
    if (selectedScene) {
      const store = useUIStore.getState();
      store.setActiveModal('assets');
      store.setModalContext({ category: 'backgrounds', targetSceneId: selectedScene.id });
    }
  };

  const handleAddCharacterToScene = () => {
    if (!selectedScene) return;
    setShowAddCharacterModal?.(true);
  };

  const handleAddCharacterConfirm = (characterId: string, mood: string, position?: Position) => {
    if (!selectedScene) return;

    let finalPosition = position;
    if (!finalPosition) {
      if (characterId === 'player') {
        finalPosition = { x: AUTO_POSITION.PLAYER_X, y: AUTO_POSITION.DEFAULT_Y };
      } else {
        const centerOccupied = sceneCharacters.some(
          sc => Math.abs((sc.position?.x || AUTO_POSITION.CENTER_X) - AUTO_POSITION.CENTER_X) < AUTO_POSITION.CENTER_THRESHOLD
        );
        finalPosition = centerOccupied
          ? { x: AUTO_POSITION.RIGHT_X, y: AUTO_POSITION.DEFAULT_Y }
          : { x: AUTO_POSITION.CENTER_X, y: AUTO_POSITION.DEFAULT_Y };
      }
    }

    addCharacterToScene(selectedScene.id, characterId, mood, finalPosition);
  };

  return {
    // High-level handlers
    handleAddDialogue,
    handleSetBackground,
    handleAddCharacterToScene,
    handleAddCharacterConfirm,
    // Store actions (passthrough facade for child components)
    addDialogue,
    addCharacterToScene,
    removeCharacterFromScene,
    updateSceneCharacter,
    setSceneBackground,
    addTextBoxToScene,
    removeTextBoxFromScene,
    updateTextBox,
    addPropToScene,
    removePropFromScene,
    updateProp,
    // Data
    characters,
  };
}
