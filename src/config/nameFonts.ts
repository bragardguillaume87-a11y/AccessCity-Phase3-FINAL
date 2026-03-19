/**
 * nameFonts — Polices disponibles pour le nom du speaker (boîte de dialogue)
 *
 * Chargées via Google Fonts (index.html) sauf 'georgia' (built-in).
 * Utilisées dans TextSection (panneau global) et DialogueBox (rendu).
 *
 * @module config/nameFonts
 */

// ============================================================================
// FONT DEFINITIONS
// ============================================================================

export interface NameFontDef {
  id: string;
  /** Label court affiché dans le picker */
  label: string;
  emoji: string;
  /** Valeur CSS font-family complète */
  fontFamily: string;
  /** Style / ambiance en une phrase */
  description: string;
}

export const NAME_FONTS: NameFontDef[] = [
  {
    id: 'georgia',
    label: 'Classique',
    emoji: '📖',
    fontFamily: "Georgia, 'Palatino Linotype', serif",
    description: 'Serif élégant, sans import',
  },
  {
    id: 'cinzel',
    label: 'Cinzel',
    emoji: '⚔️',
    fontFamily: "'Cinzel', serif",
    description: 'Final Fantasy / Square Enix',
  },
  {
    id: 'cinzel-deco',
    label: 'Ornemental',
    emoji: '🏰',
    fontFamily: "'Cinzel Decorative', serif",
    description: 'Titres épiques ornementés',
  },
  {
    id: 'bebas',
    label: 'Bebas',
    emoji: '🔤',
    fontFamily: "'Bebas Neue', sans-serif",
    description: 'Ultra-bold, tout-caps',
  },
  {
    id: 'orbitron',
    label: 'Orbitron',
    emoji: '🤖',
    fontFamily: "'Orbitron', sans-serif",
    description: 'Sci-fi / cyberpunk',
  },
  {
    id: 'press-start',
    label: 'Pixel',
    emoji: '🕹️',
    fontFamily: "'Press Start 2P', monospace",
    description: 'Rétro NES / arcade',
  },
  {
    id: 'exo2',
    label: 'Exo 2',
    emoji: '🎮',
    fontFamily: "'Exo 2', sans-serif",
    description: 'Modern JRPG / Persona',
  },
  {
    id: 'righteous',
    label: 'Righteous',
    emoji: '🔥',
    fontFamily: "'Righteous', sans-serif",
    description: 'Action / énergie',
  },
];

export const DEFAULT_NAME_FONT_ID = 'georgia';

// ============================================================================
// SHADOW PRESETS
// ============================================================================

export type NameShadowPreset = 'none' | 'subtle' | 'glow' | 'hard' | 'neon';

export const NAME_SHADOW_LABELS: Record<NameShadowPreset, string> = {
  none: 'Aucune',
  subtle: 'Subtile',
  glow: 'Lueur',
  hard: 'Rétro',
  neon: 'Néon',
};

/**
 * CSS text-shadow par preset.
 * `currentColor` référence automatiquement la couleur du texte (speakerColor ou nameColor).
 */
export const NAME_SHADOW_CSS: Record<NameShadowPreset, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.65)',
  glow: '0 0 12px currentColor, 0 1px 2px rgba(0,0,0,0.5)',
  hard: '2px 2px 0px #000, -1px -1px 0px rgba(0,0,0,0.4)',
  neon: '0 0 5px currentColor, 0 0 20px currentColor, 0 0 40px currentColor',
};

export const DEFAULT_NAME_SHADOW: NameShadowPreset = 'glow';
