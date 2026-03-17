/**
 * godraysEffect — Rayons de lumière atmosphériques (Canvas 2D)
 *
 * Technique : triangles fins depuis une source lumineuse hors-écran (au-dessus
 * du canvas), remplis par un gradient linéaire source→transparent.
 * Composite 'screen' pour un rendu additif naturel sur fond sombre.
 *
 * @module utils/sceneEffects/godraysEffect
 */

import type { GodrayEffectParams } from '@/types/sceneEffect';

interface Ray {
  baseAngle: number; // angle depuis la verticale (rad), distribution uniforme
  halfWidth: number; // demi-largeur angulaire du rayon
  animSpeed: number; // vitesse d'oscillation
  phase: number; // décalage de phase
  peakOpacity: number; // opacité relative (0.4–1.0)
}

interface GodraysRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(color: string): { r: number; g: number; b: number } {
  // Supporte #rrggbb et rgba(r,g,b,a)
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

// ── Renderer ─────────────────────────────────────────────────────────────────

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
  // angle=0 → centre, angle=-90 → gauche, angle=+90 → droite
  const getSource = () => ({
    x: w * 0.5 + (params.angle / 90) * w * 0.42,
    y: -h * 0.12,
  });

  // Rayons distribués en éventail vers le bas (~100° d'ouverture)
  // Chaque rayon a un angle de base dans cet éventail
  const rays: Ray[] = Array.from({ length: numRays }, (_, i) => ({
    baseAngle: -Math.PI * 0.28 + (i / (numRays - 1)) * Math.PI * 0.56,
    halfWidth: 0.016 + Math.random() * 0.024,
    animSpeed: 0.2 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
    peakOpacity: 0.35 + Math.random() * 0.65,
  }));

  function drawRay(ray: Ray, src: { x: number; y: number }) {
    const wobble = Math.sin(time * ray.animSpeed + ray.phase) * 0.018;
    const a1 = Math.PI / 2 + ray.baseAngle - ray.halfWidth + wobble;
    const a2 = Math.PI / 2 + ray.baseAngle + ray.halfWidth + wobble;

    // Prolonger jusqu'au bord du canvas (diagonale × 1.3 suffit)
    const dist = Math.sqrt(w * w + h * h) * 1.3;
    const x1 = src.x + Math.cos(a1) * dist;
    const y1 = src.y + Math.sin(a1) * dist;
    const x2 = src.x + Math.cos(a2) * dist;
    const y2 = src.y + Math.sin(a2) * dist;

    // Centre du triangle (pour le gradient)
    const midX = (x1 + x2) * 0.5;
    const midY = (y1 + y2) * 0.5;

    const alpha = params.intensity * ray.peakOpacity;
    const grad = ctx.createLinearGradient(src.x, src.y, midX, midY);
    grad.addColorStop(0.0, `rgba(${rgb.r},${rgb.g},${rgb.b},${(alpha * 0.75).toFixed(3)})`);
    grad.addColorStop(0.35, `rgba(${rgb.r},${rgb.g},${rgb.b},${(alpha * 0.35).toFixed(3)})`);
    grad.addColorStop(1.0, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    const src = getSource();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const ray of rays) drawRay(ray, src);
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
    },
  };
}
