import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Sparkles,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';

/**
 * AssetStatsCards - Dashboard statistics for asset library
 *
 * Displays 4 cards showing:
 * - Total assets count
 * - Used assets count (in scenes/characters)
 * - Unused assets count
 * - Filtered assets count
 *
 * @param {Object} props
 * @param {Object} props.stats - Statistics object
 * @param {number} props.stats.total - Total number of assets
 * @param {number} props.stats.used - Number of used assets
 * @param {number} props.stats.unused - Number of unused assets
 * @param {number} props.filteredCount - Number of filtered assets currently displayed
 */
export function AssetStatsCards({ stats, filteredCount }) {
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

AssetStatsCards.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    used: PropTypes.number.isRequired,
    unused: PropTypes.number.isRequired,
    categoryCount: PropTypes.object.isRequired
  }).isRequired,
  filteredCount: PropTypes.number.isRequired
};
