/**
 * Selection Store Types
 *
 * Defines all types for the centralized selection management system.
 *
 * @module stores/selectionStore.types
 */

/** Possible selection types in the editor */
export type SelectionType = 'scene' | 'dialogue' | 'character' | 'sceneCharacter' | null;

interface BaseSelection {
  type: SelectionType;
}

export interface SceneSelection extends BaseSelection {
  type: 'scene';
  id: string;
}

export interface DialogueSelection extends BaseSelection {
  type: 'dialogue';
  sceneId: string;
  index: number;
}

export interface CharacterSelection extends BaseSelection {
  type: 'character';
  id: string;
}

export interface SceneCharacterSelection extends BaseSelection {
  type: 'sceneCharacter';
  sceneId: string;
  sceneCharacterId: string;
}

export interface NoSelection extends BaseSelection {
  type: null;
}

/** Union type of all possible selections */
export type SelectedElement =
  | SceneSelection
  | DialogueSelection
  | CharacterSelection
  | SceneCharacterSelection
  | NoSelection
  | null;

/** Selection state structure */
export interface SelectionState {
  selectedElement: SelectedElement;
}

/** Selection actions interface */
export interface SelectionActions {
  selectScene: (id: string) => void;
  selectDialogue: (sceneId: string, index: number) => void;
  selectCharacter: (id: string) => void;
  selectSceneCharacter: (sceneId: string, sceneCharacterId: string) => void;
  clearSelection: () => void;
  setSelectedElement: (element: SelectedElement) => void;
}

/** Complete selection store type (state + actions) */
export type SelectionStore = SelectionState & SelectionActions;

// === Type Guards ===

export function isSceneSelection(element: SelectedElement): element is SceneSelection {
  return element !== null && element.type === 'scene';
}

export function isDialogueSelection(element: SelectedElement): element is DialogueSelection {
  return element !== null && element.type === 'dialogue';
}

export function isCharacterSelection(element: SelectedElement): element is CharacterSelection {
  return element !== null && element.type === 'character';
}

export function isSceneCharacterSelection(element: SelectedElement): element is SceneCharacterSelection {
  return element !== null && element.type === 'sceneCharacter';
}

export function isNoSelection(element: SelectedElement): element is NoSelection | null {
  return element === null || element.type === null;
}

/** Get a human-readable description of a selection (for logging) */
export function describeSelection(element: SelectedElement): string {
  if (element === null || element.type === null) return 'No selection';

  const typed = element as Exclude<SelectedElement, NoSelection | null>;

  switch (typed.type) {
    case 'scene': return `Scene: ${typed.id}`;
    case 'dialogue': return `Dialogue ${typed.index} in scene ${typed.sceneId}`;
    case 'character': return `Character: ${typed.id}`;
    case 'sceneCharacter': return `Scene Character: ${typed.sceneCharacterId} in scene ${typed.sceneId}`;
    default: return 'Unknown selection';
  }
}
