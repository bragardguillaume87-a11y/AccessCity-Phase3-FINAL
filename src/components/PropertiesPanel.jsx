import React from 'react';

/**
 * PropertiesPanel - Panneau latéral droit avec onglets
 * 
 * Onglets:
 * 1. Propriétés: Paramétrage de la scène ou de l'objet sélectionné
 * 2. Bibliothèque: Ressources (personnages, décors, sons)
 * 3. Styles: Apparence et thématique
 * 
 * Phase 1 (current): Structure et onglets vides
 * Phase 2: Implémenter chaque onglet avec contenu fonctionnel
 * Phase 3: Édition temps réel et prévisualisation
 */
export default function PropertiesPanel({ scene, selectedElement, onUpdateScene }) {
  const [activeTab, setActiveTab] = React.useState('properties');

  return (
    <div className="h-full flex flex-col bg-slate-800 text-slate-100 overflow-hidden">
      {/* En-tête du panneau */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-100">
          {selectedElement ? 'Élément' : 'Scène'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {scene?.title || 'Aucune scène sélectionnée'}
        </p>
      </div>

      {/* Onglets */}
      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-750">
        <div className="flex gap-0 px-2">
          {/* Onglet Propriétés */}
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
            aria-selected={activeTab === 'properties'}
            role="tab"
          >
            📄 Propriétés
          </button>
          
          {/* Onglet Bibliothèque */}
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'library'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
            aria-selected={activeTab === 'library'}
            role="tab"
          >
            📚 Bibliothèque
          </button>
          
          {/* Onglet Styles */}
          <button
            onClick={() => setActiveTab('styles')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'styles'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
            aria-selected={activeTab === 'styles'}
            role="tab"
          >
            🎨 Styles
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="flex-1 overflow-y-auto">
        {/* Onglet Propriétés */}
        {activeTab === 'properties' && (
          <div className="p-4 space-y-4" role="tabpanel" aria-labelledby="tab-properties">
            {scene ? (
              <>
                {/* Titre */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Titre de la scène
                  </label>
                  <input
                    type="text"
                    value={scene.title || ''}
                    onChange={(e) => {
                      // TODO: Implémenter la mise à jour du titre
                      console.log('Update title:', e.target.value);
                    }}
                    className="w-full px-2 py-1 bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Titre de la scène"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={scene.description || ''}
                    onChange={(e) => {
                      // TODO: Implémenter la mise à jour de la description
                      console.log('Update description:', e.target.value);
                    }}
                    className="w-full px-2 py-1 bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 focus:border-purple-500 focus:outline-none h-20 resize-none"
                    placeholder="Description de la scène"
                  />
                </div>

                {/* TODO: Ajouter d'autres propriétés */}
                {/* - Background URL
                    - Dialogues count
                    - Characters count
                    - Created/Modified dates */}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">
                  Sélectionnez une scène pour voir ses propriétés
                </p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Bibliothèque */}
        {activeTab === 'library' && (
          <div className="p-4" role="tabpanel" aria-labelledby="tab-library">
            <div className="space-y-4">
              {/* Section Personnages */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  👾 Personnages
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Aucun personnage disponible
                </div>
              </div>

              {/* Section Décors */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  🎭 Décors
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Aucun décor disponible
                </div>
              </div>

              {/* Section Sons */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  🔊 Sons
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Aucun son disponible
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Styles */}
        {activeTab === 'styles' && (
          <div className="p-4" role="tabpanel" aria-labelledby="tab-styles">
            <div className="space-y-4">
              {/* Couleur de fond */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Couleur de fond
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={scene?.backgroundColor || '#1e293b'}
                    onChange={(e) => {
                      // TODO: Implémenter le changement de couleur
                      console.log('Update bg color:', e.target.value);
                    }}
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={scene?.backgroundColor || '#1e293b'}
                    onChange={(e) => {
                      // TODO: Implémenter la saisie de couleur
                      console.log('Update bg color text:', e.target.value);
                    }}
                    className="flex-1 px-2 py-1 bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
                    placeholder="#1e293b"
                  />
                </div>
              </div>

              {/* Section Police/Thématique */}
              <div>
                <p className="text-xs text-slate-400">
                  Plus d'options à venir (police, thématique, effets)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pied de panneau avec actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700 flex gap-2">
        <button
          onClick={() => {
            // TODO: Implémenter la restauration
            console.log('Reset to defaults');
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
          aria-label="Réinitialiser aux valeurs par défaut"
        >
          ↺ Réinitialiser
        </button>
        <button
          onClick={() => {
            onUpdateScene();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
          aria-label="Appliquer les modifications"
        >
          ✓ Appliquer
        </button>
      </div>
    </div>
  );
}