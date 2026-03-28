import type { Condition, DiceCheck, Effect, MinigameConfig } from './game';
import type { SceneAudio, DialogueAudio, AmbientAudio } from './audio';
import type { CinematicEvent, CinematicTracks } from './cinematic';
import type { SceneEffectConfig } from './sceneEffect';

/** Type de scène : dialogue interactif ou cinématique auto-play */
export type SceneType = 'standard' | 'cinematic';

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
  /** Scene type: 'standard' (click-to-advance dialogues) or 'cinematic' (auto-play event sequence). Default: 'standard'. */
  sceneType?: SceneType;
  /** Ordered sequence of cinematic events. Only used when sceneType === 'cinematic'. */
  cinematicEvents?: CinematicEvent[];
  /** Multi-track timeline (nouveau format NLE). Remplace cinematicEvents quand présent. */
  cinematicTracks?: CinematicTracks;
  /** Couleur de la pastille dans le filmstrip (hex). Défaut: --color-primary. */
  color?: string;
  /**
   * Effet atmosphérique de la scène VN (pluie, brouillard, neige…).
   * Rendu via <SceneEffectCanvas> overlay sur le fond de la scène.
   * Absent → pas d'effet.
   */
  sceneEffect?: SceneEffectConfig;
}

/**
 * Type guard — retourne true si la scène est une cinématique auto-play.
 * Utiliser partout où sceneType === 'cinematic' est testé pour centraliser la logique.
 *
 * @example
 * if (isCinematicScene(selectedScene)) { ... }
 */
export function isCinematicScene(scene: { sceneType?: SceneType } | null | undefined): boolean {
  return scene?.sceneType === 'cinematic';
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
  /**
   * Box position preset (default: 'bottom').
   * 'custom' uses positionX / positionY (percentages 0–100).
   */
  position?:
    | 'bottom'
    | 'bottom-left'
    | 'bottom-right'
    | 'top'
    | 'top-left'
    | 'top-right'
    | 'center'
    | 'custom';
  /** Custom horizontal position 0–100% (used only when position === 'custom'). Default: 50. */
  positionX?: number;
  /** Custom vertical position 0–100% (used only when position === 'custom'). Default: 75. */
  positionY?: number;
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
  /** Box background color as hex (default: '#030712'). Combined with boxOpacity. */
  bgColor?: string;
  /** Main dialogue text color as hex (default: '#ffffff'). */
  textColor?: string;
  /** Border color as hex (default: '#ffffff'). Opacity derived from borderStyle. */
  borderColor?: string;
  /** Box border radius preset (default: 'xl' = 24px). */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Layout preset: 'classique' = all-in-one box (default), 'visual' = separate nameplate tab + text box */
  layout?: 'classique' | 'visual';
  /**
   * Transition entre dialogues (paramètre global projet uniquement).
   * - 'aucune'  : swap instantané (comportement legacy)
   * - 'fondu'   : fade opacity, boîte fixe — discret, adapté aux rythmes rapides
   * - 'glisse'  : fade + léger slide vertical — style VN japonais
   * Défaut : 'fondu'
   */
  dialogueTransition?: 'aucune' | 'fondu' | 'glisse';
  // ── Nom du personnage ─────────────────────────────────────────────────────
  /** Police du nom (ID parmi NAME_FONTS dans config/nameFonts.ts — défaut : 'georgia') */
  nameFont?: string;
  /**
   * Couleur du nom en hex. Vide ou absent = utiliser speakerColor (couleur auto par personnage).
   * Ex : '#ffffff' forcer blanc, '#ffd700' or.
   */
  nameColor?: string;
  /** Preset d'ombre du nom (défaut : 'glow') */
  nameShadow?: 'none' | 'subtle' | 'glow' | 'hard' | 'neon';
  /** Espacement des lettres du nom en px (0–8, défaut : 1.5) */
  nameLetterSpacing?: number;
  // ── Boîte narrateur (dialogues sans speaker) ──────────────────────────────
  /** Fond de la boîte narrateur en hex (défaut : '#070a1a' — bleu nuit Octopath). */
  narratorBgColor?: string;
  /** Couleur du texte narrateur en hex (défaut : '#ede8d5' — crème Octopath). */
  narratorTextColor?: string;
  /** Couleur de la bordure et des ornements narrateur en hex (défaut : '#c9a84c' — or). */
  narratorBorderColor?: string;
  /** Opacité du fond narrateur 0–1 (défaut : 0.93). */
  narratorBgOpacity?: number;
  // ── Dimensionnement de la boîte ──────────────────────────────────────────────
  /** Largeur de la boîte en % du canvas (défaut : 76). Plage : 40–100. */
  boxWidth?: number;
}

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  /**
   * Texte enrichi en HTML (gras, couleurs) — set par le Surligneur dans TextTab.
   * Toujours synchronisé avec `text` (version plain text pour le typewriter).
   * Si absent, le rendu utilise `text` directement.
   */
  richText?: string;
  choices: DialogueChoice[];
  sfx?: DialogueAudio;
  nextDialogueId?: string;
  isResponse?: boolean;
  speakerMood?: string;
  /** Overrides mood per character for this specific dialogue. Key = sceneCharacterId, value = mood id. */
  characterMoods?: Record<string, string>;
  /**
   * Profil vocal procédural pour le typewriter blip (ex: 'homme-neutre', 'femme-joyeuse', 'robot').
   * Aucun fichier audio requis — synthèse Web Audio API.
   * @see src/utils/voiceProfiles.ts
   */
  voicePreset?: string;
  stageDirections?: string;
  conditions?: Condition[];
  /** Per-dialogue dialogue box style override (merged with project defaults). */
  boxStyle?: DialogueBoxStyle;
  /** Marque ce dialogue comme nœud de conclusion intentionnel (fin de l'histoire). */
  isConclusion?: boolean;
  /** Config mini-jeu — uniquement quand ComplexityLevel === 'minigame'. */
  minigame?: MinigameConfig;
  /**
   * Sous-type visuel du dialogue.
   * - 'phonecall' : vignette sombre, icône téléphone, fond neutre.
   * - 'normal'    : rendu standard (défaut).
   */
  dialogueSubtype?: 'normal' | 'phonecall';
}

type ChoiceActionType = 'continue' | 'sceneJump' | 'diceCheck';

export interface DialogueChoice {
  id: string;
  text: string;
  effects: Effect[];
  actionType?: ChoiceActionType;
  nextSceneId?: string;
  nextDialogueId?: string;
  diceCheck?: DiceCheck;
  /** Conditions de visibilité — le choix est masqué si une condition échoue. Vide = toujours visible. */
  conditions?: Condition[];
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
  /** Scene type: 'standard' (click-to-advance dialogues) or 'cinematic' (auto-play event sequence). Default: 'standard'. */
  sceneType?: SceneType;
  /** Ordered sequence of cinematic events. Only used when sceneType === 'cinematic'. Inherited from SceneMetadata. */
  cinematicEvents?: CinematicEvent[];
  /** Multi-track timeline (nouveau format NLE). Inherited from SceneMetadata. */
  cinematicTracks?: CinematicTracks;
  /** Effet atmosphérique de la scène. Inherited from SceneMetadata. */
  sceneEffect?: SceneEffectConfig;
}
