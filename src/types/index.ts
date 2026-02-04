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
 *
 * Standard stats (use GAME_STATS constants from @/i18n):
 * - empathy: Empathie / Empathy
 * - autonomy: Autonomie / Autonomy
 * - confidence: Confiance / Confidence
 *
 * @example
 * import { GAME_STATS } from '@/i18n';
 * const stats: GameStats = {
 *   [GAME_STATS.EMPATHY]: 50,
 *   [GAME_STATS.AUTONOMY]: 50,
 *   [GAME_STATS.CONFIDENCE]: 50,
 * };
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
// AUDIO
// ============================================================================

/**
 * Audio configuration for scene background music
 *
 * @example
 * ```typescript
 * const sceneAudio: SceneAudio = {
 *   url: '/assets/music/ambient-forest.mp3',
 *   volume: 0.5,
 *   loop: true,
 *   continueToNextScene: false
 * };
 * ```
 */
export interface SceneAudio {
  /** URL path to the audio file */
  url: string;
  /** Volume level 0-1, default 0.5 */
  volume?: number;
  /** Whether to loop the audio, default true */
  loop?: boolean;
  /** Whether to continue playing on next scene, default false */
  continueToNextScene?: boolean;
}

/**
 * Audio configuration for dialogue sound effects
 *
 * @example
 * ```typescript
 * const dialogueSfx: DialogueAudio = {
 *   url: '/assets/sfx/door-knock.wav',
 *   volume: 0.7
 * };
 * ```
 */
export interface DialogueAudio {
  /** URL path to the audio file */
  url: string;
  /** Volume level 0-1, default 0.7 */
  volume?: number;
}

// ============================================================================
// SCENES & DIALOGUES
// ============================================================================

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  /** Sound effect to play when this dialogue appears */
  sfx?: DialogueAudio;
  /** Explicit next dialogue ID for convergence after branching */
  nextDialogueId?: string;
  /** Whether this dialogue is a branch response (visual marker in editor) */
  isResponse?: boolean;
  /** Speaker's mood/expression for avatar display (links to character sprite) */
  speakerMood?: string;
  /** Stage directions: actions, emotions, context not spoken but acted (like theater) */
  stageDirections?: string;
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
  zIndex?: number;
  entranceAnimation: string;
  exitAnimation: string;
  flipped?: boolean; // Mirror horizontally (flip left-right)
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
  /** Background music configuration for this scene */
  audio?: SceneAudio;
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

export type ModalType = 'characters' | 'assets' | 'export' | 'preview' | 'settings' | 'project' | 'addCharacter' | null;

/**
 * Base props for all modal components
 * Provides consistent interface for modal visibility and close handling
 */
export interface ModalBaseProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Context data passed to modals from EditorShell
 */
export interface ModalContext {
  /** Character ID for CharactersModal */
  characterId?: string;
  /** Asset category for AssetsLibraryModal */
  category?: string;
  /** Target scene ID for asset operations */
  targetSceneId?: string;
  /** Scene ID for PreviewModal */
  sceneId?: string;
}

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
  id: string;
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

/**
 * Asset usage information across scenes and characters
 */
export interface AssetUsageInfo {
  total: number;
  scenes: string[];
  characters: string[];
  sceneCount: number;
  characterCount: number;
}

/**
 * Asset statistics for dashboard display
 */
export interface AssetStats {
  total: number;
  used: number;
  unused: number;
  categoryCount: {
    all: number;
    backgrounds: number;
    characters: number;
    illustrations: number;
    music: number;
    sfx: number;
    voices: number;
  };
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
  /** Stage directions: actions, emotions, context (like theater didascalies) */
  stageDirections?: string;
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

// ============================================================================
// GAME ENGINE (Phase F - engine.ts)
// ============================================================================

/**
 * Comparison operators for condition evaluation in dialogues
 */
export type ConditionOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

/**
 * Condition for dialogue branching based on game variables
 */
export interface Condition {
  variable: string;
  operator: ConditionOperator;
  value: number;
}

/**
 * Event bus event types and their typed payloads
 */
export interface EventBusEvents {
  'dialogue:show': {
    speaker: string;
    text: string;
    choices: DialogueChoice[];
  };
  'scene:complete': {
    sceneId: string;
  };
  'variables:updated': GameStats;
  'variables:delta': Array<{
    variable: string;
    delta: number;
  }>;
}

/**
 * Event bus callback function type
 */
export type EventCallback<T = unknown> = (data: T) => void;

/**
 * Parameters for createEngine factory function
 */
export interface CreateEngineParams {
  /** Initial game variable values (default: { Physique: 100, Mentale: 100 }) */
  initialVars?: GameStats;
}

/**
 * Game engine instance returned by createEngine
 */
export interface GameEngine {
  eventBus: EventBus;
  variableManager: VariableManager;
  dialogueEngine: DialogueEngine;
}

/**
 * Type-safe event bus for game engine communication
 */
export interface EventBus {
  on<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void;
  off<K extends keyof EventBusEvents>(
    event: K,
    callback: EventCallback<EventBusEvents[K]>
  ): void;
  emit<K extends keyof EventBusEvents>(
    event: K,
    data: EventBusEvents[K]
  ): void;
}

/**
 * Manages game variables with bounded values
 */
export interface VariableManager {
  get(name: string): number;
  set(name: string, value: number): void;
  modify(name: string, delta: number): void;
  getAll(): GameStats;
}

/**
 * Evaluates conditions for dialogue branching
 */
export interface ConditionEvaluator {
  evaluate(conditions?: Condition[]): boolean;
}

/**
 * Main dialogue engine for scene playback
 */
export interface DialogueEngine {
  loadScene(scene: Scene | null): void;
  handleChoice(choice: DialogueChoice): void;
  next(): void;
}
