import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { TutorialStep } from '@/config/tutorials';

interface SpotlightTutorialProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6; // px autour de l'élément cible

/**
 * SpotlightTutorial — Overlay 4 rideaux + carte d'aide flottante.
 *
 * Technique "4 rideaux" (§5 plan) :
 *   - 4 div fixed couvrent tout l'écran sauf le rect de l'élément cible
 *   - pointer-events: all sur les rideaux bloquent les interactions hors cible
 *   - L'élément cible reste dans le flux normal, pleinement accessible
 *
 * Recalcul via ResizeObserver + MutationObserver (DOM change quand l'étape avance).
 */
export function SpotlightTutorial({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: SpotlightTutorialProps) {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeRect = useCallback(() => {
    const el = document.querySelector(`[data-tutorial-id="${step.targetId}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    });
  }, [step.targetId]);

  useEffect(() => {
    computeRect();

    // ResizeObserver sur window via sentinel div
    observerRef.current = new ResizeObserver(computeRect);
    observerRef.current.observe(document.body);

    // Polling léger (100ms) pour les transitions CSS et montages asynchrones
    pollRef.current = setInterval(computeRect, 150);

    return () => {
      observerRef.current?.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [computeRect]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Si l'élément cible n'est pas encore monté → fallback centre écran
  const rect: Rect = targetRect ?? {
    top: vh / 2 - 40,
    left: vw / 2 - 80,
    width: 160,
    height: 80,
  };

  // Position de la carte d'aide
  const cardStyle = buildCardStyle(rect, step.position, vw, vh);

  const progress = (stepIndex + 1) / totalSteps;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return createPortal(
    <AnimatePresence>
      {/* ── 4 rideaux ────────────────────────────────────────────────────── */}
      {/* Rideau haut */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: Math.max(0, rect.top),
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9000,
          pointerEvents: 'all',
        }}
      />
      {/* Rideau gauche */}
      <div
        style={{
          position: 'fixed',
          top: rect.top,
          left: 0,
          width: Math.max(0, rect.left),
          height: rect.height,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9000,
          pointerEvents: 'all',
        }}
      />
      {/* Rideau droit */}
      <div
        style={{
          position: 'fixed',
          top: rect.top,
          left: rect.left + rect.width,
          width: Math.max(0, vw - rect.left - rect.width),
          height: rect.height,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9000,
          pointerEvents: 'all',
        }}
      />
      {/* Rideau bas */}
      <div
        style={{
          position: 'fixed',
          top: rect.top + rect.height,
          left: 0,
          width: '100vw',
          height: Math.max(0, vh - rect.top - rect.height),
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9000,
          pointerEvents: 'all',
        }}
      />

      {/* ── Bordure pulsante sur l'élément cible ─────────────────────────── */}
      <SpotlightRing rect={rect} />

      {/* ── Carte d'aide ─────────────────────────────────────────────────── */}
      <motion.div
        key={step.targetId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          ...cardStyle,
          zIndex: 9100,
          background: 'var(--color-bg-elevated)',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px var(--color-primary-40)',
          padding: '14px 16px 12px',
          width: 240,
          pointerEvents: 'all',
        }}
      >
        {/* En-tête : étape X/N */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{step.emoji}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Barre de progression inline */}
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'var(--color-border-base)',
            marginBottom: 10,
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{ height: '100%', background: 'var(--color-primary)', borderRadius: 2 }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Contenu */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          {step.title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
            marginBottom: 12,
          }}
        >
          {step.description}
        </p>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              marginRight: 'auto',
            }}
          >
            Passer
          </button>

          {!isFirst && (
            <button type="button" onClick={onPrev} style={navBtnStyle}>
              ← Préc.
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            style={{
              ...navBtnStyle,
              background: 'var(--color-primary)',
              color: '#fff',
              border: '1.5px solid var(--color-primary)',
            }}
          >
            {isLast ? '✅ Terminer' : 'Suivant →'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Anneau pulsant autour de l'élément cible ─────────────────────────────────

function SpotlightRing({ rect }: { rect: Rect }) {
  return createPortal(
    <motion.div
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: 8,
        border: '2px solid var(--color-primary)',
        zIndex: 9050,
        pointerEvents: 'none',
        boxShadow: '0 0 0 4px var(--color-primary-muted)',
      }}
      animate={{
        boxShadow: [
          '0 0 0 4px var(--color-primary-muted)',
          '0 0 0 8px var(--color-primary-subtle)',
          '0 0 0 4px var(--color-primary-muted)',
        ],
      }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />,
    document.body
  );
}

// ── Calcul de la position de la carte d'aide ─────────────────────────────────

function buildCardStyle(
  rect: Rect,
  position: TutorialStep['position'],
  vw: number,
  vh: number
): React.CSSProperties {
  const CARD_W = 240;
  const CARD_H = 180; // estimation hauteur carte
  const GAP = 12;

  let top: number;
  let left: number;

  switch (position) {
    case 'below':
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - CARD_W / 2;
      break;
    case 'above':
      top = rect.top - CARD_H - GAP;
      left = rect.left + rect.width / 2 - CARD_W / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - CARD_H / 2;
      left = rect.left + rect.width + GAP;
      break;
    case 'left':
    default:
      top = rect.top + rect.height / 2 - CARD_H / 2;
      left = rect.left - CARD_W - GAP;
      break;
  }

  // Clamp dans les limites de l'écran
  top = Math.max(8, Math.min(top, vh - CARD_H - 8));
  left = Math.max(8, Math.min(left, vw - CARD_W - 8));

  return { top, left };
}

// ── Styles partagés ───────────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '5px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  border: '1.5px solid var(--color-border-base)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
};
