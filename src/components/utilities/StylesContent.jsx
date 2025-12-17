import React, { useState } from 'react';
import { useApp } from '../../AppContext.jsx';

/**
 * StylesContent - Styles visuels de la scène
 * Couleur de fond, filtres, effets
 */
export default function StylesContent() {
  const { selectedSceneId, scenes, updateScene } = useApp();
  
  const currentScene = scenes.find(s => s.id === selectedSceneId);

  const [sceneStyles, setSceneStyles] = useState({
    backgroundColor: currentScene?.backgroundColor || '#1e293b',
    filter: currentScene?.filter || 'none',
    opacity: currentScene?.opacity || 1.0,
    blur: currentScene?.blur || 0
  });

  const handleStyleChange = (key, value) => {
    setSceneStyles(prev => ({ ...prev, [key]: value }));
    if (selectedSceneId) {
      updateScene(selectedSceneId, { [key]: value });
    }
  };

  const filters = [
    { id: 'none', label: 'Aucun', icon: '🔳' },
    { id: 'grayscale', label: 'Noir & Blanc', icon: '⬛' },
    { id: 'sepia', label: 'Sépia', icon: '🟫' },
    { id: 'invert', label: 'Inversé', icon: '🔄' },
    { id: 'blur', label: 'Flou', icon: '🌫️' }
  ];

  if (!selectedSceneId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4 opacity-50">🎨</div>
        <div className="text-slate-400 text-sm">
          Aucune scène sélectionnée
        </div>
        <div className="text-slate-500 text-xs mt-2">
          Sélectionnez une scène pour modifier ses styles visuels
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête scène */}
      <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
        <div className="text-xs text-purple-300 mb-1">Scène active</div>
        <div className="font-bold text-lg">{currentScene?.title || 'Sans titre'}</div>
      </div>
      {/* Couleur de fond */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>🎨</span>
          <span>Couleur de fond</span>
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={sceneStyles.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="w-16 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={sceneStyles.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            placeholder="#1e293b"
          />
        </div>
      </div>
      {/* Filtres visuels */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>✨</span>
          <span>Filtre visuel</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleStyleChange('filter', filter.id)}
              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                sceneStyles.filter === filter.id
                  ? 'bg-blue-900 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-1">{filter.icon}</div>
              <div>{filter.label}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Opacité */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>👁️</span>
          <span>Opacité</span>
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sceneStyles.opacity}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            value={sceneStyles.opacity}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
            step="0.1"
            min="0"
            max="1"
          />
        </div>
      </div>
      {/* Effet flou (si filtre blur actif) */}
      {sceneStyles.filter === 'blur' && (
        <div>
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <span>🌫️</span>
            <span>Intensité du flou</span>
          </h4>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={sceneStyles.blur}
              onChange={(e) => handleStyleChange('blur', parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              value={sceneStyles.blur}
              onChange={(e) => handleStyleChange('blur', parseInt(e.target.value))}
              className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
            />
            <span className="text-xs text-slate-400">px</span>
          </div>
        </div>
      )}
      {/* Prévisualisation */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>👀</span>
          <span>Prévisualisation</span>
        </h4>
        <div
          className="w-full h-32 rounded-lg border-2 border-slate-600 flex items-center justify-center text-4xl"
          style={{
            backgroundColor: sceneStyles.backgroundColor,
            filter: sceneStyles.filter !== 'none' 
              ? `${sceneStyles.filter}(${sceneStyles.filter === 'blur' ? sceneStyles.blur + 'px' : '100%'})` 
              : 'none',
            opacity: sceneStyles.opacity
          }}
        >
          🎭
        </div>
      </div>
      {/* Reset */}
      <button
        onClick={() => {
          const defaults = {
            backgroundColor: '#1e293b',
            filter: 'none',
            opacity: 1.0,
            blur: 0
          };
          setSceneStyles(defaults);
          if (selectedSceneId) {
            updateScene(selectedSceneId, defaults);
          }
        }}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >
        🔄 Réinitialiser les styles
      </button>
    </div>
  );
}
