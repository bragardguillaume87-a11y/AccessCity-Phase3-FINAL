/**
 * filmGrainRenderer — Grain de pellicule animé via Canvas 2D
 *
 * Génère un bruit blanc aléatoire chaque frame à la fréquence `fps` configurée.
 * L'overlay est dessiné en mode 'screen' (ne noircit pas l'image, ajoute seulement
 * de la luminosité aléatoire — reproduit l'aspect argentique).
 *
 * @module utils/visualFilters/filmGrainRenderer
 */

import type { FilmGrainParams } from '@/types/visualFilter';

export interface FilmGrainHandle {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

/**
 * Démarre le rendu de grain sur le canvas fourni.
 * Le canvas doit être positionné en overlay (position:absolute, pointer-events:none).
 */
export function startFilmGrain(
  canvas: HTMLCanvasElement,
  params: FilmGrainParams
): FilmGrainHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop: () => {}, resize: () => {} };

  let running = true;
  let lastFrameTime = 0;
  const frameDuration = 1000 / params.fps;
  let rafId: number;

  function renderFrame(now: number) {
    if (!running) return;

    if (now - lastFrameTime >= frameDuration) {
      lastFrameTime = now;

      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Utiliser un grain "grossier" si size > 1 (plus rapide que pixel-par-pixel)
      const step = Math.max(1, Math.round(params.size));
      const grainOpacity = Math.min(1, params.intensity);

      // ImageData directe pour perf maximale
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const noise = (Math.random() * 255) | 0;
          const alpha = (grainOpacity * 255) | 0;

          for (let dy = 0; dy < step && y + dy < height; dy++) {
            for (let dx = 0; dx < step && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              data[idx] = noise;
              data[idx + 1] = noise;
              data[idx + 2] = noise;
              data[idx + 3] = alpha;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    rafId = requestAnimationFrame(renderFrame);
  }

  rafId = requestAnimationFrame(renderFrame);

  return {
    stop: () => {
      running = false;
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    resize: (w, h) => {
      canvas.width = w;
      canvas.height = h;
    },
  };
}
