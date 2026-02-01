import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useUIStore, useScenesStore } from '@/stores';
import DialogueGraph from '../features/DialogueGraph';

/**
 * DialogueGraphModal - Full-screen modal for interactive dialogue graph editing
 *
 * PHASE 1: Basic modal with existing DialogueGraph component
 * PHASE 2: Interactive editing (drag & drop, inline editing)
 * PHASE 3: Properties panel on the right
 * PHASE 4: Enhanced design (gradients, effects)
 * PHASE 5: Full accessibility (keyboard nav, screen reader, alternate modes)
 */
export function DialogueGraphModal() {
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    sceneId?: string;
    index?: number;
  } | null>(null);

  // UI Store
  const isOpen = useUIStore((state) => state.dialogueGraphModalOpen);
  const setIsOpen = useUIStore((state) => state.setDialogueGraphModalOpen);
  const selectedSceneId = useUIStore((state) => state.dialogueGraphSelectedScene);
  const setSelectedSceneId = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // Scenes Store
  const scenes = useScenesStore((state) => state.scenes);
  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedSceneId(null);
    setSelectedElement(null);
  };

  const handleSelectDialogue = (sceneId: string, dialogueIndex: number) => {
    // PHASE 2: Will implement node selection and properties panel
    setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
  };

  if (!selectedScene) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] p-0 gap-0 bg-[var(--color-bg-base)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Éditeur Nodal - {selectedScene.title}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {selectedScene.dialogues.length} dialogue{selectedScene.dialogues.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Fermer l'éditeur nodal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Graph Canvas */}
          <div className="flex-1 relative bg-[var(--color-bg-base)] h-full">
            <DialogueGraph
              selectedScene={selectedScene}
              selectedElement={selectedElement}
              onSelectDialogue={handleSelectDialogue}
            />
          </div>

          {/* Right: Properties Panel (PHASE 3) */}
          {selectedElement && (
            <div className="w-[30%] border-l-2 border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Propriétés
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedElement(null)}
                    aria-label="Fermer le panneau de propriétés"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  PHASE 3 : Panneau de propriétés à implémenter
                </p>
                <div className="mt-4 text-xs text-[var(--color-text-muted)]">
                  <p>Dialogue #{selectedElement.index !== undefined ? selectedElement.index + 1 : 'N/A'}</p>
                  <p>Scene: {selectedElement.sceneId}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DialogueGraphModal;
