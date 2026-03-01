/**
 * DiceCubeCSS — Rendu CSS 3D du dé (6 faces, preserve-3d).
 * Utilisé comme rendu principal ou comme fallback si WebGL est indisponible.
 *
 * Exports partagés avec DiceCubeR3F :
 *   Phase, DiceCubeProps, DIE_SIZE, PALETTE, PaletteKey,
 *   getPaletteKey, getGlowStyle
 */
import { AnimatePresence, motion } from 'framer-motion';

// ── Types & constantes partagées ──────────────────────────────────────────────

export type Phase = 'hidden' | 'entry' | 'rolling' | 'impact' | 'reveal' | 'result' | 'ready';

export interface DiceCubeProps {
  phase: Phase;
  success: boolean;
  displayNumber: number;
  flashId: number;
}

export const DIE_SIZE = 180;

const HALF           = DIE_SIZE / 2;
const PHASE_ROLL_MS  = 1400;

const FACE_TRANSFORMS = {
  front:  `translateZ(${HALF}px)`,
  back:   `rotateY(180deg) translateZ(${HALF}px)`,
  right:  `rotateY(90deg) translateZ(${HALF}px)`,
  left:   `rotateY(-90deg) translateZ(${HALF}px)`,
  top:    `rotateX(-90deg) translateZ(${HALF}px)`,
  bottom: `rotateX(90deg) translateZ(${HALF}px)`,
} as const;

/** Éclairage directionnel simulé — facteur d'assombrissement par face [0..1]. */
const FACE_SHADE: Record<keyof typeof FACE_TRANSFORMS, number> = {
  front:  1.00,
  top:    0.82,
  right:  0.68,
  left:   0.62,
  back:   0.48,
  bottom: 0.52,
};

/**
 * Matériaux par thème. 4 couches box-shadow CONSTANTES → CSS transition fluide.
 *   1. specular  → highlight directionnel (Blender: Specular)
 *   2. ao        → occlusion ambiante     (Blender: AO)
 *   3. glow      → halo coloré post-impact (Blender: Emission)
 *   4. shadow    → ombre portée réaliste  (Blender: Shadow)
 */
export const PALETTE = {
  neutral: {
    // Ivoire blanc cassé — dé de jeu classique, surface nacrée chaude
    frontGradient: 'linear-gradient(145deg, #f8f3e8 0%, #ede0c4 50%, #d8c9a8 100%)',
    sideBase:      [232, 216, 180] as const,
    textColor:     '#1a1008',
    textShadow:    '0 1px 3px rgba(0,0,0,0.55), 0 0 10px rgba(180,140,60,0.18)',
    rimBorder:     'rgba(195,170,115,0.55)',
    specular:      'inset 4px 4px 18px rgba(255,255,255,0.78)',
    ao:            'inset -3px -3px 14px rgba(120,90,50,0.32)',
    glowColor:     'rgba(255,210,100,0.65)',
    labelOpacity:  0.42,
    dotOpacity:    0.30,
  },
  success: {
    frontGradient: 'linear-gradient(145deg, #052e16 0%, #065f46 50%, #059669 100%)',
    sideBase:      [6, 80, 58] as const,
    textColor:     '#86efac',
    textShadow:    '0 0 24px rgba(134,239,172,0.85), 0 2px 8px rgba(0,0,0,0.95)',
    rimBorder:     'rgba(52,211,153,0.55)',
    specular:      'inset 4px 4px 18px rgba(134,239,172,0.32)',
    ao:            'inset -3px -3px 14px rgba(0,0,0,0.75)',
    glowColor:     'rgba(16,185,129,0.92)',
    labelOpacity:  0.48,
    dotOpacity:    0.26,
  },
  failure: {
    frontGradient: 'linear-gradient(145deg, #450a0a 0%, #7f1d1d 50%, #a01c1c 100%)',
    sideBase:      [110, 22, 22] as const,
    textColor:     '#fca5a5',
    textShadow:    '0 0 24px rgba(252,165,165,0.80), 0 2px 8px rgba(0,0,0,0.95)',
    rimBorder:     'rgba(248,113,113,0.50)',
    specular:      'inset 4px 4px 18px rgba(252,165,165,0.24)',
    ao:            'inset -3px -3px 14px rgba(0,0,0,0.82)',
    glowColor:     'rgba(220,38,38,0.92)',
    labelOpacity:  0.44,
    dotOpacity:    0.22,
  },
} as const;

