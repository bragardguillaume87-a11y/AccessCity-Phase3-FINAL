import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar';
import DialoguesPanel from './DialoguesPanel';
import { useScenesStore, useUIStore } from '../../stores/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogueWizard } from '../dialogue-editor/DialogueWizard';

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
  wizardOpen?: boolean;
  onWizardOpenChange?: (open: boolean) => void;
  editDialogueIndex?: number;
  onEditDialogueIndexChange?: (index: number | undefined) => void;
}

export default function LeftPanel({
  activeTab,
  onTabChange,
  onDialogueSelect,
  onSceneSelect,
  wizardOpen: controlledWizardOpen,
  onWizardOpenChange,
  editDialogueIndex: controlledEditDialogueIndex,
  onEditDialogueIndexChange
}: LeftPanelProps) {
  // Zustand stores
  const scenes = useScenesStore(state => state.scenes);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);
  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);
  const addDialogue = useScenesStore(state => state.addDialogue);

  // DialogueWizard state - Use controlled if provided, otherwise local state
  const [localWizardOpen, setLocalWizardOpen] = useState(false);
  const [localEditDialogueIndex, setLocalEditDialogueIndex] = useState<number | undefined>();

  const wizardOpen = controlledWizardOpen ?? localWizardOpen;
  const setWizardOpen = onWizardOpenChange ?? setLocalWizardOpen;
  const editDialogueIndex = controlledEditDialogueIndex ?? localEditDialogueIndex;
  const setEditDialogueIndex = onEditDialogueIndexChange ?? setLocalEditDialogueIndex;

  // Gestionnaire de changement d'onglet
  const handleTabChange = (newTab: string) => {
    const tab = newTab as 'scenes' | 'dialogues';
    onTabChange(tab);
  };

  const handleWizardSave = (dialogue: any) => {
    if (!selectedScene) return;

    if (editDialogueIndex !== undefined) {
      const updateDialogue = useScenesStore.getState().updateDialogue;
      updateDialogue(selectedScene.id, editDialogueIndex, dialogue);
    } else {
      addDialogue(selectedScene.id, dialogue);
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
      <TabsContent
        value="scenes"
        className="flex-1 m-0 animate-in fade-in duration-200"
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <ScenesSidebar
            scenes={scenes}
            selectedSceneId={selectedSceneForEdit}
            onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
          />
        </div>
      </TabsContent>

      <TabsContent
        value="dialogues"
        className="flex-1 m-0 animate-in fade-in duration-200"
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <DialoguesPanel
            onDialogueSelect={onDialogueSelect}
            wizardOpen={wizardOpen}
            onWizardOpenChange={setWizardOpen}
            editDialogueIndex={editDialogueIndex}
            onEditDialogueIndexChange={setEditDialogueIndex}
          />
        </div>
      </TabsContent>
    </Tabs>

    {/* DialogueWizard Modal - Outside Tabs to survive unmounts */}
    <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Assistant de création de dialogue</DialogTitle>
        </DialogHeader>
        {selectedScene ? (
          <DialogueWizard
            sceneId={selectedScene.id}
            dialogueIndex={editDialogueIndex}
            dialogue={editDialogueIndex !== undefined ? selectedScene.dialogues[editDialogueIndex] : undefined}
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
