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
    deleteScene,
    reorderScenes
  } = useApp();

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

  function getSceneStatus(scene) {
    const hasTitle = scene.title && scene.title.trim() !== '' && scene.title !== 'Nouvelle scene';
    const hasDialogues = (scene.dialogues || []).length > 0;
    const hasBackground = scene.background && scene.background !== '';
    
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
        {scenes.map((scene, index) => {
          const status = getSceneStatus(scene);
          const isDragging = draggedSceneId === scene.id;
          const isDragOver = dragOverSceneId === scene.id;
          
          return (
            <div
              key={scene.id}
              draggable={editingSceneId !== scene.id}
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, scene.id)}
              onDragEnd={handleDragEnd}
              className={`border-2 rounded-xl p-4 transition-all ${
                isDragging
                  ? 'opacity-50 scale-95'
                  : isDragOver
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : selectedSceneForEdit === scene.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
              } ${editingSceneId !== scene.id ? 'cursor-move' : ''}`}
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
                  {/* Grab handle indicator */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-slate-400 hover:text-slate-600" aria-hidden="true">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM3 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM5 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM3 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
                      </svg>
                    </div>
                    
                    <div
                      onClick={() => setSelectedSceneForEdit(scene.id)}
                      className="flex-1 cursor-pointer"
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-slate-900">
                          {scene.title}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status.color === 'green' ? 'bg-green-100 text-green-700' :
                          status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11z"/>
                            <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                          </svg>
                          {(scene.dialogues || []).length} dialogue{(scene.dialogues || []).length !== 1 ? 's' : ''}
                        </span>
                        {scene.background && (
                          <span className="flex items-center gap-1 text-green-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                              <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.505.505 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
                            </svg>
                            Arriere-plan
                          </span>
                        )}
                      </div>
                      
                      {status.status === 'incomplete' && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                          </svg>
                          Titre ou dialogues manquants
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 mt-3 border-t border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(scene.id);
                      }}
                      disabled={index === 0}
                      className="text-xs px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Deplacer vers le haut"
                      title="Deplacer vers le haut"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(scene.id);
                      }}
                      disabled={index === scenes.length - 1}
                      className="text-xs px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Deplacer vers le bas"
                      title="Deplacer vers le bas"
                    >
                      ↓
                    </button>
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