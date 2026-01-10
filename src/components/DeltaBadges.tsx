import React from 'react';

/**
 * Variable delta information
 */
export interface DeltaBadge {
  /** Unique identifier for the delta (used as React key) */
  id: string;
  /** Variable name being changed */
  variable: string;
  /** Change amount (positive, negative, or zero) */
  delta: number;
}

/**
 * Props for DeltaBadges component
 */
export interface DeltaBadgesProps {
  /** Array of variable deltas to display */
  deltas: DeltaBadge[];
}

/**
 * DeltaBadges - Animated Variable Change Indicators
 *
 * Displays animated badges showing changes to game variables (health, score, etc.).
 * Badges rise and fade out using CSS keyframe animations.
 *
 * Features:
 * - Color-coded badges (green for positive, red for negative, gray for zero)
 * - Smooth rise-and-fade animation (1.5s duration)
 * - Non-interactive overlay (pointer-events-none)
 * - Automatically displays sign (+ for positive, - for negative)
 *
 * Position: Fixed at top-left (64px top, 280px left) - adjust as needed.
 *
 * @example
 * ```tsx
 * <DeltaBadges
 *   deltas={[
 *     { id: 'health-1', variable: 'Santé', delta: -10 },
 *     { id: 'score-1', variable: 'Score', delta: 50 }
 *   ]}
 * />
 * ```
 */
export default function DeltaBadges({ deltas }: DeltaBadgesProps) {
  return (
    <div className="pointer-events-none absolute z-50" style={{ top: '64px', left: '280px' }}>
      {deltas.map(d => (
        <div
          key={d.id}
          className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold transition-opacity duration-700 ${
            d.delta > 0
              ? 'bg-emerald-600/90 text-white border border-emerald-400/60'
              : d.delta < 0
              ? 'bg-rose-600/90 text-white border border-rose-400/60'
              : 'bg-slate-600/90 text-white border border-slate-400/60'
          }`}
          style={{ animation: 'riseFade 1.5s ease forwards' }}
        >
          {d.variable} {d.delta > 0 ? '+' : ''}{d.delta}
        </div>
      ))}
      <style>{`
        @keyframes riseFade {
          0% { opacity: 0; transform: translateY(8px) scale(0.98); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
