/**
 * cinematic.ts — Types pour le mode Cinématique AccessCity
 *
 * Une scène cinématique joue une séquence d'événements horodatés
 * en auto-play (pas de clic joueur), avec effets Framer Motion.
 *
 * Philosophie :
 *  - Vitesses nommées (Lent/Normal/Rapide) — pas de millisecondes exposées
 *  - Presets d'effets — pas de paramètres bas niveau
 *  - Compatible public 8-10 ans : vocabulaire visuel intuitif
 */

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Vitesse pré-définie — masque les millisecondes aux créateurs */
export type CinematicSpeed = 'instant' | 'fast' | 'normal' | 'slow' | 'verySlow';

/** Durées en ms correspondant à chaque vitesse */
export const CINEMATIC_SPEED_MS: Record<CinematicSpeed, number> = {
  instant:  0,
  fast:     200,
  normal:   500,
  slow:     1000,
  verySlow: 3000,
};

/** Labels affichés dans l'UI (friendly names) */
export const CINEMATIC_SPEED_LABELS: Record<CinematicSpeed, string> = {
  instant:  'Instantané',
  fast:     'Rapide',
  normal:   'Normal',
  slow:     'Lent',
  verySlow: 'Très lent',
};

/** Côté d'entrée/sortie d'un personnage */
export type CinematicSide = 'left' | 'right' | 'top' | 'bottom';

/** Couleur de fondu ou flash */
export type CinematicColor = 'black' | 'white';

/** Intensité d'un effet (léger / moyen / fort) */
export type CinematicIntensity = 'light' | 'medium' | 'strong';

/** Transition entre deux décors */
export type BackgroundTransition = 'cut' | 'fade' | 'dissolve';

/** Preset d'ambiance couleur (filtre sur toute la scène) */
export type TintPreset = 'none' | 'memory' | 'danger' | 'cold' | 'warm' | 'dream';

/** Labels des presets de teinte */
export const TINT_PRESET_LABELS: Record<TintPreset, string> = {
  none:   'Aucune',
  memory: '📷 Souvenir (sépia)',
  danger: '🔴 Danger (rouge)',
  cold:   '🔵 Froid (bleu)',
  warm:   '🟡 Chaleur (doré)',
  dream:  '💜 Rêve (violet)',
};

// ── Events V1 — Essentiels ───────────────────────────────────────────────────

/** Fondu au noir ou depuis le noir (ou blanc) */
export interface CinematicEventFade {
  id: string;
  type: 'fade';
  direction: 'in' | 'out';   // 'in' = depuis le noir, 'out' = vers le noir
  color: CinematicColor;
  speed: CinematicSpeed;
}

/** Flash — éclair blanc ou noir (impact, surprise, révélation) */
export interface CinematicEventFlash {
  id: string;
  type: 'flash';
  color: CinematicColor;
  speed: CinematicSpeed;
}

/** Tremblement d'écran (explosion, impact, émotion forte) */
export interface CinematicEventScreenShake {
  id: string;
  type: 'screenShake';
  intensity: CinematicIntensity;
  speed: CinematicSpeed;
}

/** Changer le décor de la scène */
export interface CinematicEventBackground {
  id: string;
  type: 'background';
  url: string;
  transition: BackgroundTransition;
}

/** Un personnage entre dans la scène */
export interface CinematicEventCharacterEnter {
  id: string;
  type: 'characterEnter';
  characterId: string;      // ID du personnage dans la bibliothèque
  mood: string;             // Mood à afficher (nom du mood)
  side: CinematicSide;      // Côté d'entrée
  animation: string;        // Clé de CHARACTER_ANIMATION_VARIANTS
  speed: CinematicSpeed;
}

/** Un personnage quitte la scène */
export interface CinematicEventCharacterExit {
  id: string;
  type: 'characterExit';
  characterId: string;
  side: CinematicSide;
  speed: CinematicSpeed;
}

/** Une réplique de dialogue (avec option auto-avance ou clic) */
export interface CinematicEventDialogue {
  id: string;
  type: 'dialogue';
  speaker: string;          // ID du personnage ou '' pour narrateur
  speakerMood?: string;
  text: string;
  autoAdvance: boolean;     // true = avance automatiquement, false = attend le clic
  speed: CinematicSpeed;    // Vitesse du typewriter
}

/** Pause — attend X secondes sans rien faire */
export interface CinematicEventWait {
  id: string;
  type: 'wait';
  speed: CinematicSpeed;    // Durée : instant=0, fast=0.2s, normal=0.5s, slow=1s
}

/** Jouer un effet sonore */
export interface CinematicEventSfx {
  id: string;
  type: 'sfx';
  url: string;
  volume?: number;           // 0-1, défaut 0.7
}

// ── Events V2 — Utiles ───────────────────────────────────────────────────────

