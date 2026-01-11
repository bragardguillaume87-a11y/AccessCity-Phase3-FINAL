import React, { useState, useEffect } from 'react';
import { useScenesStore, useCharactersStore, useUIStore } from '../stores/index.ts';
import { useUndoRedo } from '../hooks/useUndoRedo.ts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.ts';
import { Panel, Group, Separator } from 'react-resizable-panels';
import KeyboardShortcuts from './KeyboardShortcuts';
import ProblemsPanel from './ProblemsPanel';
import CommandPalette from './CommandPalette';
import { useValidation } from '../hooks/useValidation.ts';
import TopBar from './layout/TopBar';
import Sidebar from './layout/Sidebar';
import Inspector from './layout/Inspector';
import { AnnouncementRegion, AssertiveAnnouncementRegion } from './ui/AnnouncementRegion.tsx';
import MainCanvas from './panels/MainCanvas';

/**
 * Modal context type - Stores context data for various modals
 */
interface ModalContext {
  characterId?: string;
  category?: string;
  targetSceneId?: string;
  sceneId?: string;
}

const LeftPanel = React.lazy(() => import('./panels/LeftPanel'));
const UnifiedPanel = React.lazy(() => import('./panels/UnifiedPanel'));
const CharactersModal = React.lazy(() => import('./modals/CharactersModal'));
const AssetsLibraryModal = React.lazy(() => import('./modals/AssetsLibraryModal'));
const SettingsModal = React.lazy(() => import('./modals/SettingsModal'));
const PreviewModal = React.lazy(() => import('./modals/PreviewModal'));

/**
 * EditorShell - New 3-pane editor layout (GDevelop-like)
 * Replaces StudioShell progressively with:
 * - Left: ExplorerPanel (scenes/dialogues/characters tree)
 * - Center: MainCanvas (visual editing, scene preview)
 * - Right: PropertiesPanel (properties of selected element)
 * ASCII only, no hardcoded French strings.
 */
