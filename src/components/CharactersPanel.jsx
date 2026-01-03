import { useState, useMemo } from 'react';
import { useCharactersStore } from '../stores/index.js';
import { useValidation } from '../hooks/useValidation.js';
import ConfirmModal from './ConfirmModal.jsx';
import CharacterEditor from './CharacterEditor.jsx';
import { duplicateCharacter } from '../utils/duplication.js';
import { TIMING } from '@/config/timing';

function CharactersPanel({ onPrev, onNext }) {
  const characters = useCharactersStore(state => state.characters);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const updateCharacter = useCharactersStore(state => state.updateCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);
  const validation = useValidation();
  const [newCharacterName, setNewCharacterName] = useState('');
  const [charToDelete, setCharToDelete] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [nameError, setNameError] = useState(false);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => a.name.localeCompare(b.name));
  }, [characters]);

  const handleAddCharacter = () => {
    const trimmed = newCharacterName.trim();
    if (!trimmed) {
      setNameError(true);
      setTimeout(() => setNameError(false), TIMING.SHAKE_ERROR_DURATION);
      return;
    }
    addCharacter({ name: trimmed });
    setNewCharacterName('');
  };

  const confirmDelete = () => {
    if (charToDelete) {
      deleteCharacter(charToDelete.id);
      setCharToDelete(null);
    }
  };

  const handleDuplicateCharacter = (characterId) => {
    const charToDuplicate = characters.find(c => c.id === characterId);
    if (!charToDuplicate) return;

    const existingCharacterIds = characters.map(c => c.id);
    const existingCharacterNames = characters.map(c => c.name);

    const duplicatedChar = duplicateCharacter(charToDuplicate, existingCharacterIds, existingCharacterNames);

    addCharacter(duplicatedChar);
    setEditingCharacter(duplicatedChar);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          👥 Etape 2 : Personnages
        </h2>
        <p className="text-slate-600">
          Definissez les personnages de votre scenario
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Liste des personnages</h3>

        {/* Add Character */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nom du personnage"
            value={newCharacterName}
            onChange={(e) => {
              setNewCharacterName(e.target.value);
              if (nameError) setNameError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()}
            aria-label="Nom du nouveau personnage"
            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
              nameError
                ? 'shake-error'
                : 'border-slate-300 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          <button
            onClick={handleAddCharacter}
            disabled={!newCharacterName.trim()}
            aria-label="Ajouter le personnage"
            className="btn-gradient-primary px-6 py-3 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            + Ajouter
          </button>
        </div>

        {/* Character List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {sortedCharacters.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-slate-600 font-medium mb-1">Aucun personnage</p>
              <p className="text-xs text-slate-500">Ajoutez votre premier personnage ci-dessus</p>
            </div>
          )}
          {sortedCharacters.map((character) => {
            const charErrors = validation.errors.characters[character.id];
            const hasErrors = charErrors && charErrors.some(e => e.severity === 'error');

            return (
            <div key={character.id} className="magnetic-lift shadow-depth-sm bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p
                  className="font-semibold text-slate-900 text-lg flex-1 mr-2 overflow-hidden whitespace-nowrap"
                  style={{ textOverflow: 'ellipsis', maxWidth: '100%' }}
                  title={character.name}
                >
                  {character.name}
                </p>
                {/* Badge d'erreur */}
                {charErrors && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700" title={charErrors.map(e => e.message).join(', ')}>
                    {hasErrors ? '🔴' : '⚠️'}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCharacter(character)}
                  aria-label={`Editer ${character.name}`}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  ✏️ Editer
                </button>
                <button
                  onClick={() => handleDuplicateCharacter(character.id)}
                  aria-label={`Dupliquer ${character.name}`}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  title="Dupliquer ce personnage"
                >
                  📋 Dupliquer
                </button>
                <button
                  onClick={() => setCharToDelete(character)}
                  aria-label={`Supprimer ${character.name}`}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Delete Confirmation Modal */}
        {charToDelete && (
          <ConfirmModal
            title="Supprimer le personnage"
            message={`Etes-vous sur de vouloir supprimer "${charToDelete.name}" ?`}
            onConfirm={confirmDelete}
            onCancel={() => setCharToDelete(null)}
          />
        )}

        {/* Character Editor Modal */}
        {editingCharacter && (
          <CharacterEditor
            character={editingCharacter}
            onSave={(updated) => { updateCharacter(updated); setEditingCharacter(null); }}
            onClose={() => setEditingCharacter(null)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
          >
            ← Precedent
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all ml-auto"
          >
            Suivant : Assets →
          </button>
        )}
      </div>
    </div>
  );
}

export default CharactersPanel;