/** Halo sombre autour de l'écran (focus, flashback, tension) */
export interface CinematicEventVignette {
  id: string;
  type: 'vignette';
  on: boolean;
  intensity: CinematicIntensity;
  speed: CinematicSpeed;
}

/** Filtre de couleur sur toute la scène (ambiance, flashback sépia) */
export interface CinematicEventTint {
  id: string;
  type: 'tint';
  preset: TintPreset;
  speed: CinematicSpeed;
}

/** Zoom avant ou arrière sur la scène (gros plan, révélation) */
export interface CinematicEventZoom {
  id: string;
  type: 'zoom';
  direction: 'in' | 'out';
  scale: number;             // in: 1.1-1.5, out: 0.7-0.95
  speed: CinematicSpeed;
}

/** Barres cinéma en haut et en bas (letterbox) */
export interface CinematicEventLetterbox {
  id: string;
  type: 'letterbox';
  on: boolean;
  speed: CinematicSpeed;
}

/** Carte titre (texte centré sur fond sombre — nom de chapitre, lieu) */
export interface CinematicEventTitleCard {
  id: string;
  type: 'titleCard';
  title: string;
  subtitle?: string;
  speed: CinematicSpeed;
}

/** Personnage qui tremble (choc, peur, rires) */
export interface CinematicEventCharacterShake {
  id: string;
  type: 'characterShake';
  characterId: string;
  intensity: CinematicIntensity;
}

/** Changer la musique de fond */
export interface CinematicEventBgm {
  id: string;
  type: 'bgm';
  url: string;
  fade: boolean;
  volume?: number;
}

/** Arrêter la musique de fond */
export interface CinematicEventBgmStop {
  id: string;
  type: 'bgmStop';
  fade: boolean;   // true = fondu progressif, false = arrêt immédiat
}

/** Changer l'expression d'un personnage déjà présent à l'écran */
export interface CinematicEventCharacterExpression {
  id: string;
  type: 'characterExpression';
  characterId: string;
  mood: string;   // nouveau mood/sprite à afficher
}

/** Déplacer un personnage déjà présent vers une autre position */
export interface CinematicEventCharacterMove {
  id: string;
  type: 'characterMove';
  characterId: string;
  side: CinematicSide;
  speed: CinematicSpeed;
}

/** Son d'ambiance en boucle (pluie, foule, vent…) — indépendant de la musique */
export interface CinematicEventAmbiance {
  id: string;
  type: 'ambiance';
  url: string;
  volume?: number;   // 0-1, défaut 0.5
  loop: boolean;     // true = boucle continue
}

// ── Union type ───────────────────────────────────────────────────────────────

/** Tous les types d'événements cinématiques (V1 + V2) */
export type CinematicEvent =
  // V1 — Essentiels
  | CinematicEventFade
  | CinematicEventFlash
  | CinematicEventScreenShake
  | CinematicEventBackground
  | CinematicEventCharacterEnter
  | CinematicEventCharacterExit
  | CinematicEventDialogue
  | CinematicEventWait
  | CinematicEventSfx
  // V2 — Utiles
  | CinematicEventVignette
  | CinematicEventTint
  | CinematicEventZoom
  | CinematicEventLetterbox
  | CinematicEventTitleCard
  | CinematicEventCharacterShake
  | CinematicEventBgm
  // V2 — Personnages avancés
  | CinematicEventCharacterExpression
  | CinematicEventCharacterMove
  // V2 — Audio avancé
  | CinematicEventBgmStop
  | CinematicEventAmbiance;

/** Type discriminant pour identifier le type d'un event */
export type CinematicEventType = CinematicEvent['type'];

// ── UI metadata (pour l'éditeur) ─────────────────────────────────────────────

/** Metadata affichée dans le sélecteur d'event "+  Ajouter" */
export interface CinematicEventMeta {
  type: CinematicEventType;
  label: string;      // Nom enfant-friendly
  emoji: string;      // Icône visuelle
  group: 'essential' | 'effects' | 'characters' | 'audio';
  v2?: true;          // Events V2 (grisés en mode kid)
}

