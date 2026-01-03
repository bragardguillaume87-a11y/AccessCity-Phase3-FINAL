/**
 * Centralized application constants for AccessCity Studio
 *
 * Usage:
 * import { LIMITS, VALIDATION_RULES } from '@/config/constants';
 * if (stories.length >= LIMITS.MAX_FREE_STORIES) { ... }
 */

// Application Limits
export const LIMITS = {
  MAX_FREE_STORIES: 5,          // Maximum number of free stories in scenario editor
  MAX_UPLOAD_FILES: 20,         // Maximum files per upload batch
  MAX_FILE_SIZE_MB: 10,         // Maximum file size in MB
  MAX_SCENES_PER_STORY: 100,    // Maximum scenes per story
  MAX_DIALOGUES_PER_SCENE: 50,  // Maximum dialogues per scene
  MAX_CHARACTERS: 20,           // Maximum characters per project
};

// Validation Rules
export const VALIDATION_RULES = {
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
};

// Default Values
export const DEFAULTS = {
  CHARACTER_MOOD: 'neutral',
  CHARACTER_MOODS_LIST: ['neutral'],
  SCENE_BACKGROUND: '',
  DIALOGUE_SPEAKER: 'narrator',
};

// Layout Dimensions (in pixels)
export const LAYOUT = {
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
};

// API Configuration
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  UPLOAD_ENDPOINT: '/api/assets/upload',
  TIMEOUT: 30000, // 30 seconds
};

// System Characters (protected, cannot be deleted)
export const SYSTEM_CHARACTERS = ['player', 'narrator', 'counsellor'];

// Asset Categories
export const ASSET_CATEGORIES = {
  BACKGROUND: 'background',
  CHARACTER: 'character',
  PROP: 'prop',
  AUDIO: 'audio',
  OTHER: 'other',
};

// File Type Filters
export const FILE_TYPES = {
  IMAGES: {
    accept: 'image/*',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  },
  AUDIO: {
    accept: 'audio/*',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
  },
};

// App Metadata
export const APP_METADATA = {
  NAME: 'AccessCity Studio',
  VERSION: '6.0.0',
  DESCRIPTION: 'Éditeur de visual novels accessible',
  AUTHOR: 'APF France Handicap Limousin',
};
