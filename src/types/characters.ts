export interface Character {
  id: string;
  name: string;
  description: string;
  sprites: Record<string, string>;
  moods: string[];
  /** Voice preset used for text blips during dialogue. Defaults to 'narrator' if unset. */
  voicePreset?: string;
}

export interface MoodPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export type ValidationLocale = 'en' | 'fr';

export interface ValidationMessages {
  nameRequired: string;
  nameMinLength: string;
  nameMaxLength: string;
  nameDuplicate: string;
  descriptionMaxLength: string;
  moodsRequired: string;
  moodsDuplicate: string;
  moodsEmpty: string;
  spritesWarning: (count: number, moods: string) => string;
}
