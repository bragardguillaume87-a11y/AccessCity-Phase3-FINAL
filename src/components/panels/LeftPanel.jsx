import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.jsx';
import { Film, MessageSquare } from 'lucide-react';
import ScenesSidebar from './ScenesSidebar.tsx';
import DialoguesPanel from './DialoguesPanel';
import { useScenesStore, useUIStore } from '../../stores/index.js';

/**
 * LeftPanel - Système d'onglets Scènes/Dialogues (PHASE 2)
 * Remplace ScenesSidebar dans EditorShell
 *
 * Features:
 * - Toggle entre vue Scènes et vue Dialogues
 * - Radix-UI Tabs pour accessibilité WCAG 2.2 AA
 * - Gaming aesthetic avec border-bottom indicator
 * - Keyboard navigation (Arrow Left/Right, Home/End)
 *
 * @param {Object} props
 * @param {Function} props.onDialogueSelect - PHASE 3: Callback when dialogue is selected
 * @returns {JSX.Element}
 */
export default function LeftPanel({ onDialogueSelect }) {
  // Zustand stores
  const scenes = useScenesStore(state => state.scenes);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);

  return (
    <Tabs
      defaultValue="scenes"
      className="h-full flex flex-col bg-[var(--color-bg-elevated)]"
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
          onSceneSelect={setSelectedSceneForEdit}
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

LeftPanel.propTypes = {
  onDialogueSelect: PropTypes.func
};
