import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Sparkles,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import type { AssetStats } from '@/types';

/**
 * Props for AssetStatsCards component
 */
export interface AssetStatsCardsProps {
  /** Asset statistics object */
  stats: AssetStats;
  /** Number of filtered assets currently displayed */
  filteredCount: number;
}

/**
 * AssetStatsCards - Dashboard statistics for asset library
 *
 * Displays 4 metric cards showing:
 * - Total assets count (all assets in library)
 * - Used assets count (assets referenced in scenes/characters)
 * - Unused assets count (orphaned assets)
 * - Filtered assets count (currently visible after filters)
 *
 * Each card has:
 * - Color-coded icon and border
 * - Large number display
 * - Descriptive label
 *
 * @example
 * ```tsx
 * <AssetStatsCards
 *   stats={{
 *     total: 150,
 *     used: 120,
 *     unused: 30,
 *     categoryCount: { all: 150, backgrounds: 50, characters: 80, illustrations: 20 }
 *   }}
 *   filteredCount={25}
 * />
 * ```
 */
export function AssetStatsCards({ stats, filteredCount }: AssetStatsCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Total Assets */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </CardContent>
      </Card>

      {/* Used Assets */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-green-500" />
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.used}</div>
            <div className="text-xs text-muted-foreground">Utilisés</div>
          </div>
        </CardContent>
      </Card>

      {/* Unused Assets */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <div>
            <div className="text-2xl font-bold text-amber-600">{stats.unused}</div>
            <div className="text-xs text-muted-foreground">Non utilisés</div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Assets */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <SlidersHorizontal className="h-8 w-8 text-primary" />
          <div>
            <div className="text-2xl font-bold">{filteredCount}</div>
            <div className="text-xs text-muted-foreground">Filtrés</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
