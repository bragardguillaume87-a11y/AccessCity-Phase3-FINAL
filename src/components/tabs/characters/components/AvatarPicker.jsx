import React, { useState, useEffect } from 'react';
import { useAssets, getRecentAssets, addToRecentAssets } from '../../../../hooks/useAssets.js';

/**
 * Sélecteur d'avatar pour un personnage
 * Permet de parcourir les assets disponibles et de sélectionner un sprite
 */
export const AvatarPicker = ({ currentSprites = {}, onSelect, mood, labels = {} }) => {
  const { assets, loading, error } = useAssets({ category: 'characters' });
  const [recentAssets, setRecentAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les assets récents au montage
  useEffect(() => {
    const recent = getRecentAssets('character-sprites', 6);
    setRecentAssets(recent);
  }, []);

  // Filtrer les assets en fonction de la recherche
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (assetPath) => {
    onSelect(mood, assetPath);
    // Ajouter aux récents
    const newRecent = addToRecentAssets('character-sprites', assetPath, 6);
    setRecentAssets(newRecent);
  };

  const currentSprite = currentSprites[mood];

  if (loading) {
    return (
      <div className="p-5 text-center text-slate-500">
        Chargement des avatars...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 text-center text-red-600 bg-red-100 rounded-lg">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
      {/* Avatar actuel */}
      {currentSprite && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">
            Avatar actuel ({mood})
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border-2 border-blue-500">
            <img
              src={currentSprite}
              alt={mood}
              className="w-16 h-16 object-contain bg-slate-800 rounded"
            />
            <div className="flex-1 overflow-hidden">
              <div className="text-xs text-slate-400 truncate">
                {currentSprite}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(mood, '')}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Retirer
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Rechercher un avatar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Assets récents */}
      {!searchTerm && recentAssets.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">
            Récents
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
            {recentAssets.map((assetPath, idx) => (
              <AssetThumbnail
                key={idx}
                path={assetPath}
                isSelected={assetPath === currentSprite}
                onClick={() => handleSelect(assetPath)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grille d'avatars disponibles */}
      <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">
        {searchTerm ? `Résultats (${filteredAssets.length})` : 'Tous les avatars'}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 max-h-80 overflow-y-auto p-1">
        {filteredAssets.length === 0 && (
          <div className="col-span-full p-5 text-center text-slate-500 text-sm">
            Aucun avatar disponible
          </div>
        )}

        {filteredAssets.map((asset, idx) => (
          <AssetThumbnail
            key={idx}
            path={asset.path}
            name={asset.name}
            isSelected={asset.path === currentSprite}
            onClick={() => handleSelect(asset.path)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Composant miniature d'asset
 */
const AssetThumbnail = ({ path, name, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer bg-slate-900 transition-all ${
      isSelected
        ? 'border-blue-500 ring-2 ring-blue-500/30'
        : 'border-slate-700 hover:border-slate-500 hover:scale-105'
    }`}
    title={name || path}
  >
    <img
      src={path}
      alt={name || path}
      className="w-full h-full object-contain p-1"
      onError={(e) => {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2394a3b8">?</text></svg>';
      }}
    />
    {isSelected && (
      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">
        ✓
      </div>
    )}
  </div>
);
