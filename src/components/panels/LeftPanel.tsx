import React, { Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar';
import DialoguesPanel from './DialoguesPanel';
import { useScenesStore, useUIStore } from '../../stores/index';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneWithElements, useAllScenesWithElements } from '@/stores/selectors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogueWizard } from '../dialogue-editor/DialogueWizard';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import type { Dialogue } from '@/types';

// PHASE 4 (Option 4): Lazy load DialogueGraphModal for bundle optimization
// This modal contains ReactFlow, Dagre, and theme system (~300KB)
const DialogueGraphModal = React.lazy(() =>
  import('../modals/DialogueGraphModal').then(module => ({ default: module.DialogueGraphModal }))
);

/**
 * LeftPanel - Système d'onglets Scènes/Dialogues (PHASE 2)
 * Remplace ScenesSidebar dans EditorShell
 *
 * Features:
 * - Toggle entre vue Scènes et vue Dialogues
 * - Radix-UI Tabs pour accessibilité WCAG 2.2 AA
 * - Gaming aesthetic avec border-bottom indicator
 * - Keyboard navigation (Arrow Left/Right, Home/End)
 */
export interface LeftPanelProps {
  activeTab: 'scenes' | 'dialogues';
  onTabChange: (tab: 'scenes' | 'dialogues') => void;
  onDialogueSelect?: (sceneId: string, index: number, metadata?: unknown) => void;
  onSceneSelect?: (sceneId: string) => void;
}

export default function LeftPanel({
  activeTab,
  onTabChange,
  onDialogueSelect,
  onSceneSelect,
}: LeftPanelProps) {
  // Zustand stores
  const scenes = useScenesStore((state) => state.scenes); // SceneMetadata[] (pour ScenesSidebar)
  const scenesWithElements = useAllScenesWithElements(); // Scene[] avec dialogues (pour DialogueWizard)
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const addDialogue = useDialoguesStore((state) => state.addDialogue);
  const addDialogues = useDialoguesStore((state) => state.addDialogues);
  const insertDialoguesAfter = useDialoguesStore((state) => state.insertDialoguesAfter);
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);

  // DialogueWizard state from UIStore (no more prop-drilling)
  const wizardOpen = useUIStore((state) => state.dialogueWizardOpen);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const editDialogueIndex = useUIStore((state) => state.dialogueWizardEditIndex);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);

  // PHASE 4: Cosmos theme effects for node creation celebration
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation } = useCosmosEffects();

  // Gestionnaire de changement d'onglet
  const handleTabChange = (newTab: string) => {
    const tab = newTab as 'scenes' | 'dialogues';
    onTabChange(tab);
  };

  const handleWizardSave = (dialogues: Dialogue[]) => {
    if (!selectedScene || dialogues.length === 0) return;

    if (editDialogueIndex !== undefined) {
      // Edit mode: update the main dialogue
      updateDialogue(selectedScene.id, editDialogueIndex, dialogues[0]);

      // If there are response dialogues, insert them after the main dialogue
      if (dialogues.length > 1) {
        const responseDialogues = dialogues.slice(1); // Get responses (dialogues[1], dialogues[2], ...)
        insertDialoguesAfter(selectedScene.id, editDialogueIndex, responseDialogues);
      }
    } else {
      // Create mode: determine convergence point for response dialogues
      // If response dialogues exist and we're appending at the end,
      // there's no convergence point yet (scene ends after responses).
      // Convergence will auto-resolve when more dialogues are added.
      if (dialogues.length === 1) {
        addDialogue(selectedScene.id, dialogues[0]);
      } else {
        addDialogues(selectedScene.id, dialogues);
      }

      // PHASE 4: Cosmos celebration effect for new dialogue creation
      if (isCosmosTheme) {
        celebrateNodeCreation();
      }
    }

    setWizardOpen(false);
    setEditDialogueIndex(undefined);
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="h-full flex flex-col bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
      >
        {/* Tabs Header — compact vertical (icon + micro-label) pour tenir dans 160px */}
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-[var(--color-border-base)] bg-transparent p-0 h-auto">
          <TabsTrigger
            value="scenes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-[var(--color-bg-hover)] transition-all duration-200 h-12 flex flex-col gap-1 px-2"
          >
            <Film className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-none font-semibold truncate">Scènes</span>
          </TabsTrigger>
          <TabsTrigger
            value="dialogues"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-[var(--color-bg-hover)] transition-all duration-200 h-12 flex flex-col gap-1 px-2"
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-none font-semibold truncate">Dial.</span>
          </TabsTrigger>
        </TabsList>

        {/* Tabs Content avec animations fade-in */}
        <TabsContent value="scenes" className="flex-1 m-0 animate-in fade-in duration-200">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <ScenesSidebar
              scenes={scenes}
              selectedSceneId={selectedSceneForEdit}
              onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
            />
          </div>
        </TabsContent>

        <TabsContent value="dialogues" className="flex-1 m-0 animate-in fade-in duration-200">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <DialoguesPanel
              onDialogueSelect={onDialogueSelect}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* DialogueWizard Modal - Outside Tabs to survive unmounts */}
      <Dialog open={wizardOpen} onOpenChange={(open) => {
        setWizardOpen(open);
        if (!open) setEditDialogueIndex(undefined);
      }}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editDialogueIndex !== undefined
                ? 'Modifier un dialogue avec l\'assistant'
                : 'Créer un nouveau dialogue'}
            </DialogTitle>
          </DialogHeader>
          {selectedScene ? (
            <DialogueWizard
              sceneId={selectedScene.id}
              dialogueIndex={editDialogueIndex}
              dialogue={
                editDialogueIndex !== undefined
                  ? selectedScene.dialogues[editDialogueIndex]
                  : undefined
              }
              scenes={scenesWithElements}
              onSave={handleWizardSave}
              onClose={() => setWizardOpen(false)}
            />
          ) : (
            <div className="p-8 text-center">Aucune scène sélectionnée</div>
          )}
        </DialogContent>
      </Dialog>

      {/* DialogueGraph Modal - Full-screen node editor (lazy loaded) */}
      <Suspense fallback={null}>
        <DialogueGraphModal />
      </Suspense>
    </>
  );
}
