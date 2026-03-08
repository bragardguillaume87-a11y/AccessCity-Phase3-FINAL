/**
 * Centralized localStorage keys for AccessCity Studio
 *
 * Usage:
 * import { STORAGE_KEYS } from '@/config/storageKeys';
 * localStorage.getItem(STORAGE_KEYS.BACKGROUNDS_HISTORY);
 */

// ============================================================================
// TYPES
// ============================================================================

interface StorageKeys {
  readonly BACKGROUNDS_HISTORY: string;
  readonly FAVORITES_ASSETS: string;
  readonly FAVORITES_CHARACTERS: string;
  readonly ONBOARDING_COMPLETED: string;
  readonly HAS_UPLOADED_ASSET: string;
  readonly STORIES: string;
  readonly SETTINGS: string;
  readonly SELECTED_SCENE: string;
  readonly SELECTED_TAB: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEYS: StorageKeys = {
  // Asset management
  BACKGROUNDS_HISTORY: 'ac_backgrounds_history',
  FAVORITES_ASSETS: 'accesscity-favorite-assets',
  FAVORITES_CHARACTERS: 'accesscity-favorite-characters',

  // User preferences
  ONBOARDING_COMPLETED: 'ac_onboarding_completed',
  HAS_UPLOADED_ASSET: 'hasUploadedAsset',

  // Story/Scene data
  STORIES: 'ac_scenario_stories_v1',

  // Settings
  SETTINGS: 'accesscity-settings',

  // UI state (if needed)
  SELECTED_SCENE: 'accesscity-selected-scene',
  SELECTED_TAB: 'accesscity-selected-tab',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

