import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMoodPresets } from '../../hooks/useMoodPresets.js';

/**
 * MoodManager - Component for managing character moods
 * Allows adding, removing, and renaming moods with preset templates
 */
export default function MoodManager({ moods, sprites, onAddMood, onRemoveMood, onRenameMood, errors }) {
  const [newMoodInput, setNewMoodInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [editingMood, setEditingMood] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  const moodPresets = useMoodPresets();

  const handleAddCustomMood = () => {
    if (newMoodInput.trim()) {
      const success = onAddMood(newMoodInput.trim());
      if (success) {
        setNewMoodInput('');
      }
    }
  };

  const handleAddPresetMood = (presetId) => {
    onAddMood(presetId);
    setShowPresets(false);
  };

  const handleStartRename = (mood) => {
    setEditingMood(mood);
    setRenameInput(mood);
  };

  const handleConfirmRename = () => {
    if (renameInput.trim() && renameInput !== editingMood) {
      const success = onRenameMood(editingMood, renameInput.trim());
      if (success) {
        setEditingMood(null);
        setRenameInput('');
      }
    } else {
      setEditingMood(null);
    }
  };

  const handleCancelRename = () => {
    setEditingMood(null);
    setRenameInput('');
  };

  return (
    <div className="space-y-4">
      {/* Header with instruction */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="text-lg">💡</div>
          <div className="text-sm text-blue-200">
            <strong className="text-blue-300">Humeurs</strong>: Définissez les expressions émotionnelles de votre personnage.
            Vous pourrez ensuite assigner un sprite différent à chaque humeur.
          </div>
        </div>
      </div>

      {/* Add mood section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-300">Gérer les humeurs</h4>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {showPresets ? 'Fermer presets' : '📦 Presets'}
          </button>
        </div>

        {/* Preset dropdown */}
        {showPresets && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg">
            {moodPresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleAddPresetMood(preset.id)}
                disabled={moods.includes(preset.id)}
                className={`p-2 rounded-lg text-left transition-all ${
                  moods.includes(preset.id)
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={preset.description}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="text-sm font-medium">{preset.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Custom mood input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMoodInput}
            onChange={(e) => setNewMoodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMood()}
            placeholder="Nom de l'humeur (ex: joyeux, triste...)"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            type="button"
            onClick={handleAddCustomMood}
            disabled={!newMoodInput.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            + Ajouter
          </button>
        </div>

        {/* Error display */}
        {errors && errors.moods && (
          <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-700 rounded-lg">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-300">{errors.moods[0]}</span>
          </div>
        )}
      </div>

      {/* Moods list */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-300">Humeurs actuelles ({moods.length})</h4>

        {moods.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-lg">
            <div className="text-4xl mb-2">🎭</div>
            <p className="text-slate-400 text-sm">Aucune humeur définie</p>
            <p className="text-slate-500 text-xs mt-1">Ajoutez votre première humeur ci-dessus</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {moods.map((mood) => {
              const isEditing = editingMood === mood;
              const hasSprite = sprites && sprites[mood];

              return (
                <div
                  key={mood}
                  className={`relative group p-3 bg-slate-800 border-2 rounded-lg transition-all ${
                    hasSprite ? 'border-green-700' : 'border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    // Rename mode
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        autoFocus
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleConfirmRename}
                          className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="flex-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal display
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          onClick={() => handleStartRename(mood)}
                          className="font-semibold text-white text-sm cursor-pointer hover:text-blue-400 transition-colors"
                          title="Cliquer pour renommer"
                        >
                          🎭 {mood}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveMood(mood)}
                          disabled={moods.length === 1}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title={moods.length === 1 ? "Impossible de supprimer la dernière humeur" : "Supprimer cette humeur"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Sprite status indicator */}
                      <div className={`text-xs ${hasSprite ? 'text-green-400' : 'text-amber-400'}`}>
                        {hasSprite ? '✓ Sprite assigné' : '⚠ Pas de sprite'}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="flex gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-purple-400">{moods.length}</div>
          <div className="text-xs text-slate-400">Humeurs</div>
        </div>
        <div className="flex-1 text-center border-l border-slate-700">
          <div className="text-2xl font-bold text-green-400">
            {Object.values(sprites || {}).filter(s => s).length}
          </div>
          <div className="text-xs text-slate-400">Sprites</div>
        </div>
        <div className="flex-1 text-center border-l border-slate-700">
          <div className="text-2xl font-bold text-amber-400">
            {moods.length - Object.values(sprites || {}).filter(s => s).length}
          </div>
          <div className="text-xs text-slate-400">Manquants</div>
        </div>
      </div>
    </div>
  );
}

MoodManager.propTypes = {
  moods: PropTypes.arrayOf(PropTypes.string).isRequired,
  sprites: PropTypes.object,
  onAddMood: PropTypes.func.isRequired,
  onRemoveMood: PropTypes.func.isRequired,
  onRenameMood: PropTypes.func.isRequired,
  errors: PropTypes.object
};
