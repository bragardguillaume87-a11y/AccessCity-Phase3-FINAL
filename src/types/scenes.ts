import type { Condition, DiceCheck, Effect } from './game';
import type { SceneAudio, DialogueAudio, AmbientAudio } from './audio';

/**
 * CSS filter overrides applied to the scene background image only.
 * Characters and dialogue box are NOT affected.
 * Values follow CSS filter conventions.
 */
export interface BackgroundFilter {
  /** Blur radius in px (0-10, default: 0). Blurs the background for depth separation. */
  blur?: number;
  /** Brightness in % (50-150, default: 100). Below 100 = darker, above = brighter. */
  brightness?: number;
  /** Saturation / vivacité in % (0-200, default: 100). 0 = greyscale, 200 = vivid. */
  saturation?: number;
  /** Contrast in % (50-150, default: 100). Below 100 = flat, above = punchy. */
  contrast?: number;
}

/**
 * SceneMetadata — Version stockée dans scenesStore (SANS dialogues/characters/textBoxes/props)
 *
 * ⚠️ INVARIANT POST-PHASE 3 : scenesStore ne stocke QUE ces champs.
 * Les tableaux (dialogues, characters, textBoxes, props) sont dans leurs stores respectifs.
 *
 * Pour une scène complète avec ses données, utiliser :
 * - useSceneWithElements(sceneId)    → 1 scène
 * - useAllScenesWithElements()       → toutes les scènes
 */
export interface SceneMetadata {
  id: string;
  title: string;
  description: string;
  backgroundUrl: string;
  audio?: SceneAudio;
  order?: number;
  /** Up to 2 independent ambient sound tracks (wind, crowd, rain…). Independent from BGM. */
  ambientTracks?: [AmbientAudio?, AmbientAudio?];
  /** CSS filter applied to background image only. Characters and UI are unaffected. */
  backgroundFilter?: BackgroundFilter;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Dialogue box visual style override.
 * All fields optional — unset fields fall back to project-level defaults (settingsStore).
 *
 * @see settingsStore.projectSettings.game.dialogueBoxDefaults for global defaults
 */
export interface DialogueBoxStyle {
  /** Typewriter speed in ms per character (default: 40) */
  typewriterSpeed?: number;
  /** Text font size in px (default: 15) */
  fontSize?: number;
  /** Box background opacity 0–1 (default: 0.75) */
  boxOpacity?: number;
  /** Box vertical position (default: 'bottom') */
  position?: 'bottom' | 'top' | 'center';
  /** Show speaker portrait thumbnail 48×48px (default: true) */
  showPortrait?: boolean;
  /** Speaker name alignment: 'auto' = left/right based on sprite position (default: 'auto') */
  speakerAlign?: 'auto' | 'left';
  /** Border style around the box (default: 'subtle') */
  borderStyle?: 'none' | 'subtle' | 'prominent';
  /** Portrait horizontal pan 0–100 % (default: 50 = centre). Controls object-position X. */
  portraitOffsetX?: number;
  /** Portrait vertical pan 0–100 % (default: 0 = haut, pour afficher le visage). Controls object-position Y. */
  portraitOffsetY?: number;
  /** Portrait zoom factor 1.0–3.0 (default: 1.0). Scale CSS + overflow-hidden. */
  portraitScale?: number;
}

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  sfx?: DialogueAudio;
  nextDialogueId?: string;
  isResponse?: boolean;
  speakerMood?: string;
  /** Overrides mood per character for this specific dialogue. Key = sceneCharacterId, value = mood id. */
  characterMoods?: Record<string, string>;
  stageDirections?: string;
  conditions?: Condition[];
  /** Per-dialogue dialogue box style override (merged with project defaults). */
  boxStyle?: DialogueBoxStyle;
}

export type ChoiceActionType = 'continue' | 'sceneJump' | 'diceCheck';

export interface DialogueChoice {
  id: string;
  text: string;
  effects: Effect[];
  actionType?: ChoiceActionType;
  nextSceneId?: string;
  nextDialogueId?: string;
  diceCheck?: DiceCheck;
}

/** Determine the action type of a choice from its data (backwards compatible) */
export function getChoiceActionType(choice: DialogueChoice): ChoiceActionType | 'none' {
  if (choice.actionType) return choice.actionType;
  if (choice.diceCheck) return 'diceCheck';
  if (choice.nextSceneId) return 'sceneJump';
  if (choice.nextDialogueId) return 'continue';
  return 'none';
}

export interface SceneCharacter {
  id: string;
  characterId: string;
  mood: string;
  position: Position;
  size: Size;
  scale?: number;
  zIndex?: number;
  entranceAnimation: string;
  exitAnimation: string;
  flipped?: boolean;
}

export interface TextBox {
  id: string;
  content: string;
  position: Position;
  size: Size;
  style?: React.CSSProperties;
}

export interface Prop {
  id: string;
  assetUrl: string;
  position: Position;
  size: Size;
  rotation?: number;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  backgroundUrl: string;
  dialogues: Dialogue[];
  characters: SceneCharacter[];
  textBoxes?: TextBox[];
  props?: Prop[];
  audio?: SceneAudio;
  /** Up to 2 independent ambient sound tracks. Inherited from SceneMetadata. */
  ambientTracks?: [AmbientAudio?, AmbientAudio?];
  /** CSS filter applied to background image only. Inherited from SceneMetadata. */
  backgroundFilter?: BackgroundFilter;
}
