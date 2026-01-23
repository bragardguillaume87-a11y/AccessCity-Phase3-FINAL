import { Card, CardContent } from '@/components/ui/card';
import { Users, Sparkles, Eye } from 'lucide-react';
import type { TotalCharacterStats } from '../hooks/useCharacterStats';

/**
 * Props for CharacterStatsBar component
 */
export interface CharacterStatsBarProps {
  /** Aggregate statistics for all characters */
  totalStats: TotalCharacterStats;
}

/**
 * Individual stat configuration for display
 */
interface StatConfig {
  id: string;
  label: string;
  value: number;
  icon: typeof Users;
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  iconColor: string;
  valueColor: string;
}

/**
 * CharacterStatsBar - Displays aggregate statistics for all characters
 *
 * Shows three key metrics in visually distinct cards:
 * - Total number of characters
 * - Number of complete characters (all moods have sprites)
 * - Number of characters with at least one sprite
 *
 * Inspired by Nintendo UX Guide: Visual stats cards with smooth animations
 *
 * ## Theme Improvements (Phase 6D)
 * - bg-green-50 → bg-green-500/10 (dark mode compatible)
 * - bg-blue-50 → bg-blue-500/10 (dark mode compatible)
 * - text-green-700 → text-green-400 (better contrast on dark)
 * - text-blue-700 → text-blue-400 (better contrast on dark)
 *
 * ## UX Enhancements
 * - Hover: scale(1.05) for "magnetic lift" effect
 * - Transition: cubic-bezier(0.4, 0, 0.2, 1) for smooth feel
 *
 * @example
 * ```tsx
 * <CharacterStatsBar
 *   totalStats={{
 *     total: 10,
 *     complete: 5,
 *     withSprites: 8
 *   }}
 * />
 * ```
 */
export function CharacterStatsBar({ totalStats }: CharacterStatsBarProps) {
  const stats: StatConfig[] = [
    {
      id: 'total',
      label: 'Total',
      value: totalStats.total,
      icon: Users,
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20',
      iconBgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-foreground'
    },
    {
      id: 'complete',
      label: 'Complets',
      value: totalStats.complete,
      icon: Sparkles,
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      iconBgColor: 'bg-accent/10',
      iconColor: 'text-accent',
      valueColor: 'text-accent'
    },
    {
      id: 'withSprites',
      label: 'Avec sprites',
      value: totalStats.withSprites,
      icon: Eye,
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      iconBgColor: 'bg-primary/15',
      iconColor: 'text-primary',
      valueColor: 'text-primary'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className={`
              ${stat.borderColor} ${stat.bgColor}
              transition-all duration-200 ease-out
              hover:scale-105 hover:shadow-lg
              cursor-default
            `}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${stat.iconBgColor}`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default CharacterStatsBar;
