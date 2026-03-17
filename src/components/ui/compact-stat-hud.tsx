/**
 * CompactStatHUD — Overlay HUD RPG ultra-compact
 *
 * Affiche Physique et Mentale sous forme d'icône + chiffre coloré,
 * sans libellé textuel. Style inspiré des RPG (Undertale, Celeste, Hades).
 *
 * - Icône ❤ (Heart) pour Physique    → rouge
 * - Icône ⚡ (Zap)  pour Mentale     → cyan
 * - Couleur du chiffre : vert >66, jaune >33, rouge ≤33
 * - Icône pulse si valeur critique (≤33)
 * - Barre fine (3px) sous chaque stat pour lecture rapide au survol
 * - Animation Mother 2 : compteur odomètre + badge delta flottant lors d'un changement
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap } from 'lucide-react';
import { STAT_BOUNDS, STAT_THRESHOLDS } from '@/config/gameConstants';

// ── Animation constants (module-level — références stables) ───────────────────
//
// ⚠️ PERFORMANCE : Ces objets DOIVENT être déclarés HORS du composant.
// S'ils étaient inline, React les recrée à chaque render → Framer Motion
// détecte de "nouveaux" tableaux et peut relancer les animations, causant
// un stutter visuel sans charge CPU mesurable (bug connu Chromium + WAAPI).

const HEARTBEAT_NORMAL_ANIM   = { scale: [1, 1.10, 0.96, 1.05, 1] as number[] };
const HEARTBEAT_CRITICAL_ANIM = { scale: [1, 1.32, 0.91, 1.24, 1] as number[] };
const FLICKER_NORMAL_ANIM     = { opacity: [1, 0.65, 1, 0.78, 1] as number[] };
const FLICKER_CRITICAL_ANIM   = { opacity: [1, 0.22, 1, 0.18, 1] as number[] };

const HEARTBEAT_NORMAL_TRANS = {
  times: [0, 0.12, 0.25, 0.38, 1], duration: 2.2,
  repeat: Infinity, ease: 'easeInOut' as const,
};
const HEARTBEAT_CRITICAL_TRANS = {
  times: [0, 0.10, 0.20, 0.30, 1], duration: 0.80,
  repeat: Infinity, ease: 'easeInOut' as const,
};
const FLICKER_NORMAL_TRANS = {
  times: [0, 0.08, 0.22, 0.55, 1], duration: 1.9,
  repeat: Infinity, ease: 'easeOut' as const,
};
const FLICKER_CRITICAL_TRANS = {
  times: [0, 0.07, 0.15, 0.45, 1], duration: 0.60,
  repeat: Infinity, ease: 'easeOut' as const,
};
const CRITICAL_PULSE_ANIM  = { opacity: [0, 0.7, 0] as number[] };
const CRITICAL_PULSE_TRANS = { duration: 1.5, repeat: Infinity };

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CompactStatHUDProps {
  physique: number;
  mentale: number;
  /** Taille de la fonte — mis à l'échelle avec le canvas si besoin */
  scaleFactor?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clampStat(v: number): number {
  return Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, v));
}

function statColor(v: number): string {
  if (v > STAT_THRESHOLDS.HEALTHY) return 'text-emerald-400';
  if (v > STAT_THRESHOLDS.WARNING)  return 'text-amber-400';
  return 'text-red-400';
}

function barColor(v: number): string {
  if (v > STAT_THRESHOLDS.HEALTHY) return 'bg-emerald-400';
  if (v > STAT_THRESHOLDS.WARNING)  return 'bg-amber-400';
  return 'bg-red-400';
}

// ── Mother 2 rolling counter hook ─────────────────────────────────────────────
//
// Quand la valeur cible change :
//   1. Le chiffre affiché « chasse » la nouvelle valeur sur ~700ms (ease-out cubic)
//   2. Un badge delta (+N / -N) apparaît et monte en se dissipant
//   3. Le chiffre grossit brièvement (scale pulse) avec un halo coloré

