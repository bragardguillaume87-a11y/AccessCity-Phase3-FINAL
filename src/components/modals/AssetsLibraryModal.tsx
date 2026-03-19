import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAssets, getRecentAssets } from '@/hooks/useAssets';
import { useScenesStore, useCharactersStore, useSettingsStore } from '../../stores/index';
import { useFavorites } from './AssetsLibraryModal/hooks/useFavorites';
import { useCollections } from './AssetsLibraryModal/hooks/useCollections';
import {
  LibraryTab,
  type SortOrder,
  type LibraryContext,
} from './AssetsLibraryModal/components/LibraryTab';
import type { SidebarSection } from './AssetsLibraryModal/components/AssetsLibrarySidebar';
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
import type { AmbientAudio } from '@/types/audio';

export interface AssetsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  targetSceneId?: string;
  /** When 'sceneAudio', audio cards show "Utiliser cette musique" (assigns BGM).
   *  When 'ambientTrack', audio cards show "Utiliser" (assigns ambient track at selectionSlot). */
  selectionPurpose?: 'sceneAudio' | 'ambientTrack';
  /** Ambient track slot (0 or 1). Used when selectionPurpose === 'ambientTrack'. */
  selectionSlot?: 0 | 1;
  /** Filtre les catégories affichées : 'vn' = visual novel, '2d' = éditeur carte */
  context?: LibraryContext;
}

