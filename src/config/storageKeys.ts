/**
 * Centralized localStorage keys for AccessCity Studio
 *
 * Usage:
 * import { STORAGE_KEYS } from '@/config/storageKeys';
 * localStorage.getItem(STORAGE_KEYS.BACKGROUNDS_HISTORY);
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface StorageKeys {
  readonly BACKGROUNDS_HISTORY: string;
  readonly FAVORITES_ASSETS: string;
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

/**
 * Get item from localStorage with error handling
 * @param key - Storage key from STORAGE_KEYS
 * @param defaultValue - Default value if key doesn't exist
 * @returns Parsed value or defaultValue
 */
export const getStorageItem = <T = unknown>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage with error handling
 * @param key - Storage key from STORAGE_KEYS
 * @param value - Value to store (will be JSON stringified)
 * @returns Success status
 */
export const setStorageItem = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param key - Storage key from STORAGE_KEYS
 * @returns Success status
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
};
