import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * AddCharacterToSceneModal - Modal for selecting a character to add to the scene
 */
export default function AddCharacterToSceneModal({ isOpen, onClose, characters, onAddCharacter }) {
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [mood, setMood] = useState('neutral');

  if (!isOpen) return null;

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const availableMoods = selectedCharacter?.moods || ['neutral'];

  const handleAdd = () => {
    if (!selectedCharacterId) return;
    onAddCharacter(selectedCharacterId, mood);
    onClose();
    setSelectedCharacterId(null);
    setMood('neutral');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Ajouter un personnage à la scène</h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Aucun personnage disponible.</p>
              <p className="text-sm text-slate-500">
                Créez d'abord des personnages dans le modal Characters (Ctrl+Shift+C).
              </p>
            </div>
          ) : (
            <>
              {/* Character Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Sélectionner un personnage :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setSelectedCharacterId(character.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedCharacterId === character.id
                          ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-2xl flex-shrink-0">
                          {character.sprites?.neutral ? (
                            <img
                              src={character.sprites.neutral}
                              alt={character.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className={character.sprites?.neutral ? 'hidden' : ''}>👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{character.name}</div>
                          <div className="text-xs text-slate-400 truncate">ID: {character.id}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Selection */}
              {selectedCharacter && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Humeur / Expression :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableMoods.map((moodOption) => (
                      <button
                        key={moodOption}
                        onClick={() => setMood(moodOption)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          mood === moodOption
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {moodOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedCharacterId}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedCharacterId
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Ajouter à la scène
          </button>
        </div>
      </div>
    </div>
  );
}

AddCharacterToSceneModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  characters: PropTypes.array.isRequired,
  onAddCharacter: PropTypes.func.isRequired
};
