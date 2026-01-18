/**
 * Centralized application constants for AccessCity Studio
 *
 * Usage:
 * import { LIMITS, VALIDATION_RULES } from '@/config/constants';
 * if (stories.length >= LIMITS.MAX_FREE_STORIES) { ... }
 */

// ============================================================================
// TYPES
// ============================================================================

interface Limits {
  readonly MAX_FREE_STORIES: number;
  readonly MAX_UPLOAD_FILES: number;
  readonly MAX_FILE_SIZE_MB: number;
  readonly MAX_SCENES_PER_STORY: number;
  readonly MAX_DIALOGUES_PER_SCENE: number;
  readonly MAX_CHARACTERS: number;
}

interface ValidationRules {
  readonly CHARACTER_NAME_MIN_LENGTH: number;
  readonly CHARACTER_NAME_MAX_LENGTH: number;
  readonly CHARACTER_DESCRIPTION_MAX_LENGTH: number;
  readonly CHARACTER_MOODS_MIN: number;
  readonly SCENE_TITLE_MIN_LENGTH: number;
  readonly SCENE_TITLE_MAX_LENGTH: number;
  readonly SCENE_DESCRIPTION_MAX_LENGTH: number;
  readonly DIALOGUE_TEXT_MIN_LENGTH: number;
  readonly DIALOGUE_TEXT_MAX_LENGTH: number;
  readonly DIFFICULTY_MIN: number;
  readonly DIFFICULTY_MAX: number;
  readonly VARIABLE_VALUE_MIN: number;
  readonly VARIABLE_VALUE_MAX: number;
}

interface Defaults {
  readonly CHARACTER_MOOD: string;
  readonly CHARACTER_MOODS_LIST: readonly string[];
  readonly SCENE_BACKGROUND: string;
  readonly DIALOGUE_SPEAKER: string;
}

interface Layout {
  readonly SIDEBAR_WIDTH: number;
  readonly INSPECTOR_WIDTH: number;
  readonly TOPBAR_HEIGHT: number;
  readonly PANEL_MIN_WIDTH: number;
  readonly PANEL_MIN_HEIGHT: number;
  readonly MODAL_MIN_WIDTH: number;
  readonly MODAL_MAX_WIDTH: number;
  readonly DIALOG_SMALL_WIDTH: number;
  readonly DIALOG_MEDIUM_WIDTH: number;
  readonly DIALOG_LARGE_WIDTH: number;
}

interface ApiConfig {
  readonly BASE_URL: string;
  readonly UPLOAD_ENDPOINT: string;
  readonly TIMEOUT: number;
}

interface AssetCategories {
  readonly BACKGROUND: string;
  readonly CHARACTER: string;
  readonly PROP: string;
  readonly AUDIO: string;
  readonly OTHER: string;
}

interface FileTypeConfig {
  readonly accept: string;
  readonly extensions: readonly string[];
}

interface FileTypes {
  readonly IMAGES: FileTypeConfig;
  readonly AUDIO: FileTypeConfig;
}

interface AppMetadata {
  readonly NAME: string;
  readonly VERSION: string;
  readonly DESCRIPTION: string;
  readonly AUTHOR: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Application Limits
export const LIMITS: Limits = {
  MAX_FREE_STORIES: 5,          // Maximum number of free stories in scenario editor
  MAX_UPLOAD_FILES: 20,         // Maximum files per upload batch
  MAX_FILE_SIZE_MB: 10,         // Maximum file size in MB
  MAX_SCENES_PER_STORY: 100,    // Maximum scenes per story
  MAX_DIALOGUES_PER_SCENE: 50,  // Maximum dialogues per scene
  MAX_CHARACTERS: 20,           // Maximum characters per project
} as const;

// Validation Rules
export const VALIDATION_RULES: ValidationRules = {
  // Character validation
  CHARACTER_NAME_MIN_LENGTH: 1,
  CHARACTER_NAME_MAX_LENGTH: 50,
  CHARACTER_DESCRIPTION_MAX_LENGTH: 500,
  CHARACTER_MOODS_MIN: 1,       // At least one mood required

  // Scene validation
  SCENE_TITLE_MIN_LENGTH: 1,
  SCENE_TITLE_MAX_LENGTH: 100,
  SCENE_DESCRIPTION_MAX_LENGTH: 1000,

  // Dialogue validation
  DIALOGUE_TEXT_MIN_LENGTH: 1,
  DIALOGUE_TEXT_MAX_LENGTH: 500,

  // Game rules
  DIFFICULTY_MIN: 1,
  DIFFICULTY_MAX: 20,
  VARIABLE_VALUE_MIN: 0,
  VARIABLE_VALUE_MAX: 100,
} as const;

// Default Values
export const DEFAULTS: Defaults = {
  CHARACTER_MOOD: 'neutral',
  CHARACTER_MOODS_LIST: ['neutral'],
  SCENE_BACKGROUND: '',
  DIALOGUE_SPEAKER: 'narrator',
} as const;

// Layout Dimensions (in pixels)
export const LAYOUT: Layout = {
  SIDEBAR_WIDTH: 240,
  INSPECTOR_WIDTH: 320,
  TOPBAR_HEIGHT: 60,
  PANEL_MIN_WIDTH: 200,
  PANEL_MIN_HEIGHT: 100,

  // Modal dimensions
  MODAL_MIN_WIDTH: 500,
  MODAL_MAX_WIDTH: 800,
  DIALOG_SMALL_WIDTH: 500,
  DIALOG_MEDIUM_WIDTH: 600,
  DIALOG_LARGE_WIDTH: 800,
} as const;

// API Configuration
export const API: ApiConfig = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  UPLOAD_ENDPOINT: '/api/assets/upload',
  TIMEOUT: 30000, // 30 seconds
} as const;

// System Characters (protected, cannot be deleted)
export const SYSTEM_CHARACTERS = ['player', 'narrator', 'counsellor'] as const;
export type SystemCharacter = typeof SYSTEM_CHARACTERS[number];

// HUD Display Thresholds (for color-coded progress bars)
export const HUD_THRESHOLDS = {
  HIGH: 66,    // Green zone (value > 66)
  MEDIUM: 33,  // Yellow zone (value > 33)
  // Below MEDIUM is Red zone
} as const;

// Asset Categories
export const ASSET_CATEGORIES: AssetCategories = {
  BACKGROUND: 'background',
  CHARACTER: 'character',
  PROP: 'prop',
  AUDIO: 'audio',
  OTHER: 'other',
} as const;

// File Type Filters
export const FILE_TYPES: FileTypes = {
  IMAGES: {
    accept: 'image/*',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  },
  AUDIO: {
    accept: 'audio/*',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
  },
} as const;

// App Metadata
export const APP_METADATA: AppMetadata = {
  NAME: 'AccessCity Studio',
  VERSION: '6.0.0',
  DESCRIPTION: 'Éditeur de visual novels accessible',
  AUTHOR: 'APF France Handicap Limousin',
} as const;
