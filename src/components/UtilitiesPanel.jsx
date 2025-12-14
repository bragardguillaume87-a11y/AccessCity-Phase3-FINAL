import React from 'react';

/**
 * UtilitiesPanel - Outils rapides et actions communes
 * Emplacement: Panneau inférieur (tools strip)
 * 
 * Phase 1: Boutons d'actions basiques (annuler, rétablir, sauvegarder)
 * Phases futures: Outils de dessin, grille, règle, historique d'édition
 */
export default function UtilitiesPanel({ onSave }) {
  return (
    <div 
      className="h-full bg-slate-900 border-t border-slate-700 flex items-center px-4 gap-2"
      role="toolbar"
      aria-label="Outils d'édition"
    >
      <button 
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
        aria-label="Annuler la dernière action"
        disabled
      >
        ↺ Annuler
      </button>
      <button 
        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
        aria-label="Rétablir l'action annulée"
        disabled
      >
        ↻ Rétablir
      </button>
      <div className="flex-1" />
      <button 
        onClick={onSave}
        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded font-medium transition-colors"
        aria-label="Sauvegarder les modifications"
      >
        💾 Sauvegarder
      </button>
    </div>
  );
}