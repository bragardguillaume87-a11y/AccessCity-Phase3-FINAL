import React, { useState, useEffect, Suspense } from 'react';
import { useUIStore, useScenes, useCharacters } from '../stores/index.ts';
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
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger';
import type { ModalContext, SelectedElementType, FullscreenMode } from '../types';

const LeftPanel = React.lazy(() => import('./panels/LeftPanel'));
const PropertiesPanel = React.lazy(() => import('./panels/PropertiesPanel'));
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
interface EditorShellProps {
  onBack?: (() => void) | null;
}

export default function EditorShell({ onBack = null }: EditorShellProps) {
  // Zustand stores (memoized selectors for better performance)
  const scenes = useScenes();
  const characters = useCharacters();
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const lastSaved = useUIStore((state) => state.lastSaved);
  const isSaving = useUIStore((state) => state.isSaving);

  // Undo/Redo functionality from zundo
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const validation = useValidation();
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElementType>(null);

  // Track active tab in LeftPanel ('scenes' or 'dialogues')
  const [leftPanelActiveTab, setLeftPanelActiveTab] = useState<'scenes' | 'dialogues'>('scenes');

  // PHASE 6: Fullscreen mode state (null | 'graph' | 'canvas' | 'preview')
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenMode>(null);

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

  // Detect old localStorage cache that might block panel resizing
  useEffect(() => {
    const oldKeys = [
      'react-resizable-panels:layout',
      'react-resizable-panels:editor-main-group'
    ];

    const hasOldKeys = oldKeys.some(key => localStorage.getItem(key) !== null);

    if (hasOldKeys) {
      logger.warn('[EditorShell] Ancien layout détecté. Si redimensionnement ne fonctionne pas, vider localStorage.');
    }
  }, []);

  // Auto-select first dialogue on initial load or when scene changes
  // Visual novel behavior: always show first dialogue when scene is selected
  useEffect(() => {
    // Find the current scene
    const currentScene = scenes.find(s => s.id === selectedSceneForEdit);

    // Guard: need a scene with dialogues
    if (!currentScene?.dialogues?.length) {
      return;
    }

    // Guard: don't override existing dialogue selection for this scene
    if (
      selectedElement?.type === 'dialogue' &&
      selectedElement?.sceneId === currentScene.id
    ) {
      return;
    }

    // Auto-select first dialogue
    logger.info(`[EditorShell] Auto-selecting first dialogue for scene: ${currentScene.id}`);
    setSelectedElement({ type: 'dialogue', sceneId: currentScene.id, index: 0 });
  }, [scenes, selectedSceneForEdit]);

  // Handler for ProblemsPanel navigation
  const handleNavigateTo = (_tab: string, params?: { sceneId?: string }) => {
    if (params?.sceneId) {
      setSelectedSceneForEdit(params.sceneId);
    }
    setShowProblemsPanel(false);
  };

  // Handler for scene selection from Explorer
  // Always select first dialogue when scene is chosen (visual novel behavior)
  const handleSceneSelect = (sceneId: string) => {
    setSelectedSceneForEdit(sceneId);
    // Set to null - the auto-select effect will pick up the first dialogue
    setSelectedElement(null);
  };

  // Handler for character selection from Explorer
  const handleCharacterSelect = (charId: string) => {
    setSelectedElement({ type: 'character', id: charId });
  };

  // Handler for dialogue selection from Explorer
  const handleDialogueSelect = (sceneId: string, dialogueIndex: number, metadata?: { type: string; sceneCharacterId?: string }) => {
    setSelectedSceneForEdit(sceneId);

    // If metadata is provided (e.g., for scene character selection), use it
    if (metadata && metadata.type === 'sceneCharacter' && metadata.sceneCharacterId) {
      setSelectedElement({
        type: 'sceneCharacter',
        sceneId,
        sceneCharacterId: metadata.sceneCharacterId,
      });
    } else {
      setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
    }
  };

  // Handler for tab change in LeftPanel
  // - 'scenes' tab: show UnifiedPanel (Add Elements) by setting selectedElement to scene
  // - 'dialogues' tab: clear scene selection to trigger auto-select in MainCanvas
  const handleTabChange = (tab: 'scenes' | 'dialogues') => {
    logger.debug('[EditorShell] Tab changed to:', tab);
    setLeftPanelActiveTab(tab);

    if (tab === 'scenes') {
      // Always set to scene type to show UnifiedPanel
      // If no scene selected, select first one (if exists)
      const sceneId = selectedSceneForEdit || scenes[0]?.id;
      if (sceneId) {
        setSelectedSceneForEdit(sceneId);
        setSelectedElement({ type: 'scene', id: sceneId });
      }
    } else if (tab === 'dialogues') {
      // Clear to null - auto-select in MainCanvas will pick up first dialogue
      setSelectedElement(null);
    }
  };

  const selectedScene = scenes.find((s) => s.id === selectedSceneForEdit);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        <div className="bg-card border-b border-border animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Main 3-pane layout - Resizable with react-resizable-panels */}
      <main className="flex-1 overflow-hidden" id="main-content" tabIndex={-1}>
        {/* Main content heading - Screen reader only */}
        <h2 className="sr-only">Zone d'édition principale</h2>

        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading editor...</p>
              </div>
            </div>
          }
        >
          <Group
            id="editor-layout-v2"
            className="h-full"
          >
            {/* Left panel: Explorer/Sidebar - Resizable 15-40% (PHASE 6: Hidden in fullscreen) */}
            <Panel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              collapsible={true}
              collapsedSize={fullscreenMode ? 0 : undefined}
              className="bg-card border-r border-border overflow-y-auto"
              id="explorer-panel"
              role="complementary"
              aria-label="Explorateur de scènes et personnages"
            >
              <h3 className="sr-only">Explorateur de scènes</h3>
              <Sidebar>
                <ErrorBoundary name="LeftPanel">
                  <LeftPanel
                    activeTab={leftPanelActiveTab}
                    onTabChange={handleTabChange}
                    onDialogueSelect={handleDialogueSelect}
                    onSceneSelect={handleSceneSelect}
                  />
                </ErrorBoundary>
              </Sidebar>
            </Panel>

            {/* Resize handle (drag border) - Hidden in fullscreen */}
            {!fullscreenMode && (
              <Separator
                id="left-center-separator"
                className="w-1 bg-muted hover:bg-blue-500 active:bg-blue-400 transition-colors cursor-col-resize"
                aria-label="Redimensionner panneaux gauche et centre"
              />
            )}

            {/* Center panel: Main Canvas - Flexible */}
            <Panel
              defaultSize={50}
              minSize={30}
              maxSize={70}
              className="bg-background overflow-auto"
              id="canvas-panel"
              role="main"
              aria-label="Canvas de scène"
            >
              <h3 className="sr-only">Canvas de scène</h3>
              <ErrorBoundary name="MainCanvas">
                <MainCanvas
                  selectedScene={selectedScene}
                  selectedElement={selectedElement}
                  onSelectDialogue={handleDialogueSelect}
                  onOpenModal={(modal, context = {}) => {
                    setActiveModal(modal);
                    setModalContext(context as ModalContext);
                  }}
                  fullscreenMode={fullscreenMode}
                  onFullscreenChange={setFullscreenMode}
                />
              </ErrorBoundary>
            </Panel>

            {/* Resize handle - Hidden in fullscreen */}
            {!fullscreenMode && (
              <Separator
                id="center-right-separator"
                className="w-1 bg-muted hover:bg-blue-500 active:bg-blue-400 transition-colors cursor-col-resize"
                aria-label="Redimensionner panneaux centre et droite"
              />
            )}

            {/* Right panel: Inspector/Properties - Resizable 20-40% (PHASE 6: Hidden in fullscreen) */}
            <Panel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              collapsible={true}
              collapsedSize={fullscreenMode ? 0 : undefined}
              className="bg-card border-l border-border overflow-y-auto"
              id="properties-panel"
              role="complementary"
              aria-label="Propriétés et outils"
            >
              <h3 className="sr-only">Propriétés</h3>
              <Inspector>
                <ErrorBoundary name="PropertiesPanel">
                  {selectedElement?.type === 'scene' ? (
                    <UnifiedPanel
                      onOpenModal={(modal, context) => {
                        setActiveModal(modal);
                        setModalContext(context as ModalContext);
                      }}
                    />
                  ) : (
                    <PropertiesPanel
                      selectedElement={selectedElement}
                      selectedScene={selectedScene}
                      characters={characters}
                      onOpenModal={(modal, context) => {
                        setActiveModal(modal);
                        setModalContext(context as ModalContext);
                      }}
                    />
                  )}
                </ErrorBoundary>
              </Inspector>
            </Panel>
          </Group>
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border flex-shrink-0">
        <div className="px-6 py-2 text-center text-xs text-muted-foreground">
          AccessCity Studio - Accessible scenario editor
        </div>
      </footer>

      {/* Modals - Each wrapped in ErrorBoundary for isolation */}
      <React.Suspense fallback={null}>
        {activeModal === 'project' && (
          <ErrorBoundary name="SettingsModal">
            <SettingsModal isOpen={true} onClose={() => setActiveModal(null)} />
          </ErrorBoundary>
        )}
        {activeModal === 'characters' && (
          <ErrorBoundary name="CharactersModal">
            <CharactersModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              initialCharacterId={modalContext.characterId}
            />
          </ErrorBoundary>
        )}
        {activeModal === 'assets' && (
          <ErrorBoundary name="AssetsLibraryModal">
            <AssetsLibraryModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              initialCategory={modalContext.category}
              targetSceneId={modalContext.targetSceneId}
            />
          </ErrorBoundary>
        )}
        {activeModal === 'preview' && (
          <ErrorBoundary name="PreviewModal">
            <PreviewModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              initialSceneId={modalContext.sceneId || selectedScene?.id}
            />
          </ErrorBoundary>
        )}
      </React.Suspense>
    </div>
  );
}
