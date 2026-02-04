import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useUIStore, useScenesStore } from '@/stores';
import DialogueGraph from '../features/DialogueGraph';
import { DialogueGraphToolbar } from './components/DialogueGraphToolbar';
import { DialogueGraphPalette } from './components/DialogueGraphPalette';
import { DialoguePropertiesPanel } from './components/DialoguePropertiesPanel';
import { ThemeSelector } from './components/ThemeSelector';
import { CosmosBackground } from '../features/CosmosBackground';
import { useDialogueGraphActions } from '@/hooks/useDialogueGraphActions';
import { useIsCosmosTheme, useGraphTheme } from '@/hooks/useGraphTheme';

/**
 * DialogueGraphModal - Full-screen modal for interactive dialogue graph editing
 *
 * PHASE 1: ✅ Basic modal with existing DialogueGraph component
 * PHASE 2: ✅ Interactive editing (Hybrid approach: Toolbar + Palette + Double-click wizard + Drag handles)
 * PHASE 3: ✅ Panneau de propriétés latéral (édition rapide speaker + text)
 * PHASE 4: ✅ Design amélioré avec système de thèmes (Cosmos pour enfants)
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

  // PHASE 3.5: State for layout direction (TB = vertical, LR = horizontal)
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');

  // PHASE 4: Theme system
  const isCosmosTheme = useIsCosmosTheme();
  const theme = useGraphTheme();

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

  const handleToggleLayout = () => {
    // Toggle between vertical (TB) and horizontal (LR) layout
    setLayoutDirection((d) => (d === 'TB' ? 'LR' : 'TB'));
    setLayoutVersion((v) => v + 1); // Force Dagre recalculation
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

          {/* PHASE 4: Theme selector + Close button */}
          <div className="flex items-center gap-4">
            <ThemeSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Fermer l'éditeur nodal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* PHASE 2: Toolbar (flottant, se décale quand le panneau propriétés est ouvert) */}
          <DialogueGraphToolbar
            selectedNodeId={
              selectedElement
                ? `${selectedElement.sceneId}-${selectedElement.index}`
                : null
            }
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onAutoLayout={handleAutoLayout}
            onToggleLayout={handleToggleLayout}
            layoutDirection={layoutDirection}
            onClose={handleClose}
            isPanelOpen={selectedElement !== null && selectedElement.index !== undefined}
          />

          {/* PHASE 2: Palette (flottant en haut à gauche) */}
          <DialogueGraphPalette onCreate={actions.handleCreateDialogue} />

          {/* Graph Canvas */}
          <div
            className="flex-1 relative h-full overflow-hidden"
            style={{
              backgroundColor: theme.background.value,
              transition: 'background-color 0.3s ease',
            }}
          >
            {/* PHASE 4: Animated background for Cosmos theme */}
            {isCosmosTheme && <CosmosBackground />}

            {/* ReactFlow Graph */}
            <DialogueGraph
              key={layoutVersion}
              selectedScene={selectedScene}
              selectedElement={selectedElement}
              onSelectDialogue={handleSelectDialogue}
              editMode={true}
              layoutDirection={layoutDirection}
            />
          </div>

          {/* PHASE 3: Properties Panel */}
          {selectedElement && selectedElement.index !== undefined && (
            <DialoguePropertiesPanel
              sceneId={selectedElement.sceneId || ''}
              dialogueIndex={selectedElement.index}
              onClose={() => setSelectedElement(null)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DialogueGraphModal;
