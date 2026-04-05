import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MessageSquare, MessageCircle } from 'lucide-react';

import { Button } from '../ui/button';
import { useUIStore } from '@/stores';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useSceneWithElements } from '@/stores/selectors';
import { useSelectionStore } from '@/stores/selectionStore';
import type { DialogueSelection } from '@/stores/selectionStore.types';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { DEFAULTS } from '@/config/constants';
import { DialogueCard } from './DialoguesPanel/DialogueCard';
import { DialogueSmsCard } from './DialoguesPanel/DialogueSmsCard';

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
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const reorderDialogues = useDialoguesStore((state) => state.reorderDialogues);
  const addDialogue = useDialoguesStore((state) => state.addDialogue);
  const selectedElement = useSelectionStore((state) => state.selectedElement);
  const characters = useCharactersStore((state) => state.characters);

  const [viewMode, setViewMode] = useState<'classic' | 'sms'>('classic');

  // Index du dialogue sélectionné dans cette scène (-1 si aucun)
  // Note: cast nécessaire — TypeScript ne réduit pas le discriminant null (NoSelection.type)
  const selectedDialogueIdx = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'dialogue') return -1;
    const sel = selectedElement as DialogueSelection;
    if (sel.sceneId !== selectedSceneForEdit) return -1;
    return sel.index;
  }, [selectedElement, selectedSceneForEdit]);

  // DialogueWizard state from UIStore
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag pour activer (évite clicks accidentels)
      },
    }),
    useSensor(KeyboardSensor)
  );

  const dialogues = useMemo(() => selectedScene?.dialogues ?? [], [selectedScene]);
  const dialogueIds = useMemo(
    () => dialogues.map((_, idx) => `dialogue-${idx}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute uniquement si la longueur change, pas les valeurs
    [dialogues.length]
  );

  // ── SMS mode — ordre d'apparition des speakers → côté gauche/droite ────────
  // Premier speaker unique = droite, second = gauche, alternance ensuite.
  const speakerOrderMap = useMemo(() => {
    const seen = new Map<string, number>();
    for (const d of dialogues) {
      const id = d.speaker || 'narrator';
      if (!seen.has(id)) seen.set(id, seen.size);
    }
    return seen; // speakerId → index d'apparition
  }, [dialogues]);

  const getSpeakerSide = (speakerId: string): 'left' | 'right' => {
    const idx = speakerOrderMap.get(speakerId || 'narrator') ?? 0;
    return idx % 2 === 0 ? 'right' : 'left';
  };

  const getSpeakerName = (speakerId: string): string => {
    if (!speakerId || speakerId === 'narrator' || speakerId === 'Narrateur') return 'Narrateur';
    return characters.find((c) => c.id === speakerId)?.name ?? speakerId;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedScene) return;

    const oldIndex = parseInt(String(active.id).split('-')[1]);
    const newIndex = parseInt(String(over.id).split('-')[1]);

    reorderDialogues(selectedScene.id, oldIndex, newIndex);
  };

  const handleAddDialogue = () => {
    if (!selectedScene) return;
    addDialogue(
      selectedScene.id,
      DialogueFactory.createText(DEFAULTS.DIALOGUE_SPEAKER, 'Nouveau dialogue')
    );
  };

  const handleOpenWizard = () => {
    setEditDialogueIndex(undefined); // undefined = nouveau dialogue
    setWizardOpen(true);
  };

  const handleEditWithWizard = (index: number) => {
    setEditDialogueIndex(index);
    setWizardOpen(true);
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
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide truncate">
              Dialogues — {selectedScene.title}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {dialogues.length} dialogue{dialogues.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Toggle vue classique / SMS */}
          {dialogues.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setViewMode('classic')}
                aria-label="Vue classique"
                aria-pressed={viewMode === 'classic'}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${viewMode === 'classic' ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.10)'}`,
                  background: viewMode === 'classic' ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: viewMode === 'classic' ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.15s',
                }}
              >
                <MessageSquare size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sms')}
                aria-label="Vue SMS"
                aria-pressed={viewMode === 'sms'}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${viewMode === 'sms' ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.10)'}`,
                  background: viewMode === 'sms' ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: viewMode === 'sms' ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.15s',
                }}
              >
                <MessageCircle size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
        {dialogues.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
            <p className="text-[var(--color-text-muted)] text-sm mb-4">
              Aucun dialogue dans cette scène
            </p>
            <Button variant="token-primary" size="sm" onClick={handleAddDialogue}>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Créer un dialogue
            </Button>
          </div>
        ) : viewMode === 'sms' ? (
          // ── Vue SMS — bulles sans DnD ────────────────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
            {dialogues.map((dialogue, idx) => {
              const prevSpeaker = idx > 0 ? dialogues[idx - 1].speaker : null;
              const showLabel = dialogue.speaker !== prevSpeaker;
              return (
                <DialogueSmsCard
                  key={dialogueIds[idx]}
                  dialogue={dialogue}
                  index={idx}
                  sceneId={selectedScene.id}
                  speakerName={getSpeakerName(dialogue.speaker)}
                  side={getSpeakerSide(dialogue.speaker)}
                  showSpeakerLabel={showLabel}
                  isSelected={idx === selectedDialogueIdx}
                  onDialogueSelect={onDialogueSelect}
                  onEditWithWizard={handleEditWithWizard}
                />
              );
            })}
          </div>
        ) : (
          // ── Vue classique — drag-and-drop ────────────────────────────────
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
                  isSelected={idx === selectedDialogueIdx}
                  onDialogueSelect={onDialogueSelect}
                  onEditWithWizard={handleEditWithWizard}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer — bouton unifié dans les deux modes */}
      <div className="flex-shrink-0 p-3 border-t-2 border-[var(--color-border-base)]">
        <Button variant="gaming-primary" size="kid" onClick={handleOpenWizard} className="w-full">
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
          Nouveau dialogue
        </Button>
      </div>
    </div>
  );
}

export default DialoguesPanel;
