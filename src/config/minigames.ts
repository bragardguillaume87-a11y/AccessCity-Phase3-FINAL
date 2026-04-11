/**
 * minigames.ts — Constantes de configuration des mini-jeux AccessCity
 *
 * Source unique pour : types, couleurs, presets temps, difficulté, touches.
 * Centralisé ici pour être partagé entre MinigameChoiceBuilder et ses sous-composants.
 */

import type { MinigameType, MinigameConfig } from '@/types';

// ── Types de mini-jeux ────────────────────────────────────────────────────────

export const MINIGAME_TYPES: Array<{
  id: MinigameType;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    id: 'falc',
    emoji: '🗂️',
    label: 'FALC',
    description: 'Réordonner des cartes dans le bon ordre',
  },
  { id: 'qte', emoji: '⌨️', label: 'QTE', description: 'Appuyer sur des touches dans les temps' },
  { id: 'braille', emoji: '⠿', label: 'Braille', description: 'Identifier une lettre en Braille' },
];

// ── Couleurs par type de mini-jeu ─────────────────────────────────────────────

export const MINIGAME_TYPE_COLORS: Record<
  MinigameType,
  { border: string; bg: string; color: string; bgInactive: string }
> = {
  falc: {
    border: 'rgba(245,158,11,0.55)',
    bg: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    bgInactive: 'rgba(245,158,11,0.05)',
  },
  qte: {
    border: 'rgba(6,182,212,0.55)',
    bg: 'rgba(6,182,212,0.15)',
    color: '#06b6d4',
    bgInactive: 'rgba(6,182,212,0.05)',
  },
  braille: {
    border: 'rgba(167,139,250,0.55)',
    bg: 'rgba(167,139,250,0.15)',
    color: '#a78bfa',
    bgInactive: 'rgba(167,139,250,0.05)',
  },
};

// ── Config par défaut ─────────────────────────────────────────────────────────

export const DEFAULT_MINIGAME_CONFIG: MinigameConfig = {
  type: 'falc',
  difficulty: 3,
  timeout: undefined,
  items: ['Étape 1', 'Étape 2', 'Étape 3'],
  onSuccess: {},
  onFailure: {},
};

// ── Presets temps (secondes) ──────────────────────────────────────────────────

/** Valeurs disponibles dans le sélecteur de timeout — en secondes */
export const TIME_PRESETS_S = [3, 5, 10, 15, 20, 30] as const;

/** Sentinel indiquant "pas de timeout" dans le Select Radix */
export const SENTINEL_AUTO = '__auto__';

// ── Couleurs progressives temps : urgence (rouge) → sérénité (bleu) ───────────

export const TIME_CIRCLE_EMOJI: Record<number, string> = {
  3: '🔴',
  5: '🟠',
  10: '🟡',
  15: '🟢',
  20: '🔵',
  30: '🟣',
};

/** Couleurs sémantiques par chip temps — design brief §10 */
export const TIME_CHIP_SEMANTIC: Record<
  number,
  { color: string; bg: string; border: string; shadow: string }
> = {
  3: {
    color: '#ff7070',
    bg: 'rgba(255,112,112,0.18)',
    border: 'rgba(255,112,112,0.55)',
    shadow: '0 0 0 2px rgba(255,112,112,0.25)',
  },
  5: {
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.18)',
    border: 'rgba(251,146,60,0.55)',
    shadow: '0 0 0 2px rgba(251,146,60,0.25)',
  },
  10: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.18)',
    border: 'rgba(251,191,36,0.55)',
    shadow: '0 0 0 2px rgba(251,191,36,0.25)',
  },
  15: {
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.18)',
    border: 'rgba(74,222,128,0.55)',
    shadow: '0 0 0 2px rgba(74,222,128,0.25)',
  },
  20: {
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.18)',
    border: 'rgba(45,212,191,0.55)',
    shadow: '0 0 0 2px rgba(45,212,191,0.25)',
  },
  30: {
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.55)',
    shadow: '0 0 0 2px rgba(96,165,250,0.25)',
  },
};

// ── Niveaux de difficulté ─────────────────────────────────────────────────────

export const DIFFICULTY_INFO: Record<
  number,
  { label: string; color: string; bg: string; border: string }
> = {
  1: {
    label: 'Facile',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
  },
  2: {
    label: 'Modéré',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
  },
  3: {
    label: 'Risqué',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
  },
  4: {
    label: 'Difficile',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
  },
  5: {
    label: 'Extrême',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
  },
};

// ── Affichage des touches clavier ─────────────────────────────────────────────

export const KEY_DISPLAY_MAP: Record<string, string> = {
  ' ': '⎵ Espace',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: '↵ Entrée',
  Escape: 'Échap',
  Backspace: '⌫',
  Tab: '⇥ Tab',
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
};

/** Retourne le label affichable d'une touche clavier */
export function displayKey(k: string): string {
  return KEY_DISPLAY_MAP[k] ?? k.toUpperCase();
}
