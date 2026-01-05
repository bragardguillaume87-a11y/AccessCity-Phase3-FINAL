/**
 * Global TypeScript type definitions for AccessCity
 *
 * This file contains shared types used across the application.
 * Organized by domain: Scenes, Characters, UI, etc.
 */

// ============================================================================
// SCENES & DIALOGUES
// ============================================================================

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  effects: Effect[];
  nextSceneId?: string;
}

export interface Effect {
  variable: string;
  value: number;
  operation: 'add' | 'set' | 'multiply';
}

export interface SceneCharacter {
  id: string;
  characterId: string;
  mood: string;
  position: Position;
  size: Size;
  scale?: number;
  entranceAnimation: string;
  exitAnimation: string;
}

export interface TextBox {
  id: string;
  content: string;
  position: Position;
  size: Size;
  style?: Record<string, unknown>;
}

export interface Prop {
  id: string;
  assetUrl: string;
  position: Position;
  size: Size;
  rotation?: number;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  backgroundUrl: string;
  dialogues: Dialogue[];
  characters: SceneCharacter[];
  textBoxes?: TextBox[];
  props?: Prop[];
}

// ============================================================================
// CHARACTERS
// ============================================================================

export interface Character {
  id: string;
  name: string;
  description: string;
  sprites: Record<string, string>;
  moods: string[];
}

// ============================================================================
// UI & SELECTION
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type SelectedElementType =
  | { type: 'scene'; id: string }
  | { type: 'character'; id: string }
  | { type: 'dialogue'; sceneId: string; index: number }
  | { type: 'sceneCharacter'; sceneId: string; sceneCharacterId: string }
  | null;

export type FullscreenMode = 'graph' | 'canvas' | 'preview' | null;

export type ModalType = 'characters' | 'assets' | 'export' | 'preview' | 'settings' | null;

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationProblem {
  id: string;
  type: 'error' | 'warning';
  message: string;
  location?: {
    sceneId?: string;
    dialogueIndex?: number;
    characterId?: string;
  };
}

// ============================================================================
// ASSETS
// ============================================================================

export interface AssetManifest {
  backgrounds?: Record<string, string[]>;
  illustrations?: Record<string, string[]>;
  characters?: Record<string, string[]>;
  props?: Record<string, string[]>;
  [category: string]: Record<string, string[]> | undefined;
}
