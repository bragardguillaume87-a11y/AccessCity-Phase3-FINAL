import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Trash2, Search, X, Package, ImageIcon, Users as UsersIcon, Palette } from 'lucide-react';
import { SelectableAssetCard } from './SelectableAssetCard';
import type { Asset } from '@/types';

export interface ManagementTabProps {
  assets: Asset[];
  onBulkDelete: (paths: string[]) => Promise<void>;
  deleting: boolean;
  getAssetUsage?: (assetPath: string) => { scenes: string[]; characters: string[] };
}

/**
 * ManagementTab - Onglet Gestion des assets
 *
 * Mode sélection multiple avec:
 * - Barre d'actions fixe (sélectionner tout, supprimer)
 * - Grille de cartes sélectionnables
 * - Filtre par catégorie et recherche
 */
export function ManagementTab({
  assets,
  onBulkDelete,
  deleting,
  getAssetUsage
}: ManagementTabProps) {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchQuery, activeCategory]);

  // Category counts
  const categoryCount = useMemo(() => ({
    all: assets.length,
    backgrounds: assets.filter(a => a.category === 'backgrounds').length,
    characters: assets.filter(a => a.category === 'characters').length,
    illustrations: assets.filter(a => a.category === 'illustrations').length,
  }), [assets]);

  const toggleSelection = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedAssets.size === 0) return;

    const pathsToDelete = Array.from(selectedAssets);

    // Check for used assets
    let usageWarning = '';
    if (getAssetUsage) {
      const usedAssets: string[] = [];
      for (const path of pathsToDelete) {
        const usage = getAssetUsage(path);
        if (usage.scenes.length > 0 || usage.characters.length > 0) {
          const asset = assets.find(a => a.id === path);
          usedAssets.push(asset?.name || path);
        }
      }
      if (usedAssets.length > 0) {
        usageWarning = `\n\n⚠️ Attention: ${usedAssets.length} asset(s) sont utilisés dans le projet:\n• ${usedAssets.slice(0, 5).join('\n• ')}${usedAssets.length > 5 ? `\n... et ${usedAssets.length - 5} autre(s)` : ''}`;
      }
    }

    const confirmed = window.confirm(
      `Supprimer ${selectedAssets.size} asset(s) sélectionné(s) ?${usageWarning}\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    await onBulkDelete(pathsToDelete);
    setSelectedAssets(new Set());
  };

  const categories = [
    { id: 'all', label: 'Tous', icon: Package, count: categoryCount.all },
    { id: 'backgrounds', label: 'Fonds', icon: ImageIcon, count: categoryCount.backgrounds },
    { id: 'characters', label: 'Sprites', icon: UsersIcon, count: categoryCount.characters },
    { id: 'illustrations', label: 'Illus.', icon: Palette, count: categoryCount.illustrations },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-management"
              checked={selectedAssets.size > 0 && selectedAssets.size === filteredAssets.length}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all-management" className="text-sm cursor-pointer">
              Tout sélectionner
            </label>
          </div>

          {/* Selection count */}
          {selectedAssets.size > 0 && (
            <Badge variant="secondary" className="px-2">
              {selectedAssets.size} sélectionné{selectedAssets.size > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Delete Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={selectedAssets.size === 0 || deleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {deleting ? 'Suppression...' : 'Supprimer'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 py-3 border-b shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer..."
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-1">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon className="h-3 w-3" />
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Aucun asset à gérer</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <SelectableAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssets.has(asset.id)}
                  onToggle={() => toggleSelection(asset.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
