import { useState, useMemo, useEffect } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { useScenesStore, useCharactersStore } from '../../stores/index';
import { useFavorites } from './AssetsLibraryModal/hooks/useFavorites';
import { LibraryTab, type SortOrder } from './AssetsLibraryModal/components/LibraryTab';
import { UploadTab } from './AssetsLibraryModal/components/UploadTab';
import { ManagementTab } from './AssetsLibraryModal/components/ManagementTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, MapPin, Upload, Settings, FolderInput, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Asset } from '@/types';

/**
 * Props for AssetsLibraryModal component
 */
export interface AssetsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  targetSceneId?: string;
}

/**
 * AssetsLibraryModal - Gestionnaire d'assets avec onglets
 *
 * Interface compacte organisée en 3 onglets:
 * - **Bibliothèque**: Navigation et visualisation des assets
 * - **Uploader**: Zone d'upload dédiée
 * - **Gestion**: Sélection multiple et suppression
 *
 * En mode sélection de fond (targetSceneId fourni):
 * - Seul l'onglet Bibliothèque est visible
 * - Click sur un asset = sélection du fond
 */
export default function AssetsLibraryModal({
  isOpen,
  onClose,
  initialCategory,
  targetSceneId
}: AssetsLibraryModalProps) {
  const [activeTab, setActiveTab] = useState('library');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');

  // Hooks
  const { assets: rawAssets, loading, deleteAssets, deleting, moveAsset, moving } = useAssets();
  const { favorites, isFavorite } = useFavorites();

  // Stores
  const scenes = useScenesStore(state => state.scenes);
  const updateScene = useScenesStore(state => state.updateScene);
  const characters = useCharactersStore(state => state.characters);

  // Check if asset is used in the project
  const getAssetUsage = (assetPath: string): { scenes: string[]; characters: string[] } => {
    const usedInScenes = scenes
      .filter(s => s.backgroundUrl === assetPath)
      .map(s => s.title || s.id);
    const usedByCharacters = characters
      .filter(c => Object.values(c.sprites || {}).includes(assetPath))
      .map(c => c.name);
    return { scenes: usedInScenes, characters: usedByCharacters };
  };

  // Mode sélection de fond
  const targetScene = targetSceneId ? scenes.find(s => s.id === targetSceneId) : null;
  const isBackgroundSelectionMode = !!targetSceneId && !!targetScene;

  // Add IDs to assets
  const assets = useMemo(() => {
    return rawAssets.map(asset => ({
      ...asset,
      id: asset.path
    }));
  }, [rawAssets]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    const filtered = assets.filter(asset => {
      // Search filter
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filter
      if (activeCategory === 'favorites') {
        return isFavorite(asset.path);
      }
      if (activeCategory !== 'all' && asset.category !== activeCategory) {
        return false;
      }
      return true;
    });

    // Sort assets
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'recent':
          // Sort by path timestamp (files have timestamp in name)
          const tsA = a.path.match(/-(\d+)\./)?.[1] || '0';
          const tsB = b.path.match(/-(\d+)\./)?.[1] || '0';
          return parseInt(tsB) - parseInt(tsA);
        case 'oldest':
          const tsA2 = a.path.match(/-(\d+)\./)?.[1] || '0';
          const tsB2 = b.path.match(/-(\d+)\./)?.[1] || '0';
          return parseInt(tsA2) - parseInt(tsB2);
        default:
          return 0;
      }
    });
  }, [assets, searchQuery, activeCategory, isFavorite, sortOrder]);

  // Category counts
  const categoryCount = useMemo(() => ({
    all: assets.length,
    backgrounds: assets.filter(a => a.category === 'backgrounds').length,
    characters: assets.filter(a => a.category === 'characters').length,
    illustrations: assets.filter(a => a.category === 'illustrations').length,
    music: assets.filter(a => a.category === 'music').length,
    sfx: assets.filter(a => a.category === 'sfx').length,
    voices: assets.filter(a => a.category === 'voices').length,
  }), [assets]);

  // Set initial category
  useEffect(() => {
    if (isOpen) {
      if (isBackgroundSelectionMode) {
        setActiveCategory('backgrounds');
        setActiveTab('library');
      } else if (initialCategory) {
        setActiveCategory(initialCategory);
      }
    }
  }, [isOpen, initialCategory, isBackgroundSelectionMode]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setPreviewAsset(null);
    }
  }, [isOpen]);

  // Handle background selection
  const handleSelectBackground = (assetPath: string) => {
    if (!isBackgroundSelectionMode || !targetSceneId) return;
    updateScene(targetSceneId, { backgroundUrl: assetPath });
    onClose();
  };

  // Handle single asset delete with usage warning
  const handleSingleDelete = async (assetPath: string, assetName?: string) => {
    const usage = getAssetUsage(assetPath);
    const isUsed = usage.scenes.length > 0 || usage.characters.length > 0;

    let confirmMessage = `Supprimer "${assetName || assetPath}" ?`;
    if (isUsed) {
      const usageDetails: string[] = [];
      if (usage.scenes.length > 0) {
        usageDetails.push(`• Arrière-plan dans: ${usage.scenes.join(', ')}`);
      }
      if (usage.characters.length > 0) {
        usageDetails.push(`• Sprite de: ${usage.characters.join(', ')}`);
      }
      confirmMessage = `⚠️ Cet asset est utilisé dans le projet:\n\n${usageDetails.join('\n')}\n\nÊtes-vous sûr de vouloir le supprimer ?`;
    }

    if (!window.confirm(confirmMessage)) return;

    const result = await deleteAssets([assetPath]);
    if (result.success && result.count > 0) {
      // Silently deleted
    } else if (result.errors && result.errors.length > 0) {
      alert(`Erreur: ${result.errors[0].error}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (paths: string[]) => {
    const result = await deleteAssets(paths);
    if (result.success && result.count > 0) {
      alert(`${result.count} asset(s) supprimé(s) avec succès.`);
    } else if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(e => `${e.path}: ${e.error}`).join('\n');
      alert(`Erreur:\n${errorMessages}`);
    }
  };

  // Handle asset click - show preview panel
  const handleAssetClick = (asset: Asset) => {
    setPreviewAsset(previewAsset?.id === asset.id ? null : asset);
  };

  // Handle category change (move asset)
  const handleCategoryChange = async (newCategory: string) => {
    if (!previewAsset || previewAsset.category === newCategory) return;

    const result = await moveAsset(previewAsset.path, newCategory);
    if (result.success && result.newPath) {
      // Update preview with new path
      setPreviewAsset({
        ...previewAsset,
        path: result.newPath,
        category: newCategory
      });
    } else if (result.error) {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-[1200px] h-[75vh] max-h-[800px] p-0 gap-0 flex flex-col !bg-slate-900 border-slate-700/50 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-700/50 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              {isBackgroundSelectionMode ? <MapPin className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </div>
            <div>
              <DialogTitle className="text-base">
                {isBackgroundSelectionMode ? 'Sélectionner un arrière-plan' : 'Bibliothèque d\'Assets'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isBackgroundSelectionMode
                  ? `Pour: "${targetScene?.title || targetScene?.id}"`
                  : `${assets.length} assets disponibles`
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Tabs Section */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="mx-4 mt-2 self-start shrink-0">
              <TabsTrigger value="library" className="text-xs gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Bibliothèque
              </TabsTrigger>
              {!isBackgroundSelectionMode && (
                <>
                  <TabsTrigger value="upload" className="text-xs gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Uploader
                  </TabsTrigger>
                  <TabsTrigger value="management" className="text-xs gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Sélection multiple
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Library Tab */}
            <TabsContent value="library" className="flex-1 m-0 min-h-0">
              <LibraryTab
                assets={filteredAssets}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                categoryCount={categoryCount}
                favoritesCount={favorites.length}
                onAssetClick={handleAssetClick}
                onAssetDelete={handleSingleDelete}
                isSelectionMode={isBackgroundSelectionMode}
                onSelectBackground={isBackgroundSelectionMode ? handleSelectBackground : undefined}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
              />
            </TabsContent>

            {/* Upload Tab */}
            {!isBackgroundSelectionMode && (
              <TabsContent value="upload" className="flex-1 m-0 min-h-0">
                <UploadTab initialCategory={activeCategory} />
              </TabsContent>
            )}

            {/* Management Tab */}
            {!isBackgroundSelectionMode && (
              <TabsContent value="management" className="flex-1 m-0 min-h-0">
                <ManagementTab
                  assets={assets}
                  onBulkDelete={handleBulkDelete}
                  deleting={deleting}
                  getAssetUsage={getAssetUsage}
                />
              </TabsContent>
            )}
          </Tabs>

          {/* Preview Panel (optional side panel when asset is clicked) */}
          {previewAsset && !isBackgroundSelectionMode && (
            <div className="w-[320px] border-l border-slate-700/50 bg-slate-800/50 p-6 shrink-0 overflow-hidden flex flex-col">
              <div className="space-y-4 overflow-y-auto flex-1">
                {/* Preview Image */}
                <div className="relative rounded-lg overflow-hidden bg-black/30 border border-slate-600/30">
                  <img
                    src={previewAsset.path}
                    alt={previewAsset.name}
                    className="w-full aspect-square object-contain"
                  />
                </div>

                {/* Asset Name */}
                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-600/30">
                  <h4 className="font-semibold text-sm text-white truncate" title={previewAsset.name}>
                    {previewAsset.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{previewAsset.category}</p>
                </div>

                {/* Category Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <FolderInput className="h-3.5 w-3.5" />
                    Catégorie
                  </label>
                  <Select
                    value={previewAsset.category}
                    onValueChange={handleCategoryChange}
                    disabled={moving}
                  >
                    <SelectTrigger className="w-full h-9 text-sm bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      portal={true}
                      position="popper"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <SelectItem value="backgrounds">Arrière-plans</SelectItem>
                      <SelectItem value="characters">Sprites</SelectItem>
                      <SelectItem value="illustrations">Illustrations</SelectItem>
                      <SelectItem value="music">Musique</SelectItem>
                      <SelectItem value="sfx">Effets sonores</SelectItem>
                      <SelectItem value="voices">Voix</SelectItem>
                    </SelectContent>
                  </Select>
                  {moving && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Déplacement en cours...
                    </p>
                  )}
                </div>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={async () => {
                    await handleSingleDelete(previewAsset.path, previewAsset.name);
                    setPreviewAsset(null);
                  }}
                  disabled={deleting}
                >
                  Supprimer cet asset
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
