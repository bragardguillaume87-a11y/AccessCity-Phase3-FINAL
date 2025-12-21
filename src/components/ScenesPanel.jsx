import React, { useState } from 'react';
import { useScenesStore, useUIStore } from '../stores/index.js';
import { useValidation } from '../hooks/useValidation.js';
import ConfirmModal from './ConfirmModal.jsx';
import { duplicateScene } from '../utils/duplication.js';
import AssetPicker from './AssetPicker.jsx';

export default function ScenesPanel({ onPrev, onNext }) {
  const scenes = useScenesStore(state => state.scenes);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);
  const addScene = useScenesStore(state => state.addScene);
  const updateScene = useScenesStore(state => state.updateScene);
  const deleteScene = useScenesStore(state => state.deleteScene);
  const reorderScenes = useScenesStore(state => state.reorderScenes);

  const validation = useValidation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSceneId, setPendingSceneId] = useState(null);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggedSceneId, setDraggedSceneId] = useState(null);
  const [dragOverSceneId, setDragOverSceneId] = useState(null);

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

  function handleDuplicateScene(sceneId) {
    const sceneToDuplicate = scenes.find(s => s.id === sceneId);
    if (!sceneToDuplicate) return;

    const existingSceneIds = scenes.map(s => s.id);
    const existingSceneTitles = scenes.map(s => s.title);

    const duplicatedScene = duplicateScene(sceneToDuplicate, existingSceneIds, existingSceneTitles);

    // Add the duplicated scene after the original
    const originalIndex = scenes.findIndex(s => s.id === sceneId);
    const updatedScenes = [...scenes];
    updatedScenes.splice(originalIndex + 1, 0, duplicatedScene);

    // Use reorderScenes to update the entire scenes array
    reorderScenes(updatedScenes);

    // Select the duplicated scene
    setSelectedSceneForEdit(duplicatedScene.id);
  }

  function getSceneStatus(scene) {
    const hasTitle = scene.title && scene.title.trim() !== '' && scene.title !== 'Nouvelle scene';
    const hasDialogues = (scene.dialogues || []).length > 0;
    const hasBackground = scene.backgroundUrl && scene.backgroundUrl.trim() !== '';

    if (hasTitle && hasDialogues && hasBackground) {
      return { status: 'complete', label: 'Complete', color: 'green' };
    } else if (hasTitle && hasDialogues) {
      return { status: 'partial', label: 'En cours', color: 'amber' };
    } else {
      return { status: 'incomplete', label: 'A completer', color: 'red' };
    }
  }

  function handleDragStart(e, sceneId) {
    setDraggedSceneId(sceneId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  }

  function handleDragOver(e, sceneId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSceneId !== sceneId) {
      setDragOverSceneId(sceneId);
    }
  }

  function handleDragLeave() {
    setDragOverSceneId(null);
  }

  function handleDrop(e, targetSceneId) {
    e.preventDefault();

    if (draggedSceneId && draggedSceneId !== targetSceneId && reorderScenes) {
      const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId);
      const targetIndex = scenes.findIndex(s => s.id === targetSceneId);

      const newScenes = [...scenes];
      const [draggedScene] = newScenes.splice(draggedIndex, 1);
      newScenes.splice(targetIndex, 0, draggedScene);

      reorderScenes(newScenes);
    }

    setDraggedSceneId(null);
    setDragOverSceneId(null);
  }

  function handleDragEnd() {
    setDraggedSceneId(null);
    setDragOverSceneId(null);
  }

  function handleMoveUp(sceneId) {
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index > 0 && reorderScenes) {
      const newScenes = [...scenes];
      [newScenes[index - 1], newScenes[index]] = [newScenes[index], newScenes[index - 1]];
      reorderScenes(newScenes);
    }
  }

  function handleMoveDown(sceneId) {
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index < scenes.length - 1 && reorderScenes) {
      const newScenes = [...scenes];
      [newScenes[index], newScenes[index + 1]] = [newScenes[index + 1], newScenes[index]];
      reorderScenes(newScenes);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          🎬 Etape 4 : Scenes
        </h2>
        <p className="text-slate-600">
          Construisez l'histoire scene par scene
        </p>
      </div>

      <div className="grid grid-cols-[35%_65%] gap-6">
        {/* COLONNE 1 : Liste des scènes (35%) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">Scenes</h3>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-sm"
              aria-label="Ajouter une nouvelle scene"
            >
              + Ajouter
            </button>
          </div>

          {/* Liste */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {scenes.map((scene, index) => {
              const status = getSceneStatus(scene);
              const isDragging = draggedSceneId === scene.id;
              const isDragOver = dragOverSceneId === scene.id;
              const sceneErrors = validation.errors.scenes[scene.id];
              const hasErrors = sceneErrors && sceneErrors.some(e => e.severity === 'error');

              return (
                <div
                  key={scene.id}
                  draggable={editingSceneId !== scene.id}
                  onDragStart={(e) => handleDragStart(e, scene.id)}
                  onDragOver={(e) => handleDragOver(e, scene.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, scene.id)}
                  onDragEnd={handleDragEnd}
                  className={`magnetic-lift shadow-depth-sm p-4 rounded-lg transition-all ${
                    isDragging
                      ? 'opacity-50 scale-95 cursor-grabbing'
                      : isDragOver
                      ? 'border-2 border-blue-400 bg-blue-50 scale-105 cursor-grab'
                      : selectedSceneForEdit === scene.id
                      ? 'bg-blue-600 text-white shadow-lg cursor-grab hover:cursor-grab'
                      : hasErrors
                      ? 'bg-white hover:bg-slate-50 border-2 cursor-grab'
                      : 'bg-white hover:bg-slate-50 border-2 border-slate-200 cursor-grab'
                  }`}
                  onClick={() => !editingSceneId && setSelectedSceneForEdit(scene.id)}
                >
                  {editingSceneId === scene.id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Drag handle icon */}
                        <svg
                          className={`w-4 h-4 cursor-grab active:cursor-grabbing ${
                            selectedSceneForEdit === scene.id ? 'text-white/60' : 'text-slate-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-label="Drag pour reordonner"
                        >
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                        </svg>
                        <span className={`font-mono text-sm ${selectedSceneForEdit === scene.id ? 'opacity-70 text-white' : 'opacity-70'}`}>#{index + 1}</span>
                        <h4 className="font-bold">{scene.title || 'Sans titre'}</h4>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1">
                        {/* Badge d'erreurs de validation */}
                        {validation.errors.scenes[scene.id] && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            selectedSceneForEdit === scene.id
                              ? 'bg-red-500 text-white'
                              : 'bg-red-100 text-red-700'
                          }`} title={validation.errors.scenes[scene.id].map(e => e.message).join(', ')}>
                            {validation.errors.scenes[scene.id].filter(e => e.severity === 'error').length > 0 ? '🔴' : '⚠️'}
                          </span>
                        )}
                        {(scene.dialogues || []).length > 0 ? (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            selectedSceneForEdit === scene.id
                              ? 'bg-white/20 text-white'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            ✅ {scene.dialogues.length}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            selectedSceneForEdit === scene.id
                              ? 'bg-white/20 text-white'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            ⚠️
                          </span>
                        )}
                        {scene.backgroundUrl && <span className="text-sm">🏞️</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

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
        </div>

        {/* COLONNE 2 : Détails de la scène (65%) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {selectedScene ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  Edition de la scene
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDuplicateScene(selectedScene.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2"
                    title="Dupliquer cette scène (Ctrl+D)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Dupliquer
                  </button>
                  <button
                    onClick={() => askDelete(selectedScene.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label htmlFor="scene-title" className="block text-sm font-semibold text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  id="scene-title"
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  value={selectedScene.title || ''}
                  onChange={(e) => updateScene(selectedScene.id, { title: e.target.value })}
                  placeholder="Ex: Arrivee devant la mairie"
                />
              </div>

              {/* Arrière-plan avec AssetPicker */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🏞️ Arriere-plan
                </label>
                <AssetPicker
                  type="background"
                  value={selectedScene.backgroundUrl || ''}
                  onChange={(url) => updateScene(selectedScene.id, { backgroundUrl: url })}
                  allowUpload={true}
                  allowUrl={true}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="scene-description" className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="scene-description"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                  rows={4}
                  value={selectedScene.description || ''}
                  onChange={(e) => updateScene(selectedScene.id, { description: e.target.value })}
                  placeholder="Decrivez la scene..."
                />
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Dialogues</p>
                  <p className="text-2xl font-bold text-blue-700">{(selectedScene.dialogues || []).length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Statut</p>
                  <p className="text-sm font-bold text-purple-700">{getSceneStatus(selectedScene).label}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p className="text-sm">← Selectionnez une scene pour l'editer</p>
            </div>
          )}
        </div>
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
            Suivant : Dialogues →
          </button>
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
