import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, GitBranch, Wand2, Copy, Trash2, MessageCircleReply, MessageSquare } from 'lucide-react';
import { Button } from '../../ui/button';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import type { Dialogue } from '@/types';

/**
 * DialogueCard - Carte dialogue individuelle avec drag-and-drop
 *
 * Refonte visuelle (Vague 12) :
 * - Speaker : couleur dynamique par personnage + texte tronqué sur 1 ligne
 * - Texte : line-clamp-2 (plus lisible que substring(0,50))
 * - Badge type : toujours visible (Simple / N choix / Dé)
 * - Actions : toujours visibles
 * - Response index : memoized (O(1) en lookup)
 * - PHASE 3 : synchronized 3-action dialogue selection
 */

// ── Couleur dérivée du nom du speaker (hash stable) ──────────────────────────
const SPEAKER_PALETTE = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-orange-500',
] as const;

function getSpeakerColorClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return SPEAKER_PALETTE[Math.abs(hash) % SPEAKER_PALETTE.length];
}

// ── Badge type de dialogue ────────────────────────────────────────────────────
interface TypeInfo {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}

function getDialogueTypeInfo(dialogue: Dialogue): TypeInfo {
  if (dialogue.choices?.some(c => c.diceCheck)) {
    return {
      icon: <span aria-hidden="true" className="text-[10px]">🎲</span>,
      label: 'Dé',
      colorClass: 'border-amber-500/60 text-amber-400',
    };
  }
  if (dialogue.choices && dialogue.choices.length > 0) {
    return {
      icon: <GitBranch className="w-3 h-3" aria-hidden="true" />,
      label: `${dialogue.choices.length} choix`,
      colorClass: 'border-purple-500/60 text-purple-400',
    };
  }
  return {
    icon: <MessageSquare className="w-3 h-3" aria-hidden="true" />,
    label: 'Simple',
    colorClass: 'border-slate-600 text-slate-500',
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface DialogueCardProps {
  id: string;
  dialogue: Dialogue;
  index: number;
  sceneId: string;
  onDialogueSelect?: (sceneId: string, index: number) => void;
  onEditWithWizard?: (index: number) => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function DialogueCard({
  id,
  dialogue,
  index,
  sceneId,
  onDialogueSelect,
  onEditWithWizard,
}: DialogueCardProps) {
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
    opacity: isDragging ? 0.4 : 1,
  };

  const characters    = useCharactersStore(state => state.characters);
  const duplicateDialogue = useDialoguesStore(state => state.duplicateDialogue);
  const deleteDialogue    = useDialoguesStore(state => state.deleteDialogue);
  const sceneDialogues    = useDialoguesStore(s => s.getDialoguesByScene(sceneId));

  const speaker     = characters.find(c => c.id === dialogue.speaker);
  const speakerName = speaker?.name || dialogue.speaker || 'Inconnu';
  const isResponse  = dialogue.isResponse === true;
  const typeInfo    = getDialogueTypeInfo(dialogue);
  const speakerBg   = getSpeakerColorClass(speakerName);

  // Memoized response index (O(N²) lookup → run only when dependencies change)
  const responseIndex = useMemo(() => {
    if (!isResponse) return -1;
    for (const d of sceneDialogues) {
      for (let ci = 0; ci < d.choices.length; ci++) {
        if (d.choices[ci].nextDialogueId === dialogue.id) return ci;
      }
    }
    return -1;
  }, [isResponse, sceneDialogues, dialogue.id]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleClick = () => onDialogueSelect?.(sceneId, index);

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateDialogue(sceneId, index);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const preview = dialogue.text?.substring(0, 40) || '(vide)';
    if (window.confirm(`Supprimer "${preview}…" ?`)) {
      deleteDialogue(sceneId, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // ── Border réponse A/B ───────────────────────────────────────────────────────
  const responseBorderClass = isResponse
    ? responseIndex === 0
      ? 'border-l-4 border-l-emerald-500 border-[var(--color-border-base)] hover:border-emerald-400'
      : 'border-l-4 border-l-rose-500 border-[var(--color-border-base)] hover:border-rose-400'
    : 'border-[var(--color-border-base)] hover:border-[var(--color-primary)]';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dialogue-id={`${sceneId}-${index}`}
      className={`group relative bg-[var(--color-bg-base)] border-2 rounded-lg px-2 py-2 transition-all cursor-pointer hover:shadow-[var(--shadow-game-glow)] ${responseBorderClass}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${isResponse ? `Réponse ${responseIndex === 0 ? 'A' : 'B'} — ` : ''}Dialogue ${index + 1} : ${speakerName}`}
    >
      {/* ── Drag handle ────────────────────────────────────────────────── */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0.5 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-0.5 hover:bg-[var(--color-bg-hover)] rounded transition-colors"
        aria-label="Réorganiser"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
      </div>

      {/* ── Contenu ────────────────────────────────────────────────────── */}
      <div className="ml-4">

        {/* Ligne 1 : speaker dot + nom + index */}
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${speakerBg}`} aria-hidden="true" />
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate flex-1 leading-tight">
            {speakerName}
          </span>
          {isResponse && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold px-1 py-0.5 rounded border flex-shrink-0 ${
              responseIndex === 0
                ? 'border-emerald-500/60 text-emerald-400'
                : 'border-rose-500/60 text-rose-400'
            }`}>
              <MessageCircleReply className="w-3 h-3" aria-hidden="true" />
              {responseIndex === 0 ? 'A' : 'B'}
            </span>
          )}
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono flex-shrink-0">
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Ligne 2 : texte (2 lignes max) */}
        <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-2 leading-snug mb-1.5">
          {dialogue.text || '(vide)'}
        </p>

        {/* Ligne 3 : badge type + actions */}
        <div className="flex items-center justify-between gap-1">
          <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${typeInfo.colorClass}`}>
            {typeInfo.icon}
            {typeInfo.label}
          </span>

          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-primary hover:bg-primary/10"
              onClick={e => { e.stopPropagation(); onEditWithWizard?.(index); }}
              aria-label="Modifier avec l'assistant"
            >
              <Wand2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-[var(--color-bg-hover)]"
              onClick={handleDuplicate}
              aria-label="Dupliquer"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleDelete}
              aria-label="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DialogueCard;
