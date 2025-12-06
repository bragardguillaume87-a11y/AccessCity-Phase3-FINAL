import React, { useState } from 'react';
import { useApp } from '../AppContext.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function ScenesPanel() {
  const {
    scenes,
    selectedSceneForEdit,
    setSelectedSceneForEdit,
    addScene,
    updateScene,
    deleteScene
  } = useApp();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSceneId, setPendingSceneId] = useState(null);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);

  function handleAdd() {
    addScene('Nouvelle scene');
  }

  function handleStartEdit(scene) {
    setEditingSceneId(scene.id);
    setEditTitle(scene.title);
  }

  function handleSaveEdit(sceneId) {
    updateScene(sceneId, { title: editTitle });
    setEditingSceneId(null);
  }

  function handleCancelEdit() {
    setEditingSceneId(null);
  }

  function askDelete(sceneId) {
    setPendingSceneId(sceneId);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (pendingSceneId) {
      deleteScene(pendingSceneId);
      setPendingSceneId(null);
    }
    setConfirmOpen(false);
  }

  function handleCancelDelete() {
    setPendingSceneId(null);
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-600">Scenes</h3>
        <button
          onClick={handleAdd}
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          aria-label="Ajouter une scene"
        >
          + Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {scenes.map(scene => (
          <div
            key={scene.id}
            className={`border-2 rounded-lg p-3 cursor-pointer transition ${
              selectedSceneForEdit === scene.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {editingSceneId === scene.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded px-2 py-1 text-sm"
                  aria-label="Titre de la scene"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSaveEdit(scene.id)}
                    className="px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setSelectedSceneForEdit(scene.id)}
                className="mb-2"
              >
                <div className="font-semibold text-sm text-gray-900">
                  {scene.title}
                </div>
                <div className="text-xs text-gray-600">
                  {(scene.dialogues || []).length} dialogue(s)
                </div>
              </div>
            )}

            {editingSceneId !== scene.id && (
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => handleStartEdit(scene)}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  aria-label="Modifier la scene"
                >
                  Modifier
                </button>
                <button
                  onClick={() => askDelete(scene.id)}
                  className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  aria-label="Supprimer la scene"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="text-sm text-gray-500 p-3 border-2 border-dashed border-gray-200 rounded">
            Aucune scene. Cree-en une pour commencer.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Supprimer la scene"
        message="Etes-vous sur de vouloir supprimer cette scene ? Tous ses dialogues seront perdus."
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
      />
    </div>
  );
}
