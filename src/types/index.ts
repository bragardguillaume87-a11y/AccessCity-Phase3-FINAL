/**
 * Global TypeScript type definitions for AccessCity
 *
 * This file contains shared types used across the application.
 * Organized by domain: Scenes, Characters, UI, etc.
 */

// ============================================================================
// GAME MECHANICS
// ============================================================================

/**
 * Game statistics as key-value pairs
 */
export interface GameStats {
  [key: string]: number;
}

/**
 * Branch configuration after dice check result
 */
export interface DiceCheckBranch {
  nextSceneId?: string;
  nextDialogueId?: string;
}

/**
 * Dice check configuration for gameplay mechanics
 */
export interface DiceCheck {
  stat: string;
  difficulty: number;
  success?: DiceCheckBranch;
  failure?: DiceCheckBranch;
}

// ============================================================================
// SCENES & DIALOGUES
// ============================================================================

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
}

/**
 * Dialogue choice with full game mechanics support
 */
export interface DialogueChoice {
  id: string;
  text: string;
  effects: Effect[];
  nextSceneId?: string;
  nextDialogueId?: string;
  // Legacy support for old format
  statsDelta?: GameStats;
  // Game mechanic: dice check
  diceCheck?: DiceCheck;
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
  style?: React.CSSProperties;
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

/**
 * Individual asset from the manifest
 */
export interface Asset {
  name: string;
  path: string;
  category: string;
  subcategory?: string;
  tags?: string[];
}

/**
 * Asset manifest structure (legacy format from assets-manifest.json)
 */
export interface AssetManifest {
  backgrounds?: Record<string, string[]>;
  illustrations?: Record<string, string[]>;
  characters?: Record<string, string[]>;
  props?: Record<string, string[]>;
  [category: string]: Record<string, string[]> | undefined;
}

// ============================================================================
// MOOD PRESETS
// ============================================================================

/**
 * Mood preset configuration for character expressions
 */
export interface MoodPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

// ============================================================================
// CHARACTER VALIDATION (useCharacterValidation)
// ============================================================================

/**
 * Supported locales for validation messages
 */
export type ValidationLocale = 'en' | 'fr';

/**
 * Validation messages for character fields (i18n ready)
 */
export interface ValidationMessages {
  nameRequired: string;
  nameMinLength: string;
  nameMaxLength: string;
  nameDuplicate: string;
  descriptionMaxLength: string;
  moodsRequired: string;
  moodsDuplicate: string;
  moodsEmpty: string;
  spritesWarning: (count: number, moods: string) => string;
}

// ============================================================================
// DIALOGUE GRAPH (useDialogueGraph)
// ============================================================================

/**
 * Data payload for dialogue nodes in ReactFlow graph
 */
export interface DialogueNodeData extends Record<string, unknown> {
  dialogue: Dialogue;
  index: number;
  speaker: string;
  text: string;
  speakerMood: string;
  choices: DialogueChoice[];
  issues: ValidationProblem[];
}

/**
 * Data payload for terminal nodes (scene jumps) in ReactFlow graph
 */
export interface TerminalNodeData extends Record<string, unknown> {
  sceneId: string;
  label: string;
  choiceText?: string;
}

/**
 * Color theme for graph nodes
 */
export interface NodeColorTheme {
  bg: string;
  border: string;
  text: string;
}
