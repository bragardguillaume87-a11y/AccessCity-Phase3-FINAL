/**
 * visualFilters — Defaults et presets pour le système de filtres visuels
 *
 * Suit le même pattern que sceneEffects.ts (metadata + defaults + factory).
 *
 * @module config/visualFilters
 */

import type {
  VisualFilterConfig,
  ScanlinesParams,
  VignetteParams,
  FilmGrainParams,
  CRTBalatrParams,
  DitherParams,
} from '@/types/visualFilter';

// ============================================================================
// DEFAULTS PAR FILTRE
// ============================================================================

export const SCANLINES_DEFAULTS: ScanlinesParams = {
  opacity: 0.18,
  spacing: 3,
  thickness: 1,
};

export const VIGNETTE_DEFAULTS: VignetteParams = {
  intensity: 0.45,
  softness: 0.55,
  color: '#000000',
};

export const FILM_GRAIN_DEFAULTS: FilmGrainParams = {
  intensity: 0.08,
  size: 1,
  fps: 18,
};

export const CRT_DEFAULTS: CRTBalatrParams = {
  warp: 0.18,
  caIntensity: 1.5,
  flickerAmp: 0.03,
};

export const DITHER_DEFAULTS: DitherParams = {
  levels: 4,
  opacity: 0.35,
  palette: 'auto',
};

// ============================================================================
// CONFIG PAR DÉFAUT (tous désactivés)
// ============================================================================

export const DEFAULT_VISUAL_FILTER: VisualFilterConfig = {
  enabled: false,
  scanlines: { enabled: false, params: SCANLINES_DEFAULTS },
  vignette: { enabled: false, params: VIGNETTE_DEFAULTS },
  filmGrain: { enabled: false, params: FILM_GRAIN_DEFAULTS },
  crt: { enabled: false, params: CRT_DEFAULTS },
  dither: { enabled: false, params: DITHER_DEFAULTS },
};

// ============================================================================
// PRESETS
// ============================================================================

export interface VisualFilterPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  config: VisualFilterConfig;
}

export const VISUAL_FILTER_PRESETS: VisualFilterPreset[] = [
  {
    id: 'off',
    label: 'Aucun',
    emoji: '✨',
    description: 'Affichage propre sans filtre',
    config: DEFAULT_VISUAL_FILTER,
  },
  {
    id: 'subtle',
    label: 'Subtil',
    emoji: '🎞',
    description: 'Grain léger + vignette douce',
    config: {
      enabled: true,
      scanlines: { enabled: false, params: SCANLINES_DEFAULTS },
      vignette: { enabled: true, params: { intensity: 0.28, softness: 0.6, color: '#000000' } },
      filmGrain: { enabled: true, params: { intensity: 0.05, size: 1, fps: 18 } },
      crt: { enabled: false, params: CRT_DEFAULTS },
      dither: { enabled: false, params: DITHER_DEFAULTS },
    },
  },
  {
    id: 'crt-balatro',
    label: 'CRT Balatro',
    emoji: '📺',
    description: 'Écran CRT arcade : scanlines, courbure, aberration chromatique',
    config: {
      enabled: true,
      scanlines: { enabled: true, params: { opacity: 0.22, spacing: 3, thickness: 1 } },
      vignette: { enabled: true, params: { intensity: 0.5, softness: 0.45, color: '#000000' } },
      filmGrain: { enabled: false, params: FILM_GRAIN_DEFAULTS },
      crt: { enabled: true, params: { warp: 0.18, caIntensity: 1.5, flickerAmp: 0.03 } },
      dither: { enabled: false, params: DITHER_DEFAULTS },
    },
  },
  {
    id: 'cinema',
    label: 'Cinéma',
    emoji: '🎬',
    description: 'Grain pellicule + vignette intense',
    config: {
      enabled: true,
      scanlines: { enabled: false, params: SCANLINES_DEFAULTS },
      vignette: { enabled: true, params: { intensity: 0.62, softness: 0.5, color: '#000000' } },
      filmGrain: { enabled: true, params: { intensity: 0.14, size: 1, fps: 24 } },
      crt: { enabled: false, params: CRT_DEFAULTS },
      dither: { enabled: false, params: DITHER_DEFAULTS },
    },
  },
  {
    id: 'retro',
    label: 'Rétro',
    emoji: '👾',
    description: 'Dithering Bayer palette Game Boy + scanlines',
    config: {
      enabled: true,
      scanlines: { enabled: true, params: { opacity: 0.28, spacing: 4, thickness: 2 } },
      vignette: { enabled: true, params: { intensity: 0.35, softness: 0.5, color: '#000000' } },
      filmGrain: { enabled: false, params: FILM_GRAIN_DEFAULTS },
      crt: { enabled: false, params: CRT_DEFAULTS },
      dither: { enabled: true, params: { levels: 4, opacity: 0.45, palette: 'gameboy' } },
    },
  },
];
