import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  X,
  Package,
  Star,
  ImageIcon,
  Users as UsersIcon,
  Palette,
  Tag,
  Trash2
} from 'lucide-react';

/**
 * AssetFilters - Search, category filters, bulk actions, and tag filters
 *
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Callback when search changes
 * @param {string} props.activeCategory - Currently active category
 * @param {Function} props.onCategoryChange - Callback when category changes
 * @param {Object} props.stats - Statistics for badge counts
 * @param {number} props.favoritesCount - Number of favorites
 * @param {Set} props.selectedAssets - Set of selected asset IDs
 * @param {number} props.filteredAssetsCount - Number of filtered assets
 * @param {Function} props.onSelectAll - Callback for select all checkbox
 * @param {Function} props.onBulkDelete - Callback for bulk delete
 * @param {Set} props.filterTags - Set of active filter tags
 * @param {Function} props.onToggleFilterTag - Callback to toggle a filter tag
 * @param {Array} props.allTags - Array of all available tags
 * @param {boolean} props.isSelectionMode - Whether in selection mode (simplified filters)
 */
export function AssetFilters({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  stats,
  favoritesCount,
  selectedAssets,
  filteredAssetsCount,
  onSelectAll,
  onBulkDelete,
  filterTags,
  onToggleFilterTag,
  allTags,
  isSelectionMode
}) {
  return (
    <div className="px-8 py-4 border-b bg-slate-800/50">
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isSelectionMode ? "Rechercher un arrière-plan..." : "Rechercher un asset..."}
            className="pl-10 pr-10 bg-slate-900 border-slate-700 text-slate-100"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Filters - Simplified in selection mode */}
        {!isSelectionMode && (
          <div className="flex gap-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('all')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Tous
              <Badge variant="secondary" className="ml-1">
                {stats.categoryCount.all}
              </Badge>
            </Button>
            <Button
              variant={activeCategory === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('favorites')}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              Favoris
              <Badge variant="secondary" className="ml-1">
                {favoritesCount}
              </Badge>
            </Button>
            <Button
              variant={activeCategory === 'backgrounds' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('backgrounds')}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Arrière-plans
              <Badge variant="secondary" className="ml-1">
                {stats.categoryCount.backgrounds}
              </Badge>
            </Button>
            <Button
              variant={activeCategory === 'characters' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('characters')}
              className="gap-2"
            >
              <UsersIcon className="h-4 w-4" />
              Sprites
              <Badge variant="secondary" className="ml-1">
                {stats.categoryCount.characters}
              </Badge>
            </Button>
            <Button
              variant={activeCategory === 'illustrations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('illustrations')}
              className="gap-2"
            >
              <Palette className="h-4 w-4" />
              Illustrations
              <Badge variant="secondary" className="ml-1">
                {stats.categoryCount.illustrations}
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* Phase 5: Bulk Actions & Tags Filter - Hide in selection mode */}
      {!isSelectionMode && filteredAssetsCount > 0 && (
        <div className="flex items-center justify-between mt-4">
          {/* Bulk Selection */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedAssets.size === filteredAssetsCount && filteredAssetsCount > 0}
                onCheckedChange={onSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Tout sélectionner
              </label>
            </div>

            {selectedAssets.size > 0 && (
              <>
                <Badge variant="secondary" className="px-3">
                  {selectedAssets.size} sélectionné{selectedAssets.size > 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer la sélection
                </Button>
              </>
            )}
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrer par tags:</span>
              <div className="flex gap-1 flex-wrap">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filterTags.has(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => onToggleFilterTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

AssetFilters.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  stats: PropTypes.shape({
    categoryCount: PropTypes.object.isRequired
  }).isRequired,
  favoritesCount: PropTypes.number.isRequired,
  selectedAssets: PropTypes.instanceOf(Set).isRequired,
  filteredAssetsCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onBulkDelete: PropTypes.func.isRequired,
  filterTags: PropTypes.instanceOf(Set).isRequired,
  onToggleFilterTag: PropTypes.func.isRequired,
  allTags: PropTypes.array.isRequired,
  isSelectionMode: PropTypes.bool.isRequired
};
