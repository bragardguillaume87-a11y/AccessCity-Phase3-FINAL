/**
 * rainEffect — Renderer Canvas 2D pour la pluie, la bruine et la neige
 *
 * Pluie : streaks inclinés + système d'éclaboussures réalistes (arc particles au sol).
 * Bruine : micro-streaks courts, quasi-horizontaux, très faible opacité.
 * Neige  : flocons circulaires avec dérive sinusoïdale.
 *
 * @module utils/sceneEffects/rainEffect
 */

import type {
  RainEffectParams,
  DrizzleEffectParams,
  SnowEffectParams,
  CharacterHitbox,
} from '@/types/sceneEffect';

/** Ref mutable partagée avec SceneEffectCanvas — lue à chaque frame sans restart */
type HitboxesRef = { current: CharacterHitbox[] };

// ── Types internes ────────────────────────────────────────────────────────────

interface Drop {
  x: number;
  y: number;
  speed: number;
  /** Longueur du streak (pluie/bruine) ou rayon (neige) */
  size: number;
  drift: number;
  /** Empêche de spawner plusieurs splash par passage au sol */
  landed: boolean;
  /** Opacité individuelle — variation stochastique 0.5–1.0 */
  opacity: number;
  /** Épaisseur du trait — utilisée par la bruine (lineWidth variable) */
  width: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  maxLife: number; // frames
  radius: number;
}

