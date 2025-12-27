import React, { useState, useEffect } from 'react';
import { useScenesStore, useCharactersStore, useUIStore, useUndoRedoStore } from '../stores/index.js';
import { Panel, Group, Separator } from 'react-resizable-panels';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import ProblemsPanel from './ProblemsPanel.jsx';
import CommandPalette from './CommandPalette.jsx';
import { useValidation } from '../hooks/useValidation.js';
import TopBar from './layout/TopBar.jsx';
import Sidebar from './layout/Sidebar.jsx';
import Inspector from './layout/Inspector.jsx';

const ExplorerPanel = React.lazy(() => import('./panels/ExplorerPanel.jsx'));
const MainCanvas = React.lazy(() => import('./panels/MainCanvas.jsx'));
const PropertiesPanel = React.lazy(() => import('./panels/PropertiesPanel.jsx'));
const CharactersModal = React.lazy(() => import('./modals/CharactersModal.jsx'));
const AssetsLibraryModal = React.lazy(() => import('./modals/AssetsLibraryModal.jsx'));
const SettingsModal = React.lazy(() => import('./modals/SettingsModal.jsx'));
const PreviewModal = React.lazy(() => import('./modals/PreviewModal.jsx'));

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
  const lastSaved = useUndoRedoStore(state => state.lastSaved);
  const isSaving = useUndoRedoStore(state => state.isSaving);
  const undo = useUndoRedoStore(state => state.undo);
  const redo = useUndoRedoStore(state => state.redo);
  const canUndo = useUndoRedoStore(state => state.canUndo);
  const canRedo = useUndoRedoStore(state => state.canRedo);

  const validation = useValidation();
  const [, _forceUpdate] = useState(0);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

  // Modal state management
  const [activeModal, setActiveModal] = useState(null); // 'characters' | 'assets' | 'export' | 'preview' | null
  const [modalContext, setModalContext] = useState({}); // { characterId, category, sceneId, ... }

  // Force re-render every second for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      _forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to calculate time since last save
  const getTimeSinceLastSave = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

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
      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts
        activeTab="editor"
        setActiveTab={() => {}}
        onOpenCommandPalette={(mode) => setCommandPaletteOpen(mode || true)}
        onOpenModal={(modal, context) => {
          setActiveModal(modal);
          if (context) setModalContext(context);
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
        getTimeSinceLastSave={getTimeSinceLastSave}
      />

      {/* Problems Panel (displayed at top when activated) */}
      {showProblemsPanel && (
        <div className="bg-slate-800 border-b border-slate-700 animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Main 3-pane layout - Resizable with react-resizable-panels */}
      <main className="flex-1 overflow-hidden" id="main-content" tabIndex="-1">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading editor...</p>
            </div>
          </div>
        }>
          <Group direction="horizontal" className="h-full">
            {/* Left panel: Explorer/Sidebar - Resizable 15-40% */}
            <Panel
              defaultSize="20%"
              minSize="15%"
              maxSize="40%"
              collapsible={true}
              className="bg-slate-800 border-r border-slate-700 overflow-y-auto"
              id="explorer-panel"
            >
              <Sidebar>
                <ExplorerPanel
                  scenes={scenes}
                  characters={characters}
                  selectedSceneId={selectedSceneForEdit}
                  selectedElement={selectedElement}
                  onSceneSelect={handleSceneSelect}
                  onCharacterSelect={handleCharacterSelect}
                  onDialogueSelect={handleDialogueSelect}
                />
              </Sidebar>
            </Panel>

            {/* Resize handle (drag border) */}
            <Separator className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Center panel: Main Canvas - Flexible */}
            <Panel
              defaultSize="50%"
              minSize="30%"
              className="bg-slate-900 overflow-auto"
              id="canvas-panel"
            >
              <div role="main">
                <MainCanvas
                  selectedScene={selectedScene}
                  scenes={scenes}
                  selectedElement={selectedElement}
                  onSelectDialogue={handleDialogueSelect}
                  onOpenModal={(modal, context = {}) => {
                    setActiveModal(modal);
                    setModalContext(context);
                  }}
                />
              </div>
            </Panel>

            {/* Resize handle */}
            <Separator className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Right panel: Inspector/Properties - Resizable 20-40% */}
            <Panel
              defaultSize="30%"
              minSize="20%"
              maxSize="40%"
              collapsible={true}
              className="bg-slate-800 border-l border-slate-700 overflow-y-auto"
              id="properties-panel"
            >
              <Inspector>
                <PropertiesPanel
                  selectedElement={selectedElement}
                  selectedScene={selectedScene}
                  characters={characters}
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
