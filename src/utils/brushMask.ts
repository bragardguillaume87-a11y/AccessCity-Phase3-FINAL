/**
 * brushMask.ts — Utilitaires de correction par pinceau pour BgRemovalDialog
 *
 * Pattern : deux Uint8Array (keepMask / removeMask) pour noter les zones peintes.
 * `applyMasks()` compose le résultat final pixel par pixel (~1–3ms à 720p en V8).
 *
 * @module utils/brushMask
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type BrushMode = 'keep' | 'remove';

export interface BrushMasks {
  keepMask: Uint8Array; // 255 = pixel forcé opaque   (conserver)
  removeMask: Uint8Array; // 255 = pixel forcé transparent (effacer)
  width: number;
  height: number;
}

// ── Création ───────────────────────────────────────────────────────────────

export function createEmptyMasks(width: number, height: number): BrushMasks {
  return {
    keepMask: new Uint8Array(width * height),
    removeMask: new Uint8Array(width * height),
    width,
    height,
  };
}

export function cloneMasks(masks: BrushMasks): BrushMasks {
  return {
    keepMask: masks.keepMask.slice(),
    removeMask: masks.removeMask.slice(),
    width: masks.width,
    height: masks.height,
  };
}

// ── Peinture du pinceau ────────────────────────────────────────────────────

/**
 * Peint un cercle de pinceau dans les masques.
 *
 * @param masks     - Masques à modifier (en place)
 * @param cx        - Centre X en pixels image (coordonnées naturelles)
 * @param cy        - Centre Y en pixels image (coordonnées naturelles)
 * @param radius    - Rayon du pinceau en pixels image
 * @param mode      - 'keep' ou 'remove'
 */
export function paintBrush(
  masks: BrushMasks,
  cx: number,
  cy: number,
  radius: number,
  mode: BrushMode
): void {
  const { keepMask, removeMask, width, height } = masks;
  const r2 = radius * radius;

  const xMin = Math.max(0, Math.floor(cx - radius));
  const xMax = Math.min(width - 1, Math.ceil(cx + radius));
  const yMin = Math.max(0, Math.floor(cy - radius));
  const yMax = Math.min(height - 1, Math.ceil(cy + radius));

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = y * width + x;
        if (mode === 'keep') {
          keepMask[idx] = 255;
          removeMask[idx] = 0; // les deux masques sont mutuellement exclusifs
        } else {
          removeMask[idx] = 255;
          keepMask[idx] = 0;
        }
      }
    }
  }
}

/**
 * Peint un trait entre deux points (interpolation linéaire) pour un tracé continu.
 */
export function paintStroke(
  masks: BrushMasks,
  from: { x: number; y: number },
  to: { x: number; y: number },
  radius: number,
  mode: BrushMode,
  steps = 20
): void {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    paintBrush(masks, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius, mode);
  }
}

// ── Composition ────────────────────────────────────────────────────────────

/**
 * Compose le résultat final en appliquant keepMask et removeMask sur resultImageData.
 *
 * - keepMask[i] > 0  → restaure le pixel original (alpha = 255)
 * - removeMask[i] > 0 → efface le pixel (alpha = 0)
 * - sinon → garde le pixel du résultat tel quel
 *
 * @returns Nouveau ImageData (ne modifie pas les données d'entrée)
 */
export function applyMasks(result: ImageData, original: ImageData, masks: BrushMasks): ImageData {
  const len = result.width * result.height;
  const out = new Uint8ClampedArray(result.data);

  const { keepMask, removeMask } = masks;

  for (let i = 0; i < len; i++) {
    const o = i * 4;
    if (keepMask[i] > 0) {
      // Restaurer le pixel original en entier
      out[o] = original.data[o];
      out[o + 1] = original.data[o + 1];
      out[o + 2] = original.data[o + 2];
      out[o + 3] = 255;
    } else if (removeMask[i] > 0) {
      // Effacer complètement
      out[o + 3] = 0;
    }
    // sinon : conserver le pixel du résultat d'origine (déjà copié dans `out`)
  }

  return new ImageData(out, result.width, result.height);
}

// ── Rendu de l'overlay canvas ──────────────────────────────────────────────

/**
 * Rend les masques keepMask / removeMask sous forme de couleurs semi-transparentes
 * dans le CanvasRenderingContext2D fourni.
 * Utiliser sur un canvas overlay (séparé du canvas résultat).
 */
export function renderMaskOverlay(ctx: CanvasRenderingContext2D, masks: BrushMasks): void {
  const { keepMask, removeMask, width, height } = masks;
  const img = ctx.createImageData(width, height);
  const d = img.data;

  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    if (keepMask[i] > 0) {
      d[o] = 0;
      d[o + 1] = 200;
      d[o + 2] = 80;
      d[o + 3] = 140; // vert semi-transparent
    } else if (removeMask[i] > 0) {
      d[o] = 220;
      d[o + 1] = 0;
      d[o + 2] = 0;
      d[o + 3] = 140; // rouge semi-transparent
    }
  }

  ctx.putImageData(img, 0, 0);
}
