/**
 * bloomEffect — Lueur atmosphérique et bokeh de lumière (Canvas 2D)
 *
 * Technique : canvas offscreen avec des spots lumineux (gradients radiaux),
 * flouté via ctx.filter puis composité en mode 'screen' sur le canvas principal.
 * Simule l'effet de bloom (halos sur les zones lumineuses) sans accès aux pixels
 * de la scène sous-jacente.
 *
 * @module utils/sceneEffects/bloomEffect
 */

import type { BloomEffectParams } from '@/types/sceneEffect';

interface BokehPoint {
  /** Position relative [0–1] */
  x: number;
  y: number;
  /** Rayon de base du spot */
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

  // Canvas offscreen pour les sources de lumière (avant blur)
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d')!;

  // Points de bokeh distribués aléatoirement (positions relatives)
  const bokehPoints: BokehPoint[] = Array.from({ length: 9 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 40 + Math.random() * 80,
    brightness: 0.3 + Math.random() * 0.7,
    animSpeed: 0.25 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }));

  function frame() {
    if (!running) return;

    // ── Sources lumineuses sur offscreen ───────────────────────────────
    octx.clearRect(0, 0, w, h);

    // Lueur centrale douce (halo général)
    const cx = w * 0.5;
    const cy = h * 0.4;
    const centerGrad = octx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
    centerGrad.addColorStop(0.0, `rgba(255,245,220,${(params.intensity * 0.18).toFixed(3)})`);
    centerGrad.addColorStop(0.5, `rgba(255,245,220,${(params.intensity * 0.06).toFixed(3)})`);
    centerGrad.addColorStop(1.0, 'rgba(255,245,220,0)');
    octx.fillStyle = centerGrad;
    octx.fillRect(0, 0, w, h);

    // Spots bokeh pulsants
    for (const b of bokehPoints) {
      if (b.brightness < params.threshold) continue;
      const pulse = 0.5 + 0.5 * Math.sin(time * b.animSpeed + b.phase);
      const alpha =
        ((params.intensity * (b.brightness - params.threshold)) / (1 - params.threshold + 0.01)) *
        pulse;
      const r = b.r * (1 + params.radius * 0.15);
      const bx = b.x * w;
      const by = b.y * h;
      const grad = octx.createRadialGradient(bx, by, 0, bx, by, r);
      grad.addColorStop(0.0, `rgba(255,248,210,${(alpha * 0.7).toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(255,240,180,${(alpha * 0.25).toFixed(3)})`);
      grad.addColorStop(1.0, 'rgba(255,240,180,0)');
      octx.fillStyle = grad;
      octx.beginPath();
      octx.arc(bx, by, r, 0, Math.PI * 2);
      octx.fill();
    }

    // ── Composite offscreen → canvas principal avec blur ───────────────
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.filter = `blur(${Math.round(params.radius * 3)}px)`;
    ctx.globalCompositeOperation = 'screen';
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