interface RainRenderer {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Extrait {r,g,b} depuis une couleur rgba(...) ou hex.
 * Utilisé pour les particules de splash (alpha variable).
 */
function parseColorRgb(color: string): { r: number; g: number; b: number } {
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
  return { r: 160, g: 200, b: 255 };
}

const MAX_SPLASHES = 250;

// ── PLUIE ─────────────────────────────────────────────────────────────────────

export function startRainEffect(
  canvas: HTMLCanvasElement,
  params: RainEffectParams,
  hitboxesRef?: HitboxesRef
): RainRenderer {
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width;
  let h = canvas.height;
  let running = true;

  const splashScale = params.splashScale ?? 1.0;
  const groundLevel = params.groundLevel ?? 0.82;
  const splashEnabled = splashScale > 0;
  const rgb = parseColorRgb(params.color);

  const angleRad = (params.angle * Math.PI) / 180;
  const driftX = Math.sin(angleRad);
  const driftY = Math.cos(angleRad);

  const drops: Drop[] = Array.from({ length: params.density }, () => {
    const size = rand(params.length * 0.6, params.length * 1.4);
    return {
      x: rand(-50, w + 50),
      y: rand(-h, h),
      speed: rand(12, 22),
      size,
      drift: 0,
      landed: false,
      opacity: rand(0.6, 1.0),
      width: 0.8 + (size / params.length) * 0.8,
    };
  });

  // Pool partagé : éclaboussures au sol + micro-ricochets sur personnages
  const splashes: SplashParticle[] = [];

  function spawnSplash(x: number, y: number) {
    const count = Math.round(2 + Math.random() * 2 * splashScale);
    for (let i = 0; i < count && splashes.length < MAX_SPLASHES; i++) {
      // Fan d'arc : de 145° à 35° (arc horizontal vers le haut)
      const fanAngle = rand(Math.PI * 0.2, Math.PI * 0.8);
      const speed = rand(0.8, 2.5) * splashScale;
      splashes.push({
        x,
        y,
        vx: Math.cos(Math.PI - fanAngle) * speed,
        vy: -Math.abs(Math.sin(fanAngle)) * speed * 1.2, // toujours vers le haut
        life: 1,
        maxLife: rand(12, 22),
        radius: rand(0.7, 1.4),
      });
    }
  }

  /**
   * Micro-ricochet sur un personnage : 1–2 particules très latérales, vie courte.
   * Déclenchée au point exact où la goutte entre dans le sprite par le haut.
   * Les particules partent quasi-horizontalement (pas vers le haut comme au sol).
   */
  function spawnCharacterSplash(x: number, y: number) {
    const count = 1 + (Math.random() < 0.5 ? 1 : 0); // 1 ou 2 particules
    for (let i = 0; i < count && splashes.length < MAX_SPLASHES; i++) {
      const dir = Math.random() < 0.5 ? -1 : 1; // gauche ou droite
      const speed = rand(0.6, 1.8) * splashScale;
      splashes.push({
        x,
        y,
        vx: dir * speed * rand(0.9, 1.4), // forte composante latérale
        vy: -rand(0.1, 0.5) * speed, // légèrement vers le haut
        life: 1,
        maxLife: rand(6, 12), // durée très courte
        radius: rand(0.4, 0.9), // plus petit qu'au sol
      });
    }
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    // ── Éclaboussures (sol + personnages) ────────────────────────────────
    if (splashEnabled && splashes.length > 0) {
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.life -= 1 / s.maxLife;
        if (s.life <= 0) {
          splashes.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.22; // gravité

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${s.life * 0.65})`;
        ctx.fill();
      }
    }

    // ── Streaks de pluie — 2 groupes par opacité ─────────────────────────
    ctx.lineCap = 'round';

    // Passer les déplacements + collisions, collecter les deux groupes
    const dropsNormal: Drop[] = [];
    const dropsDim: Drop[] = [];

    for (const d of drops) {
      // Mémoriser Y avant déplacement pour la détection de franchissement
      const prevY = d.y;

      d.x += driftX * d.speed * 0.9;
      d.y += driftY * d.speed;

      // ── Collision avec un sprite personnage ───────────────────────────
      if (splashEnabled && !d.landed && hitboxesRef && hitboxesRef.current.length > 0) {
        const tipPrevY = prevY + driftY * d.size;
        const tipCurrY = d.y + driftY * d.size;
        const tipCurrX = d.x + driftX * d.size;

        for (const hb of hitboxesRef.current) {
          if (tipPrevY < hb.y && tipCurrY >= hb.y && tipCurrX >= hb.x && tipCurrX <= hb.x + hb.w) {
            d.landed = true;
            spawnCharacterSplash(tipCurrX, hb.y + rand(0, 3));
            break;
          }
        }
      }

      // ── Éclaboussure au sol virtuel ────────────────────────────────────
      if (splashEnabled && d.y > h * groundLevel && !d.landed) {
        d.landed = true;
        spawnSplash(d.x + driftX * d.size * 0.5, h * groundLevel);
      }

      // Wrap-around
      if (d.y > h + d.size) {
        d.y = rand(-40, -d.size);
        d.x = rand(-50, w + 50);
        d.landed = false;
      }
      if (d.x > w + 50) d.x = -50;
      if (d.x < -50) d.x = w + 50;

      if (d.opacity >= 0.8) dropsNormal.push(d);
      else dropsDim.push(d);
    }

    // Groupe opaque (opacity ≥ 0.8)
    ctx.strokeStyle = params.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const d of dropsNormal) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + driftX * d.size, d.y + driftY * d.size);
    }
    ctx.stroke();

    // Groupe atténué (opacity < 0.8) — même couleur avec alpha réduit de moitié
    const dimColor = params.color.replace(
      /[\d.]+\)$/,
      `${parseFloat(params.color.match(/[\d.]+\)$/)?.[0] ?? '0.6') * 0.5})`
    );
    ctx.strokeStyle = dimColor;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const d of dropsDim) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + driftX * d.size, d.y + driftY * d.size);
    }
    ctx.stroke();

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
      for (const d of drops) {
        d.x = rand(-50, w + 50);
        d.y = rand(-h, h);
        d.landed = false;
        d.opacity = rand(0.6, 1.0);
        d.width = 0.8 + (d.size / params.length) * 0.8;
      }
      splashes.length = 0;
    },
  };
}

// ── BRUINE ────────────────────────────────────────────────────────────────────

export function startDrizzleEffect(
  canvas: HTMLCanvasElement,
  params: DrizzleEffectParams
): RainRenderer {
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width;
  let h = canvas.height;
  let running = true;

  const angleRad = (params.angle * Math.PI) / 180;
  const driftX = Math.sin(angleRad) * 0.9;
  const driftY = Math.cos(angleRad);

  const rgb = parseColorRgb(params.color);

  const drops: Drop[] = Array.from({ length: params.density }, () => ({
    x: rand(-20, w + 20),
    y: rand(-h, h),
    speed: rand(params.speed * 0.7, params.speed * 1.3),
    // Streaks visibles : 8–16 px au lieu de 3 px
    size: rand(8, 16),
    drift: rand(-0.15, 0.15),
    landed: false,
    // Opacité légèrement variable par goutte (clampée à 1.0)
    opacity: Math.min(params.opacity * rand(0.5, 1.2), 1.0),
    // Épaisseur variable : fines à épaisses
    width: rand(0.4, 1.0),
  }));

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    ctx.lineCap = 'round';

    // Chaque goutte est dessinée individuellement car lineWidth varie
    for (const d of drops) {
      const ex = d.x + driftX * d.size;
      const ey = d.y + driftY * d.size;

      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${d.opacity})`;
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      d.x += driftX * d.speed + d.drift;
      d.y += driftY * d.speed;

      if (d.y > h + d.size) {
        d.y = rand(-30, -d.size);
        d.x = rand(-20, w + 20);
        d.size = rand(8, 16);
        d.opacity = Math.min(params.opacity * rand(0.5, 1.2), 1.0);
        d.width = rand(0.4, 1.0);
      }
      if (d.x > w + 20) d.x = -20;
      if (d.x < -20) d.x = w + 20;
    }

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
      for (const d of drops) {
        d.x = rand(-20, w + 20);
        d.y = rand(-h, h);
      }
    },
  };
}

