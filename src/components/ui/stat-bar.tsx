import { STAT_BOUNDS, STAT_THRESHOLDS } from '@/config/gameConstants';

export interface StatBarProps {
  label: string;
  icon: string;
  value: number;
  size?: 'sm' | 'default';
}

/**
 * StatBar - Reusable RPG stat progress bar (Physique, Mentale, etc.)
 *
 * Displays a labeled progress bar with color coding:
 * - Green (>STAT_THRESHOLDS.HEALTHY), Yellow (>STAT_THRESHOLDS.WARNING), Red (≤WARNING)
 */
export function StatBar({ label, icon, value, size = 'default' }: StatBarProps) {
  const clamped = Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, value));
  const color = clamped > STAT_THRESHOLDS.HEALTHY ? 'from-green-500 to-green-600' : clamped > STAT_THRESHOLDS.WARNING ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600';
  const valueColor = clamped > STAT_THRESHOLDS.HEALTHY ? 'text-green-400' : clamped > STAT_THRESHOLDS.WARNING ? 'text-yellow-400' : 'text-red-400';

  const isSmall = size === 'sm';

  return (
    <div>
      <div className={`flex justify-between ${isSmall ? 'mb-0.5' : 'mb-1'}`}>
        <span className={`${isSmall ? 'text-xs gap-1' : 'text-sm gap-1.5'} font-medium text-foreground flex items-center`}>
          <span aria-hidden="true">{icon}</span> {label}
        </span>
        <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-bold ${valueColor}`}>
          {clamped}/{STAT_BOUNDS.MAX}
        </span>
      </div>
      <div className={`bg-muted/50 rounded-full ${isSmall ? 'h-2' : 'h-2.5'}`}>
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuemin={STAT_BOUNDS.MIN}
          aria-valuemax={STAT_BOUNDS.MAX}
          aria-valuenow={clamped}
          aria-label={label}
        />
      </div>
    </div>
  );
}
