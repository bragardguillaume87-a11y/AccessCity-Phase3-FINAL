import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, ArrowUpDown, Package, ImageIcon, Users as UsersIcon, Palette, Music, Volume2, Mic, Wind } from 'lucide-react';
import { VirtualAssetGrid } from './VirtualAssetGrid';
import { AssetsLibrarySidebar, type SidebarSection } from './AssetsLibrarySidebar';
import type { Asset } from '@/types';
import type { AssetCollection } from '@/types/collections';

export type SortOrder = 'name-asc' | 'name-desc' | 'recent' | 'oldest';

const CATEGORY_ITEMS = [
  { id: 'all',           label: 'Tous',     icon: Package   },
  { id: 'backgrounds',   label: 'Fonds',    icon: ImageIcon  },
  { id: 'characters',    label: 'Sprites',  icon: UsersIcon  },
  { id: 'illustrations', label: 'Illus.',   icon: Palette    },
  { id: 'music',         label: 'Musique',  icon: Music      },
  { id: 'sfx',           label: 'SFX',      icon: Volume2    },
  { id: 'voices',        label: 'Voix',     icon: Mic        },
  { id: 'atmosphere',    label: 'Ambiance', icon: Wind       },
];

export interface LibraryTabProps {
  assets: Asset[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  categoryCount: Record<string, number>;
  favoritesCount: number;
  recentsCount: number;
  unusedCount: number;
  protagonistCount: number;
  collections: AssetCollection[];
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onAssetClick: (asset: Asset) => void;
  onAssetDelete?: (assetPath: string, assetName?: string) => void;
  onRenameAsset?: (assetPath: string, displayName: string) => void;
  isSelectionMode: boolean;
  onSelectBackground?: (assetPath: string) => void;
  sortOrder?: SortOrder;
  onSortChange?: (order: SortOrder) => void;
}

/**
 * LibraryTab — Onglet Bibliothèque
 *
 * Layout horizontal :
 * - Sidebar gauche (~190px) : navigation par type, smart collections, dossiers perso
 * - Zone principale : barre de recherche + tri + grille virtualisée
 */
export function LibraryTab({
  assets,
  loading,
  searchQuery,
  onSearchChange,
  activeSection,
  onSectionChange,
  categoryCount,
  favoritesCount,
  recentsCount,
  unusedCount,
  protagonistCount,
  collections,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
  onAssetClick,
  onAssetDelete,
  onRenameAsset,
  isSelectionMode,
  onSelectBackground,
  sortOrder = 'name-asc',
  onSortChange,
}: LibraryTabProps) {
  const categoriesWithCount = useMemo(() => CATEGORY_ITEMS.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? (categoryCount.all ?? 0) : (categoryCount[cat.id] ?? 0),
  })), [categoryCount]);

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar gauche — navigation */}
      <AssetsLibrarySidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        categories={categoriesWithCount}
        favoritesCount={favoritesCount}
        recentsCount={recentsCount}
        unusedCount={unusedCount}
        protagonistCount={protagonistCount}
        collections={collections}
        onCreateCollection={onCreateCollection}
        onDeleteCollection={onDeleteCollection}
        onRenameCollection={onRenameCollection}
      />

      {/* Zone principale : toolbar + grille */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Toolbar : recherche + tri */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher…"
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

          {onSortChange && (
            <Select value={sortOrder} onValueChange={(v) => onSortChange(v as SortOrder)}>
              <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
                <ArrowUpDown className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end" avoidCollisions sideOffset={4}>
                <SelectItem value="name-asc">Nom A→Z</SelectItem>
                <SelectItem value="name-desc">Nom Z→A</SelectItem>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="oldest">Plus anciens</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grille virtualisée */}
        <VirtualAssetGrid
          assets={assets}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onAssetClick={onAssetClick}
          onAssetDelete={onAssetDelete}
          onRenameAsset={onRenameAsset}
          isSelectionMode={isSelectionMode}
          onSelectBackground={onSelectBackground}
        />
      </div>
    </div>
  );
}
