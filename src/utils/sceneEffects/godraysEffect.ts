/**
 * godraysEffect — Rayons de lumière atmosphériques (Canvas 2D)
 *
 * Technique : feathering 4 passes par rayon (triangles largeur décroissante),
 * gradient 6 color stops, glow source radial, particules de poussière flottante.
 * Composite 'screen' pour un rendu additif naturel sur fond sombre.
 *
 * @module utils/sceneEffects/godraysEffect
 */

import type { GodrayEffectParams } from '@/types/sceneEffect';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Ray {
  baseAngle: number; // angle depuis la verticale (rad)
  halfWidth: number; // demi-largeur angulaire du rayon
  animSpeed: number; // vitesse d'oscillation
  phase: number; // décalage de phase individuel
  peakOpacity: number; // opacité relative (0.4–1.0)
  wobbleAmp: number; // amplitude de wobble indépendante par rayon
}

interface DustParticle {
  x: number; // position relative [0, 1]
  y: number; // position relative [0, 1]
  vx: number; // dérive très lente par frame
  vy: number;
  size: number; // rayon en px (0.5–1.5)
  alpha: number; // opacité de base
  phase: number; // décalage de scintillement
}

export interface GodraysRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(color: string): { r: number; g: number; b: number } {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  const hex = color.replace('#', '');
  if (hex.length >= 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 255, g: 224, b: 144 };
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ── Glow source ───────────────────────────────────────────────────────────────

function drawSourceGlow(
  ctx: CanvasRenderingContext2D,
  src: { x: number; y: number },
  rgb: { r: number; g: number; b: number },
  intensity: number,
  w: number,
  h: number
): void {
  const glowR = Math.max(w, h) * 0.08;
  const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, glowR);
  grad.addColorStop(0.0, `rgba(${rgb.r},${rgb.g},${rgb.b},${(intensity * 0.4).toFixed(3)})`);
  grad.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${(intensity * 0.12).toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(src.x, src.y, glowR, 0, Math.PI * 2);
  ctx.fill();
}

// ── Ray drawing (4-pass feathering) ──────────────────────────────────────────

const FEATHER_PASSES: ReadonlyArray<{ widthFactor: number; alphaFactor: number }> = [
  { widthFactor: 1.0, alphaFactor: 1.0 }, // rendu principal (large, semi-transparent)
  { widthFactor: 0.65, alphaFactor: 0.55 }, // cœur lumineux
  { widthFactor: 0.35, alphaFactor: 0.75 }, // noyau intense
  { widthFactor: 0.15, alphaFactor: 1.0 }, // fil brillant central
];

function drawRayPass(
  ctx: CanvasRenderingContext2D,
  src: { x: number; y: number },
  a1: number,
  a2: number,
  halfWidth: number,
  dist: number,
  rgb: { r: number; g: number; b: number },
  alpha: number,
  widthFactor: number,
  alphaFactor: number
): void {
  const scaledHalf = halfWidth * widthFactor;
  const center = (a1 + a2) * 0.5;
  const pa1 = center - scaledHalf;
  const pa2 = center + scaledHalf;

  const x1 = src.x + Math.cos(pa1) * dist;
  const y1 = src.y + Math.sin(pa1) * dist;
  const x2 = src.x + Math.cos(pa2) * dist;
  const y2 = src.y + Math.sin(pa2) * dist;
  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5;

  const a = alpha * alphaFactor;
  const grad = ctx.createLinearGradient(src.x, src.y, midX, midY);
  grad.addColorStop(0.0, `rgba(${rgb.r},${rgb.g},${rgb.b},${(a * 0.85).toFixed(3)})`);
  grad.addColorStop(0.12, `rgba(${rgb.r},${rgb.g},${rgb.b},${(a * 0.7).toFixed(3)})`);
  grad.addColorStop(0.28, `rgba(${rgb.r},${rgb.g},${rgb.b},${(a * 0.45).toFixed(3)})`);
  grad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${(a * 0.22).toFixed(3)})`);
  grad.addColorStop(0.75, `rgba(${rgb.r},${rgb.g},${rgb.b},${(a * 0.07).toFixed(3)})`);
  grad.addColorStop(1.0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

  ctx.beginPath();
  ctx.moveTo(src.x, src.y);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawRay(
  ctx: CanvasRenderingContext2D,
  ray: Ray,
  src: { x: number; y: number },
  rgb: { r: number; g: number; b: number },
  intensity: number,
  time: number,
  w: number,
  h: number
): void {
  const wobble = Math.sin(time * ray.animSpeed + ray.phase) * ray.wobbleAmp;
  const a1 = Math.PI / 2 + ray.baseAngle - ray.halfWidth + wobble;
  const a2 = Math.PI / 2 + ray.baseAngle + ray.halfWidth + wobble;

  const dist = Math.sqrt(w * w + h * h) * 1.3;
  const alpha = intensity * ray.peakOpacity;

  for (const pass of FEATHER_PASSES) {
    drawRayPass(
      ctx,
      src,
      a1,
      a2,
      ray.halfWidth,
      dist,
      rgb,
      alpha,
      pass.widthFactor,
      pass.alphaFactor
    );
  }
}

// ── Dust particles ────────────────────────────────────────────────────────────

const DUST_COUNT = 40;

function createDustPool(): DustParticle[] {
  return Array.from({ length: DUST_COUNT }, () => ({
    x: rand(0, 1),
    y: rand(0.1, 0.9),
    vx: rand(-0.0003, 0.0003),
    vy: rand(-0.0002, 0.0002),
    size: rand(0.5, 1.5),
    alpha: rand(0.08, 0.22),
    phase: rand(0, Math.PI * 2),
  }));
}

function drawDust(
  ctx: CanvasRenderingContext2D,
  particles: DustParticle[],
  rgb: { r: number; g: number; b: number },
  time: number,
  w: number,
  h: number
): void {
  for (const p of particles) {
    const flicker = 0.4 + 0.6 * Math.sin(time * 1.2 + p.phase);
    const opacity = p.alpha * flicker;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function moveDust(particles: DustParticle[]): void {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    // Wrap-around sur les 4 bords
    if (p.x < 0) p.x += 1;
    if (p.x > 1) p.x -= 1;
    if (p.y < 0) p.y += 1;
    if (p.y > 1) p.y -= 1;
  }
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export function startGodRaysEffect(
  canvas: HTMLCanvasElement,
  params: GodrayEffectParams
): GodraysRenderer {
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width;
  let h = canvas.height;
  let running = true;
  let time = 0;

  // Nombre de rayons : density [0.3, 1.5] → [4, 13]
  const numRays = Math.max(4, Math.round(params.density * 8 + 1));
  const rgb = hexToRgb(params.color);

  // Source lumineuse : au-dessus du canvas, X déterminé par l'angle
  const getSource = (): { x: number; y: number } => ({
    x: w * 0.5 + (params.angle / 90) * w * 0.42,
    y: -h * 0.12,
  });

  // Éventail de rayons distribués (~100° d'ouverture)
  const rays: Ray[] = Array.from({ length: numRays }, (_, i) => ({
    baseAngle: -Math.PI * 0.28 + (i / Math.max(numRays - 1, 1)) * Math.PI * 0.56,
    halfWidth: rand(0.016, 0.04),
    animSpeed: rand(0.2, 0.45),
    phase: rand(0, Math.PI * 2),
    peakOpacity: rand(0.35, 1.0),
    wobbleAmp: 0.008 + Math.random() * 0.022,
  }));

  const dust = createDustPool();

  function frame(): void {
    if (!running) return;

    ctx.clearRect(0, 0, w, h);
    const src = getSource();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Glow à la source (avant les rayons)
    drawSourceGlow(ctx, src, rgb, params.intensity, w, h);

    // 2. Rayons avec feathering 4 passes
    for (const ray of rays) {
      drawRay(ctx, ray, src, rgb, params.intensity, time, w, h);
    }

    // 3. Particules de poussière (très faible alpha)
    ctx.globalAlpha = 0.6;
    drawDust(ctx, dust, rgb, time, w, h);

    ctx.restore();

    // 4. Mise à jour des particules après le restore (hors composite 'screen')
    moveDust(dust);

    time += 0.016;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop: () => {
      running = false;
      ctx.clearRect(0, 0, w, h);
    },
    resize: (nw: number, nh: number) => {
      w = nw;
      h = nh;
    },
  };
}
