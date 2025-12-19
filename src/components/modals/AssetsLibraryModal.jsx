import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAssets } from '../../hooks/useAssets.js';
import { useApp } from '../../AppContext.jsx';
import AssetPicker from '../AssetPicker.jsx';
import BaseModal from './BaseModal.jsx';

/**
 * AssetsLibraryModal - Modal for managing project assets
 * Converted from AssetsLibraryPanel to modal format
 * Supports initial category selection via initialCategory prop
 */
export default function AssetsLibraryModal({ isOpen, onClose, initialCategory }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const { assets, loading, error } = useAssets();
  const { scenes, characters } = useApp();

  // Set initial category when modal opens
  useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  // Available categories
  const assetCategories = [
    { id: 'all', label: 'Tous les assets', icon: '📦' },
    { id: 'backgrounds', label: 'Arrière-plans', icon: '🏞️' },
    { id: 'characters', label: 'Sprites personnages', icon: '🧍' },
    { id: 'illustrations', label: 'Illustrations', icon: '🎨' }
  ];

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
    <BaseModal isOpen={isOpen} onClose={onClose} title="📚 Bibliothèque d'Assets" size="xl">
      <div className="p-6 space-y-6">
        {/* Description */}
        <p className="text-slate-400 text-sm">
          Gérez tous les assets de votre projet (backgrounds, sprites, illustrations)
        </p>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-900/30 border-2 border-blue-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{usageStats.total}</div>
            <div className="text-sm text-blue-300 font-medium">Assets totaux</div>
          </div>
          <div className="bg-green-900/30 border-2 border-green-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{usageStats.used}</div>
            <div className="text-sm text-green-300 font-medium">Utilisés</div>
          </div>
          <div className="bg-amber-900/30 border-2 border-amber-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">{usageStats.unused}</div>
            <div className="text-sm text-amber-300 font-medium">Non utilisés</div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
          {assetCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Asset Grid/List */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Chargement des assets...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400 font-semibold">Erreur : {error.message}</p>
            </div>
          )}

          {!loading && !error && filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg font-semibold text-slate-300 mb-2">Aucun asset dans cette catégorie</p>
              <p className="text-sm text-slate-500">Uploadez vos premiers assets ci-dessous</p>
            </div>
          )}

          {!loading && !error && filteredAssets.length > 0 && (
            <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className="border-2 border-slate-700 rounded-lg p-3 hover:border-blue-500 transition-all cursor-pointer bg-slate-900"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-slate-950 rounded-lg mb-2 overflow-hidden">
                    <img
                      src={asset.path}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="text-xs">
                    <p className="font-semibold text-white truncate" title={asset.name}>
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
        <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            📤 Uploader de nouveaux assets
          </h3>
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
          <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Astuce :</strong> Après avoir uploadé des fichiers manuellement dans /public/assets,
              exécutez <code className="bg-blue-950 px-1 rounded text-blue-200">npm run generate-assets</code> pour mettre à jour le manifest.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

AssetsLibraryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCategory: PropTypes.string // Optional - 'backgrounds' | 'characters' | 'illustrations'
};