// ── NEIGE ─────────────────────────────────────────────────────────────────────

export function startSnowEffect(canvas: HTMLCanvasElement, params: SnowEffectParams): RainRenderer {
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width;
  let h = canvas.height;
  let running = true;

  const snowRgb = parseColorRgb(params.color);
  // Extraire l'alpha de base depuis la couleur (ex: rgba(255,255,255,0.75) → 0.75)
  const snowBaseAlpha = parseFloat(params.color.match(/[\d.]+\)$/)?.[0] ?? '0.75');
  // Au-delà de 150 flocons, le gradient radial est trop coûteux : arc classique + globalAlpha
  const useGradientSnow = params.density <= 150;

  const flakes: Drop[] = Array.from({ length: params.density }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    speed: rand(0.5, 2.5),
    size: rand(params.size * 0.5, params.size * 1.5),
    drift: rand(-params.drift, params.drift),
    landed: false,
    opacity: rand(0.6, 1.0),
    width: 0,
  }));

  let time = 0;

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    time += 0.016;

    for (const f of flakes) {
      f.x += f.drift + Math.sin(time * 0.8 + f.size) * 0.3;
      f.y += f.speed;

      const radius = f.size / 2;

      if (useGradientSnow) {
        // Gradient radial doux : centre opaque → bord transparent (effet lueur)
        const gradRadius = radius * 1.5;
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, gradRadius);
        grad.addColorStop(
          0,
          `rgba(${snowRgb.r},${snowRgb.g},${snowRgb.b},${snowBaseAlpha * f.opacity})`
        );
        grad.addColorStop(
          0.5,
          `rgba(${snowRgb.r},${snowRgb.g},${snowRgb.b},${snowBaseAlpha * f.opacity * 0.5})`
        );
        grad.addColorStop(1.0, `rgba(${snowRgb.r},${snowRgb.g},${snowRgb.b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, gradRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Arc classique + globalAlpha — performant pour density > 150
        ctx.globalAlpha = snowBaseAlpha * f.opacity;
        ctx.fillStyle = params.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (f.y > h + f.size) {
        f.y = -f.size;
        f.x = rand(0, w);
        f.opacity = rand(0.6, 1.0);
      }
      if (f.x > w + 10) f.x = -10;
      if (f.x < -10) f.x = w + 10;
    }

    // Remettre globalAlpha à 1 après le mode haute densité
    if (!useGradientSnow) ctx.globalAlpha = 1;

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
      for (const f of flakes) {
        f.x = rand(0, w);
        if (f.y > nh) f.y = rand(-nh, 0);
      }
    },
  };
}
