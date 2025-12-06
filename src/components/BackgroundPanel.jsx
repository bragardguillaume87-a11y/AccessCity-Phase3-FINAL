// src/components/BackgroundPanel.jsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext.jsx';

// Utilise des chemins absolus depuis /public ou des placeholders SVG
const GALLERY_ASSETS = [
  { url: '/assets/backgrounds/city_street.svg', name: 'Rue de la ville', fallback: 'city_street.svg' },
  { url: '/assets/backgrounds/city_hall.svg', name: 'Hotel de ville', fallback: 'city_hall.svg' },
  { url: '/assets/backgrounds/park.svg', name: 'Parc', fallback: 'park.svg' },
  { url: '/assets/backgrounds/office.svg', name: 'Bureau', fallback: 'office.svg' }
];

export default function BackgroundPanel() {
  const { scenes, selectedSceneId, updateScene } = useApp();
  const [history, setHistory] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  const scene = scenes.find(s => s.id === selectedSceneId);

  useEffect(() => {
    const stored = window.localStorage.getItem('ac_backgrounds_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch {}
    }
  }, []);

  if (!scene) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-primary">Decor / Lieu</h3>
        <div className="border-2 border-gray-200 rounded-lg p-6 text-center text-slate-500">
          <p className="mb-2">Aucune scene selectionnee</p>
          <p className="text-sm">Selectionnez une scene a gauche pour configurer son decor.</p>
        </div>
      </div>
    );
  }

  function setBackground(url) {
    const trimmed = url.trim();
    updateScene(scene.id, { backgroundUrl: trimmed });
    
    if (trimmed && !history.includes(trimmed)) {
      const newHistory = [trimmed, ...history.filter(u => u !== trimmed)].slice(0, 6);
      setHistory(newHistory);
      window.localStorage.setItem('ac_backgrounds_history', JSON.stringify(newHistory));
    }
  }

  function handleImageError(key) {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Decor / Lieu</h3>

      {/* Input URL */}
      <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
        <label htmlFor="background-url" className="block text-sm font-semibold mb-2 text-slate-700">
          URL du decor (image)
        </label>
        <input
          id="background-url"
          type="text"
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          placeholder="/assets/backgrounds/city.jpg ou URL complete"
          value={scene.backgroundUrl || ''}
          onChange={(e) => setBackground(e.target.value)}
          aria-label="URL du decor de la scene"
        />
        <p className="text-xs text-slate-500 mt-1">Entrez un chemin local ou une URL complete (https://...)</p>
      </div>

      {/* Galerie d'assets */}
      <div className="border-2 border-slate-200 rounded-lg p-4">
        <p className="text-sm font-semibold mb-3 text-slate-900">Galerie de decors</p>
        <div className="grid grid-cols-2 gap-3">
          {GALLERY_ASSETS.map((asset) => (
            <button
              key={asset.url}
              onClick={() => setBackground(asset.url)}
              className="rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group"
              aria-label={`Utiliser le decor ${asset.name}`}
            >
              {imageErrors[asset.url] ? (
                <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">{asset.fallback}</span>
                </div>
              ) : (
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  onError={() => handleImageError(asset.url)}
                />
              )}
              <div className="text-xs px-2 py-1.5 text-left text-slate-700 bg-slate-50 group-hover:bg-blue-50 transition-colors font-medium">
                {asset.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Historique récent */}
      {history.length > 0 && (
        <div className="border-2 border-slate-200 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2 text-slate-900">Decors recents</p>
          <div className="flex flex-wrap gap-2">
            {history.map((bg, index) => (
              <button
                key={`${bg}-${index}`}
                onClick={() => setBackground(bg)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 border border-slate-300 hover:border-blue-500 transition-all font-medium text-slate-700"
                title={bg}
                aria-label={`Utiliser le decor recent ${bg}`}
              >
                {bg.length > 30 ? bg.slice(0, 27) + '...' : bg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aperçu */}
      <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
        <p className="text-sm font-semibold mb-3 text-slate-900">Apercu du decor</p>
        {scene.backgroundUrl ? (
          <div className="relative">
            <img
              src={scene.backgroundUrl}
              alt={`Decor de la scene ${scene.name}`}
              className="w-full max-h-64 object-contain rounded-lg shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-48 bg-gradient-to-br from-red-50 to-red-100 rounded-lg items-center justify-center flex-col text-red-600 border-2 border-red-200">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold">Impossible de charger l image</p>
              <p className="text-xs mt-1">{scene.backgroundUrl}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-slate-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Aucune image de decor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
