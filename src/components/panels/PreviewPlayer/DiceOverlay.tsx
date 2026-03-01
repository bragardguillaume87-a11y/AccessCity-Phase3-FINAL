/**
 * DiceOverlay — Animation spectaculaire de lancer de dé (cube 3D CSS réel, 6 faces).
 *
 * S'affiche directement dans le canvas du PreviewPlayer (position absolute inset-0).
 * Les personnages restent visibles derrière le fond assombri.
 *
 * ⚠️ Architecture :
 *   - Le résultat (roll, success, difficulty) est connu DÈS l'ouverture (synchrone).
 *   - Pas de refs de capture — les props sont stables depuis frame 1.
 *   - Cube CSS 3D : 6 faces avec transformStyle: preserve-3d + backfaceVisibility: hidden.
 *   - Halo lumineux : div floutée SIBLING du cube → ne casse pas le preserve-3d context.
 *   - Séparation scale/opacity (wrapper externe) et rotation (cube interne).
 *
 * Phases :
 *   hidden  → entry (350ms, zoom + fond)
 *           → rolling (1400ms, tumble 6 faces + flash nombres)
 *           → impact (280ms, bounce)
 *           → reveal (420ms, halo couleur)
 *           → result (400ms, bannière)
 *           → ready (∞, bouton Continuer)
 *
 * ⚠️ Note architecturale : DiceOverlay n'apparaît que dans les scènes standard
 * (sceneType !== 'cinematic'). Les scènes cinématiques n'ont pas de choix
 * utilisateur ni de lancers de dé — c'est intentionnel.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
import { uiSounds } from '@/utils/uiSounds';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'hidden' | 'entry' | 'rolling' | 'impact' | 'reveal' | 'result' | 'ready';

export interface DiceOverlayProps {
  isOpen: boolean;
  roll: number;           // 1-20 résultat final
  difficulty: number;
  success: boolean;
  criticalThreshold?: number;  // défaut 19
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_ENTRY_MS  = 350;
const PHASE_ROLL_MS   = 1400;
const PHASE_IMPACT_MS = 280;
const PHASE_REVEAL_MS = 420;
const PHASE_RESULT_MS = 400;

// Flash numbers :
//   12 steps × (55ms + k×12ms) → total ≈ 1452ms ≈ PHASE_ROLL_MS
const FLASH_STEPS    = 12;
const FLASH_START_MS = 55;
const FLASH_STEP_INC = 12;

// ── Cube geometry ─────────────────────────────────────────────────────────────

/** Taille d'une face du cube (px). Cube parfait : HALF = DIE_SIZE / 2. */
const DIE_SIZE = 180;
const HALF     = DIE_SIZE / 2; // = 90px — translateZ de chaque face depuis le centre

/**
 * Transformations CSS 3D pour chaque face.
 * Chaque face part du centre (position absolute, inset 0) puis est déplacée
 * vers sa position finale : rotateX/Y (orientation) + translateZ (distance).
 */
const FACE_TRANSFORMS = {
  front:  `translateZ(${HALF}px)`,
  back:   `rotateY(180deg) translateZ(${HALF}px)`,
  right:  `rotateY(90deg) translateZ(${HALF}px)`,
  left:   `rotateY(-90deg) translateZ(${HALF}px)`,
  top:    `rotateX(-90deg) translateZ(${HALF}px)`,
  bottom: `rotateX(90deg) translateZ(${HALF}px)`,
} as const;

/** Facteur d'assombrissement par face pour simuler un éclairage directionnel. */
const FACE_SHADE: Record<keyof typeof FACE_TRANSFORMS, number> = {
  front:  1.00,  // face principale — pleine lumière
  top:    0.82,  // dessus — légèrement éclairé
  right:  0.68,  // droite — ombre latérale
  left:   0.62,  // gauche — ombre latérale plus profonde
  back:   0.48,  // arrière — très sombre
  bottom: 0.52,  // dessous — sombre
};

// ── Visual helpers ─────────────────────────────────────────────────────────────

/** Gradient de la face avant (full brightness). Transitions via CSS transition. */
function getFrontFaceGradient(phase: Phase, success: boolean): string {
  const isPost = phase === 'reveal' || phase === 'result' || phase === 'ready';
  if (isPost && success)  return 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #166534 100%)';
  if (isPost && !success) return 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #991b1b 100%)';
  return 'linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%)';
}

