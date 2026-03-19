/**
 * bloomEffect — Lueur atmosphérique et bokeh de lumière (Canvas 2D)
 *
 * Technique : canvas offscreen avec des spots lumineux (gradients radiaux),
 * flouté via ctx.filter puis composité en mode 'screen' sur le canvas principal.
 * Simule l'effet de bloom (halos sur les zones lumineuses) sans accès aux pixels
 * de la scène sous-jacente.
 *
 * v3 — Correction des "bulles de savon" :
 * - Rayon bokeh réduit (6–28px) — les halos secondaires à ×2.2 causaient
 *   des cercles de 264px visibles en mode screen.
 * - Halo secondaire limité à ×1.5 et alpha ×0.18 (était ×0.25).
 * - Blur augmenté (radius × 7) pour diffuser correctement les petits spots.
 * - Halo central atténué — n'est actif que si intensity > threshold × 0.9.
 *
 * @module utils/sceneEffects/bloomEffect
 */

import type { BloomEffectParams } from '@/types/sceneEffect';

interface BokehPoint {
  /** Position relative [0–1] */
  x: number;
  y: number;
  /** Rayon de base du spot (pixels canvas) */
  r: number;
  /** Luminosité intrinsèque [0–1] — filtrée par threshold */
  brightness: number;
  animSpeed: number;
  phase: number;
}

interface BloomRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBloomColor(color: string | undefined): { r: number; g: number; b: number } {
  if (!color) return { r: 255, g: 240, b: 200 };

  const hex = color.replace('#', '');
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };

  return { r: 255, g: 240, b: 200 };
}

function drawBokeh(
  octx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  r: number,
  alpha: number,
  rgb: { r: number; g: number; b: number }
): void {
  if (alpha < 0.004 || r < 1) return;
  const grad = octx.createRadialGradient(bx, by, 0, bx, by, r);
  grad.addColorStop(0.0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha.toFixed(3)})`);
  grad.addColorStop(0.35, `rgba(${rgb.r},${rgb.g},${rgb.b},${(alpha * 0.5).toFixed(3)})`);
  grad.addColorStop(0.75, `rgba(${rgb.r},${rgb.g},${rgb.b},${(alpha * 0.1).toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  octx.fillStyle = grad;
  octx.beginPath();
  octx.arc(bx, by, r, 0, Math.PI * 2);
  octx.fill();
}

// ── Renderer ─────────────────────────────────────────────────────────────────

export function startBloomEffect(
  canvas: HTMLCanvasElement,
  params: BloomEffectParams
): BloomRenderer {
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width;
  let h = canvas.height;
  let running = true;
  let time = 0;

  const rgb = parseBloomColor(params.color);

  // Canvas offscreen pour les sources de lumière (avant blur)
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d')!;

  // 12 bokeh points — rayon réduit (6–28px) pour éviter les halos trop larges.
  // Phases régulièrement espacées de 0 à 2π.
  const bokehPoints: BokehPoint[] = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    r: 6 + Math.random() * 22,
    brightness: 0.25 + Math.random() * 0.75,
    animSpeed: 0.06 + (i / 12) * 0.45,
    phase: (i / 12) * Math.PI * 2,
  }));

  function frame() {
    if (!running) return;

    // Courbe d'intensité non-linéaire — évite la saturation perceptuelle
    const effectiveIntensity = Math.pow(params.intensity, 0.65);

    // ── Sources lumineuses sur offscreen ───────────────────────────────
    octx.clearRect(0, 0, w, h);

    // ── Halo central conditionnel (seulement si très lumineux) ─────────
    const haloAlpha = Math.max(0, params.intensity - params.threshold * 0.9) * 0.1;
    if (haloAlpha > 0.005) {
      const cx = w * 0.5;
      const cy = h * 0.38;
      // Rayon limité à 35% de la diagonale pour ne pas couvrir toute la scène
      const haloR = Math.min(Math.max(w, h) * 0.35, 280);
      const centerGrad = octx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      centerGrad.addColorStop(0.0, `rgba(${rgb.r},${rgb.g},${rgb.b},${haloAlpha.toFixed(3)})`);
      centerGrad.addColorStop(
        0.5,
        `rgba(${rgb.r},${rgb.g},${rgb.b},${(haloAlpha * 0.3).toFixed(3)})`
      );
      centerGrad.addColorStop(1.0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      octx.fillStyle = centerGrad;
      octx.fillRect(0, 0, w, h);
    }

    // ── Passe 1 : bokeh principaux ─────────────────────────────────────
    for (const b of bokehPoints) {
      if (b.brightness < params.threshold) continue;
      const pulse = 0.5 + 0.5 * Math.sin(time * b.animSpeed + b.phase);
      const normalizedBrightness =
        (b.brightness - params.threshold) / (1 - params.threshold + 0.01);
      const alpha = effectiveIntensity * normalizedBrightness * pulse * 0.72;
      // Rayon final : bokeh de base + radius param (contribution réduite)
      const finalR = b.r * (1 + params.radius * 0.06);
      drawBokeh(octx, b.x * w, b.y * h, finalR, alpha, rgb);
    }

    // ── Passe 2 : halos secondaires (×1.5 au lieu de ×2.2 — pas de bulles) ──
    for (const b of bokehPoints) {
      if (b.brightness < params.threshold + 0.2) continue;
      const pulse = 0.5 + 0.5 * Math.sin(time * b.animSpeed * 0.7 + b.phase + Math.PI * 0.3);
      const alpha = effectiveIntensity * (b.brightness - params.threshold) * pulse * 0.18;
      drawBokeh(octx, b.x * w, b.y * h, b.r * 1.5, alpha, rgb);
    }

    // ── Passe 3 : scintillement (petits points brillants, haute fréquence) ──
    for (let i = 0; i < bokehPoints.length; i += 2) {
      const b = bokehPoints[i];
      if (b.brightness < 0.7) continue;
      const sparkle = 0.5 + 0.5 * Math.sin(time * 1.8 + b.phase * 3.1);
      const alpha = effectiveIntensity * sparkle * 0.38;
      drawBokeh(
        octx,
        b.x * w + (Math.random() - 0.5) * 6,
        b.y * h + (Math.random() - 0.5) * 6,
        b.r * 0.2,
        alpha,
        rgb
      );
    }

    // ── Composite offscreen → canvas principal (double blur) ───────────
    // Blur augmenté (radius × 7) pour diffuser des petits bokeh correctement.
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    // Passe large et douce — étale le bloom en douceur
    ctx.filter = `blur(${Math.round(params.radius * 7)}px)`;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(offscreen, 0, 0);
    // Passe nette et intense — renforce les centres lumineux
    ctx.filter = `blur(${Math.round(params.radius * 2)}px)`;
    ctx.globalAlpha = 0.65;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    time += 0.016;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop: () => {
      running = false;
      ctx.clearRect(0, 0, w, h);
    },
    resize: (nw, nh) => {
      w = nw;
      h = nh;
      offscreen.width = nw;
      offscreen.height = nh;
    },
  };
}
