/**
 * MinigameQte — Quick Time Event : appuyer sur les touches dans les temps.
 * v2 : urgence croissante (pulse accéléré, vignette rouge), slam-in de touche, couleur bar fluide.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MinigameConfig } from '@/types';
import { uiSounds } from '@/utils/uiSounds';

// ── Helpers couleur ───────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolation fluide rouge → orange → vert selon le temps restant (0=vide, 1=plein). */
function progressToColor(p: number): string {
  if (p > 0.5) {
    const f = (p - 0.5) / 0.5;
    return `rgb(${Math.round(lerp(245, 34, f))},${Math.round(lerp(158, 197, f))},${Math.round(lerp(11, 94, f))})`;
  }
  const f = p / 0.5;
  return `rgb(${Math.round(lerp(239, 245, f))},${Math.round(lerp(68, 158, f))},${Math.round(lerp(68, 11, f))})`;
}

// ── Affichage des touches ─────────────────────────────────────────────────────
const KEY_DISPLAY: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: '↵',
  ' ': '⎵',
  Escape: 'Esc',
};
function getDisplay(key: string) {
  return KEY_DISPLAY[key] ?? key.toUpperCase();
}

// Nom lisible de la touche (FR) — affiché sous le gros symbole pour lever l'ambiguïté
const KEY_NAMES: Record<string, string> = {
  ArrowUp: 'Flèche Haut',
  ArrowDown: 'Flèche Bas',
  ArrowLeft: 'Flèche Gauche',
  ArrowRight: 'Flèche Droite',
  Enter: 'Entrée',
  ' ': 'Espace',
  Escape: 'Échap',
  Backspace: 'Retour',
  Tab: 'Tab',
  Shift: 'Shift',
  Control: 'Ctrl',
  Alt: 'Alt',
};
function getKeyName(key: string): string | null {
  // Retourne le nom uniquement si différent du symbole affiché (évite "A → A")
  const display = getDisplay(key);
  const name = KEY_NAMES[key] ?? null;
  return name && name.toUpperCase() !== display ? name : null;
}

// ── Niveaux d'urgence — 3 paliers discrets pour éviter les re-renders trop fréquents ─
type Urgency = 'calm' | 'tense' | 'urgent';

interface PulseConfig {
  scale: number[];
  duration: number;
}
const KEY_PULSE: Record<Urgency, PulseConfig> = {
  calm: { scale: [1, 1.025, 1], duration: 1.8 },
  tense: { scale: [1, 1.055, 1], duration: 0.72 },
  urgent: { scale: [1, 1.09, 1], duration: 0.25 },
};

interface MinigameQteProps {
  config: MinigameConfig;
  onResult: (success: boolean) => void;
}

