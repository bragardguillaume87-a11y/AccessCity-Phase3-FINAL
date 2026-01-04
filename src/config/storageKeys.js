/**
 * Centralized localStorage keys for AccessCity Studio
 *
 * Usage:
 * import { STORAGE_KEYS } from '@/config/storageKeys';
 * localStorage.getItem(STORAGE_KEYS.BACKGROUNDS_HISTORY);
 */

import { logger } from '../utils/logger';

export const STORAGE_KEYS = {
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
};

/**
 * Helper function to get item from localStorage with error handling
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or defaultValue
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Helper function to set item in localStorage with error handling
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Helper function to remove item from localStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @returns {boolean} Success status
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
};
