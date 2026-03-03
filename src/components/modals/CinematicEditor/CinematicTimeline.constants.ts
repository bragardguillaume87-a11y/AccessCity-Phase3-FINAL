/**
 * CinematicTimeline.constants.ts — Constantes et helpers partagés entre les composants
 * de la timeline multi-pistes (CinematicTimeline, CinematicTrackLane, CinematicTrackBlock).
 */
import type { CinematicEvent, CinematicEventType, CinematicTrackId } from '@/types/cinematic';
import { getEventDurationMs } from '@/types/cinematic';

// ── Layout ────────────────────────────────────────────────────────────────────

export const TRACK_LABEL_WIDTH = 96;   // Largeur de la colonne labels fixe (px)
export const MIN_BLOCK_PX      = 56;   // Largeur minimale d'un bloc (px)
export const BLOCK_HEIGHT_PX   = 36;   // Hauteur d'un bloc dans la piste (px)
export const LANE_PADDING_Y    = 6;    // Padding haut/bas de chaque piste (px)
export const RULER_HEIGHT_PX   = 22;   // Hauteur de la règle temporelle (px)
export const TOOLBAR_HEIGHT_PX = 44;   // Hauteur de la barre d'outils (px)

/** Hauteur d'une piste (bloc + padding × 2) */
export const LANE_HEIGHT_PX = LANE_PADDING_Y * 2 + BLOCK_HEIGHT_PX;

// ── Zoom ──────────────────────────────────────────────────────────────────────

export const ZOOM_LEVELS = [0.06, 0.12, 0.22, 0.40, 0.70] as const; // px/ms
export const DEFAULT_ZOOM = 2;  // Index dans ZOOM_LEVELS (0.22 px/ms = 100%)

// ── Block colors ──────────────────────────────────────────────────────────────

export const BLOCK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  fade:                { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  flash:               { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  screenShake:         { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  vignette:            { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  tint:                { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  zoom:                { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  letterbox:           { bg: '#4c1d95', border: '#7c3aed', text: '#ede9fe' },
  characterEnter:      { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterExit:       { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterMove:       { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterExpression: { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  characterShake:      { bg: '#1e3a8a', border: '#3b82f6', text: '#dbeafe' },
  sfx:                 { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  bgm:                 { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  bgmStop:             { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  ambiance:            { bg: '#064e3b', border: '#059669', text: '#d1fae5' },
  dialogue:            { bg: '#78350f', border: '#d97706', text: '#fef3c7' },
  wait:                { bg: '#111827', border: '#4b5563', text: '#d1d5db' },
  background:          { bg: '#831843', border: '#db2777', text: '#fce7f3' },
  titleCard:           { bg: '#831843', border: '#db2777', text: '#fce7f3' },
};

export const FALLBACK_COLOR = { bg: '#1f2937', border: '#374151', text: '#f3f4f6' };

// ── Event types allowed per track ─────────────────────────────────────────────

/** Types d'événements autorisés par canal — filtre le EventPicker de chaque piste */
export const TRACK_EVENT_TYPES: Record<CinematicTrackId, CinematicEventType[]> = {
  background: ['background', 'fade', 'tint', 'zoom', 'letterbox'],
  effects:    ['flash', 'screenShake', 'vignette', 'titleCard'],
  characters: ['characterEnter', 'characterExit', 'characterMove', 'characterExpression', 'characterShake'],
  audio:      ['sfx', 'bgm', 'bgmStop', 'ambiance'],
  dialogue:   ['dialogue', 'wait'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getBlockWidth(event: CinematicEvent, pxPerMs: number): number {
  return Math.max(MIN_BLOCK_PX, getEventDurationMs(event) * pxPerMs);
}

export function formatMs(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m${(s % 60).toFixed(0)}s`;
}

export function getRulerInterval(pxPerMs: number): number {
  if (pxPerMs < 0.08) return 5000;
  if (pxPerMs < 0.18) return 2000;
  if (pxPerMs < 0.35) return 1000;
  if (pxPerMs < 0.65) return 500;
  return 200;
}
