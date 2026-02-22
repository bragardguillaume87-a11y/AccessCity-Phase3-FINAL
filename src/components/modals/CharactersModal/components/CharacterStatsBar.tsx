import { Users, CheckCircle, Image } from 'lucide-react';
import type { TotalCharacterStats } from '../hooks/useCharacterStats';

/**
 * Props for CharacterStatsBar component
 */
export interface CharacterStatsBarProps {
  /** Total aggregated stats */
  totalStats: TotalCharacterStats;
}

/**
 * CharacterStatsBar - Global statistics bar
 *
 * Displays aggregated statistics across all characters in a compact horizontal bar.
 * Placed in the modal header below the title.
 *
 * ## Features
 * - **Total count:** Total number of characters
 * - **Complete percentage:** Characters at 100% completeness
 * - **With sprites percentage:** Characters with at least one sprite
 * - **Icons:** Visual indicators for each stat
 * - **Responsive:** Adapts to available width
 *
 * ## Layout
 * ```
 * [Users icon] X personnages | [Check icon] X% complets | [Image icon] X% avec sprites
 * ```
 *
 * @example
 * ```tsx
 * <CharacterStatsBar totalStats={totalStats} />
 * ```
 */
export function CharacterStatsBar({ totalStats }: CharacterStatsBarProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
      {/* Total Characters */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span>
          <span className="font-semibold text-foreground">{totalStats.total}</span>
          {' '}personnage{totalStats.total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Complete Characters */}
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span>
          <span className="font-semibold text-foreground">{totalStats.completePercentage}%</span>
          {' '}complets
          <span className="text-xs ml-1">({totalStats.complete}/{totalStats.total})</span>
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* With Sprites */}
      <div className="flex items-center gap-2">
        <Image className="h-4 w-4 text-blue-600" />
        <span>
          <span className="font-semibold text-foreground">{totalStats.withSpritesPercentage}%</span>
          {' '}avec sprites
          <span className="text-xs ml-1">({totalStats.withSprites}/{totalStats.total})</span>
        </span>
      </div>
    </div>
  );
}

export default CharacterStatsBar;
