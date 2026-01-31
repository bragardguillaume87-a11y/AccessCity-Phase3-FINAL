import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar';
import DialoguesPanel from './DialoguesPanel';
import { useScenesStore, useUIStore } from '../../stores/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogueWizard } from '../dialogue-editor/DialogueWizard';
import type { Dialogue } from '@/types';

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
  const scenes = useScenesStore((state) => state.scenes);
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const selectedScene = scenes.find((s) => s.id === selectedSceneForEdit);
  const addDialogue = useScenesStore((state) => state.addDialogue);
  const addDialogues = useScenesStore((state) => state.addDialogues);
  const updateDialogue = useScenesStore((state) => state.updateDialogue);

  // DialogueWizard state from UIStore (no more prop-drilling)
  const wizardOpen = useUIStore((state) => state.dialogueWizardOpen);
  const setWizardOpen = useUIStore((state) => state.setDialogueWizardOpen);
  const editDialogueIndex = useUIStore((state) => state.dialogueWizardEditIndex);
  const setEditDialogueIndex = useUIStore((state) => state.setDialogueWizardEditIndex);

  // Gestionnaire de changement d'onglet
  const handleTabChange = (newTab: string) => {
    const tab = newTab as 'scenes' | 'dialogues';
    onTabChange(tab);
  };

  const handleWizardSave = (dialogues: Dialogue[]) => {
    if (!selectedScene || dialogues.length === 0) return;

    if (editDialogueIndex !== undefined) {
      // Edit mode: update the main dialogue (first in array)
      updateDialogue(selectedScene.id, editDialogueIndex, dialogues[0]);
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
        {/* Tabs Header avec indicateur gaming */}
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b-2 border-[var(--color-border-base)] bg-transparent p-0 h-auto">
          <TabsTrigger
            value="scenes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-[var(--color-bg-hover)] transition-all duration-200 h-12 gap-2"
          >
            <Film className="w-4 h-4" aria-hidden="true" />
            <span className="font-semibold text-sm">Scènes</span>
          </TabsTrigger>
          <TabsTrigger
            value="dialogues"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-[var(--color-bg-hover)] transition-all duration-200 h-12 gap-2"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span className="font-semibold text-sm">Dialogues</span>
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
        <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
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
              scenes={scenes}
              onSave={handleWizardSave}
              onClose={() => setWizardOpen(false)}
            />
          ) : (
            <div className="p-8 text-center">Aucune scène sélectionnée</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
