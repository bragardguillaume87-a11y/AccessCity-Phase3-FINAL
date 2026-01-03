import React from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, GitBranch, Edit2, Copy, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button.jsx';
import { useScenesStore } from '@/stores/scenesStore';
import { useCharactersStore } from '@/stores/charactersStore';

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
 *
 * @param {Object} props
 * @param {string} props.id - ID unique pour drag-and-drop
 * @param {Object} props.dialogue - Objet dialogue
 * @param {number} props.index - Index du dialogue dans la scène
 * @param {string} props.sceneId - ID de la scène parente
 * @param {Function} props.onDialogueSelect - PHASE 3: Callback when dialogue is selected
 */
export default function DialogueCard({ id, dialogue, index, sceneId, onDialogueSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const characters = useCharactersStore(state => state.characters);
  const duplicateDialogue = useScenesStore(state => state.duplicateDialogue);
  const deleteDialogue = useScenesStore(state => state.deleteDialogue);
  const selectElement = useScenesStore(state => state.selectElement);

  const speaker = characters.find(c => c.id === dialogue.speaker);
  const speakerName = speaker?.name || dialogue.speaker || 'Unknown';
  const hasChoices = dialogue.choices && dialogue.choices.length > 0;
  const truncatedText = dialogue.text?.substring(0, 50) || '(empty)';

  const handleClick = () => {
    // PHASE 3: Use onDialogueSelect for synchronized 3 actions
    if (onDialogueSelect) {
      onDialogueSelect(sceneId, index);
    } else {
      // Fallback to direct store call
      selectElement({ type: 'dialogue', index, sceneId });
    }
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    duplicateDialogue(sceneId, index);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Supprimer le dialogue "${truncatedText}..." ?`);
    if (confirmed) {
      deleteDialogue(sceneId, index);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dialogue-id={`${sceneId}-${index}`} // Pour scroll auto (PHASE 3)
      className="group relative bg-[var(--color-bg-base)] border-2 border-[var(--color-border-base)] hover:border-[var(--color-primary)] rounded-lg p-3 transition-all cursor-pointer magnetic-lift hover:shadow-[var(--shadow-game-glow)]"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Dialogue ${index + 1}: ${truncatedText}`}
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
        {/* Header: Speaker + Choices badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-0.5 bg-blue-600 rounded text-xs font-bold text-white">
            {speakerName}
          </div>
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
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Ouvrir modal édition dialogue
            }}
            aria-label="Éditer le dialogue"
          >
            <Edit2 className="w-3 h-3" />
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

DialogueCard.propTypes = {
  id: PropTypes.string.isRequired,
  dialogue: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  sceneId: PropTypes.string.isRequired,
  onDialogueSelect: PropTypes.func
};
