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
import type { AssetStats } from '@/types';

/**
 * Props for AssetFilters component
 */
export interface AssetFiltersProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Currently active category filter */
  activeCategory: string;
  /** Callback when category filter changes */
  onCategoryChange: (category: string) => void;
  /** Asset statistics for badge counts */
  stats: AssetStats;
  /** Number of favorite assets */
  favoritesCount: number;
  /** Set of selected asset IDs */
  selectedAssets: Set<string>;
  /** Number of filtered assets */
  filteredAssetsCount: number;
  /** Callback for select all checkbox */
  onSelectAll: () => void;
  /** Callback for bulk delete action */
  onBulkDelete: () => void;
  /** Set of active filter tags */
  filterTags: Set<string>;
  /** Callback to toggle a filter tag */
  onToggleFilterTag: (tag: string) => void;
  /** Array of all available tags */
  allTags: string[];
  /** Whether in selection mode (simplified filters) */
  isSelectionMode: boolean;
}

/**
 * AssetFilters - Search, category filters, bulk actions, and tag filters
 *
 * Comprehensive filtering toolbar with:
 * - **Search bar** with clear button
 * - **Category filters** with counts (All, Favorites, Backgrounds, Characters, Illustrations)
 * - **Bulk selection** (select all checkbox + delete button)
 * - **Tag filters** (toggle tags to filter assets)
 *
 * In selection mode, only search bar is shown (simplified UI).
 *
 * @example
 * ```tsx
 * <AssetFilters
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   activeCategory={activeCategory}
 *   onCategoryChange={setActiveCategory}
 *   stats={stats}
 *   favoritesCount={favorites.length}
 *   selectedAssets={selectedAssets}
 *   filteredAssetsCount={filteredAssets.length}
 *   onSelectAll={toggleSelectAll}
 *   onBulkDelete={handleBulkDelete}
 *   filterTags={filterTags}
 *   onToggleFilterTag={toggleFilterTag}
 *   allTags={allTags}
 *   isSelectionMode={false}
 * />
 * ```
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
}: AssetFiltersProps) {
  return (
    <div className="px-8 py-4 border-b bg-card/50">
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isSelectionMode ? "Rechercher un arrière-plan..." : "Rechercher un asset..."}
            className="pl-10 pr-10 bg-background border-border text-foreground"
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