/** Couleur unie des faces secondaires, assombrie par shade ∈ [0..1]. */
function getSideFaceColor(phase: Phase, success: boolean, shade: number): string {
  const isPost = phase === 'reveal' || phase === 'result' || phase === 'ready';
  let r: number, g: number, b: number;
  if (isPost && success)  { r = 22;  g = 163; b = 74;  }
  else if (isPost)        { r = 220; g = 38;  b = 38;  }
  else                    { r = 67;  g = 56;  b = 202; }
  return `rgb(${Math.round(r * shade)},${Math.round(g * shade)},${Math.round(b * shade)})`;
}

/** Halo lumineux derrière le cube (sibling, pas de filter sur preserve-3d). */
function getGlowStyle(phase: Phase, success: boolean) {
  const isPost = phase === 'reveal' || phase === 'result' || phase === 'ready';
  if (phase === 'hidden' || phase === 'entry') {
    return { background: 'rgba(99,102,241,0.6)', opacity: 0 };
  }
  if (isPost) {
    return {
      background: success ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)',
      opacity: 1.0,
    };
  }
  return { background: 'rgba(99,102,241,0.65)', opacity: phase === 'impact' ? 0.55 : 0.38 };
}

/** Couleur du chiffre sur la face avant. */
function getDieNumberColor(phase: Phase, success: boolean): string {
  if (phase === 'reveal' || phase === 'result' || phase === 'ready')
    return success ? '#4ade80' : '#fca5a5';
  return 'rgba(255,255,255,0.95)';
}

// ── DiceOverlay ───────────────────────────────────────────────────────────────

