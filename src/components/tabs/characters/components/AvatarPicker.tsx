import React, { useState, useEffect } from 'react';
import { useAssets, getRecentAssets, addToRecentAssets } from '@/hooks/useAssets';

interface AvatarPickerProps {
  currentSprites?: Record<string, string>;
  onSelect: (mood: string, path: string) => void;
  mood: string;
  labels?: Record<string, string>;
}

/**
 * Sélecteur d'avatar pour un personnage
 * Permet de parcourir les assets disponibles et de sélectionner un sprite
 *
 * REFACTORED (Phase 7):
 * - Fallback to all assets when 'characters' category is empty
 * - Harmonized with Midnight Bloom theme (slate → semantic classes)
 */
export const AvatarPicker: React.FC<AvatarPickerProps> = ({ currentSprites = {}, onSelect, mood, labels = {} }) => {
  // Try characters first, fallback to all assets if empty
  const { assets: characterAssets, loading: loadingChars } = useAssets({ category: 'characters' });
  const { assets: allAssets, loading: loadingAll, error } = useAssets({});

  // Use character assets if available, otherwise show all assets
  const hasCharacterAssets = characterAssets.length > 0;
  const assets = hasCharacterAssets ? characterAssets : allAssets;
  const loading = loadingChars || loadingAll;

  const [recentAssets, setRecentAssets] = useState<string[]>([]);
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

  const handleSelect = (assetPath: string) => {
    onSelect(mood, assetPath);
    // Ajouter aux récents
    const newRecent = addToRecentAssets('character-sprites', assetPath, 6);
    setRecentAssets(newRecent);
  };

  const currentSprite = currentSprites[mood];

  if (loading) {
    return (
      <div className="p-5 text-center text-muted-foreground">
        Chargement des avatars...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 text-center text-destructive bg-destructive/10 rounded-lg">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      {/* Info si fallback sur tous les assets */}
      {!hasCharacterAssets && assets.length > 0 && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-muted-foreground">
          <strong className="text-foreground">Info:</strong> Aucun sprite de personnage trouvé.
          Affichage de tous les assets disponibles.
        </div>
      )}

      {/* Avatar actuel */}
      {currentSprite && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
            Avatar actuel ({mood})
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border-2 border-primary">
            <img
              src={currentSprite}
              alt={mood}
              className="w-16 h-16 object-contain bg-card rounded"
            />
            <div className="flex-1 overflow-hidden">
              <div className="text-xs text-muted-foreground truncate">
                {currentSprite}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(mood, '')}
              className="px-3 py-1.5 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded transition-colors"
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
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Assets récents */}
      {!searchTerm && recentAssets.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
            Récents
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
            {recentAssets.map((assetPath, idx) => (
              <AssetThumbnail
                key={idx}
                path={assetPath}
                name={assetPath.split('/').pop() || assetPath}
                isSelected={assetPath === currentSprite}
                onClick={() => handleSelect(assetPath)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grille d'avatars disponibles */}
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
        {searchTerm ? `Résultats (${filteredAssets.length})` : 'Tous les avatars'}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 max-h-80 overflow-y-auto p-1">
        {filteredAssets.length === 0 && (
          <div className="col-span-full p-5 text-center text-muted-foreground text-sm">
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

interface AssetThumbnailProps {
  path: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Composant miniature d'asset
 * Harmonized with Midnight Bloom theme
 */
const AssetThumbnail: React.FC<AssetThumbnailProps> = ({ path, name, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer bg-background transition-all ${
      isSelected
        ? 'border-primary ring-2 ring-primary/30'
        : 'border-border hover:border-muted-foreground hover:scale-105'
    }`}
    title={name || path}
  >
    <img
      src={path}
      alt={name || path}
      className="w-full h-full object-contain p-1"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%232f3436" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23a3a3a3">?</text></svg>';
      }}
    />
    {isSelected && (
      <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground">
        ✓
      </div>
    )}
  </div>
);
