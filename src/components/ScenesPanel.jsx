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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Scenes</h3>
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          aria-label="Ajouter une nouvelle scene"
        >
          + Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {scenes.map(scene => (
          <div
            key={scene.id}
            className={`border-2 rounded-xl p-4 transition-all ${
              selectedSceneForEdit === scene.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
            }`}
          >
            {editingSceneId === scene.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  aria-label="Titre de la scene"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    aria-label="Annuler la modification"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSaveEdit(scene.id)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors"
                    aria-label="Enregistrer la scene"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  onClick={() => setSelectedSceneForEdit(scene.id)}
                  className="cursor-pointer mb-3"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSceneForEdit(scene.id);
                    }
                  }}
                  aria-label={`Selectionner la scene ${scene.title}`}
                >
                  <div className="font-semibold text-sm text-slate-900 mb-1">
                    {scene.title}
                  </div>
                  <div className="text-xs text-slate-600">
                    {(scene.dialogues || []).length} dialogue(s)
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(scene);
                    }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
                    aria-label={`Modifier la scene ${scene.title}`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(scene.id);
                    }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                    aria-label={`Supprimer la scene ${scene.title}`}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-sm text-slate-600 font-medium mb-1">Aucune scene</p>
            <p className="text-xs text-slate-500">Cliquez sur "+ Ajouter" pour creer votre premiere scene</p>
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
