/**
 * dialogueComposerThemes.ts — Thèmes de couleur pour l'éditeur Access Studio.
 *
 * 6 thèmes disponibles (3 dark originaux + 3 nouveaux) :
 *   dark    — Violet uni (thème par défaut, Midnight Bloom)
 *   aurora  — Amber + Teal — chaud et professionnel
 *   candy   — Couleur par type de dialogue (Pokémon type system)
 *   mocha   — Catppuccin Mocha — lavande pastel sur fond doux
 *   dracula — Dracula Pro — violet vif, accents multicolores par section
 *   latte   — Catppuccin Latte — thème CLAIR (fond crème, texte sombre)
 *
 * Anti-hardcoding : toutes les couleurs passent par ce fichier.
 * Sources palettes : catppuccin.com/palette · draculatheme.com/spec
 */

import type { ComplexityLevel } from '@/types';

// ── Types exportés ────────────────────────────────────────────────────────────

export type DialogueComposerTheme = 'dark' | 'aurora' | 'candy' | 'mocha' | 'dracula' | 'latte';

/** Couleurs calculées pour un thème + type actif */
export interface ThemeColors {
  /** Couleur d'accent principale (form, VN textbox border, tab active, bouton save) */
  accent: string;
  /** Couleur de la zone preview (header bar, bordure preview) — diffère pour Aurora */
  previewAccent: string;
}

// ── Couleurs Pokémon-style par type (utilisées par le thème Candy) ────────────

/**
 * Chaque type de dialogue a une couleur signature.
 * Inspiré du système de types Pokémon et des catégories MIT Scratch.
 */
export const TYPE_ACCENT_COLORS: Record<ComplexityLevel, string> = {
  linear: '#4ade80', // vert menthe   — Simple, narratif, calme
  binary: '#fb7185', // corail        — Tension, choix, bifurcation
  dice: '#fbbf24', // amber         — Risque, aventure, aléatoire
  expert: '#a78bfa', // violet clair  — Complexité, pouvoir, magie
  minigame: '#38bdf8', // sky blue      — Jeu, interactivité, fun
};

// ── Définitions des thèmes ────────────────────────────────────────────────────

interface ThemeDefinition {
  /** Label affiché dans le sélecteur */
  label: string;
  /** Emoji du thème (Miyamoto §1.2 — emoji + label) */
  emoji: string;
  /** Couleur principale du thème — utilisée pour l'indicateur actif */
  dotColor: string;
  /** Indique si le fond du thème est clair (inverse le texte des labels) */
  isLight?: boolean;
  /** Calcule les couleurs accent/previewAccent selon le type actif */
  getColors: (level: ComplexityLevel | null) => ThemeColors;
}

export const DIALOGUE_COMPOSER_THEMES: Record<DialogueComposerTheme, ThemeDefinition> = {
  // ── Thèmes dark originaux ──────────────────────────────────────────────────
  dark: {
    label: 'Midnight',
    emoji: '🌙',
    dotColor: '#8b5cf6',
    getColors: () => ({ accent: '#8b5cf6', previewAccent: '#8b5cf6' }),
  },

  aurora: {
    label: 'Aurora',
    emoji: '🌅',
    dotColor: '#f59e0b',
    getColors: () => ({
      accent: '#f59e0b', // amber  → actions (save, tabs actifs)
      previewAccent: '#14b8a6', // teal   → zone preview (header, border)
    }),
  },

  candy: {
    label: 'Candy',
    emoji: '🍬',
    dotColor: '#fb7185',
    getColors: (level) => {
      const color = level ? TYPE_ACCENT_COLORS[level] : '#8b5cf6';
      return { accent: color, previewAccent: color };
    },
  },

  // ── Nouveaux thèmes ────────────────────────────────────────────────────────
  mocha: {
    label: 'Mocha',
    emoji: '🍫',
    dotColor: '#cba6f7', // Catppuccin Mocha Mauve
    getColors: () => ({ accent: '#cba6f7', previewAccent: '#89b4fa' }),
  },

  dracula: {
    label: 'Dracula',
    emoji: '🧛',
    dotColor: '#bd93f9', // Dracula Purple
    getColors: () => ({ accent: '#bd93f9', previewAccent: '#ff79c6' }),
  },

  latte: {
    label: 'Latte',
    emoji: '☕',
    dotColor: '#8839ef', // Catppuccin Latte Mauve — visible sur fond clair
    isLight: true,
    getColors: () => ({ accent: '#8839ef', previewAccent: '#1e66f5' }),
  },
};

