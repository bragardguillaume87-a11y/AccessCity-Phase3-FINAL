import React, { useState } from 'react';

/**
 * PropertiesContent - Propriétés de l'élément sélectionné
 * Position, échelle, rotation, z-index
 */
export default function PropertiesContent() {
  // TODO: Récupérer l'élément sélectionné depuis AppContext (à ajouter)
  // const { selectedElement, updateElement } = useApp();
  const [selectedElement, setSelectedElement] = useState(null);

  // État temporaire pour la démo
  const [properties, setProperties] = useState({
    x: 100,
    y: 150,
    scale: 1.0,
    rotation: 0,
    zIndex: 1
  });

  const handlePropertyChange = (key, value) => {
    setProperties(prev => ({ ...prev, [key]: value }));
    // TODO: Appeler updateElement(selectedElement.id, { [key]: value })
  };

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4 opacity-50">🎯</div>
        <div className="text-slate-400 text-sm">
          Aucun élément sélectionné
        </div>
        <div className="text-slate-500 text-xs mt-2">
          Cliquez sur un personnage ou objet dans le canvas pour voir ses propriétés
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête élément sélectionné */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <div className="text-xs text-blue-300 mb-1">Élément sélectionné</div>
        <div className="font-bold text-lg">{selectedElement.name || 'Sans nom'}</div>
        <div className="text-xs text-slate-400">{selectedElement.type}</div>
      </div>
      {/* Position */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>📍</span>
          <span>Position</span>
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">X</label>
            <input
              type="number"
              value={properties.x}
              onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Y</label>
            <input
              type="number"
              value={properties.y}
              onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      {/* Échelle */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>📏</span>
          <span>Échelle</span>
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={properties.scale}
            onChange={(e) => handlePropertyChange('scale', parseFloat(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            value={properties.scale}
            onChange={(e) => handlePropertyChange('scale', parseFloat(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
            step="0.1"
          />
        </div>
      </div>
      {/* Rotation */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>🔄</span>
          <span>Rotation</span>
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={properties.rotation}
            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            value={properties.rotation}
            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
          />
          <span className="text-xs text-slate-400">°</span>
        </div>
      </div>
      {/* Z-Index */}
      <div>
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <span>📊</span>
          <span>Ordre d'affichage</span>
        </h4>
        <input
          type="number"
          value={properties.zIndex}
          onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value))}
          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          min="0"
        />
        <div className="text-xs text-slate-400 mt-1">
          Plus la valeur est élevée, plus l'élément apparaît au premier plan
        </div>
      </div>
      {/* Boutons d'action */}
      <div className="pt-4 border-t border-slate-700 space-y-2">
        <button
          onClick={() => {/* TODO: Reset properties */}}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          🔄 Réinitialiser
        </button>
        <button
          onClick={() => {/* TODO: Delete element */}}
          className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-red-700"
        >
          🗑️ Supprimer l'élément
        </button>
      </div>
    </div>
  );
}
