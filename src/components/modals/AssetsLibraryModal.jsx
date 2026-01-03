import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAssets } from '../../hooks/useAssets.js';
import { useScenesStore, useCharactersStore } from '../../stores/index.js';
import AssetPicker from '../AssetPicker.jsx';
import { UploadZone } from './AssetsLibraryModal/components/UploadZone.jsx';
import { EmptyAssetState } from './AssetsLibraryModal/components/EmptyAssetState.jsx';
import { useFavorites } from './AssetsLibraryModal/hooks/useFavorites.js';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Package,
  ImageIcon,
  Users as UsersIcon,
  Palette,
  AlertCircle,
  Upload,
  Lightbulb,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Sparkles,
  Grid3x3,
  List,
  SlidersHorizontal,
  Tag,
  Trash2,
  FileUp,
  Star
} from 'lucide-react';

/**
 * AssetsLibraryModal - AAA Visual Asset Manager
 * Inspired by Unity Content Browser and Adobe Bridge
 *
 * Features:
 * - Lightbox preview on click (full-screen)
 * - Usage tracking badges ("Utilisé dans 3 scènes")
 * - Smart filters with counts
 * - Search with live filtering
 * - Large grid previews with hover zoom
 * - Professional animations
 */
export default function AssetsLibraryModal({ isOpen, onClose, initialCategory, targetSceneId }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Phase 5 enhancements
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [assetTags, setAssetTags] = useState(new Map()); // assetId -> Set of tags
  const [filterTags, setFilterTags] = useState(new Set());
  const [newTagInput, setNewTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const { assets, loading, error } = useAssets();

  // Favorites hook (Phase 2)
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

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
  }, [isOpen]);

  // Phase 5 Handlers
  const toggleAssetSelection = (assetId) => {
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

  const handleBulkDelete = () => {
    if (selectedAssets.size === 0) return;
    if (window.confirm(`Supprimer ${selectedAssets.size} asset(s) sélectionné(s) ?`)) {
      // Note: This would need actual delete implementation in useAssets hook
      setSelectedAssets(new Set());
    }
  };

  const addTagToAsset = (assetId, tag) => {
    if (!tag.trim()) return;
    setAssetTags(prev => {
      const newMap = new Map(prev);
      const tags = newMap.get(assetId) || new Set();
      tags.add(tag.trim());
      newMap.set(assetId, tags);
      return newMap;
    });
  };

  const removeTagFromAsset = (assetId, tag) => {
    setAssetTags(prev => {
      const newMap = new Map(prev);
      const tags = newMap.get(assetId);
      if (tags) {
        tags.delete(tag);
        if (tags.size === 0) {
          newMap.delete(assetId);
        } else {
          newMap.set(assetId, tags);
        }
      }
      return newMap;
    });
  };

  const toggleFilterTag = (tag) => {
    setFilterTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  // Handle background selection for scene
  const handleSelectBackground = (assetPath) => {
    if (!isSelectionMode) return;

    updateScene(targetSceneId, { backgroundUrl: assetPath });
    onClose();
  };

  // Drag & Drop upload handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
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

  // Calculate usage for each asset
  const assetUsage = useMemo(() => {
    const usage = new Map();

    // Assets used in scenes (backgrounds)
    scenes.forEach(scene => {
      const bg = scene.background || scene.backgroundUrl;
      if (bg) {
        if (!usage.has(bg)) {
          usage.set(bg, { scenes: [], characters: [] });
        }
        usage.get(bg).scenes.push(scene.name || scene.id);
      }
    });

    // Assets used in characters (sprites)
    characters.forEach(character => {
      if (character.sprites) {
        Object.values(character.sprites).forEach(sprite => {
          if (sprite) {
            if (!usage.has(sprite)) {
              usage.set(sprite, { scenes: [], characters: [] });
            }
            usage.get(sprite).characters.push(character.name);
          }
        });
      }
    });

    return usage;
  }, [scenes, characters]);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Filter by favorites (Phase 2)
    if (activeCategory === 'favorites') {
      filtered = filtered.filter(a => isFavorite(a.path));
    } else if (activeCategory !== 'all') {
      // Filter by category
      filtered = filtered.filter(a => a.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      );
    }

    // Filter by tags (Phase 5)
    if (filterTags.size > 0) {
      filtered = filtered.filter(asset => {
        const tags = assetTags.get(asset.id);
        if (!tags || tags.size === 0) return false;
        // Asset must have ALL selected filter tags
        return Array.from(filterTags).every(tag => tags.has(tag));
      });
    }

    return filtered;
  }, [assets, activeCategory, searchQuery, filterTags, assetTags, isFavorite]);

  // Get all unique tags (Phase 5)
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    assetTags.forEach(tags => {
      tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [assetTags]);

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

  // Get usage info for an asset
  const getAssetUsageInfo = (assetPath) => {
    const usage = assetUsage.get(assetPath);
    if (!usage) return null;

    const sceneCount = usage.scenes.length;
    const characterCount = usage.characters.length;
    const totalUsage = sceneCount + characterCount;

    if (totalUsage === 0) return null;

    return {
      total: totalUsage,
      scenes: usage.scenes,
      characters: usage.characters,
      sceneCount,
      characterCount
    };
  };

  // Navigate lightbox
  const navigateLightbox = (direction) => {
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
    const handleKeyDown = (e) => {
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
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 gap-0 dark bg-slate-900 text-slate-100">
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
                <DialogDescription className="text-sm text-slate-400">
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
              <div className="grid grid-cols-4 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.used}</div>
                    <div className="text-xs text-muted-foreground">Utilisés</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{stats.unused}</div>
                    <div className="text-xs text-muted-foreground">Non utilisés</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <SlidersHorizontal className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{filteredAssets.length}</div>
                    <div className="text-xs text-muted-foreground">Filtrés</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </DialogHeader>

          {/* Filters & Search */}
          <div className="px-8 py-4 border-b bg-slate-800/50">
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isSelectionMode ? "Rechercher un arrière-plan..." : "Rechercher un asset..."}
                  className="pl-10 pr-10 bg-slate-900 border-slate-700 text-slate-100"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
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
                  onClick={() => setActiveCategory('all')}
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
                  onClick={() => setActiveCategory('favorites')}
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  Favoris
                  <Badge variant="secondary" className="ml-1">
                    {favorites.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeCategory === 'backgrounds' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory('backgrounds')}
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
                  onClick={() => setActiveCategory('characters')}
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
                  onClick={() => setActiveCategory('illustrations')}
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
            {!isSelectionMode && filteredAssets.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                {/* Bulk Selection */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                      onCheckedChange={toggleSelectAll}
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
                        onClick={handleBulkDelete}
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
                          onClick={() => toggleFilterTag(tag)}
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

          {/* Assets Grid */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-8 py-6">
              {/* NEW: Upload Zone - TOUJOURS visible, même en mode sélection */}
              <div className="mb-6">
                {isSelectionMode ? (
                  // Mode compact: Petit bouton upload dans le header
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Sélectionner un {activeCategory}</h3>
                    <UploadZone category={activeCategory} compact={true} />
                  </div>
                ) : (
                  // Mode full: Grande drop zone quand 0 assets, ou compacte sinon
                  filteredAssets.length === 0 && !searchQuery && !loading ? (
                    // Empty state géré plus bas, pas de UploadZone ici
                    null
                  ) : (
                    // Assets existants: Upload zone compacte en haut
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
                      category={activeCategory === 'all' ? 'all' : activeCategory.replace(/s$/, '')}
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
                <div className="grid grid-cols-5 gap-6">
                  {filteredAssets.map(asset => {
                    const usage = getAssetUsageInfo(asset.path);
                    const isUsed = usage !== null;

                    const assetTagsList = assetTags.get(asset.id) || new Set();
                    const isSelected = selectedAssets.has(asset.id);

                    return (
                      <Card
                        key={asset.id}
                        className={`group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={(e) => {
                          if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.tag-input-wrapper')) {
                            setLightboxAsset(asset);
                          }
                        }}
                      >
                        {/* Image Preview */}
                        <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                          <img
                            src={asset.path}
                            alt={asset.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e2e8f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="16"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                          />

                          {/* Checkbox (Phase 5) */}
                          <div className="absolute top-2 left-2 checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleAssetSelection(asset.id)}
                              className="bg-white border-2"
                            />
                          </div>

                          {/* Favorite Star Toggle (Phase 2) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(asset.path);
                            }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isFavorite(asset.path)
                                ? 'bg-amber-500 text-white scale-110'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-amber-500 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                            title={isFavorite(asset.path) ? "Retirer des favoris" : "Ajouter aux favoris"}
                            aria-label={isFavorite(asset.path) ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            <Star className={`w-4 h-4 ${isFavorite(asset.path) ? 'fill-current' : ''}`} />
                          </button>

                          {/* Overlay - Always visible in selection mode */}
                          <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center ${
                            isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="flex gap-2">
                              {isSelectionMode && asset.category === 'backgrounds' ? (
                                <Button
                                  size={isSelectionMode ? "default" : "sm"}
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectBackground(asset.path);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                                >
                                  <MapPin className="h-5 w-5 mr-2" />
                                  Utiliser
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Usage Badge */}
                          {isUsed && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="backdrop-blur-sm bg-green-600">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Utilisé ({usage.total})
                              </Badge>
                            </div>
                          )}

                          {/* Category Badge */}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="backdrop-blur-sm">
                              {asset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
                              {asset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
                              {asset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
                              {asset.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Info Section */}
                        <CardContent className="p-4">
                          <p className="font-semibold text-sm truncate mb-2" title={asset.name}>
                            {asset.name}
                          </p>

                          {/* Tags (Phase 5) */}
                          {assetTagsList.size > 0 && (
                            <div className="flex gap-1 flex-wrap mb-2">
                              {Array.from(assetTagsList).map(tag => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTagFromAsset(asset.id, tag);
                                  }}
                                >
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                  <X className="h-2 w-2 ml-1" />
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Add Tag Input (Phase 5) */}
                          <div className="tag-input-wrapper mb-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              placeholder="+ tag"
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  addTagToAsset(asset.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>

                          {/* Usage Details */}
                          {isUsed && (
                            <div className="space-y-1">
                              {usage.sceneCount > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{usage.sceneCount} scène{usage.sceneCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {usage.characterCount > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <UsersIcon className="h-3 w-3" />
                                  <span>{usage.characterCount} personnage{usage.characterCount > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {!isUsed && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Non utilisé
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* List View (Phase 5) */}
              {!loading && !error && filteredAssets.length > 0 && viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredAssets.map(asset => {
                    const usage = getAssetUsageInfo(asset.path);
                    const isUsed = usage !== null;
                    const assetTagsList = assetTags.get(asset.id) || new Set();
                    const isSelected = selectedAssets.has(asset.id);

                    return (
                      <Card
                        key={asset.id}
                        className={`cursor-pointer hover:shadow-lg transition-all ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={(e) => {
                          if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.tag-input-wrapper')) {
                            setLightboxAsset(asset);
                          }
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          {/* Checkbox */}
                          <div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleAssetSelection(asset.id)}
                            />
                          </div>

                          {/* Thumbnail */}
                          <div className="w-20 h-20 rounded overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex-shrink-0">
                            <img
                              src={asset.path}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e2e8f0" width="80" height="80"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{asset.name}</p>
                              <Badge variant="secondary">
                                {asset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
                                {asset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
                                {asset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
                                {asset.category}
                              </Badge>
                              {isUsed && (
                                <Badge variant="default" className="bg-green-600">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Utilisé ({usage.total})
                                </Badge>
                              )}
                            </div>

                            {/* Tags */}
                            {assetTagsList.size > 0 && (
                              <div className="flex gap-1 flex-wrap mb-2">
                                {Array.from(assetTagsList).map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTagFromAsset(asset.id, tag);
                                    }}
                                  >
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tag}
                                    <X className="h-2 w-2 ml-1" />
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Usage Details */}
                            {isUsed && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {usage.sceneCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {usage.sceneCount} scène{usage.sceneCount > 1 ? 's' : ''}
                                  </span>
                                )}
                                {usage.characterCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <UsersIcon className="h-3 w-3" />
                                    {usage.characterCount} personnage{usage.characterCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Add Tag Input */}
                          <div className="tag-input-wrapper w-32" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="text"
                              placeholder="+ tag"
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  addTagToAsset(asset.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>

                          {/* View/Select Button */}
                          {isSelectionMode && asset.category === 'backgrounds' ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBackground(asset.path);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Utiliser
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* OLD Upload Section removed - replaced by UploadZone component above */}
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxAsset && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setLightboxAsset(null)}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxAsset(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('prev');
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox('next');
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Image */}
          <div
            className="max-w-5xl max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxAsset.path}
              alt={lightboxAsset.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Info Panel */}
            <Card className="mt-6 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{lightboxAsset.name}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {lightboxAsset.category === 'backgrounds' && <ImageIcon className="h-3 w-3 mr-1" />}
                        {lightboxAsset.category === 'characters' && <UsersIcon className="h-3 w-3 mr-1" />}
                        {lightboxAsset.category === 'illustrations' && <Palette className="h-3 w-3 mr-1" />}
                        {lightboxAsset.category}
                      </Badge>

                      {(() => {
                        const usage = getAssetUsageInfo(lightboxAsset.path);
                        if (usage) {
                          return (
                            <Badge variant="default">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Utilisé dans {usage.total} élément{usage.total > 1 ? 's' : ''}
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Non utilisé
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Usage Details */}
                {(() => {
                  const usage = getAssetUsageInfo(lightboxAsset.path);
                  if (usage) {
                    return (
                      <div className="space-y-3">
                        <Separator />
                        <div className="grid grid-cols-2 gap-6">
                          {usage.sceneCount > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Scènes ({usage.sceneCount})
                              </h4>
                              <ul className="space-y-1">
                                {usage.scenes.map((scene, i) => (
                                  <li key={i} className="text-sm text-muted-foreground">• {scene}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {usage.characterCount > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <UsersIcon className="h-4 w-4" />
                                Personnages ({usage.characterCount})
                              </h4>
                              <ul className="space-y-1">
                                {usage.characters.map((char, i) => (
                                  <li key={i} className="text-sm text-muted-foreground">• {char}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm flex items-center gap-4">
            <span>← → pour naviguer</span>
            <span>•</span>
            <span>ESC pour fermer</span>
          </div>
        </div>
      )}
    </>
  );
}

AssetsLibraryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCategory: PropTypes.string, // Optional - 'backgrounds' | 'characters' | 'illustrations'
  targetSceneId: PropTypes.string // Optional - Scene ID for background selection mode
};