// ── Couleurs primaires globales par thème (injectées dans :root via JS) ───────

/**
 * Définition complète des couleurs CSS globales par thème.
 *
 * Les thèmes dark n'ont que primary/hover — les variables bg/text restent
 * celles de tokens.css (removeProperty les restaure).
 *
 * Le thème latte overrides bgBase, bgElevated, text* et border* pour le
 * fond clair Catppuccin Latte.
 */
export interface ThemeGlobalColorDef {
  primary: string;
  hover: string;
  // Overrides fond/texte (pour les thèmes clairs uniquement — omis = tokens.css par défaut)
  bgBase?: string;
  bgElevated?: string;
  bgHover?: string;
  bgActive?: string;
  bgOverlay?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  textDisabled?: string;
  borderBase?: string;
  borderHover?: string;
}

export const THEME_GLOBAL_COLORS: Record<DialogueComposerTheme, ThemeGlobalColorDef> = {
  // ── Dark (tokens.css — aucun override fond/texte) ─────────────────────────
  dark: { primary: '#8b5cf6', hover: '#7c3aed' },
  aurora: { primary: '#f59e0b', hover: '#d97706' },
  candy: { primary: '#fb7185', hover: '#f43f5e' },

  // ── Catppuccin Mocha (dark, fond légèrement différent) ─────────────────────
  mocha: {
    primary: '#cba6f7',
    hover: '#b4befe',
    bgBase: '#1e1e2e', // Mocha Base
    bgElevated: '#181825', // Mocha Mantle
    bgHover: '#313244', // Mocha Surface0
    bgActive: '#45475a', // Mocha Surface1
    textPrimary: '#cdd6f4', // Mocha Text
    textMuted: '#a6adc8', // Mocha Subtext0
    borderBase: 'rgba(69,71,90,0.6)',
    borderHover: 'rgba(69,71,90,0.9)',
  },

  // ── Dracula Pro (dark, très saturé) ────────────────────────────────────────
  dracula: {
    primary: '#bd93f9',
    hover: '#ff79c6',
    bgBase: '#22212c', // Dracula darker bg
    bgElevated: '#282a36', // Dracula Background
    bgHover: '#383a4a',
    bgActive: '#44475a', // Dracula Selection
    textPrimary: '#f8f8f2', // Dracula Foreground
    textMuted: '#6272a4', // Dracula Comment
    borderBase: 'rgba(68,71,90,0.7)',
    borderHover: 'rgba(68,71,90,1)',
  },

  // ── Catppuccin Latte (LIGHT — fond crème, texte sombre) ───────────────────
  latte: {
    primary: '#8839ef',
    hover: '#7287fd',
    bgBase: '#eff1f5', // Latte Base
    bgElevated: '#e6e9ef', // Latte Mantle
    bgHover: '#dce0e8', // Latte Crust
    bgActive: '#ccd0da', // Latte Surface0
    bgOverlay: 'rgba(204,208,218,0.95)', // Latte Surface0 semi-opaque
    textPrimary: '#4c4f69', // Latte Text (sombre)
    textSecondary: '#5c5f77', // Latte Subtext1 — section headers
    textMuted: '#6c6f85', // Latte Subtext0
    textDisabled: '#9ca0b0', // Latte Overlay1
    borderBase: 'rgba(76,79,105,0.18)',
    borderHover: 'rgba(76,79,105,0.35)',
  },
};

// ── Utilitaire : hex → rgba avec opacité ──────────────────────────────────────

/**
 * Convertit un hex 6 chiffres (#rrggbb) + une opacité en rgba().
 * Utilisé pour les variations alpha des couleurs d'accent dans le CSS-in-JS.
 */
export function hexAlpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
