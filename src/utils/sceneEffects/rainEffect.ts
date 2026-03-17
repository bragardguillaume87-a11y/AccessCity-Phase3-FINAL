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

  const drops: Drop[] = Array.from({ length: params.density }, () => ({
    x: rand(-50, w + 50),
    y: rand(-h, h),
    speed: rand(12, 22),
    size: rand(params.length * 0.6, params.length * 1.4),
    drift: 0,
    landed: false,
  }));

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

    // ── Streaks de pluie ─────────────────────────────────────────────────
    ctx.strokeStyle = params.color;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (const d of drops) {
      const ex = d.x + driftX * d.size;
      const ey = d.y + driftY * d.size;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(ex, ey);

      // Mémoriser Y avant déplacement pour la détection de franchissement
      const prevY = d.y;

      d.x += driftX * d.speed * 0.9;
      d.y += driftY * d.speed;

      // ── Collision avec un sprite personnage ───────────────────────────
      // Détection de franchissement : la pointe du streak passe au-dessus
      // puis en-dessous du bord supérieur du sprite (hb.y) entre deux frames.
      // Impact à la position X réelle de la goutte → distribution naturelle.
      // La goutte s'arrête (d.landed = true) pour ne pas respawner en boucle.
      if (splashEnabled && !d.landed && hitboxesRef && hitboxesRef.current.length > 0) {
        const tipPrevY = prevY + driftY * d.size; // pointe du streak avant déplacement
        const tipCurrY = d.y + driftY * d.size; // pointe après déplacement
        const tipCurrX = d.x + driftX * d.size;

        for (const hb of hitboxesRef.current) {
          // La pointe vient de franchir le bord supérieur du sprite
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
  // Streaks très courts (2–4 px), voile de micro-gouttelettes
  const streakLen = 3;

  const drops: Drop[] = Array.from({ length: params.density }, () => ({
    x: rand(-20, w + 20),
    y: rand(-h, h),
    speed: rand(params.speed * 0.7, params.speed * 1.3),
    size: rand(streakLen * 0.7, streakLen * 1.3),
    drift: rand(-0.15, 0.15),
    landed: false,
  }));

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = `rgba(${parseColorRgb(params.color).r},${parseColorRgb(params.color).g},${parseColorRgb(params.color).b},${params.opacity})`;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (const d of drops) {
      const ex = d.x + driftX * d.size;
      const ey = d.y + driftY * d.size;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(ex, ey);

      d.x += driftX * d.speed + d.drift;
      d.y += driftY * d.speed;

      if (d.y > h + d.size) {
        d.y = rand(-30, -d.size);
        d.x = rand(-20, w + 20);
      }
      if (d.x > w + 20) d.x = -20;
      if (d.x < -20) d.x = w + 20;
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

  const flakes: Drop[] = Array.from({ length: params.density }, () => ({
    x: rand(0, w),
    y: rand(-h, h),
    speed: rand(0.5, 2.5),
    size: rand(params.size * 0.5, params.size * 1.5),
    drift: rand(-params.drift, params.drift),
    landed: false,
  }));

  let time = 0;

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = params.color;
    time += 0.016;

    for (const f of flakes) {
      f.x += f.drift + Math.sin(time * 0.8 + f.size) * 0.3;
      f.y += f.speed;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
      ctx.fill();

      if (f.y > h + f.size) {
        f.y = -f.size;
        f.x = rand(0, w);
      }
      if (f.x > w + 10) f.x = -10;
      if (f.x < -10) f.x = w + 10;
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
      for (const f of flakes) {
        f.x = rand(0, w);
        if (f.y > nh) f.y = rand(-nh, 0);
      }
    },
  };
}
