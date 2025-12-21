import React from 'react';
import { useScenesStore } from '../stores/index.js';

/**
 * ScenesList - Colonne gauche avec liste chronologique des scènes
 * Pattern: GDevelop Project Manager
 */
export default function ScenesList({ scenes, selectedSceneId, onSelectScene }) {
  const addScene = useScenesStore(state => state.addScene);

  const handleKeyDown = (e, sceneId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectScene(sceneId);
    }
  };

  const handleAddScene = () => {
    const newScene = {
      id: `scene-${Date.now()}`,
      title: `Nouvelle scène ${scenes.length + 1}`,
      description: '',
      backgroundUrl: '',
      dialogues: []
    };
    addScene(newScene);
    onSelectScene(newScene.id);
  };

  return (
    <div className="w-[250px] h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700">Scènes</h2>
        <p className="text-xs text-slate-500 mt-1">{scenes.length} scène(s)</p>
      </div>

      {/* Liste scrollable */}
      <div 
        className="flex-1 overflow-y-auto p-2"
        role="listbox"
        aria-label="Liste des scènes"
      >
        {scenes.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Aucune scène.
            <br />
            Créez-en une ci-dessous.
          </div>
        ) : (
          scenes.map((scene, index) => (
            <button
              key={scene.id}
              role="option"
              aria-selected={selectedSceneId === scene.id}
              onClick={() => onSelectScene(scene.id)}
              onKeyDown={(e) => handleKeyDown(e, scene.id)}
              className={`
                w-full text-left p-2 rounded-lg mb-1 text-xs
                transition-all duration-150
                ${selectedSceneId === scene.id
                  ? 'bg-purple-100 border border-purple-300 shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent'
                }
              `}
            >
              <span className="font-semibold text-slate-700">
                {index + 1}. {scene.title || 'Sans titre'}
              </span>
              {scene.description && (
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {scene.description}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {/* Bouton + Nouvelle scène */}
      <div className="p-2 border-t border-slate-200">
        <button
          onClick={handleAddScene}
          className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors duration-150"
          aria-label="Ajouter une nouvelle scène"
        >
          + Nouvelle scène
        </button>
      </div>
    </div>
  );
}