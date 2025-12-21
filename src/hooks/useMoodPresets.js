/**
 * useMoodPresets - Hook providing common mood presets for characters
 * Returns an array of mood templates with names, labels, and emoji icons
 */
export function useMoodPresets() {
  return [
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
  ];
}

/**
 * Get a specific mood preset by ID
 */
export function getMoodPreset(id) {
  const presets = useMoodPresets();
  return presets.find(preset => preset.id === id);
}

/**
 * Check if a mood ID is a common preset
 */
export function isPresetMood(id) {
  const presets = useMoodPresets();
  return presets.some(preset => preset.id === id);
}
