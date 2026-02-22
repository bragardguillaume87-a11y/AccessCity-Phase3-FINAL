import React from 'react';
import { ChevronRight, ChevronDown, MessageSquare, GitBranch, ExternalLink } from 'lucide-react';
import { useSceneWithElements } from '@/stores/selectors';
import type { Dialogue } from '@/types';

/**
 * GraphListView - Accessible tree view alternative to visual graph
 *
 * PHASE 5.4 - Vue Liste Structuree:
 * - For screen reader users
 * - Keyboard navigable (arrow keys)
 * - Shows dialogues as hierarchical tree
 * - Choices displayed as nested items
 */

interface GraphListViewProps {
  sceneId: string;
  selectedDialogueIndex: number | null;
  onSelectDialogue: (index: number) => void;
  onEditDialogue: (index: number) => void;
}

export function GraphListView({
  sceneId,
  selectedDialogueIndex,
  onSelectDialogue,
  onEditDialogue
}: GraphListViewProps) {
  const scene = useSceneWithElements(sceneId);

  if (!scene) {
    return (
      <div className="p-4 text-muted-foreground" role="alert">
        Scene non trouvee
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-auto bg-card p-4"
      role="tree"
      aria-label={`Arbre des dialogues de la scene ${scene.title}`}
    >
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        {scene.title} - {scene.dialogues.length} dialogues
      </h2>

      <div className="space-y-1">
        {scene.dialogues.map((dialogue, index) => (
          <DialogueTreeItem
            key={dialogue.id}
            dialogue={dialogue}
            index={index}
            isSelected={selectedDialogueIndex === index}
            onSelect={() => onSelectDialogue(index)}
            onEdit={() => onEditDialogue(index)}
            allDialogues={scene.dialogues}
          />
        ))}
      </div>

      {scene.dialogues.length === 0 && (
        <p className="text-muted-foreground italic">
          Aucun dialogue dans cette scene. Utilisez la palette pour en creer.
        </p>
      )}
    </div>
  );
}

/**
 * Single dialogue item in the tree
 */
interface DialogueTreeItemProps {
  dialogue: Dialogue;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  allDialogues: Dialogue[];
}

function DialogueTreeItem({
  dialogue,
  index,
  isSelected,
  onSelect,
  onEdit,
  allDialogues
}: DialogueTreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChoices = dialogue.choices && dialogue.choices.length > 0;

  // Find target dialogue names for choices
  const getTargetName = (nextDialogueId: string | undefined): string => {
    if (!nextDialogueId) return '(non connecte)';
    const targetIndex = allDialogues.findIndex((d) => d.id === nextDialogueId);
    if (targetIndex === -1) return '(cible inconnue)';
    const target = allDialogues[targetIndex];
    return `Dialogue ${targetIndex + 1} (${target.speaker || 'Narrator'})`;
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect();
        break;
      case 'e':
      case 'E':
        event.preventDefault();
        onEdit();
        break;
      case 'ArrowRight':
        if (hasChoices && !isExpanded) {
          event.preventDefault();
          setIsExpanded(true);
        }
        break;
      case 'ArrowLeft':
        if (hasChoices && isExpanded) {
          event.preventDefault();
          setIsExpanded(false);
        }
        break;
    }
  };

  const truncateText = (text: string, maxLength: number = 60): string => {
    if (!text) return '(vide)';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="select-none">
      {/* Main dialogue row */}
      <div
        role="treeitem"
        aria-level={1}
        aria-expanded={hasChoices ? isExpanded : undefined}
        aria-selected={isSelected}
        tabIndex={0}
        onClick={onSelect}
        onDoubleClick={onEdit}
        onKeyDown={handleKeyDown}
        className={`
          flex items-start gap-2 p-2 rounded-lg cursor-pointer
          transition-colors duration-150
          ${isSelected
            ? 'bg-primary/20 border-2 border-primary'
            : 'hover:bg-accent border-2 border-transparent'
          }
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        `}
      >
        {/* Expand/collapse button for choices */}
        {hasChoices ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-accent rounded"
            aria-label={isExpanded ? 'Replier les choix' : 'Developper les choix'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" /> /* Spacer for alignment */
        )}

        {/* Icon */}
        {hasChoices ? (
          <GitBranch className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        ) : (
          <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              #{index + 1}
            </span>
            <span className="font-medium text-foreground">
              {dialogue.speaker || 'Narrator'}
            </span>
            {dialogue.speakerMood && dialogue.speakerMood !== 'neutral' && (
              <span className="text-xs text-muted-foreground italic">
                ({dialogue.speakerMood})
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {truncateText(dialogue.text)}
          </p>
        </div>

        {/* Badges */}
        {hasChoices && (
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
            {dialogue.choices.length} choix
          </span>
        )}
      </div>

      {/* Nested choices */}
      {hasChoices && isExpanded && (
        <div
          role="group"
          className="ml-8 mt-1 border-l-2 border-border pl-3 space-y-1"
        >
          {dialogue.choices.map((choice, choiceIndex) => (
            <div
              key={choice.id}
              role="treeitem"
              aria-level={2}
              aria-selected={false}
              tabIndex={-1}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 text-sm"
            >
              <span className="text-muted-foreground">→</span>
              <div className="flex-1">
                <span className="text-foreground">
                  Choix {choiceIndex + 1}: {truncateText(choice.text, 40)}
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  {choice.nextSceneId ? (
                    <>
                      <ExternalLink className="w-3 h-3" />
                      <span>Vers scene: {choice.nextSceneId}</span>
                    </>
                  ) : (
                    <span>→ {getTargetName(choice.nextDialogueId)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
