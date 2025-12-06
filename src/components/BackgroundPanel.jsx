// src/components/BackgroundPanel.jsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext.jsx';

const GALLERY_ASSETS = [
  'assets/backgrounds/city_street.svg',
  'assets/backgrounds/city_hall.svg',
  'assets/backgrounds/park.svg',
  'assets/backgrounds/office.svg'
];

export default function BackgroundPanel() {
  const { scenes, selectedSceneId, updateScene } = useApp();
  const [history, setHistory] = useState([]);

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
      <div className="border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        Selectionne une scene pour configurer son decor.
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

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-primary">Decor / Lieu</h3>

      <div className="border-2 border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-semibold mb-2">URL du decor (image)</label>
        <input
          type="text"
          className="w-full px-3 py-2 border-2 border-gray-200 rounded focus:border-primary outline-none"
          placeholder="assets/backgrounds/city.jpg ou URL"
          value={scene.backgroundUrl || ''}
          onChange={(e) => setBackground(e.target.value)}
          aria-label="URL du decor"
        />
      </div>

      {/* Galerie d'assets */}
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <p className="text-sm font-semibold mb-2">Galerie de decors</p>
        <div className="grid grid-cols-2 gap-3">
          {GALLERY_ASSETS.map((bg) => (
            <button
              key={bg}
              onClick={() => setBackground(bg)}
              className="rounded overflow-hidden border-2 hover:border-primary transition-all"
              aria-label={`Utiliser ${bg.split('/').pop()}`}
            >
              <img src={bg} alt={bg} className="w-full h-24 object-cover" />
              <div className="text-xs px-2 py-1 text-left text-gray-600 bg-gray-50">
                {bg.split('/').pop()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Historique récent */}
      {history.length > 0 && (
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">Decors recents</p>
          <div className="flex flex-wrap gap-2">
            {history.map((bg) => (
              <button
                key={bg}
                onClick={() => setBackground(bg)}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border hover:border-primary transition-all"
                title={bg}
              >
                {bg.length > 30 ? bg.slice(0, 27) + '...' : bg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aperçu */}
      <div className="border-2 border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Apercu du decor</p>
        {scene.backgroundUrl ? (
          <img
            src={scene.backgroundUrl}
            alt="Decor"
            className="w-full max-h-64 object-cover rounded"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
            Aucune image
          </div>
        )}
      </div>
    </div>
  );
}
