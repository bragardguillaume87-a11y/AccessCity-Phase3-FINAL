/** Audio configuration for scene background music */
export interface SceneAudio {
  url: string;
  volume?: number;
  loop?: boolean;
  continueToNextScene?: boolean;
  /** Duration mode: plays the whole scene or stops after N dialogues */
  durationMode?: 'scene' | 'dialogues';
  /** Number of dialogues to play for (only when durationMode === 'dialogues') */
  durationDialogues?: number;
}

/** Audio configuration for dialogue sound effects */
export interface DialogueAudio {
  url: string;
  volume?: number;
}

/** Audio configuration for ambient environmental tracks (wind, crowd, rain…) */
export interface AmbientAudio {
  url: string;
  volume?: number; // 0-1, default: 0.4
  loop?: boolean;  // default: true
}
