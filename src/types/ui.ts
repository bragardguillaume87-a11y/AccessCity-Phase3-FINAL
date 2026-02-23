/**
 * Section identifiers for the UnifiedPanel icon bar (Panel 4).
 * Controls which content is shown in Panel 3.
 */
export type SectionId = 'backgrounds' | 'text' | 'characters' | 'objects' | 'audio' | 'dialogue' | 'effects';

export const SECTION_LABELS: Record<SectionId, string> = {
  backgrounds: 'Fond',
  text: 'Texte',
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
 */
export type ComplexityLevel = 'linear' | 'binary' | 'dice' | 'expert';

export type SelectedElementType =
  | { type: 'scene'; id: string }
  | { type: 'character'; id: string }
  | { type: 'dialogue'; sceneId: string; index: number }
  | { type: 'sceneCharacter'; sceneId: string; sceneCharacterId: string }
  | null;

export type FullscreenMode = 'graph' | 'canvas' | 'preview' | null;

export type ModalType =
  | 'characters'
  | 'assets'
  | 'export'
  | 'preview'
  | 'settings'
  | 'project'
  | 'addCharacter'
  | null;

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ModalContext {
  characterId?: string;
  category?: string;
  targetSceneId?: string;
  sceneId?: string;
  /** Selection purpose when opening the assets modal from a specific tool.
   *  'sceneAudio'    → BGM : "Utiliser cette musique" assigne scene.audio.
   *  'ambientTrack'  → Ambiance : "Utiliser" assigne scene.ambientTracks[slot]. */
  purpose?: 'sceneAudio' | 'ambientTrack';
  /** Ambient track slot (0 or 1). Only used when purpose === 'ambientTrack'. */
  slot?: 0 | 1;
}
