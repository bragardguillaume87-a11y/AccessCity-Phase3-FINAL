/**
 * DiceOverlay — Orchestrateur : phase machine + DOM effects.
 * Le rendu du cube est délégué à DiceCubeWrapper (CSS ou R3F selon WebGL).
 *
 * Phases : hidden → entry(350ms) → rolling(1400ms) → impact(280ms)
 *                → reveal(420ms) → result(400ms) → ready(∞)
 *
 * ⚠️ Props (roll, success, difficulty) stables depuis frame 1 — dé synchrone, pas de race condition.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
import { uiSounds } from '@/utils/uiSounds';
import type { Phase } from './DiceCubeCSS';
import { DiceCubeWrapper } from './DiceCubeWrapper';

export interface DiceOverlayProps {
  isOpen: boolean;
  roll: number;
  difficulty: number;
  success: boolean;
  criticalThreshold?: number;
  onClose: () => void;
}

// ── Timings ───────────────────────────────────────────────────────────────────

const PHASE_ENTRY_MS  = 350;
const PHASE_IMPACT_MS = 280;
const PHASE_REVEAL_MS = 420;
const PHASE_RESULT_MS = 400;

const FLASH_STEPS    = 12;
const FLASH_START_MS = 55;
const FLASH_STEP_INC = 12;

// ── DiceOverlay ───────────────────────────────────────────────────────────────

export function DiceOverlay({
  isOpen, roll, difficulty, success, criticalThreshold = 19, onClose,
}: DiceOverlayProps) {
  const [phase, setPhase]                 = useState<Phase>('hidden');
  const [displayNumber, setDisplayNumber] = useState(1);
  const [flashId, setFlashId]             = useState(0);
  const [showConfetti, setShowConfetti]   = useState(false);

  const isCritical = success && roll >= criticalThreshold;
  const advanceTo  = useCallback((p: Phase) => setPhase(p), []);

  // ── Phase machine ──────────────────────────────────────────────────────────

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
  }, [phase]);

  useEffect(() => {
    if (phase !== 'impact') return;
    uiSounds.diceImpact();
    const t = setTimeout(() => advanceTo('reveal'), PHASE_IMPACT_MS);
    return () => clearTimeout(t);
  }, [phase, advanceTo]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    if (success) uiSounds.diceSuccess(); else uiSounds.diceFailure();
    const t = setTimeout(() => advanceTo('result'), PHASE_REVEAL_MS);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => {
      advanceTo('ready');
      if (isCritical) setShowConfetti(true);
    }, PHASE_RESULT_MS);
    return () => clearTimeout(t);
  }, [phase, isCritical, advanceTo]);

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
  const resultLabel  = isCritical ? '✨ Succès Critique !' : success ? '✓ Succès' : '✗ Échec';
  const resultColor  = success ? '#4ade80' : '#f87171';

  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: isOpen ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.28 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18, paddingBottom: '14vh',
      }}
      onClick={showButton ? onClose : undefined}
    >

      {/* ── Cube (CSS ou R3F selon WebGL) ── */}
      <DiceCubeWrapper
        phase={phase}
        success={success}
        displayNumber={displayNumber}
        flashId={flashId}
      />

      {/* ── Résultat vs Difficulté (post-impact) ── */}
      <AnimatePresence>
        {isPostImpact && (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 14,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              background: 'rgba(0,0,0,0.48)', borderRadius: 8, padding: '6px 18px',
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
            initial={{ y: 30, opacity: 0, scale: 0.80 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-live="assertive"
            style={{
              fontSize: 30, fontWeight: 900, color: resultColor,
              textShadow: `0 0 28px ${resultColor}95, 0 2px 12px rgba(0,0,0,0.95)`,
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
              marginTop: 6, padding: '10px 30px', borderRadius: 10, border: 'none',
              background: success
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: `0 4px 20px ${success ? 'rgba(22,163,74,0.60)' : 'rgba(220,38,38,0.60)'}`,
              letterSpacing: '0.02em',
            }}
          >
            Continuer →
          </motion.button>
        )}
      </AnimatePresence>

      {showConfetti && <Confetti />}
    </motion.div>
  );
}
