/**
 * useMoodPresets - Hook providing common mood presets for characters
 *
 * This hook returns a curated list of mood templates that can be used
 * for character expressions throughout the application. Each preset
 * includes an ID, human-readable label, emoji icon, and description.
 *
 * @returns {ReadonlyArray<MoodPreset>} Array of mood preset configurations
 *
 * @example
 * ```typescript
 * const presets = useMoodPresets();
 * console.log(presets[0]); // { id: 'neutral', label: 'Neutral', emoji: '😐', ... }
 * ```
 */

import type { MoodPreset } from '@/types';

// Mood presets constant (used by both hook and utility functions)
const MOOD_PRESETS: readonly MoodPreset[] = [
  { id: 'neutral', label: 'Neutral', emoji: '😐', description: 'Default, calm expression' },
  { id: 'happy', label: 'Happy', emoji: '😊', description: 'Positive, cheerful mood' },
  { id: 'sad', label: 'Sad', emoji: '😢', description: 'Sorrowful, downcast expression' },
  { id: 'angry', label: 'Angry', emoji: '😠', description: 'Frustrated, upset mood' },
  { id: 'surprised', label: 'Surprised', emoji: '😲', description: 'Shocked, astonished expression' },
  { id: 'confused', label: 'Confused', emoji: '😕', description: 'Puzzled, uncertain mood' },
  { id: 'scared', label: 'Scared', emoji: '😨', description: 'Fearful, frightened expression' },
  { id: 'excited', label: 'Excited', emoji: '🤩', description: 'Energetic, enthusiastic mood' },
  { id: 'professional', label: 'Professional', emoji: '👔', description: 'Formal, business-like demeanor' },
  { id: 'helpful', label: 'Helpful', emoji: '🤝', description: 'Supportive, friendly attitude' },
  { id: 'tired', label: 'Tired', emoji: '😴', description: 'Exhausted, weary expression' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🤔', description: 'Contemplative, pensive mood' }
] as const;

export function useMoodPresets(): readonly MoodPreset[] {
  return MOOD_PRESETS;
}

/**
 * Get a specific mood preset by ID
 *
 * Retrieves a single mood preset matching the provided ID.
 * Returns undefined if no preset with the given ID exists.
 *
 * @param {string} id - The unique identifier of the mood preset
 * @returns {MoodPreset | undefined} The matching mood preset or undefined
 *
 * @example
 * ```typescript
 * const happy = getMoodPreset('happy');
 * console.log(happy?.emoji); // '😊'
 *
 * const invalid = getMoodPreset('nonexistent');
 * console.log(invalid); // undefined
 * ```
 */
export function getMoodPreset(id: string): MoodPreset | undefined {
  return MOOD_PRESETS.find((preset) => preset.id === id);
}

/**
 * Check if a mood ID is a common preset
 *
 * Validates whether the provided ID corresponds to one of the
 * predefined mood presets available in the system.
 *
 * @param {string} id - The mood identifier to check
 * @returns {boolean} True if the ID matches a preset, false otherwise
 *
 * @example
 * ```typescript
 * isPresetMood('happy'); // true
 * isPresetMood('custom_mood'); // false
 * isPresetMood(''); // false
 * ```
 */
export function isPresetMood(id: string): boolean {
  return MOOD_PRESETS.some((preset) => preset.id === id);
}
