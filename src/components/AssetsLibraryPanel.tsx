import { useState, useMemo } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { useScenesStore, useCharactersStore } from '../stores/index';
import AssetPicker from './AssetPicker.jsx';
import type { Asset } from '@/types';

/**
 * Asset category configuration
 */
interface AssetCategory {
  id: string;
  label: string;
  icon: string;
}

/**
 * Asset usage statistics
 */
interface UsageStats {
  total: number;
  used: number;
  unused: number;
}

/**
 * AssetsLibraryPanel component props
 */
export interface AssetsLibraryPanelProps {
  /** Callback when navigating to previous step */
  onPrev?: () => void;
  /** Callback when navigating to next step */
  onNext?: () => void;
}

/**
 * Bibliothèque d'Assets Centralisée
 * Vue d'ensemble professionnelle de tous les assets du projet
 */
export default function AssetsLibraryPanel({ onPrev, onNext }: AssetsLibraryPanelProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { assets, loading, error } = useAssets();
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);

  // Catégories disponibles
  const assetCategories: AssetCategory[] = [
    { id: 'all', label: 'Tous les assets', icon: '📦' },
    { id: 'backgrounds', label: 'Arrière-plans', icon: '🏞️' },
    { id: 'characters', label: 'Sprites personnages', icon: '🧍' },
    { id: 'illustrations', label: 'Illustrations', icon: '🎨' }
  ];

  // Filtrer assets par catégorie
  const filteredAssets = useMemo(() => {
    if (activeCategory === 'all') return assets;
    return assets.filter(a => a.category === activeCategory);
  }, [assets, activeCategory]);

  // Calculer les stats d'utilisation
  const usageStats: UsageStats = useMemo(() => {
    const usedAssets = new Set<string>();

    // Assets utilisés dans les scènes (backgrounds)
    scenes.forEach(scene => {
      if (scene.backgroundUrl) {
        usedAssets.add(scene.backgroundUrl);
      }
    });

    // Assets utilisés dans les personnages (sprites)
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
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          📚 Bibliothèque d'Assets
        </h2>
        <p className="text-slate-600">
          Gérez tous les assets de votre projet (backgrounds, sprites, illustrations)
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-700">{usageStats.total}</div>
          <div className="text-sm text-blue-600 font-medium">Assets totaux</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-700">{usageStats.used}</div>
          <div className="text-sm text-green-600 font-medium">Utilisés</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-700">{usageStats.unused}</div>
          <div className="text-sm text-amber-600 font-medium">Non utilisés</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {assetCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Asset Grid/List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Chargement des assets...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 font-semibold">Erreur : {error}</p>
          </div>
        )}

        {!loading && !error && filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-lg font-semibold text-slate-700 mb-2">Aucun asset dans cette catégorie</p>
            <p className="text-sm text-slate-500">Uploadez vos premiers assets ci-dessous</p>
          </div>
        )}

        {!loading && !error && filteredAssets.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id as string}
                className="magnetic-lift shadow-depth-sm border-2 border-slate-200 rounded-lg p-3 hover:border-blue-400 transition-all cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-slate-100 rounded-lg mb-2 overflow-hidden">
                  <img
                    src={asset.path}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="text-xs">
                  <p className="font-semibold text-slate-900 truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="text-slate-500">{asset.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          📤 Uploader de nouveaux assets
        </h3>
        <AssetPicker
          type={activeCategory === 'all' ? 'background' : activeCategory === 'characters' ? 'character' : 'background'}
          value=""
          onChange={(url: string) => {
            // Note: Le manifest sera régénéré manuellement avec npm run generate-assets
          }}
          allowUpload={true}
          allowUrl={true}
        />
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Astuce :</strong> Après avoir uploadé des fichiers manuellement dans /public/assets,
            exécutez <code className="bg-blue-100 px-1 rounded">npm run generate-assets</code> pour mettre à jour le manifest.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onPrev && (
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            ← Étape précédente
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="btn-gradient-primary px-6 py-3 text-white font-semibold rounded-lg"
          >
            Étape suivante →
          </button>
        )}
      </div>
    </div>
  );
}
