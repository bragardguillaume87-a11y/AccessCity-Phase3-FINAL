// ── V2 Design tokens ─────────────────────────────────────────────────────────
// ⚠️ Design glassmorphism intentionnellement différent du design system global.
// T.purple (#c084fc) est plus clair que --color-primary (#8b5cf6) — volontaire.
export const T = {
  card: 'rgba(255,255,255,0.13)',
  border: 'rgba(255,255,255,0.22)',
  borderHi: 'rgba(255,255,255,0.38)',
  t1: '#ffffff',
  t2: 'rgba(255,255,255,0.92)',
  t3: 'rgba(255,255,255,0.68)',
  purple: '#c084fc',
  purpleBg: 'rgba(192,132,252,0.20)',
  purpleBd: 'rgba(192,132,252,0.55)',
  teal: '#5eead4',
  tealBg: 'rgba(94,234,212,0.18)',
  tealBd: 'rgba(94,234,212,0.50)',
  amber: '#fde68a',
  amberBg: 'rgba(253,230,138,0.18)',
  amberBd: 'rgba(253,230,138,0.50)',
  rose: '#fda4d0',
  roseBg: 'rgba(253,164,208,0.18)',
  roseBd: 'rgba(253,164,208,0.50)',
  green: '#6ee7b7',
  greenBg: 'rgba(110,231,183,0.18)',
  greenBd: 'rgba(110,231,183,0.50)',
  blue: '#93c5fd',
  blueBg: 'rgba(147,197,253,0.18)',
  blueBd: 'rgba(147,197,253,0.50)',
  orange: '#fdba74',
  orangeBg: 'rgba(253,186,116,0.18)',
  orangeBd: 'rgba(253,186,116,0.50)',
} as const;

import type { ComplexityLevel } from '@/types';
import type { MinigameType } from '@/types/game';

export interface TypeTabDef {
  id: ComplexityLevel;
  label: string;
  desc: string;
  c: string;
  bg: string;
  bd: string;
  /** Couleur du texte sur fond actif (fill coloré) */
  tc: string;
  svgPath: string;
}

export const TYPE_TABS: TypeTabDef[] = [
  {
    id: 'linear',
    label: 'Simple',
    desc: 'Un texte',
    c: T.blue,
    bg: T.blueBg,
    bd: T.blueBd,
    tc: '#0f172a',
    svgPath:
      '<rect x="3" y="5" width="14" height="10" rx="2" fill="rgba(147,197,253,0.28)" stroke="rgba(191,219,254,0.90)" stroke-width="1.5"/><path d="M6 9h8M6 12h5" stroke="rgba(191,219,254,0.90)" stroke-width="1.5" stroke-linecap="round"/>',
  },
  {
    id: 'binary',
    label: 'À choisir',
    desc: 'A/B',
    c: T.teal,
    bg: T.tealBg,
    bd: T.tealBd,
    tc: '#0f2a26',
    svgPath:
      '<path d="M3 6h6M3 10h6M11 6h6M11 10h6" stroke="rgba(153,246,228,0.90)" stroke-width="1.5" stroke-linecap="round"/><path d="M6 14l2-2-2-2M14 14l2-2-2-2" stroke="rgba(153,246,228,0.90)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    id: 'dice',
    label: 'Dés',
    desc: 'Aléatoire',
    c: T.rose,
    bg: T.roseBg,
    bd: T.roseBd,
    tc: '#2a0f1a',
    svgPath:
      '<rect x="3" y="3" width="6" height="6" rx="1.5" fill="rgba(253,164,208,0.28)" stroke="rgba(251,207,232,0.90)" stroke-width="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5" fill="rgba(253,164,208,0.28)" stroke="rgba(251,207,232,0.90)" stroke-width="1.5"/><circle cx="6" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/><circle cx="10" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/><circle cx="14" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/>',
  },
  {
    id: 'expert',
    label: 'Expert',
    desc: 'Effets',
    c: T.amber,
    bg: T.amberBg,
    bd: T.amberBd,
    tc: '#1a1200',
    svgPath:
      '<path d="M10 3l1.5 4h4l-3 2.5 1 4L10 11l-3.5 2.5 1-4L4 7h4z" fill="rgba(253,230,138,0.32)" stroke="rgba(254,240,138,0.92)" stroke-width="1.5" stroke-linejoin="round"/>',
  },
  {
    id: 'minigame',
    label: 'Mini-jeu',
    desc: 'Braille…',
    c: T.purple,
    bg: T.purpleBg,
    bd: T.purpleBd,
    tc: '#ffffff',
    svgPath:
      '<rect x="2" y="6" width="16" height="10" rx="2" fill="rgba(192,132,252,0.28)" stroke="rgba(216,180,255,0.90)" stroke-width="1.5"/><path d="M10 6V4M7 4h6" stroke="rgba(216,180,255,0.90)" stroke-width="1.5" stroke-linecap="round"/><path d="M8 11h4M10 9v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  },
];

export interface MinigameCardDef {
  type: MinigameType;
  label: string;
  desc: string;
  c: string;
  bg: string;
  bd: string;
  tc: string;
}

export const MINIGAME_CARDS: MinigameCardDef[] = [
  {
    type: 'falc',
    label: 'FALC',
    desc: 'Réordonner les cartes',
    c: T.amber,
    bg: T.amberBg,
    bd: T.amberBd,
    tc: '#1a1200',
  },
  {
    type: 'qte',
    label: 'QTE',
    desc: 'Touche dans le temps',
    c: T.blue,
    bg: T.blueBg,
    bd: T.blueBd,
    tc: '#ffffff',
  },
  {
    type: 'braille',
    label: 'Braille',
    desc: 'Identifier en Braille',
    c: T.purple,
    bg: T.purpleBg,
    bd: T.purpleBd,
    tc: '#ffffff',
  },
];

export const TIMER_CHIPS: { value: number; color: string; bg: string }[] = [
  { value: 3, color: '#ff7070', bg: 'rgba(255,112,112,0.18)' },
  { value: 5, color: T.orange, bg: T.orangeBg },
  { value: 10, color: T.amber, bg: T.amberBg },
  { value: 15, color: T.green, bg: T.greenBg },
  { value: 20, color: T.teal, bg: T.tealBg },
  { value: 30, color: T.blue, bg: T.blueBg },
];

export const DIFFICULTY_LABELS = ['', 'Facile', 'Modéré', 'Risqué', 'Difficile', 'Extrême'];
export const DIFFICULTY_COLORS = ['', T.green, T.teal, T.orange, T.amber, T.rose];
