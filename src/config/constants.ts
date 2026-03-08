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
  readonly DIALOGUE_FLOW_MODAL_HEIGHT: number;
  readonly DIALOGUE_FLOW_MAX_HEIGHT: number;
}

interface ApiConfig {
  readonly BASE_URL: string;
  readonly UPLOAD_ENDPOINT: string;
  readonly TIMEOUT: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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
  TOPBAR_HEIGHT: 64,
  PANEL_MIN_WIDTH: 200,
  PANEL_MIN_HEIGHT: 100,

  // Modal dimensions
  MODAL_MIN_WIDTH: 500,
  MODAL_MAX_WIDTH: 800,
  DIALOG_SMALL_WIDTH: 500,
  DIALOG_MEDIUM_WIDTH: 600,
  DIALOG_LARGE_WIDTH: 800,
  DIALOGUE_FLOW_MODAL_HEIGHT: 600,   // DialogueFlowVisualization inside graph modal
  DIALOGUE_FLOW_MAX_HEIGHT: 200,     // Dialogue flow section below canvas in MainCanvas
} as const;

// API Configuration
export const API: ApiConfig = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  UPLOAD_ENDPOINT: '/api/assets/upload',
  TIMEOUT: 30000, // 30 seconds
} as const;

// System Characters (protected, cannot be deleted)
export const SYSTEM_CHARACTERS = ['player', 'narrator', 'counsellor'] as const;

// Audio Default Volumes
export const AUDIO_DEFAULTS = {
  /** Default volume for background music (0-1) */
  MUSIC_VOLUME: 0.5,
  /** Default volume for dialogue sound effects (0-1) */
  SFX_VOLUME: 0.7,
  /** Default volume for ambient environmental tracks (0-1) */
  AMBIENT_VOLUME: 0.4,
} as const;

