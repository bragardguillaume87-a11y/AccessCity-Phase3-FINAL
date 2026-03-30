/**
 * visualFilter — Filtres visuels post-processing pour l'aperçu
 *
 * Stocké globalement dans settingsStore.projectSettings.visualFilter.
 * Rendu via <VisualFilterLayer> qui enveloppe PreviewPlayer et GamePreview.
 *
 * Architecture : overlays CSS + Canvas 2D (sans lecture de pixels).
 * - scanlines / vignette / flicker → CSS (divs, box-shadow, opacity)
 * - filmGrain → Canvas 2D noise animé
 * - crt → Canvas 2D (wave + chromatic aberration)
 * - dither → Canvas 2D Bayer 4×4 quantization overlay
 *
 * @module types/visualFilter
 */

// ============================================================================
// PARAMS PAR FILTRE
// ============================================================================

export interface ScanlinesParams {
  /** Opacité des scanlines (0.05–0.55, défaut 0.18) */
  opacity: number;
  /** Espacement entre lignes en px (2–8, défaut 3) */
  spacing: number;
  /** Épaisseur de la ligne sombre en px (1–4, défaut 1) */
  thickness: number;
}

export interface VignetteParams {
  /** Intensité de la vignette (0.1–0.9, défaut 0.45) */
  intensity: number;
  /** Douceur du dégradé (0.1–0.9, défaut 0.55) */
  softness: number;
  /** Teinte de la vignette (hex #rrggbb, défaut '#000000') */
  color: string;
}

export interface FilmGrainParams {
  /** Intensité du grain (0.02–0.25, défaut 0.08) */
  intensity: number;
  /** Taille des grains en px (1–3, défaut 1) */
  size: number;
  /** Fréquence d'animation en Hz (8–30, défaut 18) */
  fps: number;
}

export interface CRTBalatrParams {
  /**
   * Intensité de la distorsion barrel/wave (0 = aucune, 0.1–0.5, défaut 0.18).
   * Simule la courbure de l'écran CRT.
   */
  warp: number;
  /**
   * Intensité de l'aberration chromatique (0–6px, défaut 1.5).
   * Décale les canaux R et B horizontalement.
   */
  caIntensity: number;
  /** Scintillement (flicker) de l'écran — amplitude (0 = off, 0.02–0.1, défaut 0.03) */
  flickerAmp: number;
}

export interface DitherParams {
  /**
   * Nombre de niveaux de quantification par canal (2–16, défaut 4).
   * 2 = 8 couleurs total, 4 = 64 couleurs, 16 = full color.
   */
  levels: number;
  /** Opacité de l'overlay dithering (0.1–0.8, défaut 0.35) */
  opacity: number;
  /**
   * Palette cible :
   * 'auto'    → quantification pure (réduit les niveaux du signal)
   * 'gameboy' → 4 nuances de vert #0f380f / #306230 / #8bac0f / #9bbc0f
   * 'cga'     → palette CGA 16 couleurs
   * 'snes'    → 32768 couleurs SNES (15-bit)
   */
  palette: 'auto' | 'gameboy' | 'cga' | 'snes';
}

// ============================================================================
// CONFIG GLOBALE
// ============================================================================

export interface VisualFilterConfig {
  /** Activer/désactiver tout le système de filtres */
  enabled: boolean;

  scanlines: {
    enabled: boolean;
    params: ScanlinesParams;
  };

  vignette: {
    enabled: boolean;
    params: VignetteParams;
  };

  filmGrain: {
    enabled: boolean;
    params: FilmGrainParams;
  };

  crt: {
    enabled: boolean;
    params: CRTBalatrParams;
  };

  dither: {
    enabled: boolean;
    params: DitherParams;
  };
}
