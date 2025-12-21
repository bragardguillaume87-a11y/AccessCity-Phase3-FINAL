import React, { useState, useEffect } from 'react';
import { useScenesStore, useUIStore } from '../stores/index.js';
import { GALLERY_ASSETS } from '../constants/assets.js';

export default function AssetsPanel({ onPrev, onNext }) {
  const scenes = useScenesStore(state => state.scenes);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const updateScene = useScenesStore(state => state.updateScene);
  const [history, setHistory] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  const scene = scenes.find(s => s.id === selectedSceneForEdit);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem('ac_backgrounds_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch {}
    }
  }, []);

  function setBackground(url) {
    if (!scene) return;

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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            🎨 Etape 3 : Assets
          </h2>
          <p className="text-slate-600">
            Gerez les arriere-plans et ressources visuelles
          </p>
        </div>
        {scene && (
          <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            Scene : {scene.title}
          </div>
        )}
      </div>

      {!scene ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-slate-600 font-medium mb-2">Aucune scene selectionnee</p>
          <p className="text-sm text-slate-500">
            Allez dans l'onglet "Scenes" pour creer ou selectionner une scene
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE : Configuration */}
          <div className="space-y-6">
            {/* Input URL */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">URL personnalisee</h3>
              <div>
                <label htmlFor="background-url" className="block text-sm font-semibold mb-2 text-slate-700">
                  Chemin ou URL de l'arriere-plan
                </label>
                <input
                  id="background-url"
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="/assets/backgrounds/city.jpg"
                  value={scene.backgroundUrl || ''}
                  onChange={(e) => setBackground(e.target.value)}
                  aria-label="URL du decor de la scene"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Entrez un chemin local (ex: /assets/...) ou une URL complete (https://...)
                </p>
              </div>
            </div>

            {/* Galerie d'assets */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Galerie de decors</h3>
              <div className="grid grid-cols-2 gap-3">
                {GALLERY_ASSETS.map((asset) => (
                  <button
                    key={asset.url}
                    onClick={() => setBackground(asset.url)}
                    className={`rounded-lg overflow-hidden border-2 transition-all group ${
                      scene.backgroundUrl === asset.url
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                    }`}
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
                    <div className={`text-xs px-2 py-1.5 text-left font-medium transition-colors ${
                      scene.backgroundUrl === asset.url
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-50 text-slate-700 group-hover:bg-blue-50'
                    }`}>
                      {asset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Historique récent */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Decors recents</h3>
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
          </div>

          {/* COLONNE DROITE : Aperçu */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Apercu en direct</h3>
            {scene.backgroundUrl ? (
              <div className="relative">
                <img
                  src={scene.backgroundUrl}
                  alt={`Decor de la scene ${scene.title}`}
                  className="w-full max-h-[500px] object-contain rounded-lg shadow-md border-2 border-slate-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-64 bg-gradient-to-br from-red-50 to-red-100 rounded-lg items-center justify-center flex-col text-red-600 border-2 border-red-200">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold">Impossible de charger l'image</p>
                  <p className="text-xs mt-1 px-4 text-center break-all">{scene.backgroundUrl}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Aucune image selectionnee</p>
                  <p className="text-xs mt-1">Choisissez un decor dans la galerie ou entrez une URL</p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Formats supportes</p>
                  <p>JPG, PNG, SVG, GIF. Dimensions recommandees : 1920x1080px minimum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
          >
            ← Precedent
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all ml-auto"
          >
            Suivant : Scenes →
          </button>
        )}
      </div>
    </div>
  );
}