interface Delta {
  amount: number;
  /** Clé unique pour forcer le remontage AnimatePresence même si le delta est identique */
  key: number;
}

function useRollingCounter(targetValue: number) {
  const [displayValue, setDisplayValue]     = useState(targetValue);
  const [delta, setDelta]                   = useState<Delta | null>(null);
  const [isJustChanged, setIsJustChanged]   = useState(false);
  const prevRef      = useRef(targetValue);
  const rafRef       = useRef<number>(0);
  const deltaKeyRef  = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === targetValue) return;

    const diff = targetValue - prev;
    deltaKeyRef.current += 1;
    setDelta({ amount: diff, key: deltaKeyRef.current });
    setIsJustChanged(true);
    prevRef.current = targetValue;

    // ── Odometer rolling (Mother 2 style) ──────────────────────────────────
    const DURATION = 700;
    const startTime = performance.now();
    const startVal  = prev;
    const endVal    = targetValue;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic → décélération progressive comme un vrai odomètre
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.round(startVal + (endVal - startVal) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setIsJustChanged(false);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    // Badge delta visible pendant 1.4 s
    const clearTimer = setTimeout(() => setDelta(null), 1400);

    return () => {
      clearTimeout(clearTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue]);

  return { displayValue, delta, isJustChanged };
}

// ── Stat Row ───────────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: React.ReactNode;
  value: number;
  iconColor: string;
  /** 'heartbeat' → lub-dub sur scale | 'flicker' → électrique sur opacity */
  animationType: 'heartbeat' | 'flicker';
  sf: number;
  /** Libellé affiché après l'icône */
  label?: string;
}

