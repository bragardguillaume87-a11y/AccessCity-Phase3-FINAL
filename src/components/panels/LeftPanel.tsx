import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar';
import DialoguesPanel from './DialoguesPanel';
import { useScenesStore, useUIStore } from '../../stores/index';

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

export default function LeftPanel({ activeTab, onTabChange, onDialogueSelect, onSceneSelect }: LeftPanelProps) {
  // Zustand stores
  const scenes = useScenesStore(state => state.scenes);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);

  // Gestionnaire de changement d'onglet
  const handleTabChange = (newTab: string) => {
    const tab = newTab as 'scenes' | 'dialogues';
    onTabChange(tab);
  };

  return (
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
        className="flex-1 overflow-hidden m-0 animate-in fade-in duration-200"
      >
        <ScenesSidebar
          scenes={scenes}
          selectedSceneId={selectedSceneForEdit}
          onSceneSelect={onSceneSelect || setSelectedSceneForEdit}
        />
      </TabsContent>

      <TabsContent
        value="dialogues"
        className="flex-1 overflow-hidden m-0 animate-in fade-in duration-200"
      >
        <DialoguesPanel onDialogueSelect={onDialogueSelect} />
      </TabsContent>
    </Tabs>
  );
}
