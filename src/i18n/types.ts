/**
 * i18n Type Definitions
 *
 * Type-safe internationalization system for AccessCity.
 * Ensures compile-time checking of translation keys.
 */

// ============================================================================
// GAME STAT KEYS (Constants to avoid typos)
// ============================================================================

/**
 * Game stat identifiers - use these constants everywhere instead of strings.
 * This prevents typos and enables refactoring.
 */
export const GAME_STATS = {
  PHYSIQUE: 'physique',
  MENTALE: 'mentale',
} as const;

export type GameStatKey = typeof GAME_STATS[keyof typeof GAME_STATS];

// ============================================================================
// TRANSLATION STRUCTURE
// ============================================================================

/**
 * Game statistics translations
 */
export interface GameStatsTranslations {
  physique: string;
  mentale: string;
}

/**
 * Common UI translations
 */
export interface CommonTranslations {
  save: string;
  cancel: string;
  delete: string;
  add: string;
  edit: string;
  close: string;
  confirm: string;
  loading: string;
  error: string;
  success: string;
}

/**
 * Editor-specific translations
 */
export interface EditorTranslations {
  scenes: string;
  dialogues: string;
  characters: string;
  assets: string;
  preview: string;
  settings: string;
  noScene: string;
  noDialogue: string;
  addScene: string;
  addDialogue: string;
  addCharacter: string;
}

/**
 * Dialogue Properties panel translations
 */
export interface DialogueEditorTranslations {
  title: string;
  propertiesTab: string;
  choicesTab: string;
  speaker: string;
  text: string;
  duplicate: string;
  sfxLabel: string;
  sfxVolume: string;
  sfxChange: string;
  sfxAdd: string;
  moodsLabel: string;
  moodDefault: string;
  infoLabel: string;
  noChoices: string;
  noChoicesHint: string;
  addChoice: string;
  editWithAssistant: string;
}

/**
 * Graph-specific translations (node/edge labels, accessibility)
 */
export interface GraphTranslations {
  startBadge: string;
  endBadge: string;
  startAriaLabel: string;
  endAriaLabel: string;
  rowLabel: string;
  nextBelow: string;
  flowContinues: string;
  convergenceLabel: string;
  choiceAriaLabel: string;
  emptyDialogue: string;
  sceneJumpLabel: string;
}

/**
 * Complete translations structure
 */
export interface Translations {
  gameStats: GameStatsTranslations;
  common: CommonTranslations;
  editor: EditorTranslations;
  graph: GraphTranslations;
  dialogueEditor: DialogueEditorTranslations;
}

// ============================================================================
// SUPPORTED LOCALES
// ============================================================================

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = 'fr';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Flattened translation keys for direct access
 * e.g., 'gameStats.empathy', 'common.save'
 */
export type TranslationPath =
  | `gameStats.${keyof GameStatsTranslations}`
  | `common.${keyof CommonTranslations}`
  | `editor.${keyof EditorTranslations}`
  | `graph.${keyof GraphTranslations}`
  | `dialogueEditor.${keyof DialogueEditorTranslations}`;