export type PaletteKey = keyof typeof PALETTE;

// ── Helpers partagés ──────────────────────────────────────────────────────────

export function getPaletteKey(phase: Phase, success: boolean): PaletteKey {
  if (phase === 'reveal' || phase === 'result' || phase === 'ready')
    return success ? 'success' : 'failure';
  return 'neutral';
}

function getSideFaceColor(phase: Phase, success: boolean, shade: number): string {
  const [r, g, b] = PALETTE[getPaletteKey(phase, success)].sideBase;
  return `rgb(${Math.round(r * shade)},${Math.round(g * shade)},${Math.round(b * shade)})`;
}

function getFrontBoxShadow(phase: Phase, success: boolean): string {
  const p      = PALETTE[getPaletteKey(phase, success)];
  const isPost = phase === 'reveal' || phase === 'result' || phase === 'ready';
  return [
    p.specular,
    p.ao,
    isPost ? `0 0 60px ${p.glowColor}` : '0 0 0px rgba(0,0,0,0)',
    '0 12px 36px rgba(0,0,0,0.75)',
  ].join(', ');
}

/** Halo derrière le cube — sibling, jamais dans le preserve-3d context. */
export function getGlowStyle(phase: Phase, success: boolean) {
  const p       = PALETTE[getPaletteKey(phase, success)];
  const neutral = PALETTE.neutral.glowColor;
  if (phase === 'hidden' || phase === 'entry') return { background: neutral, opacity: 0 };
  if (phase === 'rolling') return { background: neutral, opacity: 0.40 };
  if (phase === 'impact')  return { background: p.glowColor, opacity: 0.58 };
  return { background: p.glowColor, opacity: 1.0 };
}

// ── DiceCubeCSS ───────────────────────────────────────────────────────────────

