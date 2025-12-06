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
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Dialogues</h3>
        <div className="border-2 border-slate-200 rounded-lg p-6 text-center text-slate-500">
          <p className="mb-2">Aucune scene selectionnee</p>
          <p className="text-sm">Selectionnez une scene a gauche pour gerer ses dialogues.</p>
        </div>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Dialogues</h3>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
          aria-label="Ajouter un nouveau dialogue"
        >
          + Ajouter
        </button>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {(scene.dialogues || []).map((d, idx) => (
          <div key={idx} className="border-2 border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all">
            <div className="space-y-3">
              {/* Speaker */}
              <div>
                <label htmlFor={`speaker-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Locuteur
                </label>
                <input
                  id={`speaker-${idx}`}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm transition-all"
                  value={d.speaker || ''}
                  onChange={(e) => updateDialogue(scene.id, idx, { speaker: e.target.value })}
                  aria-label={`Locuteur du dialogue ${idx + 1}`}
                  placeholder="Ex: narrator, player, conseiller"
                />
              </div>

              {/* Text */}
              <div>
                <label htmlFor={`text-${idx}`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte
                </label>
                <textarea
                  id={`text-${idx}`}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                  rows={3}
                  value={d.text || ''}
                  onChange={(e) => updateDialogue(scene.id, idx, { text: e.target.value })}
                  aria-label={`Texte du dialogue ${idx + 1}`}
                  placeholder="Entrez le texte du dialogue ici..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => askDelete(idx)}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors font-medium"
                  aria-label={`Supprimer le dialogue ${idx + 1}`}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {(scene.dialogues || []).length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-slate-600 font-medium mb-1">Aucun dialogue</p>
            <p className="text-xs text-slate-500">Cliquez sur "+ Ajouter" pour creer votre premier dialogue</p>
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