export default function AssetsLibraryModal({
  isOpen,
  onClose,
  initialCategory,
  targetSceneId,
  selectionPurpose,
  selectionSlot = 0,
  context,
}: AssetsLibraryModalProps) {
  const [activeTab, setActiveTab] = useState('library');
  const [activeSection, setActiveSection] = useState<SidebarSection>('cat:all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');

  const { assets: rawAssets, loading, deleteAssets, deleting, moveAsset, moving } = useAssets();
  const { favorites, isFavorite } = useFavorites();
  const {
    collections,
    createCollection,
    deleteCollection,
    rename: renameCollection,
    addAsset,
  } = useCollections();
  const scenes = useScenesStore((state) => state.scenes);
  const updateScene = useScenesStore((state) => state.updateScene);
  const assetDisplayNames = useSettingsStore((state) => state.assetDisplayNames);
  const setAssetDisplayName = useSettingsStore((state) => state.setAssetDisplayName);

  // Enrichir les assets avec les noms d'affichage personnalisés
  const assets = useMemo(
    () =>
      rawAssets.map((a) => ({
        ...a,
        name: assetDisplayNames[a.path] ?? a.name,
      })),
    [rawAssets, assetDisplayNames]
  );
  // characters lu via getState() dans getAssetUsage (callback, pas render) — CLAUDE.md §6.7

  const getAssetUsage = useCallback(
    (assetPath: string): { scenes: string[]; characters: string[] } => {
      const allCharacters = useCharactersStore.getState().characters;
      const usedInScenes = scenes
        .filter((s) => s.backgroundUrl === assetPath)
        .map((s) => s.title || s.id);
      const usedByCharacters = allCharacters
        .filter((c) => Object.values(c.sprites || {}).includes(assetPath))
        .map((c) => c.name);
      return { scenes: usedInScenes, characters: usedByCharacters };
    },
    [scenes]
  );

  const targetScene = targetSceneId ? scenes.find((s) => s.id === targetSceneId) : null;
  const isAudioSelectionMode =
    selectionPurpose === 'sceneAudio' && !!targetSceneId && !!targetScene;
  const isAmbientSelectionMode =
    selectionPurpose === 'ambientTrack' && !!targetSceneId && !!targetScene;
  // Background mode : targetSceneId fourni SANS purpose audio/ambiance
  const isBackgroundSelectionMode =
    !!targetSceneId && !!targetScene && !isAudioSelectionMode && !isAmbientSelectionMode;

  // Smart collections calculées dynamiquement
  const recentPaths = useMemo(() => new Set(getRecentAssets('all', 20)), []);
  const unusedAssets = useMemo(() => {
    return assets.filter((asset) => {
      const usage = getAssetUsage(asset.path);
      return usage.scenes.length === 0 && usage.characters.length === 0;
    });
  }, [assets, getAssetUsage]);
  const protagonistAssets = useMemo(() => {
    const chars = useCharactersStore.getState().characters;
    const protagonist = chars.find((c) => c.isProtagonist);
    if (!protagonist) return [];
    const spritePaths = new Set(Object.values(protagonist.sprites || {}));
    return assets.filter((a) => spritePaths.has(a.path));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filtrage par section sidebar
    if (activeSection.startsWith('cat:')) {
      const cat = activeSection.slice(4);
      if (cat !== 'all') filtered = filtered.filter((a) => a.category === cat);
    } else if (activeSection === 'smart:favorites') {
      filtered = filtered.filter((a) => isFavorite(a.path));
    } else if (activeSection === 'smart:recents') {
      filtered = filtered.filter((a) => recentPaths.has(a.path));
    } else if (activeSection === 'smart:unused') {
      filtered = unusedAssets;
    } else if (activeSection === 'smart:protagonist') {
      filtered = protagonistAssets;
    } else if (activeSection.startsWith('folder:')) {
      const colId = activeSection.slice(7);
      const col = collections.find((c) => c.id === colId);
      if (col) filtered = filtered.filter((a) => col.assetIds.includes(a.id));
      else filtered = [];
    }

    // Recherche textuelle
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q));
    }

    // Tri
    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'recent': {
          const tsA = a.path.match(/-(\d+)\./)?.[1] || '0';
          const tsB = b.path.match(/-(\d+)\./)?.[1] || '0';
          return parseInt(tsB) - parseInt(tsA);
        }
        case 'oldest': {
          const tsA = a.path.match(/-(\d+)\./)?.[1] || '0';
          const tsB = b.path.match(/-(\d+)\./)?.[1] || '0';
          return parseInt(tsA) - parseInt(tsB);
        }
        default:
          return 0;
      }
    });
  }, [
    assets,
    activeSection,
    searchQuery,
    isFavorite,
    recentPaths,
    unusedAssets,
    protagonistAssets,
    collections,
    sortOrder,
  ]);

  const categoryCount = useMemo(
    () => ({
      all: assets.length,
      backgrounds: assets.filter((a) => a.category === 'backgrounds').length,
      characters: assets.filter((a) => a.category === 'characters').length,
      illustrations: assets.filter((a) => a.category === 'illustrations').length,
      music: assets.filter((a) => a.category === 'music').length,
      sfx: assets.filter((a) => a.category === 'sfx').length,
      voices: assets.filter((a) => a.category === 'voices').length,
      atmosphere: assets.filter((a) => a.category === 'atmosphere').length,
      tilesets: assets.filter((a) => a.category === 'tilesets').length,
      'sprites-2d': assets.filter((a) => a.category === 'sprites-2d').length,
    }),
    [assets]
  );

  useEffect(() => {
    if (isOpen) {
      if (isBackgroundSelectionMode) {
        setActiveSection('cat:backgrounds');
        setActiveTab('library');
      } else if (isAmbientSelectionMode) {
        setActiveSection('cat:atmosphere');
        setActiveTab('library');
      } else if (initialCategory) {
        setActiveSection(`cat:${initialCategory}`);
      }
    }
  }, [isOpen, initialCategory, isBackgroundSelectionMode, isAmbientSelectionMode]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setPreviewAsset(null);
      setActiveSection('cat:all');
      setSortOrder('name-asc');
      setActiveTab('library');
    }
  }, [isOpen]);

  const handleSelectBackground = (assetPath: string) => {
    if (!isBackgroundSelectionMode || !targetSceneId) return;
    updateScene(targetSceneId, { backgroundUrl: assetPath });
    onClose();
  };

  const handleSelectAudio = (assetPath: string) => {
    if (!isAudioSelectionMode || !targetSceneId) return;
    updateScene(targetSceneId, { audio: { url: assetPath, volume: 0.5, loop: true } });
    onClose();
  };

  const handleSelectAmbient = (assetPath: string) => {
    if (!isAmbientSelectionMode || !targetSceneId) return;
    const currentTracks = [...(targetScene?.ambientTracks ?? [])] as [AmbientAudio?, AmbientAudio?];
    currentTracks[selectionSlot] = { url: assetPath, volume: 0.4, loop: true };
    updateScene(targetSceneId, { ambientTracks: currentTracks });
    onClose();
  };

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
    if (result.errors && result.errors.length > 0) {
      alert(`Erreur: ${result.errors[0].error}`);
    }
  };

  const handleBulkDelete = async (paths: string[]) => {
    const result = await deleteAssets(paths);
    if (result.success && result.count > 0) {
      alert(`${result.count} asset(s) supprimé(s) avec succès.`);
    } else if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e) => `${e.path}: ${e.error}`).join('\n');
      alert(`Erreur:\n${errorMessages}`);
    }
  };

  const handleBulkMove = async (paths: string[], targetCategory: string) => {
    for (const path of paths) {
      await moveAsset(path, targetCategory);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setPreviewAsset(previewAsset?.id === asset.id ? null : asset);
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!previewAsset || previewAsset.category === newCategory) return;

    const result = await moveAsset(previewAsset.path, newCategory);
    if (result.success && result.newPath) {
      setPreviewAsset({
        ...previewAsset,
        path: result.newPath,
        category: newCategory,
      });
    } else if (result.error) {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-[min(1200px,95vw)] h-[75vh] max-h-[800px] p-0 gap-0 flex flex-col !bg-slate-900 border-slate-700/50 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-700/50 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              {isBackgroundSelectionMode ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base">
                {isBackgroundSelectionMode
                  ? 'Sélectionner un arrière-plan'
                  : isAudioSelectionMode
                    ? 'Choisir une musique'
                    : isAmbientSelectionMode
                      ? `Choisir une ambiance — Piste ${selectionSlot + 1}`
                      : "Bibliothèque d'Assets"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isBackgroundSelectionMode || isAudioSelectionMode || isAmbientSelectionMode
                  ? `Pour : "${targetScene?.title || targetScene?.id}"`
                  : `${assets.length} assets disponibles`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="mx-4 mt-3 self-start shrink-0 bg-slate-800/60 border border-slate-700/40 h-auto p-1 gap-0.5 rounded-xl">
              <TabsTrigger
                value="library"
                className="text-[13px] gap-1.5 py-1.5 px-4 h-auto rounded-lg transition-all duration-150 text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-medium"
              >
                <Package className="h-[15px] w-[15px]" />
                Bibliothèque
              </TabsTrigger>
              {/* Upload visible sauf en mode sélection BGM et fond (pas pour ambiance) */}
              {!isBackgroundSelectionMode && !isAudioSelectionMode && (
                <>
                  <TabsTrigger
                    value="upload"
                    className="text-[13px] gap-1.5 py-1.5 px-4 h-auto rounded-lg transition-all duration-150 text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-medium"
                  >
                    <Upload className="h-[15px] w-[15px]" />
                    Uploader
                  </TabsTrigger>
                  {!isAmbientSelectionMode && (
                    <TabsTrigger
                      value="management"
                      className="text-[13px] gap-1.5 py-1.5 px-4 h-auto rounded-lg transition-all duration-150 text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-medium"
                    >
                      <Settings className="h-[15px] w-[15px]" />
                      Sélection multiple
                    </TabsTrigger>
                  )}
                </>
              )}
            </TabsList>

            <TabsContent value="library" className="flex-1 m-0 min-h-0">
              <LibraryTab
                assets={filteredAssets}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                categoryCount={categoryCount}
                favoritesCount={favorites.length}
                recentsCount={recentPaths.size}
                unusedCount={unusedAssets.length}
                protagonistCount={protagonistAssets.length}
                collections={collections}
                onCreateCollection={createCollection}
                onDeleteCollection={deleteCollection}
                onRenameCollection={renameCollection}
                onAssetClick={handleAssetClick}
                onAssetDelete={handleSingleDelete}
                onRenameAsset={setAssetDisplayName}
                isSelectionMode={
                  isBackgroundSelectionMode || isAudioSelectionMode || isAmbientSelectionMode
                }
                onSelectBackground={
                  isBackgroundSelectionMode
                    ? handleSelectBackground
                    : isAudioSelectionMode
                      ? handleSelectAudio
                      : isAmbientSelectionMode
                        ? handleSelectAmbient
                        : undefined
                }
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                context={context}
              />
            </TabsContent>

            {!isBackgroundSelectionMode && !isAudioSelectionMode && (
              <TabsContent value="upload" className="flex-1 m-0 min-h-0">
                <UploadTab
                  initialCategory={
                    activeSection.startsWith('cat:') ? activeSection.slice(4) : 'all'
                  }
                />
              </TabsContent>
            )}

            {!isBackgroundSelectionMode && !isAudioSelectionMode && !isAmbientSelectionMode && (
              <TabsContent value="management" className="flex-1 m-0 min-h-0">
                <ManagementTab
                  assets={assets}
                  onBulkDelete={handleBulkDelete}
                  deleting={deleting}
                  getAssetUsage={getAssetUsage}
                  collections={collections}
                  onAddToCollection={(colId, ids) => ids.forEach((id) => addAsset(colId, id))}
                  onBulkMove={handleBulkMove}
                  moving={moving}
                />
              </TabsContent>
            )}
          </Tabs>

          {previewAsset && !isBackgroundSelectionMode && !isAudioSelectionMode && (
            <div className="w-[320px] border-l border-slate-700/50 bg-slate-800/50 p-6 shrink-0 overflow-hidden flex flex-col">
              <div className="space-y-4 overflow-y-auto flex-1">
                <div className="relative rounded-lg overflow-hidden bg-black/30 border border-slate-600/30">
                  <img
                    src={previewAsset.url ?? previewAsset.path}
                    alt={previewAsset.name}
                    className="w-full aspect-square object-contain"
                  />
                </div>

                <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-600/30">
                  <h4
                    className="font-semibold text-sm text-white truncate"
                    title={previewAsset.name}
                  >
                    {previewAsset.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{previewAsset.category}</p>
                </div>

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
                      <SelectItem value="tilesets">Tilesets</SelectItem>
                      <SelectItem value="sprites-2d">Sprites 2D</SelectItem>
                    </SelectContent>
                  </Select>
                  {moving && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Déplacement en cours...
                    </p>
                  )}
                </div>

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
