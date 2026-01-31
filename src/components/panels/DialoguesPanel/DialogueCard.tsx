import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, GitBranch, Wand2, Copy, Trash2, MessageCircleReply } from 'lucide-react';
import { Button } from '../../ui/button';
import { useScenesStore } from '@/stores/scenesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import type { Dialogue } from '@/types';

/**
 * DialogueCard - Carte dialogue individuelle avec drag-and-drop (PHASE 2)
 *
 * Features:
 * - useSortable pour drag-and-drop
 * - Speaker badge + texte tronqué (50 char)
 * - Choices indicator (GitBranch icon)
 * - Actions hover: Edit / Duplicate / Delete
 * - Gaming aesthetic (magnetic-lift, glow on hover)
 * - WCAG 2.2 AA (keyboard, aria-labels)
 * - PHASE 3: Synchronized 3-action dialogue selection
 */

export interface DialogueCardProps {
  id: string;
  dialogue: Dialogue;
  index: number;
  sceneId: string;
  onDialogueSelect?: (sceneId: string, index: number) => void;
  onEditWithWizard?: (index: number) => void;
}

export function DialogueCard({ id, dialogue, index, sceneId, onDialogueSelect, onEditWithWizard }: DialogueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const characters = useCharactersStore(state => state.characters);
  const duplicateDialogue = useScenesStore(state => state.duplicateDialogue);
  const deleteDialogue = useScenesStore(state => state.deleteDialogue);

  const scenes = useScenesStore(state => state.scenes);

  const speaker = characters.find(c => c.id === dialogue.speaker);
  const speakerName = speaker?.name || dialogue.speaker || 'Unknown';
  const hasChoices = dialogue.choices && dialogue.choices.length > 0;
  const truncatedText = dialogue.text?.substring(0, 50) || '(empty)';
  const isResponse = dialogue.isResponse === true;

  // Determine response index (A=0, B=1) by checking which choice points to this dialogue
  const responseIndex = (() => {
    if (!isResponse) return -1;
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return -1;
    for (const d of scene.dialogues) {
      for (let ci = 0; ci < d.choices.length; ci++) {
        if (d.choices[ci].nextDialogueId === dialogue.id) return ci;
      }
    }
    return -1;
  })();

  const handleClick = () => {
    // PHASE 3: Use onDialogueSelect for synchronized 3 actions
    if (onDialogueSelect) {
      onDialogueSelect(sceneId, index);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateDialogue(sceneId, index);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Supprimer le dialogue "${truncatedText}..." ?`);
    if (confirmed) {
      deleteDialogue(sceneId, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dialogue-id={`${sceneId}-${index}`} // Pour scroll auto (PHASE 3)
      className={`group relative bg-[var(--color-bg-base)] border-2 rounded-lg p-3 transition-all cursor-pointer magnetic-lift hover:shadow-[var(--shadow-game-glow)] ${
        isResponse
          ? responseIndex === 0
            ? 'border-l-emerald-500 border-l-4 border-[var(--color-border-base)] hover:border-emerald-400'
            : 'border-l-rose-500 border-l-4 border-[var(--color-border-base)] hover:border-rose-400'
          : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${isResponse ? `Réponse ${responseIndex === 0 ? 'A' : 'B'} - ` : ''}Dialogue ${index + 1}: ${truncatedText}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors"
        aria-label="Réorganiser le dialogue"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-[var(--color-text-muted)]" />
      </div>

      {/* Content */}
      <div className="ml-6">
        {/* Header: Speaker + Choices/Response badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 bg-blue-600 rounded text-xs font-bold text-white">
            {speakerName}
          </div>
          {isResponse && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
              responseIndex === 0
                ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300'
                : 'bg-rose-600/20 border border-rose-500 text-rose-300'
            }`}>
              <MessageCircleReply className="w-3 h-3" aria-hidden="true" />
              Réponse {responseIndex === 0 ? 'A' : 'B'}
            </div>
          )}
          {hasChoices && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 border border-purple-500 rounded text-xs text-purple-300">
              <GitBranch className="w-3 h-3" aria-hidden="true" />
              {dialogue.choices.length}
            </div>
          )}
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">
            #{index + 1}
          </span>
        </div>

        {/* Text Preview (tronqué à 50 caractères) */}
        <p className="text-sm text-[var(--color-text-secondary)] leading-snug mb-2">
          {truncatedText}{dialogue.text?.length > 50 ? '...' : ''}
        </p>

        {/* Actions (hover uniquement) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onEditWithWizard?.(index);
            }}
            aria-label="Modifier avec l'assistant magique"
          >
            <Wand2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDuplicate}
            aria-label="Dupliquer le dialogue"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleDelete}
            aria-label="Supprimer le dialogue"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DialogueCard;