export default function EditorShell({ onBack = null }) {
  // Zustand stores (granular selectors for better performance)
  const scenes = useScenesStore(state => state.scenes);
  const characters = useCharactersStore(state => state.characters);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);
  const lastSaved = useUIStore(state => state.lastSaved);
  const isSaving = useUIStore(state => state.isSaving);

  // Undo/Redo functionality from zundo
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const validation = useValidation();
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

  // PHASE 4: Toggle panneau droit masquable
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // PHASE 6: Fullscreen mode state (null | 'graph' | 'canvas' | 'preview')
  const [fullscreenMode, setFullscreenMode] = useState(null);

  // Modal state management
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'characters' | 'assets' | 'export' | 'preview' | null
  const [modalContext, setModalContext] = useState<ModalContext>({}); // { characterId, category, sceneId, ... }

  // KEYBOARD SHORTCUTS: Register global keyboard shortcuts (Ctrl+Z, Ctrl+Y, etc.)
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPreview: () => setActiveModal('preview'),
    onCommandPalette: () => setCommandPaletteOpen(true),
  });

  // Handler for ProblemsPanel navigation
  const handleNavigateTo = (tab, params) => {
    if (params?.sceneId) {
      setSelectedSceneForEdit(params.sceneId);
    }
    setShowProblemsPanel(false);
  };

  // Handler for scene selection from Explorer
  const handleSceneSelect = (sceneId) => {
    setSelectedSceneForEdit(sceneId);
    setSelectedElement({ type: 'scene', id: sceneId });
  };

  // Handler for character selection from Explorer
  const handleCharacterSelect = (charId) => {
    setSelectedElement({ type: 'character', id: charId });
  };

  // Handler for dialogue selection from Explorer
  const handleDialogueSelect = (sceneId, dialogueIndex, metadata) => {
    setSelectedSceneForEdit(sceneId);

    // If metadata is provided (e.g., for scene character selection), use it
    if (metadata && metadata.type === 'sceneCharacter') {
      setSelectedElement({
        type: 'sceneCharacter',
        sceneId,
        sceneCharacterId: metadata.sceneCharacterId
      });
    } else {
      setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
    }
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Main page title - Screen reader only */}
      <h1 className="sr-only">AccessCity Studio - Éditeur de Visual Novels</h1>

      {/* Live regions for screen reader announcements */}
      <AnnouncementRegion />
      <AssertiveAnnouncementRegion />

      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts
        activeTab="editor"
        setActiveTab={() => {}}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenModal={(modal) => {
          setActiveModal(modal);
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={!!commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        mode={typeof commandPaletteOpen === 'string' ? commandPaletteOpen : 'commands'}
        setActiveTab={() => {}}
      />

      {/* Header with ARIA landmark */}
      <TopBar
        onBack={onBack}
        onOpenModal={setActiveModal}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        validation={validation}
        showProblemsPanel={showProblemsPanel}
        onToggleProblemsPanel={() => setShowProblemsPanel(!showProblemsPanel)}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      {/* Problems Panel (displayed at top when activated) */}
      {showProblemsPanel && (
        <div className="bg-slate-800 border-b border-slate-700 animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Main 3-pane layout - Resizable with react-resizable-panels */}
      <main className="flex-1 overflow-hidden" id="main-content" tabIndex={-1}>
        {/* Main content heading - Screen reader only */}
        <h2 className="sr-only">Zone d'édition principale</h2>

        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading editor...</p>
            </div>
          </div>
        }>
          <Group className="h-full">
            {/* Left panel: Explorer/Sidebar - Resizable 15-40% (PHASE 6: Hidden in fullscreen) */}
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              collapsible={true}
              collapsedSize={fullscreenMode ? 0 : undefined}
              className="bg-slate-800 border-r border-slate-700 overflow-y-auto"
              id="explorer-panel"
              role="complementary"
              aria-label="Explorateur de scènes et personnages"
            >
              <h3 className="sr-only">Explorateur de scènes</h3>
              <Sidebar>
                <LeftPanel onDialogueSelect={handleDialogueSelect} />
              </Sidebar>
            </Panel>

            {/* Resize handle (drag border) - Hidden in fullscreen */}
            {!fullscreenMode && (
              <Separator className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
            )}

            {/* Center panel: Main Canvas - Flexible */}
            <Panel
              defaultSize={50}
              minSize={30}
              className="bg-slate-900 overflow-auto"
              id="canvas-panel"
              role="main"
              aria-label="Canvas de scène"
            >
              <h3 className="sr-only">Canvas de scène</h3>
              <MainCanvas
                  selectedScene={selectedScene}
                  scenes={scenes}
                  selectedElement={selectedElement}
                  onSelectDialogue={handleDialogueSelect}
                  onOpenModal={(modal, context = {}) => {
                    setActiveModal(modal);
                    setModalContext(context);
                  }}
                  isRightPanelOpen={isRightPanelOpen}
                  onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  fullscreenMode={fullscreenMode}
                  onFullscreenChange={setFullscreenMode}
                />
            </Panel>

            {/* Resize handle - Hidden in fullscreen */}
            {!fullscreenMode && (
              <Separator className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
            )}

            {/* Right panel: Inspector/Properties - Resizable 20-40% (PHASE 4: Collapsible, PHASE 6: Hidden in fullscreen) */}
            <Panel
              defaultSize={30}
              minSize={20}
              maxSize={40}
              collapsible={true}
              collapsedSize={!isRightPanelOpen || fullscreenMode ? 0 : undefined}
              className="bg-slate-800 border-l border-slate-700 overflow-y-auto"
              id="properties-panel"
              role="complementary"
              aria-label="Propriétés et outils"
            >
              <h3 className="sr-only">Propriétés</h3>
              <Inspector>
                <UnifiedPanel
                  onOpenModal={(modal, context) => {
                    setActiveModal(modal);
                    setModalContext(context);
                  }}
                />
              </Inspector>
            </Panel>
          </Group>
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 flex-shrink-0">
        <div className="px-6 py-2 text-center text-xs text-slate-500">
          AccessCity Studio - Accessible scenario editor
        </div>
      </footer>

      {/* Modals */}
      <React.Suspense fallback={null}>
        {activeModal === 'project' && (
          <SettingsModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'characters' && (
          <CharactersModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            initialCharacterId={modalContext.characterId}
          />
        )}
        {activeModal === 'assets' && (
          <AssetsLibraryModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            initialCategory={modalContext.category}
            targetSceneId={modalContext.targetSceneId}
          />
        )}
        {activeModal === 'preview' && (
          <PreviewModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            initialSceneId={modalContext.sceneId || selectedScene?.id}
          />
        )}
      </React.Suspense>
    </div>
  );
}
