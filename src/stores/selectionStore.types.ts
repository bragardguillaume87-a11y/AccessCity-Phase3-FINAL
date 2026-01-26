/**
 * Selection Store Types
 *
 * Defines all types for the centralized selection management system.
 * Replaces local state in EditorShell with a global Zustand store.
 *
 * @module stores/selectionStore.types
 */

/**
 * Possible selection types in the editor
 */
export type SelectionType = 'scene' | 'dialogue' | 'character' | 'sceneCharacter' | null;

/**
 * Base interface for all selection elements
 */
interface BaseSelection {
  type: SelectionType;
}

/**
 * Scene selection - Shows UnifiedPanel (Add Element)
 */
export interface SceneSelection extends BaseSelection {
  type: 'scene';
  id: string;
}

/**
 * Dialogue selection - Shows DialoguePropertiesForm
 */
export interface DialogueSelection extends BaseSelection {
  type: 'dialogue';
  sceneId: string;
  index: number;
}

/**
 * Character selection - Shows CharacterPropertiesForm
 */
export interface CharacterSelection extends BaseSelection {
  type: 'character';
  id: string;
}

/**
 * Scene Character (placement) selection - Shows SceneCharacterPlacementForm
 */
export interface SceneCharacterSelection extends BaseSelection {
  type: 'sceneCharacter';
  sceneId: string;
  sceneCharacterId: string;
}

/**
 * No selection
 */
export interface NoSelection extends BaseSelection {
  type: null;
}

/**
 * Union type of all possible selections
 * This replaces the old SelectedElementType from types/index.ts
 */
export type SelectedElement =
  | SceneSelection
  | DialogueSelection
  | CharacterSelection
  | SceneCharacterSelection
  | NoSelection
  | null;

/**
 * Selection mode for future multi-selection feature
 */
export type SelectionMode = 'single' | 'multi' | 'range';

/**
 * Selection state structure
 */
export interface SelectionState {
  /**
   * Currently selected element
   * null = no selection (shows EmptySelectionState)
   */
  selectedElement: SelectedElement;

  /**
   * Set of selected IDs (for future multi-selection)
   * Currently unused but architecture-ready
   */
  selectedIds: Set<string>;

  /**
   * Selection mode (single/multi/range)
   * Currently always 'single', but prepared for future
   */
  mode: SelectionMode;

  /**
   * Whether selection is locked (prevents accidental changes)
   * Future feature for complex editing workflows
   */
  locked: boolean;

  /**
   * History of previous selections (for navigation back/forward)
   * Limited to last 50 selections
   */
  history: SelectedElement[];

  /**
   * Current position in history
   */
  historyIndex: number;
}

/**
 * Selection actions interface
 * All actions that can be performed on the selection
 */
export interface SelectionActions {
  // === BASIC SELECTION ACTIONS ===

  /**
   * Select a scene (shows UnifiedPanel)
   * @param id - Scene ID
   */
  selectScene: (id: string) => void;

  /**
   * Select a dialogue (shows DialoguePropertiesForm)
   * @param sceneId - Scene ID containing the dialogue
   * @param index - Dialogue index in scene.dialogues array
   */
  selectDialogue: (sceneId: string, index: number) => void;

  /**
   * Select a character (shows CharacterPropertiesForm)
   * @param id - Character ID
   */
  selectCharacter: (id: string) => void;

  /**
   * Select a scene character placement (shows SceneCharacterPlacementForm)
   * @param sceneId - Scene ID
   * @param sceneCharacterId - SceneCharacter ID
   */
  selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => void;

  /**
   * Clear selection (shows EmptySelectionState)
   */
  clearSelection: () => void;

  /**
   * Set selection directly (for advanced use cases)
   * @param element - Selection element to set
   */
  setSelectedElement: (element: SelectedElement) => void;

  // === MULTI-SELECTION ACTIONS (Future) ===

  /**
   * Add an ID to the selection set
   * @param id - Element ID to add
   */
  addToSelection: (id: string) => void;

  /**
   * Remove an ID from the selection set
   * @param id - Element ID to remove
   */
  removeFromSelection: (id: string) => void;

  /**
   * Select all elements of a given type
   * @param type - Element type to select
   */
  selectAll: (type: SelectionType) => void;

  // === NAVIGATION ACTIONS ===

  /**
   * Navigate to previous dialogue in scene
   * Does nothing if at first dialogue or no dialogue selected
   */
  selectPreviousDialogue: () => void;

  /**
   * Navigate to next dialogue in scene
   * Does nothing if at last dialogue or no dialogue selected
   */
  selectNextDialogue: () => void;

  /**
   * Go back in selection history
   */
  goBack: () => void;

  /**
   * Go forward in selection history
   */
  goForward: () => void;

  // === UTILITY ACTIONS ===

  /**
   * Toggle selection lock
   */
  toggleLock: () => void;

  /**
   * Change selection mode
   * @param mode - New selection mode
   */
  setMode: (mode: SelectionMode) => void;

  /**
   * Clear selection history
   */
  clearHistory: () => void;
}

/**
 * Complete selection store type (state + actions)
 */
export type SelectionStore = SelectionState & SelectionActions;

/**
 * Type guard: Check if selection is a scene
 */
export function isSceneSelection(element: SelectedElement): element is SceneSelection {
  return element !== null && element.type === 'scene';
}

/**
 * Type guard: Check if selection is a dialogue
 */
export function isDialogueSelection(element: SelectedElement): element is DialogueSelection {
  return element !== null && element.type === 'dialogue';
}

/**
 * Type guard: Check if selection is a character
 */
export function isCharacterSelection(element: SelectedElement): element is CharacterSelection {
  return element !== null && element.type === 'character';
}

/**
 * Type guard: Check if selection is a scene character
 */
export function isSceneCharacterSelection(element: SelectedElement): element is SceneCharacterSelection {
  return element !== null && element.type === 'sceneCharacter';
}

/**
 * Type guard: Check if there's no selection
 */
export function isNoSelection(element: SelectedElement): element is NoSelection | null {
  return element === null || element.type === null;
}

/**
 * Helper: Get a human-readable description of a selection
 * Useful for logging and debugging
 */
export function describeSelection(element: SelectedElement): string {
  // Handle null
  if (element === null) {
    return 'No selection';
  }

  // Handle NoSelection
  if (element.type === null) {
    return 'No selection';
  }

  // Type assertion to exclude NoSelection after null check
  const typedElement = element as Exclude<SelectedElement, NoSelection | null>;

  // Use explicit guards for each type
  if (typedElement.type === 'scene') {
    return `Scene: ${typedElement.id}`;
  }

  if (typedElement.type === 'dialogue') {
    return `Dialogue ${typedElement.index} in scene ${typedElement.sceneId}`;
  }

  if (typedElement.type === 'character') {
    return `Character: ${typedElement.id}`;
  }

  if (typedElement.type === 'sceneCharacter') {
    return `Scene Character: ${typedElement.sceneCharacterId} in scene ${typedElement.sceneId}`;
  }

  return 'Unknown selection';
}
