/**
 * spriteCanvas.ts — Utilitaires canvas pour le rendu de sprites
 *
 * Deux variantes :
 * - `drawSpriteFrame`      : stretch (1 frame → canvas entier), utilisé pour previews fixes
 * - `drawSpriteFrameCover` : object-fit cover (centré + rogné), utilisé dans les listes
 *
 * Partagé entre SpriteImportDialog, SpritesPanel et ObjectsPanel.
 */

import type { SpriteSheetConfig } from '@/types/sprite';

// ── Variante stretch (SpriteImportDialog + SpritesPanel) ──────────────────────

/**
 * Dessine un frame (avec flipX optionnel) sur un canvas 2D.
 * Le frame est étiré pour remplir toute la surface du canvas.
 *
 * @param canvas  Canvas cible
 * @param img     Image source chargée
 * @param frameIdx Index global du frame dans le spritesheet
 * @param cols    Nombre de colonnes du spritesheet
 * @param frameW  Largeur d'un frame en pixels
 * @param frameH  Hauteur d'un frame en pixels
 * @param flipX   Miroir horizontal (défaut : false)
 */
export function drawSpriteFrame(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  frameIdx: number,
  cols: number,
  frameW: number,
  frameH: number,
  flipX = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const col = frameIdx % Math.max(1, cols);
  const row = Math.floor(frameIdx / Math.max(1, cols));
  if (flipX) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
  } else {
    ctx.drawImage(
      img,
      col * frameW,
      row * frameH,
      frameW,
      frameH,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
}

// ── Idle frame (ObjectsPanel + SpritesPanel) ──────────────────────────────────

/**
 * Retourne la position (col, row) du premier frame idle disponible dans le spritesheet.
 * Priorité : idle_down > idle_up > walk_down > walk_up > {0, 0}.
 */
export function getIdleFramePos(config: SpriteSheetConfig): { col: number; row: number } {
  const PRIO = ['idle_down', 'idle_up', 'walk_down', 'walk_up'] as const;
  for (const tag of PRIO) {
    const anim = config.animations[tag as keyof typeof config.animations];
    if (anim?.frames?.length) {
      const frameIdx = anim.frames[0];
      return {
        col: frameIdx % Math.max(1, config.cols),
        row: Math.floor(frameIdx / Math.max(1, config.cols)),
      };
    }
  }
  return { col: 0, row: 0 };
}

// ── Variante cover (ObjectsPanel) ─────────────────────────────────────────────

/**
 * Dessine un frame avec mise à l'échelle "object-fit: cover" (centré + rogné).
 * Le frame remplit le canvas sans déformation mais peut être rogné sur les bords.
 *
 * @param canvas  Canvas cible
 * @param img     Image source chargée
 * @param col     Colonne du frame dans le spritesheet
 * @param row     Ligne du frame dans le spritesheet
 * @param cfg     Configuration du spritesheet (frameW, frameH)
 * @param flipX   Miroir horizontal (défaut : false)
 */
export function drawSpriteFrameCover(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  col: number,
  row: number,
  cfg: SpriteSheetConfig,
  flipX = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const cw = canvas.width;
  const ch = canvas.height;
  const fw = cfg.frameW;
  const fh = cfg.frameH;

  const scale = Math.max(cw / fw, ch / fh);
  const dw = fw * scale;
  const dh = fh * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  const sx = col * fw;
  const sy = row * fh;

  if (flipX) {
    ctx.save();
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, fw, fh, -dx - dw, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, fw, fh, dx, dy, dw, dh);
  }
}
