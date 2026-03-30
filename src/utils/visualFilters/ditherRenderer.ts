/**
 * ditherRenderer — Overlay Bayer 4×4 dithering via Canvas 2D
 *
 * Génère un canvas de pattern Bayer 4×4 en overlay — simule la quantification
 * de couleurs par ordered dithering sans lire les pixels sous-jacents.
 *
 * Technique : le pattern Bayer est un threshold map. En overlay avec blend-mode
 * approprié, il simule l'aspect pixel-art / Game Boy sans pixel-reading.
 *
 * Palettes disponibles :
 * - 'auto'    → pattern Bayer pur (gris, révèle la grille sous-jacente)
 * - 'gameboy' → 4 nuances de vert Game Boy DMG
 * - 'cga'     → bleu/cyan CGA 16 couleurs (palette 1)
 * - 'snes'    → teinté SNES (warm beige + dégradé)
 *
 * Le rendu est statique (pas d'animation) — la grille est dessinée une fois
 * et répétée via createPattern() sur tout le canvas.
 *
 * @module utils/visualFilters/ditherRenderer
 */

import type { DitherParams } from '@/types/visualFilter';

// Matrice Bayer 4×4 normalisée (0–15)
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Palettes Game Boy DMG (vert phosphore)
const PALETTE_GAMEBOY = [
  [15, 56, 15], // #0f380f — noir
  [48, 98, 48], // #306230 — vert foncé
  [139, 172, 15], // #8bac0f — vert moyen
  [155, 188, 15], // #9bbc0f — vert clair
];

// Palette CGA Mode 1 (bleu/cyan/magenta/blanc)
const PALETTE_CGA = [
  [0, 0, 0], // noir
  [0, 170, 170], // cyan
  [170, 0, 170], // magenta
  [170, 170, 170], // gris clair
  [0, 0, 170], // bleu
  [0, 170, 0], // vert
  [170, 0, 0], // rouge
  [170, 85, 0], // marron
  [85, 85, 85], // gris foncé
  [85, 85, 255], // bleu clair
  [85, 255, 85], // vert clair
  [85, 255, 255], // cyan clair
  [255, 85, 85], // rouge clair
  [255, 85, 255], // magenta clair
  [255, 255, 85], // jaune
  [255, 255, 255], // blanc
];

function buildBayerPattern(
  size: number,
  palette: DitherParams['palette'],
  levels: number,
  opacity: number
): HTMLCanvasElement {
  const TILE = 4; // taille du pattern Bayer (4×4)
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = TILE;
  tileCanvas.height = TILE;
  const ctx = tileCanvas.getContext('2d')!;
  const imgData = ctx.createImageData(TILE, TILE);
  const d = imgData.data;

  for (let i = 0; i < TILE * TILE; i++) {
    // threshold normalisé 0–1
    const threshold = BAYER_4X4[i] / 16;
    // quantifier selon le nombre de niveaux
    const level = Math.floor(threshold * levels) / (levels - 1 || 1);
    const alpha = Math.round(level * opacity * 255);

    let r = 128,
      g = 128,
      b = 128;

    if (palette === 'gameboy') {
      const idx = Math.floor(threshold * 4) % 4;
      [r, g, b] = PALETTE_GAMEBOY[idx];
    } else if (palette === 'cga') {
      const idx = Math.floor(threshold * 16) % 16;
      [r, g, b] = PALETTE_CGA[idx];
    } else if (palette === 'snes') {
      // Teinté chaud SNES — beige doré
      r = Math.round(180 + threshold * 75);
      g = Math.round(150 + threshold * 60);
      b = Math.round(100 + threshold * 30);
    } else {
      // auto — niveaux de gris
      const gray = Math.round(threshold * 255);
      r = gray;
      g = gray;
      b = gray;
    }

    const o = i * 4;
    d[o] = r;
    d[o + 1] = g;
    d[o + 2] = b;
    d[o + 3] = alpha;
  }

  ctx.putImageData(imgData, 0, 0);

  // Mettre à l'échelle le pattern selon size
  if (size <= 1) return tileCanvas;

  const scaled = document.createElement('canvas');
  scaled.width = TILE * size;
  scaled.height = TILE * size;
  const sCtx = scaled.getContext('2d')!;
  sCtx.imageSmoothingEnabled = false;
  sCtx.drawImage(tileCanvas, 0, 0, scaled.width, scaled.height);
  return scaled;
}

export interface DitherHandle {
  stop: () => void;
  resize: (w: number, h: number) => void;
  update: (params: DitherParams) => void;
}

export function startDither(canvas: HTMLCanvasElement, params: DitherParams): DitherHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop: () => {}, resize: () => {}, update: () => {} };

  let currentParams = { ...params };

  function redraw() {
    const { width, height } = canvas;
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);

    const size = 1; // taille du pixel dither (1 = natif)
    const patternTile = buildBayerPattern(
      size,
      currentParams.palette,
      currentParams.levels,
      currentParams.opacity
    );
    const pattern = ctx.createPattern(patternTile, 'repeat');
    if (!pattern) return;

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }

  redraw();

  return {
    stop: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    resize: (w, h) => {
      canvas.width = w;
      canvas.height = h;
      redraw();
    },
    update: (newParams) => {
      currentParams = { ...newParams };
      redraw();
    },
  };
}
