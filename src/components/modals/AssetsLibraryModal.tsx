import { useState, useMemo, useEffect } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { useScenesStore, useCharactersStore } from '../../stores/index';
import { UploadZone } from './AssetsLibraryModal/components/UploadZone';
import { EmptyAssetState } from './AssetsLibraryModal/components/EmptyAssetState';
import { AssetStatsCards } from './AssetsLibraryModal/components/AssetStatsCards';
import { AssetFilters } from './AssetsLibraryModal/components/AssetFilters';
import { useFavorites } from './AssetsLibraryModal/hooks/useFavorites';
import { useAssetUsage, getAssetUsageInfo } from './AssetsLibraryModal/hooks/useAssetUsage';
import { useAssetFiltering } from './AssetsLibraryModal/hooks/useAssetFiltering';
import { useAssetTagging } from './AssetsLibraryModal/hooks/useAssetTagging';
import { AssetLightbox } from './AssetsLibraryModal/components/AssetLightbox';
import { AssetGridView } from './AssetsLibraryModal/components/AssetGridView';
import { AssetListView } from './AssetsLibraryModal/components/AssetListView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  AlertCircle,
  MapPin,
  Package,
  Grid3x3,
  List,
  X,
} from 'lucide-react';
import type { Asset } from '@/types';

/**
 * Props for AssetsLibraryModal component
 */
export interface AssetsLibraryModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Optional initial category to display ('backgrounds' | 'characters' | 'illustrations') */
  initialCategory?: string;
  /** Optional scene ID for background selection mode */
  targetSceneId?: string;
}

/**
 * AssetsLibraryModal - AAA Visual Asset Manager
 *
 * Professional asset management modal inspired by Unity Content Browser and Adobe Bridge.
 *
 * ## Features
 *
 * ### Phase 1: Core Functionality
 * - Large grid/list view toggle
 * - Category filters with counts
 * - Search with live filtering
 * - Click for lightbox preview
 * - Usage tracking badges
 *
 * ### Phase 2: Favorites
 * - Star toggle for favorites
 * - Favorites filter category
 * - localStorage persistence
 *
 * ### Phase 5: Advanced Features
 * - Multi-selection with checkboxes
 * - Bulk delete action
 * - Tag management (add/remove)
 * - Tag-based filtering
 * - Drag & drop upload
 *
 * ## Modes
 *
 * ### Normal Mode
 * Full asset library management with all features enabled.
 *
 * ### Selection Mode (targetSceneId provided)
 * Simplified UI for selecting a background for a specific scene:
 * - Forces backgrounds category
 * - Hides stats dashboard
 * - Shows compact upload button
 * - "Utiliser" button instead of lightbox
 *
 * @example
 * ```tsx
 * // Normal mode
 * <AssetsLibraryModal
 *   isOpen={showAssets}
 *   onClose={() => setShowAssets(false)}
 *   initialCategory="backgrounds"
 * />
 *
 * // Selection mode
 * <AssetsLibraryModal
 *   isOpen={showBgSelector}
 *   onClose={() => setShowBgSelector(false)}
 *   targetSceneId="scene-123"
 * />
 * ```
 */
