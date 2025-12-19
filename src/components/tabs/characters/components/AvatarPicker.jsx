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
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#64748b'
      }}>
        Chargement des avatars...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        borderRadius: '6px'
      }}>
        Erreur: {error}
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f8fafc'
    }}>
      {/* Avatar actuel */}
      {currentSprite && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            Avatar actuel ({mood})
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '2px solid #3b82f6'
          }}>
            <img
              src={currentSprite}
              alt={mood}
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px'
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {currentSprite}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(mood, '')}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retirer
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Rechercher un avatar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Assets récents */}
      {!searchTerm && recentAssets.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#64748b',
            marginBottom: '8px',
            textTransform: 'uppercase'
          }}>
            Récents
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px'
          }}>
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
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#64748b',
        marginBottom: '8px',
        textTransform: 'uppercase'
      }}>
        {searchTerm ? `Résultats (${filteredAssets.length})` : 'Tous les avatars'}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '4px'
      }}>
        {filteredAssets.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '20px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.875rem'
          }}>
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
    style={{
      position: 'relative',
      aspectRatio: '1',
      border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
      borderRadius: '6px',
      overflow: 'hidden',
      cursor: 'pointer',
      backgroundColor: 'white',
      transition: 'all 0.2s',
      boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
    }}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#cbd5e1';
        e.currentTarget.style.transform = 'scale(1.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    title={name || path}
  >
    <img
      src={path}
      alt={name || path}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        padding: '4px'
      }}
      onError={(e) => {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2394a3b8">?</text></svg>';
      }}
    />
    {isSelected && (
      <div style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '16px',
        height: '16px',
        backgroundColor: '#3b82f6',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: 'white'
      }}>
        ✓
      </div>
    )}
  </div>
);
