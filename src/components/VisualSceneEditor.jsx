import React from 'react';

/**
 * VisualSceneEditor - Canvas principal pour l'édition visuelle des scènes
 * Affichage: Canvas central avec personnages, objets et décors positionnables
 * 
 * Phase 1: Affichage statique de la scène sélectionnée
 * Phases futures: Drag & drop, zoom, gestion des calques
 */
export default function VisualSceneEditor({ currentScene }) {
  return (
    <div 
      className="h-full bg-slate-800 flex items-center justify-center overflow-hidden"
      role="region"
      aria-label="Éditeur visuel de scène"
    >
      {currentScene ? (
        <div className="text-center">
          <div 
            className="w-96 h-64 bg-slate-700 rounded-lg border-2 border-purple-500 flex items-center justify-center mb-4"
            role="img"
            aria-label={`Aperçu de la scène ${currentScene.title}`}
          >
            <p className="text-slate-400 text-sm">📐 Canvas de scène</p>
          </div>
          <h3 className="text-white font-semibold">{currentScene.title}</h3>
          <p className="text-slate-400 text-xs mt-1">{currentScene.description}</p>
        </div>
      ) : (
        <p className="text-slate-500">Sélectionnez une scène pour l'éditer</p>
      )}
    </div>
  );
}