export default function AssetsLibraryModal({
  isOpen,
  onClose,
  initialCategory,
  targetSceneId
}: AssetsLibraryModalProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Phase 5 enhancements
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);

  const { assets: rawAssets, loading, error: rawError, deleteAssets, deleting } = useAssets();

  // Add IDs to assets (useAssets returns assets without IDs)
  const assets = useMemo(() => {
    return rawAssets.map(asset => ({
      ...asset,
      id: asset.path // Use path as unique ID
    }));
  }, [rawAssets]);

  // Convert error to Error object if it's a string
  const error = rawError ? new Error(rawError) : null;

  // Favorites hook (Phase 2)
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Asset tagging hook (Phase 5)
  const { assetTags, filterTags, allTags, addTagToAsset, removeTagFromAsset, toggleFilterTag, setFilterTags } = useAssetTagging();

  // Zustand stores (granular selectors)
  const scenes = useScenesStore(state => state.scenes);
  const updateScene = useScenesStore(state => state.updateScene);
  const characters = useCharactersStore(state => state.characters);

  // Get target scene if provided
  const targetScene = targetSceneId ? scenes.find(s => s.id === targetSceneId) : null;
  const isSelectionMode = !!targetSceneId && !!targetScene;

  // Set initial category when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isSelectionMode) {
        // Force backgrounds category in selection mode
        setActiveCategory('backgrounds');
      } else if (initialCategory) {
        setActiveCategory(initialCategory);
      }
    }
  }, [isOpen, initialCategory, isSelectionMode]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAssets(new Set());
      setFilterTags(new Set());
    }
  }, [isOpen, setFilterTags]);

  // Phase 5 Handlers
  const toggleAssetSelection = (assetId: string) => {
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

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;
    if (!window.confirm(`Supprimer ${selectedAssets.size} asset(s) sélectionné(s) ? Cette action est irréversible.`)) {
      return;
    }

    // Convert Set to Array for API call
    const pathsToDelete = Array.from(selectedAssets);

    try {
      const result = await deleteAssets(pathsToDelete);

      if (result.success && result.count > 0) {
        // Clear selection after successful deletion
        setSelectedAssets(new Set());

        // Show success message
        alert(`${result.count} asset(s) supprimé(s) avec succès.`);
      } else if (result.errors && result.errors.length > 0) {
        // Show error message
        const errorMessages = result.errors.map(e => `${e.path}: ${e.error}`).join('\n');
        alert(`Erreur lors de la suppression:\n${errorMessages}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Erreur lors de la suppression des assets. Vérifiez que le serveur est démarré (npm run server).');
    }
  };

  // Handle background selection for scene
  const handleSelectBackground = (assetPath: string) => {
    if (!isSelectionMode) return;

    updateScene(targetSceneId, { backgroundUrl: assetPath });
    onClose();
  };

  // Drag & Drop upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      // Note: This would need actual upload implementation
      alert(`${imageFiles.length} fichier(s) détecté(s). Implémentation de l'upload à venir.`);
    }
  };

  // Calculate usage for each asset (using hook)
  const assetUsage = useAssetUsage(scenes, characters);

  // Filter and search assets (using hook)
  const filteredAssets = useAssetFiltering({
    assets,
    activeCategory,
    searchQuery,
    filterTags,
    assetTags,
    isFavorite
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const categoryCount = {
      all: assets.length,
      backgrounds: assets.filter(a => a.category === 'backgrounds').length,
      characters: assets.filter(a => a.category === 'characters').length,
      illustrations: assets.filter(a => a.category === 'illustrations').length
    };

    const usedCount = Array.from(assetUsage.keys()).length;

    return {
      total: assets.length,
      used: usedCount,
      unused: assets.length - usedCount,
      categoryCount
    };
  }, [assets, assetUsage]);

  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!lightboxAsset) return;
    const currentIndex = filteredAssets.findIndex(a => a.id === lightboxAsset.id);
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredAssets.length - 1;
      setLightboxAsset(filteredAssets[prevIndex]);
    } else {
      const nextIndex = currentIndex < filteredAssets.length - 1 ? currentIndex + 1 : 0;
      setLightboxAsset(filteredAssets[nextIndex]);
    }
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxAsset) {
        setLightboxAsset(null);
      } else if (e.key === 'ArrowLeft' && lightboxAsset) {
        navigateLightbox('prev');
      } else if (e.key === 'ArrowRight' && lightboxAsset) {
        navigateLightbox('next');
      }
    };

    if (lightboxAsset) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxAsset, filteredAssets]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0 dark bg-background text-foreground">
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold mb-2">
                  <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
                    {isSelectionMode ? <MapPin className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                  </div>
                  {isSelectionMode ? `Sélectionner un arrière-plan` : 'Bibliothèque d\'Assets'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {isSelectionMode
                    ? `Pour la scène : "${targetScene?.title || targetScene?.id}"`
                    : 'Gestionnaire visuel professionnel'
                  }
                </DialogDescription>
              </div>

              {/* View Mode Toggle - Hide in selection mode */}
              {!isSelectionMode && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Stats Dashboard - Hide in selection mode */}
            {!isSelectionMode && (
              <AssetStatsCards stats={stats} filteredCount={filteredAssets.length} />
            )}
          </DialogHeader>

          {/* Filters & Search */}
          <AssetFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            stats={stats}
            favoritesCount={favorites.length}
            selectedAssets={selectedAssets}
            filteredAssetsCount={filteredAssets.length}
            onSelectAll={toggleSelectAll}
            onBulkDelete={handleBulkDelete}
            filterTags={filterTags}
            onToggleFilterTag={toggleFilterTag}
            allTags={allTags}
            isSelectionMode={isSelectionMode}
          />

          {/* Assets Grid */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-8 py-6">
              {/* NEW: Upload Zone - Always visible, even in selection mode */}
              <div className="mb-6">
                {isSelectionMode ? (
                  // Compact mode: Small upload button in header
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Sélectionner un {activeCategory}</h3>
                    <UploadZone category={activeCategory} compact={true} />
                  </div>
                ) : (
                  // Full mode: Large drop zone when assets exist, or handled by empty state
                  filteredAssets.length === 0 && !searchQuery && !loading ? (
                    // Empty state handled below, no UploadZone here
                    null
                  ) : (
                    // Assets existing: Compact upload zone at top
                    <UploadZone category={activeCategory} compact={false} />
                  )
                )}
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Chargement des assets...</p>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>Erreur de chargement:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              )}

              {!loading && !error && filteredAssets.length === 0 && (
                searchQuery ? (
                  // Search results empty - simple message
                  <Card className="max-w-2xl mx-auto border-dashed">
                    <CardContent className="p-20 text-center">
                      <Package className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
                      <h3 className="text-2xl font-bold mb-2">Aucun résultat</h3>
                      <p className="text-muted-foreground mb-6">
                        Aucun asset ne correspond à "{searchQuery}"
                      </p>
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        <X className="h-4 w-4 mr-2" />
                        Effacer la recherche
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Category empty - Gaming empty state with upload
                  <div>
                    <EmptyAssetState
                      category={activeCategory === 'all' ? 'all' : activeCategory.replace(/s$/, '') as 'background' | 'character' | 'illustration' | 'all'}
                      onUploadClick={() => {
                        // Trigger file input click - will be handled by UploadZone below
                        document.getElementById(`upload-input-full-${activeCategory}`)?.click();
                      }}
                    />
                    <div className="mt-8">
                      <UploadZone category={activeCategory} compact={false} />
                    </div>
                  </div>
                )
              )}

              {!loading && !error && filteredAssets.length > 0 && viewMode === 'grid' && (
                <AssetGridView
                  assets={filteredAssets}
                  selectedAssets={selectedAssets}
                  onToggleSelection={toggleAssetSelection}
                  onAssetClick={setLightboxAsset}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  getAssetUsage={(path) => getAssetUsageInfo(path, assetUsage)}
                  assetTags={assetTags}
                  onAddTag={addTagToAsset}
                  onRemoveTag={removeTagFromAsset}
                  isSelectionMode={isSelectionMode}
                  onSelectBackground={handleSelectBackground}
                />
              )}

              {/* List View (Phase 5) */}
              {!loading && !error && filteredAssets.length > 0 && viewMode === 'list' && (
                <AssetListView
                  assets={filteredAssets}
                  selectedAssets={selectedAssets}
                  onToggleSelection={toggleAssetSelection}
                  onAssetClick={setLightboxAsset}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  getAssetUsage={(path) => getAssetUsageInfo(path, assetUsage)}
                  assetTags={assetTags}
                  onAddTag={addTagToAsset}
                  onRemoveTag={removeTagFromAsset}
                  isSelectionMode={isSelectionMode}
                  onSelectBackground={handleSelectBackground}
                />
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxAsset && (
        <AssetLightbox
          asset={lightboxAsset}
          onClose={() => setLightboxAsset(null)}
          onNavigate={navigateLightbox}
          usage={getAssetUsageInfo(lightboxAsset.path, assetUsage)}
        />
      )}
    </>
  );
}
