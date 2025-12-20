import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BaseModal from '../modals/BaseModal.jsx';
import MoodManager from './MoodManager.jsx';
import MoodSpriteMapper from './MoodSpriteMapper.jsx';
import { useCharacterForm } from '../../hooks/useCharacterForm.js';

/**
 * CharacterEditorModal - Main modal for creating/editing characters
 * Tab-based interface with Identity, Moods & Avatars, and Advanced sections
 * Enhanced with keyboard navigation and animations
 */
export default function CharacterEditorModal({ isOpen, onClose, character, characters, onSave }) {
  const {
    formData,
    activeTab,
    setActiveTab,
    errors,
    warnings,
    hasChanges,
    updateField,
    addMood,
    removeMood,
    updateSprite,
    renameMood,
    handleSave,
    resetForm
  } = useCharacterForm(character, characters, onSave);

  const tabsRef = useRef([]);
  const TABS = ['identity', 'moods', 'advanced'];

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const success = handleSave();
        if (success) {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleSave, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = handleSave();
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?');
      if (!confirmed) return;
    }
    resetForm();
    onClose();
  };

  // Keyboard navigation for tabs
  const handleTabKeyDown = (e, tabId) => {
    const currentIndex = TABS.indexOf(tabId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = TABS.length - 1;
        break;
      default:
        return;
    }

    setActiveTab(TABS[nextIndex]);
    tabsRef.current[nextIndex]?.focus();
  };

  // Tab component with enhanced accessibility
  const Tab = ({ id, label, icon, index }) => (
    <button
      id={`tab-${id}`}
      ref={(el) => (tabsRef.current[index] = el)}
      type="button"
      onClick={() => setActiveTab(id)}
      onKeyDown={(e) => handleTabKeyDown(e, id)}
      className={`px-4 py-2 font-semibold transition-all border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        activeTab === id
          ? 'text-blue-400 border-blue-400'
          : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600'
      }`}
      role="tab"
      aria-selected={activeTab === id}
      aria-controls={`tabpanel-${id}`}
      tabIndex={activeTab === id ? 0 : -1}
    >
      <span className="inline-flex items-center gap-2">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </span>
    </button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={character.id ? `Éditer: ${character.name}` : 'Nouveau personnage'}
      size="xl"
      nested={true}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-slate-700 px-6 pt-4">
          <div className="flex gap-4" role="tablist" aria-label="Onglets de l'éditeur de personnage">
            <Tab id="identity" label="Identité" icon="👤" index={0} />
            <Tab id="moods" label="Humeurs & Avatars" icon="🎭" index={1} />
            <Tab id="advanced" label="Avancé" icon="⚙️" index={2} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'identity' && (
            <div id="tabpanel-identity" role="tabpanel" aria-labelledby="tab-identity" className="space-y-6 max-w-2xl animate-fade-in">
              {/* Name field */}
              <div>
                <label htmlFor="character-name" className="block text-sm font-semibold text-slate-300 mb-2">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-800 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.name ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Nom du personnage"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'character-name-error' : undefined}
                  autoFocus
                />
                {errors.name && (
                  <div id="character-name-error" className="flex items-center gap-2 mt-1 text-sm text-red-400" role="alert">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name[0]}
                  </div>
                )}
              </div>

              {/* Description field */}
              <div>
                <label htmlFor="character-description" className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  id="character-description"
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-3 bg-slate-800 border-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                    errors.description ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="Description du personnage (optionnel)"
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={errors.description ? 'character-description-error' : undefined}
                />
                <div className="flex justify-between mt-1">
                  <div>
                    {errors.description && (
                      <div id="character-description-error" className="flex items-center gap-2 text-sm text-red-400" role="alert">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.description[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {(formData.description || '').length} / 500
                  </span>
                </div>
              </div>

              {/* Character ID (read-only) */}
              {character.id && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    ID Personnage
                  </label>
                  <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-sm font-mono">
                    {character.id}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Identifiant unique, non modifiable
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moods' && (
            <div id="tabpanel-moods" role="tabpanel" aria-labelledby="tab-moods" className="space-y-8 animate-fade-in">
              {/* Mood Manager Section */}
              <MoodManager
                moods={formData.moods}
                sprites={formData.sprites}
                onAddMood={addMood}
                onRemoveMood={removeMood}
                onRenameMood={renameMood}
                errors={errors}
              />

              {/* Sprite Mapper Section */}
              <div className="border-t border-slate-700 pt-8">
                <MoodSpriteMapper
                  moods={formData.moods}
                  sprites={formData.sprites}
                  onUpdateSprite={updateSprite}
                  warnings={warnings}
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div id="tabpanel-advanced" role="tabpanel" aria-labelledby="tab-advanced" className="space-y-6 max-w-2xl animate-fade-in">
              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Statistiques d'utilisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {formData.moods.length}
                    </div>
                    <div className="text-sm text-slate-400">Humeurs définies</div>
                  </div>
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {Object.values(formData.sprites || {}).filter(s => s).length}
                    </div>
                    <div className="text-sm text-slate-400">Sprites assignés</div>
                  </div>
                </div>
              </div>

              {/* Export/Import */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Export / Import</h3>
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-400 mb-3">
                    Exportez les données du personnage au format JSON
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = JSON.stringify(formData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `character-${formData.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    📥 Exporter JSON
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              {character.id && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Zone de danger</h3>
                  <div className="p-4 bg-red-900/20 border-2 border-red-700 rounded-lg">
                    <p className="text-sm text-red-300 mb-3">
                      ⚠️ Cette action est irréversible. Le personnage sera supprimé définitivement.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(`Voulez-vous vraiment supprimer le personnage "${formData.name}" ? Cette action est irréversible.`);
                        if (confirmed) {
                          // TODO: Implement delete functionality
                          alert('Fonctionnalité de suppression à implémenter via CharactersModal');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      🗑️ Supprimer ce personnage
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex-shrink-0 border-t border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs px-2 py-1 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
                Modifications non sauvegardées
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={Object.keys(errors).filter(k => k !== 'sprites').length > 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
            >
              {character.id ? 'Sauvegarder' : 'Créer personnage'}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}

CharacterEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  character: PropTypes.object.isRequired,
  characters: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired
};
