import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useUIStore, useScenesStore } from '@/stores';
import DialogueGraph from '../features/DialogueGraph';
import { DialogueGraphToolbar } from './components/DialogueGraphToolbar';
import { DialogueGraphPalette } from './components/DialogueGraphPalette';
import { useDialogueGraphActions } from '@/hooks/useDialogueGraphActions';

/**
 * DialogueGraphModal - Full-screen modal for interactive dialogue graph editing
 *
 * PHASE 1: ✅ Basic modal with existing DialogueGraph component
 * PHASE 2: ✅ Interactive editing (Hybrid approach: Toolbar + Palette + Double-click wizard + Drag handles)
 * PHASE 3: Panneau de propriétés latéral (à venir)
 * PHASE 4: Design amélioré (gradients, effets) (à venir)
 * PHASE 5: Accessibilité complète (keyboard nav, screen reader, alternate modes) (à venir)
 */
export function DialogueGraphModal() {
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    sceneId?: string;
    index?: number;
  } | null>(null);

  // State for auto-layout: increment to force graph recalculation
  const [layoutVersion, setLayoutVersion] = useState(0);

  // UI Store
  const isOpen = useUIStore((state) => state.dialogueGraphModalOpen);
  const setIsOpen = useUIStore((state) => state.setDialogueGraphModalOpen);
  const selectedSceneId = useUIStore((state) => state.dialogueGraphSelectedScene);
  const setSelectedSceneId = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // Scenes Store
  const scenes = useScenesStore((state) => state.scenes);
  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  // PHASE 2: Actions for interactive editing
  const actions = useDialogueGraphActions(selectedScene?.id || '');

  const handleClose = () => {
    setIsOpen(false);
    setSelectedSceneId(null);
    setSelectedElement(null);
  };

  const handleSelectDialogue = (sceneId: string, dialogueIndex: number) => {
    // Set selected element for properties panel (PHASE 3)
    // Also used for keyboard shortcuts (Delete, Duplicate)
    if (dialogueIndex >= 0) {
      setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
    } else {
      // Deselect if index is -1
      setSelectedElement(null);
    }
  };

  // PHASE 2: Toolbar actions
  const handleDelete = () => {
    if (!selectedElement) return;
    const nodeId = `${selectedElement.sceneId}-${selectedElement.index}`;
    actions.handleDeleteNode(nodeId);
    setSelectedElement(null);
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const nodeId = `${selectedElement.sceneId}-${selectedElement.index}`;
    actions.handleDuplicateNode(nodeId);
    // Selection will stay on the original node
  };

  const handleAutoLayout = () => {
    // Force graph recalculation by changing layoutVersion key
    setLayoutVersion((v) => v + 1);
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
        <div className="flex flex-1 overflow-hidden relative">
          {/* PHASE 2: Toolbar (flottant en haut à droite) */}
          <DialogueGraphToolbar
            selectedNodeId={
              selectedElement
                ? `${selectedElement.sceneId}-${selectedElement.index}`
                : null
            }
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onAutoLayout={handleAutoLayout}
            onClose={handleClose}
          />

          {/* PHASE 2: Palette (flottant en haut à gauche) */}
          <DialogueGraphPalette onCreate={actions.handleCreateDialogue} />

          {/* Graph Canvas */}
          <div className="flex-1 relative bg-[var(--color-bg-base)] h-full">
            <DialogueGraph
              key={layoutVersion}
              selectedScene={selectedScene}
              selectedElement={selectedElement}
              onSelectDialogue={handleSelectDialogue}
              editMode={true}
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