function StatRow({ icon, value, iconColor, animationType, sf, label }: StatRowProps) {
  const clamped = clampStat(value);

  // ── Rolling counter (Mother 2 odometer) ───────────────────────────────────
  const { displayValue, delta, isJustChanged } = useRollingCounter(clamped);

  const isCritical = clamped <= STAT_THRESHOLDS.WARNING;
  const numColor   = statColor(clamped);
  const bar        = barColor(clamped);
  const iconSz     = Math.max(12, Math.round(14 * sf));
  const textSz     = Math.max(11, Math.round(13 * sf));
  const deltaSz    = Math.max(9,  Math.round(11 * sf));

  // Couleur du halo selon direction du changement
  const glowColor = delta && delta.amount > 0
    ? 'rgba(52,211,153,0.95)'   // vert émeraude  → gain
    : 'rgba(248,113,113,0.95)'; // rouge          → perte

  // Sélection des constantes d'animation stables (module-level)
  const iconAnimate = animationType === 'heartbeat'
    ? (isCritical ? HEARTBEAT_CRITICAL_ANIM : HEARTBEAT_NORMAL_ANIM)
    : (isCritical ? FLICKER_CRITICAL_ANIM   : FLICKER_NORMAL_ANIM);

  const iconTransition = animationType === 'heartbeat'
    ? (isCritical ? HEARTBEAT_CRITICAL_TRANS : HEARTBEAT_NORMAL_TRANS)
    : (isCritical ? FLICKER_CRITICAL_TRANS   : FLICKER_NORMAL_TRANS);

  return (
    <div className="flex flex-col gap-0.5">
      {/* justify-between : icône+label à gauche, chiffre aligné à droite */}
      <div className="flex items-center justify-between gap-2">

        {/* Groupe gauche : icône + label */}
        <div className="flex items-center gap-1.5">
          {/* Icône — animation idle constante, plus intense si critique */}
          <motion.span
            className={iconColor}
            animate={iconAnimate}
            transition={iconTransition}
            aria-hidden="true"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <span style={{ width: iconSz, height: iconSz, display: 'flex' }}>
              {icon}
            </span>
          </motion.span>

          {/* Libellé — toujours après l'icône (layout fixe) */}
          {label && (
            <span
              className="text-white/40 uppercase"
              style={{
                fontSize: Math.max(8, Math.round(9 * sf)),
                lineHeight: 1,
                fontFamily: "'Audiowide', sans-serif",
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          )}
        </div>

        {/* Chiffre + badge delta — alignés à droite */}
        <div className="relative flex items-center justify-end" style={{ minWidth: Math.round(28 * sf) }}>

          {/* ── Badge delta flottant (Mother 2 style) ──────────────────── */}
          <AnimatePresence>
            {delta !== null && (
              <motion.span
                key={delta.key}
                className={`absolute pointer-events-none font-bold tabular-nums z-10 ${
                  delta.amount > 0 ? 'text-emerald-300' : 'text-red-400'
                }`}
                style={{
                  fontSize: deltaSz,
                  right: 0,
                  bottom: '100%',
                  marginBottom: 2,
                  textShadow: `0 0 8px ${glowColor}`,
                  whiteSpace: 'nowrap',
                }}
                initial={{ opacity: 1, y: 0, scale: 1.3 }}
                animate={{ opacity: 0, y: -18 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                aria-hidden="true"
              >
                {delta.amount > 0 ? `+${delta.amount}` : `${delta.amount}`}
              </motion.span>
            )}
          </AnimatePresence>

          {/* ── Chiffre principal — scale pulse + halo au changement ─── */}
          <motion.span
            className={`font-bold tabular-nums ${numColor}`}
            style={{ fontSize: textSz, lineHeight: 1 }}
            animate={
              isJustChanged
                ? {
                    scale: [1, 1.55, 1.12, 1.0],
                    textShadow: [
                      '0 0 0px transparent',
                      `0 0 18px ${glowColor}`,
                      `0 0 8px ${glowColor}`,
                      '0 0 0px transparent',
                    ],
                  }
                : { scale: 1, textShadow: '0 0 0px transparent' }
            }
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            {displayValue}
          </motion.span>
        </div>
      </div>

      {/* Barre fine 3px — lecture rapide */}
      <div className="h-[3px] rounded-full bg-white/10 overflow-hidden w-full">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={false}
          animate={{ width: `${(clamped / STAT_BOUNDS.MAX) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          role="progressbar"
          aria-valuemin={STAT_BOUNDS.MIN}
          aria-valuemax={STAT_BOUNDS.MAX}
          aria-valuenow={clamped}
        />
      </div>

      {/* Alerte visuelle critique — éclat rouge */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: `rgba(239,68,68,0.08)`, zIndex: -1 }}
          animate={CRITICAL_PULSE_ANIM}
          transition={CRITICAL_PULSE_TRANS}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export function CompactStatHUD({ physique, mentale, scaleFactor = 1 }: CompactStatHUDProps) {
  const sf = Math.max(0.5, Math.min(2, scaleFactor));

  return (
    <div
      className="relative flex flex-col gap-2 pointer-events-none"
      style={{
        // ⚠️ backdrop-filter: blur() supprimé — combiné avec overflow:hidden du parent
        // (MainCanvas), Chromium crée une couche de composition défectueuse causant
        // du stutter visuel sans charge CPU/GPU mesurable. Fond plus opaque en compensation.
        background: 'rgba(3,7,18,0.82)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: Math.round(12 * sf),
        padding: `${Math.round(8 * sf)}px ${Math.round(12 * sf)}px`,
        minWidth: Math.round(72 * sf),
      }}
      role="status"
      aria-label={`Physique : ${clampStat(physique)}, Mentale : ${clampStat(mentale)}`}
    >
      <StatRow
        icon={<Heart className="w-full h-full" />}
        value={physique}
        iconColor="text-rose-400"
        animationType="heartbeat"
        sf={sf}
        label="physique"
      />
      <StatRow
        icon={<Zap className="w-full h-full" />}
        value={mentale}
        iconColor="text-cyan-400"
        animationType="flicker"
        sf={sf}
        label="mental"
      />
    </div>
  );
}
