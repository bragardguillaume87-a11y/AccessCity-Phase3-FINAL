import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAssets } from '../../hooks/useAssets.js';
import { useScenesStore, useCharactersStore } from '../../stores/index.js';
import AssetPicker from '../AssetPicker.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, ImageIcon, Users as UsersIcon, Palette, AlertCircle, Upload, Lightbulb } from 'lucide-react';

/**
 * AssetsLibraryModal - Modal for managing project assets (Redesigned with shadcn/ui)
 * Converted from AssetsLibraryPanel to modal format
 * Supports initial category selection via initialCategory prop
 */
export default function AssetsLibraryModal({ isOpen, onClose, initialCategory }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const { assets, loading, error } = useAssets();

  // Zustand stores (granular selectors)
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);

  // Set initial category when modal opens
  useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  // Filter assets by category
  const filteredAssets = useMemo(() => {
    if (activeCategory === 'all') return assets;
    return assets.filter(a => a.category === activeCategory);
  }, [assets, activeCategory]);

  // Calculate usage statistics
  const usageStats = useMemo(() => {
    const usedAssets = new Set();

    // Assets used in scenes (backgrounds)
    scenes.forEach(scene => {
      if (scene.background) {
        usedAssets.add(scene.background);
      }
      if (scene.backgroundUrl) {
        usedAssets.add(scene.backgroundUrl);
      }
    });

    // Assets used in characters (sprites)
    characters.forEach(character => {
      if (character.sprites) {
        Object.values(character.sprites).forEach(sprite => {
          if (sprite) usedAssets.add(sprite);
        });
      }
    });

    return {
      total: assets.length,
      used: usedAssets.size,
      unused: assets.length - usedAssets.size
    };
  }, [assets, scenes, characters]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6" />
            Bibliothèque d'Assets
          </DialogTitle>
          <DialogDescription>
            Parcourez et gérez vos assets (backgrounds, sprites, illustrations)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-primary mb-1">{usageStats.total}</div>
                <div className="text-sm text-muted-foreground font-medium">Assets totaux</div>
              </CardContent>
            </Card>
            <Card className="border-green-500/20 bg-green-50">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-1">{usageStats.used}</div>
                <div className="text-sm text-muted-foreground font-medium">Utilisés</div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-50">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-amber-600 mb-1">{usageStats.unused}</div>
                <div className="text-sm text-muted-foreground font-medium">Non utilisés</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Tous
              </TabsTrigger>
              <TabsTrigger value="backgrounds" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Arrière-plans
              </TabsTrigger>
              <TabsTrigger value="characters" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Sprites
              </TabsTrigger>
              <TabsTrigger value="illustrations" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Illustrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Chargement des assets...</p>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Erreur : {error.message}</AlertDescription>
                    </Alert>
                  )}

                  {!loading && !error && filteredAssets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Package className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-semibold mb-2">Aucun asset dans cette catégorie</p>
                      <p className="text-sm text-muted-foreground">Uploadez vos premiers assets ci-dessous</p>
                    </div>
                  )}

                  {!loading && !error && filteredAssets.length > 0 && (
                    <ScrollArea className="h-[400px]">
                      <div className="grid grid-cols-4 gap-4 pr-4">
                        {filteredAssets.map(asset => (
                          <TooltipProvider key={asset.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Card className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                  <CardContent className="p-3">
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                                      <img
                                        src={asset.path}
                                        alt={asset.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    </div>

                                    {/* Info */}
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium truncate" title={asset.name}>
                                        {asset.name}
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {asset.category}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{asset.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Upload Section */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  Uploader de nouveaux assets
                </h3>
              </div>

              <AssetPicker
                type={activeCategory === 'all' ? 'background' : activeCategory === 'characters' ? 'character' : 'background'}
                value=""
                onChange={(url) => {
                  console.log('Asset uploaded:', url);
                  // Note: Le manifest sera régénéré manuellement avec npm run generate-assets
                }}
                allowUpload={true}
                allowUrl={true}
              />

              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Astuce :</strong> Après avoir uploadé des fichiers manuellement dans /public/assets,
                  exécutez <code className="bg-blue-100 px-1 rounded text-blue-800">npm run generate-assets</code> pour mettre à jour le manifest.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

AssetsLibraryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCategory: PropTypes.string // Optional - 'backgrounds' | 'characters' | 'illustrations'
};
