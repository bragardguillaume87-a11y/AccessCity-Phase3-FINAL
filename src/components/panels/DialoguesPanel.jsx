import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { useScenesStore, useUIStore } from '../../stores/index.js';
import DialogueCard from './DialoguesPanel/DialogueCard.jsx';

/**
 * DialoguesPanel - Liste des dialogues avec drag-and-drop (PHASE 2)
 * Pattern identique à ScenesSidebar pour cohérence
 *
 * Features:
 * - Drag-and-drop pour réorganiser dialogues
 * - Actions Edit/Duplicate/Delete sur hover
 * - Empty state avec CTA "Créer un dialogue"
 * - Gaming aesthetic + WCAG 2.2 AA
 *
 * @param {Object} props
 * @param {Function} props.onDialogueSelect - PHASE 3: Callback when dialogue is selected
 * @returns {JSX.Element}
 */
export default function DialoguesPanel({ onDialogueSelect }) {
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const scenes = useScenesStore(state => state.scenes);
  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);
  const reorderDialogues = useScenesStore(state => state.reorderDialogues);
  const addDialogue = useScenesStore(state => state.addDialogue);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag pour activer (évite clicks accidentels)
      }
    }),
    useSensor(KeyboardSensor)
  );

  const dialogues = selectedScene?.dialogues || [];
  const dialogueIds = useMemo(
    () => dialogues.map((_, idx) => `dialogue-${idx}`),
    [dialogues.length] // Recompute only when length changes
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id.split('-')[1]);
    const newIndex = parseInt(over.id.split('-')[1]);

    reorderDialogues(selectedScene.id, oldIndex, newIndex);
  };

  const handleAddDialogue = () => {
    addDialogue(selectedScene.id, {
      speaker: null,
      text: 'Nouveau dialogue',
      choices: []
    });
  };

  if (!selectedScene) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center bg-[var(--color-bg-elevated)]">
        <p className="text-[var(--color-text-muted)] text-sm">
          Sélectionnez une scène pour éditer ses dialogues
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-elevated)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b-2 border-[var(--color-border-base)]">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
          Dialogues - {selectedScene.title}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {dialogues.length} dialogue{dialogues.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Dialogues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {dialogues.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
            <p className="text-[var(--color-text-muted)] text-sm mb-4">
              Aucun dialogue dans cette scène
            </p>
            <Button
              variant="token-primary"
              size="sm"
              onClick={handleAddDialogue}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Créer un dialogue
            </Button>
          </div>
        ) : (
          // Dialogues avec drag-and-drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={dialogueIds} strategy={verticalListSortingStrategy}>
              {dialogues.map((dialogue, idx) => (
                <DialogueCard
                  key={dialogueIds[idx]}
                  id={dialogueIds[idx]}
                  dialogue={dialogue}
                  index={idx}
                  sceneId={selectedScene.id}
                  onDialogueSelect={onDialogueSelect}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer avec bouton "Nouveau dialogue" */}
      <div className="flex-shrink-0 p-3 border-t-2 border-[var(--color-border-base)]">
        <Button
          variant="token-primary"
          size="sm"
          onClick={handleAddDialogue}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Nouveau dialogue
        </Button>
      </div>
    </div>
  );
}

DialoguesPanel.propTypes = {
  onDialogueSelect: PropTypes.func
};
