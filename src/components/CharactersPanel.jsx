import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import ConfirmModal from './ConfirmModal';
import CharacterEditor from './CharacterEditor.jsx';

function CharactersPanel() {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useApp();
  const [newCharacterName, setNewCharacterName] = useState('');
  const [charToDelete, setCharToDelete] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => a.name.localeCompare(b.name));
  }, [characters]);

  const handleAddCharacter = () => {
    const trimmed = newCharacterName.trim();
    if (!trimmed) return;
    addCharacter({ name: trimmed });
    setNewCharacterName('');
  };

  const handleUpdateCharacter = (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateCharacter(id, { name: trimmed });
  };

  const handleDeleteClick = (character) => {
    setCharToDelete(character);
  };

  const confirmDelete = () => {
    if (charToDelete) {
      deleteCharacter(charToDelete.id);
      setCharToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-slate-900">Personnages</h2>

      {/* Add Character */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nom du personnage"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()}
          aria-label="Nom du nouveau personnage"
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAddCharacter}
          disabled={!newCharacterName.trim()}
          aria-label="Ajouter le personnage"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Ajouter
        </button>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedCharacters.length === 0 && (
          <p className="text-center text-slate-500 py-8">Aucun personnage. Ajoutez-en un ci-dessus.</p>
        )}
        {sortedCharacters.map((character) => (
          <div key={character.id} className="bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 rounded-lg p-3 hover:shadow-md transition-all">
            {/* Character name - read only with ellipsis */}
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-900 truncate flex-1 mr-2" title={character.name}>
                {character.name}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCharacter(character)}
                aria-label={`Editer ${character.name}`}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Editer
              </button>
              <button
                onClick={() => handleDeleteClick(character)}
                aria-label={`Supprimer ${character.name}`}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
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
          onSave={(updated) => { updateCharacter(updated.id, updated); setEditingCharacter(null); }}
          onClose={() => setEditingCharacter(null)}
        />
      )}
    </div>
  );
}

export default CharactersPanel;