export function DiceOverlay({
  isOpen, roll, difficulty, success, criticalThreshold = 19, onClose,
}: DiceOverlayProps) {
  const [phase, setPhase]                 = useState<Phase>('hidden');
  const [displayNumber, setDisplayNumber] = useState(1);
  const [flashId, setFlashId]             = useState(0);   // unique key par flash
  const [showConfetti, setShowConfetti]   = useState(false);

  const isCritical = success && roll >= criticalThreshold;

  const advanceTo = useCallback((p: Phase) => setPhase(p), []);

  // ── Phase machine ──────────────────────────────────────────────────────────

  // Démarrage / reset selon isOpen
  useEffect(() => {
    if (!isOpen) {
      setPhase('hidden');
      setDisplayNumber(1);
      setFlashId(0);
      setShowConfetti(false);
      return;
    }
    advanceTo('entry');
    const t = setTimeout(() => advanceTo('rolling'), PHASE_ENTRY_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Phase rolling → flash nombres → impact
  useEffect(() => {
    if (phase !== 'rolling') return;

    uiSounds.diceRollStart();

    let step = 0;
    let id   = flashId;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function scheduleNext() {
      const interval = FLASH_START_MS + step * FLASH_STEP_INC;
      const t = setTimeout(() => {
        if (step < FLASH_STEPS - 1) {
          setDisplayNumber(Math.floor(Math.random() * 20) + 1);
          setFlashId(++id);
          step++;
          scheduleNext();
        } else {
          // Résultat final — roll stable depuis l'ouverture (synchrone, pas de race condition)
          setDisplayNumber(roll > 0 ? roll : Math.floor(Math.random() * 20) + 1);
          setFlashId(++id);
          advanceTo('impact');
        }
      }, interval);
      timers.push(t);
    }

    scheduleNext();
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);  // roll lu directement depuis la closure (stable depuis frame 1)

  // Phase impact → reveal
  useEffect(() => {
    if (phase !== 'impact') return;
    uiSounds.diceImpact();
    const t = setTimeout(() => advanceTo('reveal'), PHASE_IMPACT_MS);
    return () => clearTimeout(t);
  }, [phase, advanceTo]);

  // Phase reveal → result
  useEffect(() => {
    if (phase !== 'reveal') return;
    if (success) uiSounds.diceSuccess(); else uiSounds.diceFailure();
    const t = setTimeout(() => advanceTo('result'), PHASE_REVEAL_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);  // success lu directement (stable depuis frame 1)

  // Phase result → ready
  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => {
      advanceTo('ready');
      if (isCritical) setShowConfetti(true);
    }, PHASE_RESULT_MS);
    return () => clearTimeout(t);
  }, [phase, isCritical, advanceTo]);

  // Keyboard : Enter / Space → close si ready
  useEffect(() => {
    if (phase !== 'ready') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isOpen && phase === 'hidden') return null;

  const isPostImpact = phase === 'reveal' || phase === 'result' || phase === 'ready';
  const showResult   = phase === 'result' || phase === 'ready';
  const showButton   = phase === 'ready';

  const resultLabel = isCritical ? '✨ Succès Critique !' : success ? '✓ Succès' : '✗ Échec';
  const resultColor = success ? '#4ade80' : '#f87171';
  const glow        = getGlowStyle(phase, success);

  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: isOpen ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.28 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18,
      }}
      onClick={showButton ? onClose : undefined}
    >

      {/* ═══════════════════════════════════════════════════════════════════════
          Cube 3D CSS — architecture :
            Wrapper (scale/opacity/bounce)
            └── Halo (div floutée, sibling du cube, sans preserve-3d)
            └── Perspective div
                └── Cube (motion.div, preserve-3d, rotateX/Y)
                    ├── Face avant  (translateZ +90)
                    ├── Face arrière (rotateY 180 + translateZ 90)
                    ├── Face droite  (rotateY  90 + translateZ 90)
                    ├── Face gauche  (rotateY -90 + translateZ 90)
                    ├── Face dessus  (rotateX -90 + translateZ 90)
                    └── Face dessous (rotateX  90 + translateZ 90)
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Wrapper — gère scale / opacity / bounce. Ancre le halo. */}
      <motion.div
        key="cube-wrapper"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale:
            phase === 'entry'  ? [0, 1.18, 1]
            : phase === 'impact' ? [1, 1.14, 0.96, 1]
            : 1,
          opacity: 1,
        }}
        transition={{
          scale:
            phase === 'entry'
              ? { duration: 0.38, times: [0, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] }
              : phase === 'impact'
              ? { duration: 0.28, times: [0, 0.4, 0.75, 1], ease: 'easeOut' }
              : { duration: 0.2 },
          opacity: { duration: 0.15 },
        }}
        style={{ position: 'relative', width: DIE_SIZE, height: DIE_SIZE }}
      >
        {/* Halo lumineux — SIBLING du perspective div, jamais dans preserve-3d */}
        <div
          style={{
            position: 'absolute',
            inset: -36,
            borderRadius: 44,
            background: glow.background,
            opacity: glow.opacity,
            filter: 'blur(32px)',
            pointerEvents: 'none',
            transition: 'background 0.45s ease, opacity 0.38s ease',
          }}
        />

        {/* Perspective — parent direct du cube pour que l'effet s'applique */}
        <div style={{ perspective: 900, position: 'absolute', inset: 0 }}>

          {/* Cube container — transformStyle preserve-3d obligatoire ici */}
          <motion.div
            animate={{
              // Rolling : 2 tours X + 3 tours Y → atterrit sur face avant (0°, 0°)
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
              position: 'relative',
              width: DIE_SIZE,
              height: DIE_SIZE,
              transformStyle: 'preserve-3d',
            }}
          >

            {/* ── Face AVANT — affiche le chiffre ── */}
            <div
              style={{
                position: 'absolute', inset: 0,
                transform: FACE_TRANSFORMS.front,
                borderRadius: 22,
                background: getFrontFaceGradient(phase, success),
                backfaceVisibility: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                transition: 'background 0.42s ease',
              }}
            >
              {/* d20 label */}
              <span style={{
                position: 'absolute', top: 9, left: 12,
                fontSize: 10, fontWeight: 700, opacity: 0.45, color: 'white',
                letterSpacing: '0.05em', fontFamily: 'monospace',
              }}>d20</span>

              {/* Dots décoratifs (coins) */}
              <span style={{
                position: 'absolute', top: 10, right: 12,
                width: 5, height: 5, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
              }} />
              <span style={{
                position: 'absolute', bottom: 10, left: 12,
                width: 5, height: 5, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
              }} />

              {/* Chiffre — re-monté à chaque flash (key=flashId) pour l'animation */}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={flashId}
                  initial={
                    phase === 'rolling' ? { scale: 1.55, opacity: 0 }
                    : phase === 'reveal' ? { scale: 0.2, opacity: 0 }
                    : { scale: 1, opacity: 1 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={
                    phase === 'rolling'
                      ? { duration: 0.065, ease: 'easeOut' }
                      : phase === 'reveal'
                      ? { type: 'spring', stiffness: 450, damping: 12 }
                      : { duration: 0.05 }
                  }
                  style={{
                    fontSize: displayNumber >= 10 ? 74 : 88,
                    fontWeight: 900,
                    color: getDieNumberColor(phase, success),
                    textShadow: '0 2px 14px rgba(0,0,0,0.7)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    userSelect: 'none',
                    transition: 'color 0.35s ease',
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
              borderRadius: 22,
              background: getSideFaceColor(phase, success, FACE_SHADE.back),
              backfaceVisibility: 'hidden',
              border: '2.5px solid rgba(255,255,255,0.07)',
              transition: 'background 0.42s ease',
            }} />

            {/* ── Face DROITE ── */}
            <div style={{
              position: 'absolute', inset: 0,
              transform: FACE_TRANSFORMS.right,
              borderRadius: 22,
              background: getSideFaceColor(phase, success, FACE_SHADE.right),
              backfaceVisibility: 'hidden',
              border: '2.5px solid rgba(255,255,255,0.11)',
              transition: 'background 0.42s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
              }} />
            </div>

            {/* ── Face GAUCHE ── */}
            <div style={{
              position: 'absolute', inset: 0,
              transform: FACE_TRANSFORMS.left,
              borderRadius: 22,
              background: getSideFaceColor(phase, success, FACE_SHADE.left),
              backfaceVisibility: 'hidden',
              border: '2.5px solid rgba(255,255,255,0.10)',
              transition: 'background 0.42s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
              }} />
            </div>

            {/* ── Face DESSUS ── */}
            <div style={{
              position: 'absolute', inset: 0,
              transform: FACE_TRANSFORMS.top,
              borderRadius: 22,
              background: getSideFaceColor(phase, success, FACE_SHADE.top),
              backfaceVisibility: 'hidden',
              border: '2.5px solid rgba(255,255,255,0.14)',
              transition: 'background 0.42s ease',
            }} />

            {/* ── Face DESSOUS ── */}
            <div style={{
              position: 'absolute', inset: 0,
              transform: FACE_TRANSFORMS.bottom,
              borderRadius: 22,
              background: getSideFaceColor(phase, success, FACE_SHADE.bottom),
              backfaceVisibility: 'hidden',
              border: '2.5px solid rgba(255,255,255,0.07)',
              transition: 'background 0.42s ease',
            }} />

          </motion.div>
        </div>
      </motion.div>

      {/* ── Résultat vs Difficulté (après impact) ── */}
      <AnimatePresence>
        {isPostImpact && (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '6px 18px',
            }}
          >
            Résultat : <strong style={{ color: 'white' }}>{roll}</strong>
            {' '}/ Difficulté : <strong style={{ color: 'white' }}>{difficulty}</strong>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bannière succès / échec ── */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            key="result"
            initial={{ y: 28, opacity: 0, scale: 0.82 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            aria-live="assertive"
            style={{
              fontSize: 30, fontWeight: 900,
              color: resultColor,
              textShadow: `0 0 24px ${resultColor}90, 0 2px 10px rgba(0,0,0,0.9)`,
              letterSpacing: '0.03em',
            }}
          >
            {resultLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bouton Continuer ── */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            key="btn"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            autoFocus
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              marginTop: 6,
              padding: '10px 30px',
              borderRadius: 10,
              border: 'none',
              background: success
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: `0 4px 18px ${success ? 'rgba(22,163,74,0.55)' : 'rgba(220,38,38,0.55)'}`,
              letterSpacing: '0.02em',
            }}
          >
            Continuer →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Confetti succès critique */}
      {showConfetti && <Confetti />}
    </motion.div>
  );
}
