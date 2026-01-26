/**
 * Simple Sound Utility
 *
 * Provides basic sound playback functionality for the game.
 * Uses the Web Audio API with graceful fallback.
 *
 * @module utils/simpleSound
 */

import { logger } from './logger';

// ============================================================================
// STATE
// ============================================================================

let isMuted = false;
const audioCache = new Map<string, HTMLAudioElement>();

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Play a sound file
 *
 * @param src - Path to the sound file
 * @param volume - Volume level (0-1), default 0.5
 *
 * @example
 * playSound('/sounds/click.mp3', 0.3);
 */
export function playSound(src: string, volume: number = 0.5): void {
  if (isMuted) {
    logger.debug('[Sound] Muted, skipping:', src);
    return;
  }

  try {
    // Check cache first
    let audio = audioCache.get(src);

    if (!audio) {
      audio = new Audio(src);
      audioCache.set(src, audio);
    }

    // Clone for overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = Math.max(0, Math.min(1, volume));

    clone.play().catch((error) => {
      // Autoplay might be blocked by browser
      logger.debug('[Sound] Playback failed (likely autoplay blocked):', error.message);
    });
  } catch (error) {
    logger.warn('[Sound] Failed to play sound:', src, error);
  }
}

/**
 * Toggle mute state
 *
 * @returns New mute state (true = muted)
 *
 * @example
 * const muted = toggleMute();
 * console.log(muted ? 'Sound off' : 'Sound on');
 */
export function toggleMute(): boolean {
  isMuted = !isMuted;
  logger.debug('[Sound] Mute toggled:', isMuted);
  return isMuted;
}

/**
 * Check if sound is currently muted
 *
 * @returns true if muted, false otherwise
 */
export function isSoundMuted(): boolean {
  return isMuted;
}

/**
 * Set mute state directly
 *
 * @param muted - New mute state
 */
export function setMuted(muted: boolean): void {
  isMuted = muted;
  logger.debug('[Sound] Mute set to:', isMuted);
}

/**
 * Preload sounds for faster playback
 *
 * @param srcs - Array of sound file paths to preload
 *
 * @example
 * preloadSounds(['/sounds/click.mp3', '/sounds/success.mp3']);
 */
export function preloadSounds(srcs: string[]): void {
  srcs.forEach((src) => {
    if (!audioCache.has(src)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audioCache.set(src, audio);
      logger.debug('[Sound] Preloaded:', src);
    }
  });
}

/**
 * Clear the audio cache
 */
export function clearAudioCache(): void {
  audioCache.clear();
  logger.debug('[Sound] Audio cache cleared');
}