export function MinigameQte({ config, onResult }: MinigameQteProps) {
  const sequence = useMemo(() => config.keySequence ?? [], [config.keySequence]);
  const hasTimer = !!(config.timeout && config.timeout > 0);
  const timeoutPerKey =
    hasTimer && sequence.length > 0 ? Math.floor(config.timeout! / sequence.length) : 0;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(1);
  const [flash, setFlash] = useState<'success' | 'fail' | null>(null);
  const [done, setDone] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishKey = useCallback(
    (success: boolean) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);

      if (!success) {
        uiSounds.minigameFail();
        setFlash('fail');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => onResult(false), 700);
        return;
      }

      uiSounds.minigameTick();
      setFlash('success');
      const next = currentIdx + 1;
      setTimeout(() => {
        setFlash(null);
        if (next >= sequence.length) {
          uiSounds.minigameSuccess();
          setDone(true);
          setTimeout(() => onResult(true), 500);
        } else {
          setCurrentIdx(next);
          setProgress(1);
        }
      }, 280);
    },
    [currentIdx, sequence.length, onResult]
  );

  // Countdown — uniquement si timer actif
  useEffect(() => {
    if (done || !hasTimer) return;
    setProgress(1);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.max(0, 1 - (Date.now() - start) / timeoutPerKey));
    }, 30);
    timerRef.current = setTimeout(() => finishKey(false), timeoutPerKey);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, done, hasTimer]);

  // Clavier
  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      finishKey(e.key === sequence[currentIdx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIdx, sequence, finishKey, done]);

  const urgency: Urgency = hasTimer
    ? progress > 0.5
      ? 'calm'
      : progress > 0.25
        ? 'tense'
        : 'urgent'
    : 'calm';
  const pulse = KEY_PULSE[urgency];
  const barColor = progressToColor(progress);

  // Couleur et glow de la touche selon l'état
  const keyColor = done
    ? '#22c55e'
    : flash === 'success'
      ? '#22c55e'
      : flash === 'fail'
        ? '#ef4444'
        : 'white';

  const keyGlow = done
    ? '0 0 40px rgba(34,197,94,0.75)'
    : flash === 'success'
      ? '0 0 40px rgba(34,197,94,0.65)'
      : flash === 'fail'
        ? '0 0 40px rgba(239,68,68,0.75)'
        : urgency === 'urgent'
          ? '0 0 40px rgba(239,68,68,0.45), 0 0 18px rgba(167,139,250,0.3)'
          : '0 0 28px rgba(167,139,250,0.4)';

  return (
    <div style={{ width: '100%', maxWidth: 360, textAlign: 'center', position: 'relative' }}>
      {/* Keyframe CSS shake — injecté uniquement quand nécessaire */}
      {isShaking && (
        <style>{`@keyframes qteShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-9px)}35%{transform:translateX(9px)}55%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
      )}

      {/* Vignette rouge urgence — uniquement avec timer */}
      <AnimatePresence>
        {hasTimer && urgency === 'urgent' && (
          <motion.div
            key="vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.42, 0.15] }}
            exit={{ opacity: 0 }}
            transition={{ duration: pulse.duration * 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -10,
              pointerEvents: 'none',
              zIndex: 0,
              boxShadow: 'inset 0 0 50px rgba(239,68,68,1)',
              borderRadius: 20,
            }}
          />
        )}
      </AnimatePresence>

      {/* Points de progression */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {sequence.map((_, i) => (
          <motion.div
            key={`dot-${i}-${i < currentIdx ? 'done' : 'pending'}`}
            initial={i === currentIdx - 1 ? { scale: 1.5, backgroundColor: '#a78bfa' } : false}
            animate={{
              scale: 1,
              backgroundColor:
                i < currentIdx
                  ? '#22c55e'
                  : i === currentIdx
                    ? '#a78bfa'
                    : 'rgba(255,255,255,0.18)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: i === currentIdx ? '2px solid #c4b5fd' : '2px solid transparent',
            }}
          />
        ))}
      </div>

      {/* Touche à presser — slam-in à chaque nouvelle touche */}
      <div
        style={{
          marginBottom: 18,
          position: 'relative',
          zIndex: 1,
          animation: isShaking ? 'qteShake 0.45s linear' : undefined,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={done ? 'done' : currentIdx}
            initial={{ scale: 1.38, opacity: 0, y: -22 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
          >
            {/* Pulse accéléré selon l'urgence */}
            <motion.span
              animate={flash ? {} : { scale: pulse.scale }}
              transition={
                flash ? {} : { duration: pulse.duration, repeat: Infinity, ease: 'easeInOut' }
              }
              style={{
                display: 'block',
                fontSize: done ? 72 : 86,
                fontWeight: 900,
                color: keyColor,
                textShadow: keyGlow,
                fontFamily: 'var(--font-family-mono, monospace)',
                lineHeight: 1,
                transition: 'color 0.12s, text-shadow 0.12s',
              }}
            >
              {done ? '✓' : getDisplay(sequence[currentIdx] ?? '')}
            </motion.span>
            {/* Nom de la touche — affiché uniquement pour les touches spéciales (↑ → "Flèche Haut") */}
            {!done &&
              (() => {
                const name = getKeyName(sequence[currentIdx] ?? '');
                return name ? (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {name}
                  </span>
                ) : null;
              })()}
          </motion.div>
        </AnimatePresence>
      </div>

      <p
        style={{
          color: 'rgba(255,255,255,0.42)',
          fontSize: 13,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {done
          ? 'Séquence complète !'
          : hasTimer && urgency === 'urgent'
            ? '⚡ Vite !'
            : 'Appuie sur cette touche !'}
      </p>

      {/* Barre de temps — uniquement si timer actif */}
      {hasTimer && (
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            animate={urgency === 'urgent' ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
            transition={{ duration: pulse.duration, repeat: Infinity }}
            style={{
              height: '100%',
              borderRadius: 4,
              width: `${progress * 100}%`,
              background: barColor,
              transition: 'background 0.25s, width 0.03s linear',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default MinigameQte;
