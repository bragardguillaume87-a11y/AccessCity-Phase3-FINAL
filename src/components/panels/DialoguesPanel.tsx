import React, { useMemo, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { useScenesStore, useUIStore } from '@/stores';
import { DialogueCard } from './DialoguesPanel/DialogueCard';
import { DialogueWizard } from '../dialogue-editor/DialogueWizard';

/**
 * DialoguesPanel - Liste des dialogues avec drag-and-drop (PHASE 2)
 * Pattern identique à ScenesSidebar pour cohérence
 *
 * Features:
 * - Drag-and-drop pour réorganiser dialogues
 * - Actions Edit/Duplicate/Delete sur hover
 * - Empty state avec CTA "Créer un dialogue"
 * - Gaming aesthetic + WCAG 2.2 AA
 */

export interface DialoguesPanelProps {
  onDialogueSelect?: (sceneId: string, index: number) => void;
}

export function DialoguesPanel({ onDialogueSelect }: DialoguesPanelProps) {
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const scenes = useScenesStore(state => state.scenes);
  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);
  const reorderDialogues = useScenesStore(state => state.reorderDialogues);
  const addDialogue = useScenesStore(state => state.addDialogue);

  // DialogueWizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editDialogueIndex, setEditDialogueIndex] = useState<number | undefined>();

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedScene) return;

    const oldIndex = parseInt(String(active.id).split('-')[1]);
    const newIndex = parseInt(String(over.id).split('-')[1]);

    reorderDialogues(selectedScene.id, oldIndex, newIndex);
  };

  const handleAddDialogue = () => {
    if (!selectedScene) return;
    addDialogue(selectedScene.id, {
      id: `dialogue-${Date.now()}`,
      speaker: '',
      text: 'Nouveau dialogue',
      choices: []
    });
  };

  const handleOpenWizard = () => {
    setEditDialogueIndex(undefined); // undefined = nouveau dialogue
    setWizardOpen(true);
  };

  const handleWizardSave = () => {
    // Le DialogueWizard gère la sauvegarde via le store
    setWizardOpen(false);
    setEditDialogueIndex(undefined);
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

      {/* Footer avec boutons "Assistant Dialogue" et "Mode Expert" */}
      <div className="flex-shrink-0 p-3 border-t-2 border-[var(--color-border-base)]">
        <div className="flex gap-2">
          <Button
            variant="token-primary"
            size="sm"
            onClick={handleOpenWizard}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Assistant Dialogue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDialogue}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Mode Expert
          </Button>
        </div>
      </div>

      {/* DialogueWizard Modal */}
      {selectedScene && (
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-4xl h-[90vh] p-0">
            <DialogueWizard
              sceneId={selectedScene.id}
              dialogueIndex={editDialogueIndex}
              dialogue={editDialogueIndex !== undefined ? dialogues[editDialogueIndex] : undefined}
              scenes={scenes}
              onSave={handleWizardSave}
              onClose={() => setWizardOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DialoguesPanel;