export function DiceCubeCSS({ phase, success, displayNumber, flashId }: DiceCubeProps) {
  const pal  = PALETTE[getPaletteKey(phase, success)];
  const glow = getGlowStyle(phase, success);

  return (
    <motion.div
      initial={{ scaleX: 0, scaleY: 0, opacity: 0 }}
      animate={{
        scaleX:
          phase === 'entry'  ? [0, 1.18, 1] :
          phase === 'impact' ? [1, 1.13, 0.94, 1] : 1,
        scaleY:
          phase === 'entry'  ? [0, 1.18, 1] :
          phase === 'impact' ? [1, 0.86, 1.06, 1] : 1,
        opacity: 1,
      }}
      transition={{
        scaleX:
          phase === 'entry'
            ? { duration: 0.40, times: [0, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] }
            : phase === 'impact'
            ? { duration: 0.28, times: [0, 0.38, 0.72, 1], ease: 'easeOut' }
            : { duration: 0.2 },
        scaleY:
          phase === 'entry'
            ? { duration: 0.40, times: [0, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] }
            : phase === 'impact'
            ? { duration: 0.28, times: [0, 0.38, 0.72, 1], ease: 'easeOut' }
            : { duration: 0.2 },
        opacity: { duration: 0.15 },
      }}
      style={{ position: 'relative', width: DIE_SIZE, height: DIE_SIZE }}
    >

      {/* ── Halo lumineux (Emission) — SIBLING du cube, jamais dans preserve-3d ── */}
      <div style={{
        position: 'absolute', inset: -42, borderRadius: 52,
        background: glow.background, opacity: glow.opacity,
        filter: 'blur(38px)', pointerEvents: 'none',
        transition: 'background 0.45s ease, opacity 0.40s ease',
      }} />

      {/* ── Flash spectaculaire à la révélation ── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.88 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -60, borderRadius: 60,
              background: success ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.75)',
              filter: 'blur(8px)', pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Onde de choc — ring expansif à la révélation ── */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            key="shockwave"
            initial={{ scale: 0.65, opacity: 0.90 }}
            animate={{ scale: 4.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.58, ease: [0.0, 0.55, 0.65, 1.0] }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              marginTop: -(DIE_SIZE / 2), marginLeft: -(DIE_SIZE / 2),
              width: DIE_SIZE, height: DIE_SIZE,
              borderRadius: '50%',
              border: `3px solid ${success ? 'rgba(52,211,153,0.95)' : 'rgba(248,113,113,0.95)'}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Perspective — parent direct du cube ── */}
      <div style={{ perspective: 900, position: 'absolute', inset: 0 }}>

        {/* CUBE — preserve-3d. Rolling : 2 tours X + 3 tours Y → face avant 0°,0°. */}
        <motion.div
          animate={{
            rotateX: phase === 'rolling' ? [0, 360, 720] : 0,
            rotateY: phase === 'rolling' ? [0, 540, 1080] : 0,
          }}
          transition={{
            rotateX: phase === 'rolling'
              ? { duration: PHASE_ROLL_MS / 1000, ease: [0.15, 0, 0.75, 1] }
              : { duration: 0.35, ease: 'easeOut' },
            rotateY: phase === 'rolling'
              ? { duration: PHASE_ROLL_MS / 1000, ease: [0.15, 0, 0.75, 1] }
              : { duration: 0.35, ease: 'easeOut' },
          }}
          style={{
            position: 'relative', width: DIE_SIZE, height: DIE_SIZE,
            transformStyle: 'preserve-3d',
          }}
        >

          {/* ── Face AVANT — principale : chiffre + matériaux complets ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.front,
            borderRadius: 20,
            background: pal.frontGradient,
            backfaceVisibility: 'hidden',
            border: `2px solid ${pal.rimBorder}`,
            boxShadow: getFrontBoxShadow(phase, success),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            transition: 'background 0.44s ease, box-shadow 0.44s ease, border-color 0.44s ease',
          }}>
            {/* Gloss Layer — reflet diagonal (Blender: Clearcoat / Gloss Map) */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.09) 36%, transparent 56%)',
            }} />
            <span style={{
              position: 'absolute', top: 9, left: 12,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              fontFamily: 'monospace', color: pal.textColor, opacity: pal.labelOpacity,
              transition: 'color 0.44s ease, opacity 0.44s ease',
            }}>d20</span>
            <span style={{
              position: 'absolute', top: 11, right: 13,
              width: 5, height: 5, borderRadius: '50%',
              background: pal.textColor, opacity: pal.dotOpacity,
              transition: 'background 0.44s ease',
            }} />
            <span style={{
              position: 'absolute', bottom: 11, left: 13,
              width: 5, height: 5, borderRadius: '50%',
              background: pal.textColor, opacity: pal.dotOpacity,
              transition: 'background 0.44s ease',
            }} />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={flashId}
                initial={
                  phase === 'rolling' ? { scale: 1.55, opacity: 0 }
                  : phase === 'reveal' ? { scale: 0.12, opacity: 0 }
                  : { scale: 1, opacity: 1 }
                }
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={
                  phase === 'rolling'
                    ? { duration: 0.065, ease: 'easeOut' }
                    : phase === 'reveal'
                    ? { type: 'spring', stiffness: 520, damping: 11 }
                    : { duration: 0.05 }
                }
                style={{
                  fontSize: displayNumber >= 10 ? 74 : 88,
                  fontWeight: 900,
                  color: pal.textColor,
                  textShadow: pal.textShadow,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  userSelect: 'none',
                  transition: 'color 0.44s ease',
                }}
              >
                {displayNumber}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* ── Face ARRIÈRE ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.back,
            borderRadius: 20,
            background: getSideFaceColor(phase, success, FACE_SHADE.back),
            backfaceVisibility: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.05)',
            transition: 'background 0.44s ease',
          }} />

          {/* ── Face DROITE ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.right,
            borderRadius: 20,
            background: getSideFaceColor(phase, success, FACE_SHADE.right),
            backfaceVisibility: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.10)',
            transition: 'background 0.44s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: pal.textColor, opacity: pal.dotOpacity * 0.75,
              transition: 'background 0.44s ease',
            }} />
          </div>

          {/* ── Face GAUCHE ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.left,
            borderRadius: 20,
            background: getSideFaceColor(phase, success, FACE_SHADE.left),
            backfaceVisibility: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.09)',
            transition: 'background 0.44s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: pal.textColor, opacity: pal.dotOpacity * 0.75,
              transition: 'background 0.44s ease',
            }} />
          </div>

          {/* ── Face DESSUS ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.top,
            borderRadius: 20,
            background: getSideFaceColor(phase, success, FACE_SHADE.top),
            backfaceVisibility: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.13)',
            transition: 'background 0.44s ease',
          }} />

          {/* ── Face DESSOUS ── */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: FACE_TRANSFORMS.bottom,
            borderRadius: 20,
            background: getSideFaceColor(phase, success, FACE_SHADE.bottom),
            backfaceVisibility: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.05)',
            transition: 'background 0.44s ease',
          }} />

        </motion.div>
      </div>
    </motion.div>
  );
}
