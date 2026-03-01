export interface Character {
  id: string;
  name: string;
  description: string;
  sprites: Record<string, string>;
  moods: string[];
  /** Voice preset used for text blips during dialogue. Defaults to 'narrator' if unset. */
  voicePreset?: string;
  /**
   * Marque ce personnage comme protagoniste (joueur).
   * Ses `initialStats` seront utilisées comme stats de départ dans le PreviewPlayer.
   * Un seul personnage devrait avoir ce flag à true.
   */
  isProtagonist?: boolean;
  /**
   * Stats de jeu initiales (physique/mentale 0-100).
   * Actives uniquement si `isProtagonist = true`.
   * Valeur par défaut : 100 pour chaque stat si non renseignée.
   */
  initialStats?: {
    physique?: number;
    mentale?: number;
  };
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
