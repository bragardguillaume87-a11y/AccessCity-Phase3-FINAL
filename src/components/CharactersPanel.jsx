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
    <div className="h-full flex flex-col bg-white border border-gray-300 p-4">
      <h2 className="text-xl font-bold mb-4">Personnages</h2>

      {/* Add Character */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nom du personnage"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCharacter()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddCharacter}
          disabled={!newCharacterName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Ajouter
        </button>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedCharacters.map((character) => (
          <div key={character.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <input
              type="text"
              value={character.name}
              onChange={(e) => handleUpdateCharacter(character.id, e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setEditingCharacter(character)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Editer
            </button>
            <button
              onClick={() => handleDeleteClick(character)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {charToDelete && (
        <ConfirmModal
          title="Supprimer le personnage"
          message={`Êtes-vous sûr de vouloir supprimer "${charToDelete.name}" ?`}
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
