/**
 * Centralized timing constants for AccessCity Studio
 * All values in milliseconds
 *
 * Usage:
 * import { TIMING } from '@/config/timing';
 * setTimeout(() => {...}, TIMING.ANIMATION_DELAY);
 */

export const TIMING = {
  // Animation & Transitions
  ANIMATION_DELAY: 300,        // Standard animation delay (CSS transitions)
  ANIMATION_FAST: 150,          // Fast animations
  ANIMATION_SLOW: 500,          // Slow animations

  // UI Feedback
  TOOLTIP_DELAY: 300,           // Delay before showing tooltips
  TOAST_DURATION: 3000,         // Default toast notification duration
  TOAST_DURATION_SHORT: 2000,   // Short toast (success messages)
  TOAST_DURATION_LONG: 5000,    // Long toast (important warnings)

  // Asset Upload
  UPLOAD_RELOAD_DELAY: 1500,    // Delay before reloading assets after upload
  UPLOAD_PROGRESS_UPDATE: 100,  // Progress bar update interval

  // Gaming Effects
  CONFETTI_DURATION: 5000,      // Confetti celebration duration
  TYPEWRITER_DELAY: 40,         // Typewriter effect delay per character

  // Debounce & Throttle
  DEBOUNCE_SEARCH: 300,         // Search input debounce
  DEBOUNCE_AUTOSAVE: 1000,      // Auto-save debounce
  THROTTLE_RESIZE: 200,         // Window resize throttle

  // Loading States
  LOADING_MIN_DISPLAY: 500,     // Minimum time to show loading spinner (prevent flashing)
  LOADING_TIMEOUT: 10000,       // Maximum loading time before timeout error
};

/**
 * Get animation duration from Tailwind duration classes
 * @param {'duration-75'|'duration-100'|'duration-150'|'duration-200'|'duration-300'|'duration-500'|'duration-700'|'duration-1000'} className
 * @returns {number} Duration in milliseconds
 */
export const getTailwindDuration = (className) => {
  const durations = {
    'duration-75': 75,
    'duration-100': 100,
    'duration-150': 150,
    'duration-200': 200,
    'duration-300': 300,
    'duration-500': 500,
    'duration-700': 700,
    'duration-1000': 1000,
  };
  return durations[className] || TIMING.ANIMATION_DELAY;
};

/**
 * Create a delay Promise for async operations
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
