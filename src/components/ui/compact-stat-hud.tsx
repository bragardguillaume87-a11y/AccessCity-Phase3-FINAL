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
 *
 * Usage :
 *   <CompactStatHUD physique={stats.physique} mentale={stats.mentale} />
 */

import { motion } from 'framer-motion';
import { Heart, Zap } from 'lucide-react';
import { STAT_BOUNDS, STAT_THRESHOLDS } from '@/config/gameConstants';

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

// ── Stat Row ───────────────────────────────────────────────────────────────────

interface StatRowProps {
  icon: React.ReactNode;
  value: number;
  iconColor: string;
  /** 'heartbeat' → lub-dub sur scale | 'flicker' → électrique sur opacity */
  animationType: 'heartbeat' | 'flicker';
  sf: number;
}

function StatRow({ icon, value, iconColor, animationType, sf }: StatRowProps) {
  const clamped    = clampStat(value);
  const isCritical = clamped <= STAT_THRESHOLDS.WARNING;
  const numColor   = statColor(clamped);
  const bar        = barColor(clamped);
  const iconSz     = Math.max(12, Math.round(14 * sf));
  const textSz     = Math.max(11, Math.round(13 * sf));

  // Heart : scale lub-dub (deux pics proches + long silence)
  // Zap   : opacity flicker électrique
  const iconAnimate = animationType === 'heartbeat'
    ? { scale: isCritical ? [1, 1.32, 0.91, 1.24, 1] : [1, 1.10, 0.96, 1.05, 1] }
    : { opacity: isCritical ? [1, 0.22, 1, 0.18, 1] : [1, 0.65, 1, 0.78, 1] };

  const iconTransition = animationType === 'heartbeat'
    ? {
        times:    isCritical ? [0, 0.10, 0.20, 0.30, 1] : [0, 0.12, 0.25, 0.38, 1],
        duration: isCritical ? 0.80 : 2.2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      }
    : {
        times:    isCritical ? [0, 0.07, 0.15, 0.45, 1] : [0, 0.08, 0.22, 0.55, 1],
        duration: isCritical ? 0.60 : 1.9,
        repeat: Infinity,
        ease: 'easeOut' as const,
      };

  return (
    <div className="flex flex-col gap-0.5">
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

        {/* Chiffre — couleur dynamique selon niveau */}
        <span
          className={`font-bold tabular-nums ${numColor}`}
          style={{ fontSize: textSz, lineHeight: 1 }}
        >
          {clamped}
        </span>
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
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
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
        background: 'rgba(3,7,18,0.55)',
        backdropFilter: 'blur(8px)',
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
      />
      <StatRow
        icon={<Zap className="w-full h-full" />}
        value={mentale}
        iconColor="text-cyan-400"
        animationType="flicker"
        sf={sf}
      />
    </div>
  );
}
