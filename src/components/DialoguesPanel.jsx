import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import ConfirmModal from './ConfirmModal.jsx';

export default function DialoguesPanel() {
  const {
    scenes,
    selectedSceneForEdit,
    addDialogue,
    updateDialogue,
    deleteDialogue
  } = useApp();

  const scene = useMemo(
    () => scenes.find(s => s.id === selectedSceneForEdit) || null,
    [scenes, selectedSceneForEdit]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);

  if (!scene) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        Selectionne une scene pour gerer ses dialogues.
      </div>
    );
  }

  function onAdd() {
    addDialogue(scene.id, {
      speaker: 'narrator',
      text: 'Nouveau dialogue',
      choices: []
    });
  }

  function askDelete(idx) {
    setPendingIndex(idx);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (pendingIndex != null) deleteDialogue(scene.id, pendingIndex);
    setPendingIndex(null);
    setConfirmOpen(false);
  }

  function handleCancelDelete() {
    setPendingIndex(null);
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-600">Dialogues</h3>
        <button
          onClick={onAdd}
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          aria-label="Ajouter un dialogue"
        >
          + Ajouter un dialogue
        </button>
      </div>

      <div className="space-y-2">
        {(scene.dialogues || []).map((d, idx) => (
          <div key={idx} className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex gap-2 items-center mb-2">
              <label className="text-xs font-semibold w-24">Locuteur</label>
              <input
                className="flex-1 border-b border-gray-200 focus:border-blue-600 outline-none bg-transparent text-sm"
                value={d.speaker || ''}
                onChange={(e) => updateDialogue(scene.id, idx, { speaker: e.target.value })}
                aria-label="Locuteur"
              />
            </div>
            <div className="flex gap-2 items-start mb-2">
              <label className="text-xs font-semibold w-24 mt-2">Texte</label>
              <textarea
                className="flex-1 border-2 border-gray-200 rounded p-2 text-sm focus:border-blue-600 outline-none"
                rows={3}
                value={d.text || ''}
                onChange={(e) => updateDialogue(scene.id, idx, { text: e.target.value })}
                aria-label="Texte du dialogue"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => askDelete(idx)}
                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                aria-label="Supprimer le dialogue"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {(scene.dialogues || []).length === 0 && (
          <div className="text-sm text-gray-500 p-3 border-2 border-dashed border-gray-200 rounded">
            Aucun dialogue dans cette scene.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Supprimer le dialogue"
        message="Etes-vous sur de vouloir supprimer ce dialogue ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="red"
      />
    </div>
  );
}
