import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Package, ImageIcon, Users as UsersIcon, Palette, Star, ArrowUpDown, Music, Volume2, Mic, Wind } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimpleAssetCard } from './SimpleAssetCard';
import { AudioAssetCard } from './AudioAssetCard';
import type { Asset } from '@/types';

// Audio category IDs — uses AudioAssetCard (player + waveform)
const AUDIO_CATEGORIES = ['music', 'sfx', 'voices', 'atmosphere'];

export type SortOrder = 'name-asc' | 'name-desc' | 'recent' | 'oldest';

export interface LibraryTabProps {
  assets: Asset[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCount: Record<string, number>;
  favoritesCount: number;
  onAssetClick: (asset: Asset) => void;
  onAssetDelete?: (assetPath: string, assetName?: string) => void;
  isSelectionMode: boolean;
  onSelectBackground?: (assetPath: string) => void;
  sortOrder?: SortOrder;
  onSortChange?: (order: SortOrder) => void;
}

/**
 * LibraryTab - Onglet Bibliothèque
 *
 * Navigation et visualisation des assets avec:
 * - Barre de recherche
 * - Filtres par catégorie (compacts)
 * - Grille d'assets en 4 colonnes
 */
export function LibraryTab({
  assets,
  loading,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categoryCount,
  favoritesCount,
  onAssetClick,
  onAssetDelete,
  isSelectionMode,
  onSelectBackground,
  sortOrder = 'name-asc',
  onSortChange
}: LibraryTabProps) {
  const categories = [
    { id: 'all', label: 'Tous', icon: Package, count: categoryCount.all },
    { id: 'favorites', label: 'Favoris', icon: Star, count: favoritesCount },
    { id: 'backgrounds', label: 'Fonds', icon: ImageIcon, count: categoryCount.backgrounds },
    { id: 'characters', label: 'Sprites', icon: UsersIcon, count: categoryCount.characters },
    { id: 'illustrations', label: 'Illus.', icon: Palette, count: categoryCount.illustrations },
    { id: 'music', label: 'Musique', icon: Music, count: categoryCount.music || 0 },
    { id: 'sfx', label: 'SFX', icon: Volume2, count: categoryCount.sfx || 0 },
    { id: 'voices', label: 'Voix', icon: Mic, count: categoryCount.voices || 0 },
    { id: 'atmosphere', label: 'Ambiance', icon: Wind, count: categoryCount.atmosphere || 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filters Bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 flex-1">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onCategoryChange(cat.id)}
            >
              <cat.icon className="h-3.5 w-3.5" />
              <span className="ml-1 hidden sm:inline">{cat.label}</span>
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Sort Selector */}
        {onSortChange && (
          <Select value={sortOrder} onValueChange={(v) => onSortChange(v as SortOrder)}>
            <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
              <ArrowUpDown className="h-3 w-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nom A→Z</SelectItem>
              <SelectItem value="name-desc">Nom Z→A</SelectItem>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Assets Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'Aucun résultat' : 'Aucun asset dans cette catégorie'}
              </p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => onSearchChange('')}>
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {assets.map((asset) => {
                // Use AudioAssetCard for audio assets
                if (AUDIO_CATEGORIES.includes(asset.category)) {
                  return (
                    <AudioAssetCard
                      key={asset.id}
                      asset={asset}
                      onClick={() => onAssetClick(asset)}
                      onDelete={onAssetDelete && !isSelectionMode ? () => onAssetDelete(asset.path, asset.name) : undefined}
                      isSelectionMode={isSelectionMode}
                      onSelectAudio={onSelectBackground ? () => onSelectBackground(asset.path) : undefined}
                    />
                  );
                }

                // Use SimpleAssetCard for image assets
                return (
                  <SimpleAssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={() => onAssetClick(asset)}
                    onDelete={onAssetDelete && !isSelectionMode ? () => onAssetDelete(asset.path, asset.name) : undefined}
                    isSelectionMode={isSelectionMode}
                    onSelectBackground={onSelectBackground ? () => onSelectBackground(asset.path) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
