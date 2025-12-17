import React from 'react';

/**
 * PropertiesPanel - Panneau latéral droit avec onglets
 * 
 * Onglets:
 * 1. Propriétés: Paramétrage de la scène ou de l'objet sélectionné
 * 2. Bibliothèque: Ressources (personnages, décors, sons)
 * 3. Styles: Apparence et thématique
 * 
 * Phase 1: Structure et onglets ✓
 * Phase 2: Connexion au state - EN COURS
 * Phase 3: Édition temps réel et prévisualisation
 */
export default function PropertiesPanel({ scene, selectedElement, onUpdateScene }) {
  const [activeTab, setActiveTab] = React.useState('properties');

  // Handlers pour les champs de la scène
  const handleTitleChange = (e) => {
    onUpdateScene({ title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    onUpdateScene({ description: e.target.value });
  };

  const handleBackgroundColorChange = (value) => {
    onUpdateScene({ backgroundColor: value });
  };

  const handleReset = () => {
    if (!scene) return;
    // Réinitialiser aux valeurs par défaut
    onUpdateScene({
      title: scene.title,
      description: '',
      backgroundColor: '#1e293b'
    });
  };

  const handleApply = () => {
    // Auto-save via AppContext autosave
    // Visual feedback only
    if (process.env.NODE_ENV === 'development') {
      console.log('Changes applied and saved');
    }
  };

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
                    onChange={handleTitleChange}
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
                    onChange={handleDescriptionChange}
                    className="w-full px-2 py-1 bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 focus:border-purple-500 focus:outline-none h-20 resize-none"
                    placeholder="Description de la scène"
                  />
                </div>

                {/* Infos lecture seule */}
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    ID: <span className="text-slate-300 font-mono">{scene.id}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Dialogues: <span className="text-slate-300">{scene.dialogues?.length || 0}</span>
                  </p>
                </div>

                {/* TODO Phase 3: Ajouter d'autres propriétés */}
                {/* - Background URL picker
                    - Characters count
                    - Created/Modified dates
                    - Tags/Categories */}
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
              {/* TODO Phase 3: Connecter aux vraies données depuis AppContext */}
              {/* Section Personnages */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  👾 Personnages
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Utiliser AppContext.characters
                  <br />
                  <span className="text-slate-500">(TODO: drag to canvas)</span>
                </div>
              </div>

              {/* Section Décors */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  🎭 Décors
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Ajouter assets de décors
                  <br />
                  <span className="text-slate-500">(TODO: AssetPicker)</span>
                </div>
              </div>

              {/* Section Sons */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  🔊 Sons
                </h4>
                <div className="bg-slate-700 rounded p-2 text-xs text-slate-400 text-center">
                  Ajouter bibliothèque audio
                  <br />
                  <span className="text-slate-500">(TODO: SoundPicker)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Styles */}
        {activeTab === 'styles' && (
          <div className="p-4" role="tabpanel" aria-labelledby="tab-styles">
            <div className="space-y-4">
              {scene ? (
                <>
                  {/* Couleur de fond */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Couleur de fond
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={scene.backgroundColor || '#1e293b'}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={scene.backgroundColor || '#1e293b'}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-700 text-slate-100 text-xs rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
                        placeholder="#1e293b"
                      />
                    </div>
                  </div>

                  {/* TODO Phase 3: Plus d'options de style */}
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      Plus d'options à venir:
                    </p>
                    <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc list-inside">
                      <li>Police de caractères</li>
                      <li>Thématique globale</li>
                      <li>Effets visuels</li>
                      <li>Transitions</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">
                    Sélectionnez une scène pour modifier son apparence
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pied de panneau avec actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700 flex gap-2">
        <button
          onClick={handleReset}
          disabled={!scene}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded transition-colors"
          aria-label="Réinitialiser aux valeurs par défaut"
        >
          ↺ Réinitialiser
        </button>
        <button
          onClick={handleApply}
          disabled={!scene}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          aria-label="Appliquer les modifications"
        >
          ✓ Appliquer
        </button>
      </div>
    </div>
  );
}