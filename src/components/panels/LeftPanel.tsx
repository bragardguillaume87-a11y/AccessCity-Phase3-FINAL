import React, { Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar';
import DialoguesPanel from './DialoguesPanel';
import { LeftPanelJumpBar } from './LeftPanelJumpBar';
import { useScenesStore, useUIStore } from '../../stores/index';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSceneWithElements } from '@/stores/selectors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogueComposerV2 as DialogueComposer } from '../dialogue-editor/DialogueComposerV2';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import type { Dialogue } from '@/types';
import { isCinematicScene } from '@/types';

// PHASE 4 (Option 4): Lazy load DialogueGraphModal for bundle optimization
// This modal contains ReactFlow, Dagre, and theme system (~300KB)
const DialogueGraphModal = React.lazy(() =>
  import('../modals/DialogueGraphModal').then((module) => ({ default: module.DialogueGraphModal }))
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
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const isCinematicSelected = isCinematicScene(selectedScene);
  const addDialogue = useDialoguesStore((state) => state.addDialogue);
  const addDialogues = useDialoguesStore((state) => state.addDialogues);
  const insertDialoguesAfter = useDialoguesStore((state) => state.insertDialoguesAfter);
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);

  // DialogueWizard state from UIStore (no more prop-drilling)
  const wizardOpen = useUIStore((state) => state.dialogueWizardOpen);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const editDialogueIndex = useUIStore((state) => state.dialogueWizardEditIndex);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);

  // DialogueGraph modal
  const setGraphModalOpen = useUIStore((state) => state.setDialogueGraphModalOpen);
  const setGraphSelectedScene = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // PHASE 4: Cosmos theme effects for node creation celebration
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation } = useCosmosEffects();

  // Gestionnaire de changement d'onglet
  const handleTabChange = (newTab: string) => {
    const tab = newTab as 'scenes' | 'dialogues';
    onTabChange(tab);
  };

  const handleWizardSave = (dialogues: Dialogue[]) => {
    // Guard: cinematic scenes do not store dialogues in dialoguesStore
    if (!selectedScene || dialogues.length === 0 || isCinematicSelected) return;

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
      <div className="h-full flex flex-col bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex-1 min-h-0 flex flex-col"
        >
          {/* Tabs Header — compact vertical (icon + micro-label) pour tenir dans 160px */}
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-[var(--color-border-base)] bg-transparent p-1 h-auto gap-1">
            <TabsTrigger
              value="scenes"
              className="rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200 h-11 flex flex-col gap-1 px-2"
            >
              <Film className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs leading-none font-semibold">Scènes</span>
            </TabsTrigger>
            <TabsTrigger
              value="dialogues"
              className="rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200 h-11 flex flex-col gap-1 px-2"
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs leading-none font-semibold">Dialogues</span>
            </TabsTrigger>
          </TabsList>

          {/* Tabs Content avec animations fade-in
            ⚠️ min-h-0 obligatoire : sans lui, min-height:auto sur TabsContent permet au contenu
            de dépasser la hauteur flex allouée → JumpBar clippé par overflow-hidden du Panel.
            Pas de wrapper h-full overflow-y-auto : ScenesSidebar et DialoguesPanel gèrent
            leur propre scroll en interne (filmstrip/list flex-1 overflow-y-auto). */}
          <TabsContent
            value="scenes"
            className="flex-1 min-h-0 overflow-hidden m-0 animate-in fade-in duration-200"
          >
            <ScenesSidebar
              scenes={scenes}
              selectedSceneId={selectedSceneForEdit}
              onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
            />
          </TabsContent>

          <TabsContent
            value="dialogues"
            className="flex-1 min-h-0 overflow-hidden m-0 animate-in fade-in duration-200"
          >
            {isCinematicSelected ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
                <Film className="w-8 h-8 text-violet-400 opacity-40" aria-hidden="true" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Scène cinématique
                </p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Les dialogues ne sont pas disponibles pour ce type de scène. Utilisez
                  l&apos;Éditeur Cinématique pour créer des événements.
                </p>
              </div>
            ) : (
              <DialoguesPanel onDialogueSelect={onDialogueSelect} />
            )}
          </TabsContent>
        </Tabs>

        {/* HUD Compact 110px — nav scènes/dialogues + info row, aligné avec la zone timeline */}
        <LeftPanelJumpBar
          activeTab={activeTab}
          onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
          onDialogueSelect={onDialogueSelect}
        />
      </div>

      {/* DialogueWizard Modal - Outside Tabs to survive unmounts */}
      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setEditDialogueIndex(undefined);
        }}
      >
        <DialogContent className="max-w-[90vw] p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {editDialogueIndex !== undefined
                ? "Modifier un dialogue avec l'assistant"
                : 'Créer un nouveau dialogue'}
            </DialogTitle>
          </DialogHeader>
          {selectedScene ? (
            <DialogueComposer
              sceneId={selectedScene.id}
              dialogueIndex={editDialogueIndex}
              dialogue={
                editDialogueIndex !== undefined
                  ? selectedScene.dialogues[editDialogueIndex]
                  : undefined
              }
              onSave={handleWizardSave}
              onClose={() => setWizardOpen(false)}
              onOpenGraph={() => {
                setWizardOpen(false);
                setGraphSelectedScene(selectedScene.id);
                setGraphModalOpen(true);
              }}
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