export const CINEMATIC_EVENT_META: CinematicEventMeta[] = [
  // Essential
  { type: 'fade',                 label: 'Fondu',                    emoji: '🌑', group: 'essential' },
  { type: 'wait',                 label: 'Pause',                    emoji: '⏱️', group: 'essential' },
  { type: 'dialogue',             label: 'Personnage parle',         emoji: '💬', group: 'essential' },
  { type: 'characterEnter',       label: 'Personnage arrive',        emoji: '👤', group: 'characters' },
  { type: 'characterExit',        label: 'Personnage part',          emoji: '🚪', group: 'characters' },
  { type: 'background',           label: 'Changer le décor',        emoji: '🖼️', group: 'essential' },
  { type: 'sfx',                  label: 'Effet sonore',             emoji: '🔊', group: 'audio' },
  { type: 'bgm',                  label: 'Musique de fond',          emoji: '🎵', group: 'audio' },
  // Effects
  { type: 'screenShake',          label: 'Tremblement d\'écran',    emoji: '📳', group: 'effects' },
  { type: 'flash',                label: 'Flash',                    emoji: '⚡', group: 'effects' },
  // V2 — Personnages
  { type: 'characterExpression',  label: 'Changer l\'expression',   emoji: '🎭', group: 'characters', v2: true },
  { type: 'characterShake',       label: 'Personnage tremble',       emoji: '😨', group: 'characters', v2: true },
  { type: 'characterMove',        label: 'Déplacer personnage',      emoji: '🚶', group: 'characters', v2: true },
  // V2 — Effets
  { type: 'vignette',             label: 'Assombrir les bords',      emoji: '🌑', group: 'effects', v2: true },
  { type: 'tint',                 label: 'Ambiance couleur',         emoji: '🎨', group: 'effects', v2: true },
  { type: 'zoom',                 label: 'Zoom',                     emoji: '🔍', group: 'effects', v2: true },
  { type: 'letterbox',            label: 'Mode cinéma',              emoji: '🎬', group: 'effects', v2: true },
  { type: 'titleCard',            label: 'Afficher un titre',        emoji: '🎞️', group: 'essential', v2: true },
  // V2 — Audio avancé
  { type: 'bgmStop',              label: 'Arrêter la musique',       emoji: '🔇', group: 'audio', v2: true },
  { type: 'ambiance',             label: 'Son d\'ambiance',          emoji: '🌧️', group: 'audio', v2: true },
];

// ── Factory ──────────────────────────────────────────────────────────────────

// ── Timeline helpers ─────────────────────────────────────────────────────────

/**
 * Retourne la durée de l'événement en ms.
 * Pour les événements sans `speed` (sfx, bgm, background…) retourne 300ms (valeur visuelle de base).
 */
export function getEventDurationMs(event: CinematicEvent): number {
  if ('speed' in event) return CINEMATIC_SPEED_MS[event.speed];
  return 300;
}

/**
 * Trouve la vitesse la plus proche d'une durée cible en ms.
 * Utilisé par le resize des blocs de la timeline.
 */
export function snapDurationToSpeed(targetMs: number): CinematicSpeed {
  const candidates: Array<[CinematicSpeed, number]> = [
    ['instant', 0], ['fast', 200], ['normal', 500], ['slow', 1000], ['verySlow', 3000],
  ];
  let best: CinematicSpeed = 'normal';
  let bestDiff = Infinity;
  for (const [speed, ms] of candidates) {
    const diff = Math.abs(targetMs - ms);
    if (diff < bestDiff) { bestDiff = diff; best = speed; }
  }
  return best;
}

// ── Factory ──────────────────────────────────────────────────────────────────

/** Crée un event avec des valeurs par défaut sensibles */
export function createDefaultCinematicEvent(type: CinematicEventType): CinematicEvent {
  const id = `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case 'fade':           return { id, type, direction: 'out', color: 'black', speed: 'normal' };
    case 'flash':          return { id, type, color: 'white', speed: 'fast' };
    case 'screenShake':    return { id, type, intensity: 'medium', speed: 'normal' };
    case 'background':     return { id, type, url: '', transition: 'fade' };
    case 'characterEnter': return { id, type, characterId: '', mood: 'default', side: 'left', animation: 'slideInLeft', speed: 'normal' };
    case 'characterExit':  return { id, type, characterId: '', side: 'right', speed: 'normal' };
    case 'dialogue':       return { id, type, speaker: '', text: '', autoAdvance: false, speed: 'normal' };
    case 'wait':           return { id, type, speed: 'normal' };
    case 'sfx':            return { id, type, url: '', volume: 0.7 };
    case 'vignette':       return { id, type, on: true, intensity: 'medium', speed: 'normal' };
    case 'tint':           return { id, type, preset: 'memory', speed: 'normal' };
    case 'zoom':           return { id, type, direction: 'in', scale: 1.2, speed: 'slow' };
    case 'letterbox':      return { id, type, on: true, speed: 'normal' };
    case 'titleCard':      return { id, type, title: '', subtitle: '', speed: 'slow' };
    case 'characterShake':      return { id, type, characterId: '', intensity: 'medium' };
    case 'bgm':                 return { id, type, url: '', fade: true, volume: 0.7 };
    case 'bgmStop':             return { id, type, fade: true };
    case 'characterExpression': return { id, type, characterId: '', mood: 'default' };
    case 'characterMove':       return { id, type, characterId: '', side: 'right', speed: 'normal' };
    case 'ambiance':            return { id, type, url: '', volume: 0.5, loop: true };
  }
}
