import { useScenesStore, useCharactersStore } from '@/stores';
import type { Scene, SceneCharacter, Dialogue, Position, TextBox, Prop, ModalType, Character } from '@/types';

/**
 * Props for useCanvasActions hook
 */
export interface UseCanvasActionsProps {
  selectedScene: Scene | undefined;
  sceneCharacters: SceneCharacter[];
  setShowAddCharacterModal?: (show: boolean) => void;
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
}

/**
 * Return type for useCanvasActions hook
 */
export interface UseCanvasActionsReturn {
  // Handlers
  handleAddDialogue: () => void;
  handleSetBackground: () => void;
  handleAddCharacterToScene: () => void;
  handleAddCharacterConfirm: (characterId: string, mood: string, position?: Position) => void;

  // Store actions (passthrough for components)
  addDialogue: (sceneId: string, dialogue: Dialogue) => void;
  addCharacterToScene: (
    sceneId: string,
    characterId: string,
    mood: string,
    position: Position,
    entranceAnimation?: string
  ) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharId: string) => void;
  updateSceneCharacter: (sceneId: string, sceneCharId: string, updates: Partial<SceneCharacter>) => void;
  setSceneBackground: (sceneId: string, backgroundUrl: string) => void;
  addTextBoxToScene: (sceneId: string, textBox: TextBox) => void;
  removeTextBoxFromScene: (sceneId: string, textBoxId: string) => void;
  updateTextBox: (sceneId: string, textBoxId: string, updates: Partial<TextBox>) => void;
  addPropToScene: (sceneId: string, prop: Prop) => void;
  removePropFromScene: (sceneId: string, propId: string) => void;
  updateProp: (sceneId: string, propId: string, updates: Partial<Prop>) => void;

  // Characters from store
  characters: Character[];
}

/**
 * useCanvasActions - Centralize all canvas actions and store interactions
 *
 * This hook manages all CRUD operations for canvas elements:
 * - Dialogues (add)
 * - Characters (add, remove, update)
 * - Scene background (set)
 * - Text boxes (add, remove, update)
 * - Props (add, remove, update)
 *
 * It also provides high-level handlers for common actions like:
 * - Adding a dialogue to current scene
 * - Opening asset picker for background
 * - Adding a character with automatic positioning
 *
 * @param props - Configuration and callbacks
 * @returns Actions and handlers
 *
 * @example
 * ```tsx
 * const actions = useCanvasActions({
 *   selectedScene,
 *   sceneCharacters,
 *   setShowAddCharacterModal,
 *   onOpenModal
 * });
 *
 * // Use handlers
 * actions.handleAddDialogue();
 * actions.handleSetBackground();
 *
 * // Use store actions directly
 * actions.updateSceneCharacter(sceneId, charId, { mood: 'happy' });
 * ```
 */
export function useCanvasActions({
  selectedScene,
  sceneCharacters,
  setShowAddCharacterModal,
  onOpenModal
}: UseCanvasActionsProps): UseCanvasActionsReturn {
  // Zustand store selectors (granular)
  const addDialogue = useScenesStore(state => state.addDialogue);
  const addCharacterToScene = useScenesStore(state => state.addCharacterToScene);
  const removeCharacterFromScene = useScenesStore(state => state.removeCharacterFromScene);
  const updateSceneCharacter = useScenesStore(state => state.updateSceneCharacter);
  const setSceneBackground = useScenesStore(state => state.setSceneBackground);
  const addTextBoxToScene = useScenesStore(state => state.addTextBoxToScene);
  const removeTextBoxFromScene = useScenesStore(state => state.removeTextBoxFromScene);
  const updateTextBox = useScenesStore(state => state.updateTextBox);
  const addPropToScene = useScenesStore(state => state.addPropToScene);
  const removePropFromScene = useScenesStore(state => state.removePropFromScene);
  const updateProp = useScenesStore(state => state.updateProp);
  const characters = useCharactersStore(state => state.characters);

  /**
   * Add a new dialogue to the current scene
   */
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

  /**
   * Open asset picker modal to set scene background
   */
  const handleSetBackground = () => {
    if (onOpenModal && selectedScene) {
      onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
    }
  };

  /**
   * Open modal to add character to scene
   */
  const handleAddCharacterToScene = () => {
    if (!selectedScene) return;
    setShowAddCharacterModal?.(true);
  };

  /**
   * Add character to scene with automatic position calculation
   *
   * Positioning logic:
   * - Player: Always at left (20%, 50%)
   * - NPCs: Center (50%, 50%) if free, otherwise right (80%, 50%)
   *
   * @param characterId - Character ID to add
   * @param mood - Initial mood
   * @param position - Optional explicit position (overrides automatic)
   */
  const handleAddCharacterConfirm = (characterId: string, mood: string, position?: Position) => {
    if (!selectedScene) return;

    let finalPosition = position;

    // Calculate automatic position if not provided
    if (!finalPosition) {
      if (characterId === 'player') {
        finalPosition = { x: 20, y: 50 };
      } else {
        const existingPositions = sceneCharacters.map(sc => sc.position?.x || 50);
        const centerOccupied = existingPositions.some(x => Math.abs(x - 50) < 10);

        if (!centerOccupied) {
          finalPosition = { x: 50, y: 50 };
        } else {
          finalPosition = { x: 80, y: 50 };
        }
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

    // Store actions (passthrough)
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

    // Characters from store
    characters,
  };
}
