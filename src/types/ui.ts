/**
 * Section identifiers for the UnifiedPanel icon bar (Panel 4).
 * Controls which content is shown in Panel 3.
 */
export type SectionId =
  | 'backgrounds'
  | 'text'
  | 'characters'
  | 'objects'
  | 'audio'
  | 'dialogue'
  | 'effects';

export const SECTION_LABELS: Record<SectionId, string> = {
  backgrounds: 'Fond',
  text: 'Style',
  characters: 'Persos',
  objects: 'Objets',
  audio: 'Audio',
  dialogue: 'Dialogue',
  effects: 'Effets',
};

/**
 * Complexity level for dialogue creation
 * - linear: Dialogue without choices (linear story)
 * - binary: Dialogue with 2 simple choices
 * - dice: Dialogue with dice checks (1-2 tests)
 * - expert: Dialogue with multiple choices and effects (2-4 choices)
 * - minigame: Dialogue replaced by an interactive mini-game (FALC, QTE, Braille)
 */
export type ComplexityLevel = 'linear' | 'binary' | 'dice' | 'expert' | 'minigame';

export type SelectedElementType =
  | { type: 'scene'; id: string }
  | { type: 'character'; id: string }
  | { type: 'dialogue'; sceneId: string; index: number }
  | { type: 'sceneCharacter'; sceneId: string; sceneCharacterId: string }
  | null;

export type FullscreenMode = 'graph' | 'canvas' | 'preview' | null;

/** Mode d'interface — 'kid' = simplifié (8-10 ans), 'pro' = avancé (enseignant) */
export type EditorMode = 'kid' | 'pro';

export type ModalType =
  | 'characters'
  | 'assets'
  | 'export'
  | 'preview'
  | 'settings'
  | 'project'
  | 'addCharacter'
  | null;

export interface ModalContext {
  characterId?: string;
  category?: string;
  targetSceneId?: string;
  sceneId?: string;
  /** ID du dialogue de départ pour PreviewPlayer.
   *  Transmis quand l'utilisateur ouvre le preview avec un dialogue sélectionné.
   *  null ou absent → premier dialogue de la scène (comportement par défaut). */
  dialogueId?: string | null;
  /** Selection purpose when opening the assets modal from a specific tool.
   *  'sceneAudio'    → BGM : "Utiliser cette musique" assigne scene.audio.
   *  'ambientTrack'  → Ambiance : "Utiliser" assigne scene.ambientTracks[slot]. */
  purpose?: 'sceneAudio' | 'ambientTrack';
  /** Ambient track slot (0 or 1). Only used when purpose === 'ambientTrack'. */
  slot?: 0 | 1;
}
export type StudioModule =
  | 'vn-editor'
  | 'topdown'
  | 'behavior'
  | 'ui-builder'
  | 'distribution'
  | 'preview';
