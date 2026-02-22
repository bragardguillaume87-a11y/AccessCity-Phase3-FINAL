/**
 * Centralized timing constants for AccessCity Studio
 * All values in milliseconds
 *
 * Usage:
 * import { TIMING } from '@/config/timing';
 * setTimeout(() => {...}, TIMING.ANIMATION_DELAY);
 */

// ============================================================================
// TYPES
// ============================================================================

type TailwindDuration =
  | 'duration-75'
  | 'duration-100'
  | 'duration-150'
  | 'duration-200'
  | 'duration-300'
  | 'duration-500'
  | 'duration-700'
  | 'duration-1000';

interface TimingConstants {
  readonly ANIMATION_DELAY: number;
  readonly ANIMATION_FAST: number;
  readonly ANIMATION_VERY_FAST: number;
  readonly ANIMATION_MEDIUM: number;
  readonly ANIMATION_SLOW: number;
  readonly ANIMATION_BOUNCE: number;
  readonly ANIMATION_CREATE: number;
  readonly SHAKE_ERROR_DURATION: number;
  readonly TOOLTIP_DELAY: number;
  readonly TOAST_DURATION: number;
  readonly TOAST_DURATION_SHORT: number;
  readonly TOAST_DURATION_LONG: number;
  readonly UPLOAD_RELOAD_DELAY: number;
  readonly UPLOAD_PROGRESS_UPDATE: number;
  readonly CONFETTI_DURATION: number;
  readonly TYPEWRITER_DELAY: number;
  readonly DICE_ROLL_DURATION: number;
  readonly DICE_ANIMATION_DURATION: number;
  readonly DEBOUNCE_SEARCH: number;
  readonly DEBOUNCE_AUTOSAVE: number;
  readonly AUTOSAVE_INTERVAL_MS: number;
  readonly THROTTLE_RESIZE: number;
  readonly UPDATE_INTERVAL: number;
  readonly SOUND_TEST_INTERVAL: number;
  readonly LOADING_MIN_DISPLAY: number;
  readonly LOADING_TIMEOUT: number;
  readonly ARIA_ANNOUNCEMENT_CLEAR: number;
  readonly EXIT_DELAY: number;
  readonly MICRO_DELAY: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIMING: TimingConstants = {
  // Animation & Transitions
  ANIMATION_DELAY: 300,         // Standard animation delay (CSS transitions)
  ANIMATION_FAST: 150,          // Fast animations
  ANIMATION_VERY_FAST: 200,     // Very fast animations (quick exits)
  ANIMATION_MEDIUM: 400,        // Medium animations (pop effects)
  ANIMATION_SLOW: 500,          // Slow animations (fade in/out)
  ANIMATION_BOUNCE: 600,        // Bounce/spring animations
  ANIMATION_CREATE: 1500,       // Element creation animation duration
  SHAKE_ERROR_DURATION: 400,    // Error shake animation duration

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
  DICE_ROLL_DURATION: 700,      // Dice roll animation duration
  DICE_ANIMATION_DURATION: 1000, // Full dice animation cycle

  // Debounce & Throttle
  DEBOUNCE_SEARCH: 300,         // Search input debounce
  DEBOUNCE_AUTOSAVE: 1000,      // Auto-save debounce
  AUTOSAVE_INTERVAL_MS: 30000,  // Auto-save interval (30 seconds)
  THROTTLE_RESIZE: 200,         // Window resize throttle

  // Update & Polling
  UPDATE_INTERVAL: 1000,        // General state update interval
  SOUND_TEST_INTERVAL: 500,     // Sound test playback interval

  // Loading States
  LOADING_MIN_DISPLAY: 500,     // Minimum time to show loading spinner (prevent flashing)
  LOADING_TIMEOUT: 10000,       // Maximum loading time before timeout error

  // Accessibility
  ARIA_ANNOUNCEMENT_CLEAR: 1500, // Delay before clearing ARIA live region announcements

  // Navigation & State
  EXIT_DELAY: 100,              // Delay before exiting a mode (let state propagate)
  MICRO_DELAY: 50,              // Micro-delay for animation resets
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get animation duration from Tailwind duration classes
 * @param className - Tailwind duration class name
 * @returns Duration in milliseconds
 */
export const getTailwindDuration = (className: TailwindDuration): number => {
  const durations: Record<TailwindDuration, number> = {
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
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
