import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUIStore, useScenesStore, useCharactersStore } from '../stores/index.ts';
import { useSceneWithElements } from '../stores/selectors/index';
import { useSelection, toSelectedElementType } from '../hooks/useSelection.ts';
import { useEditorLogic } from '../hooks/useEditorLogic.ts';
import { useUndoRedo } from '../hooks/useUndoRedo.ts';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.ts';
import { Panel, Group, Separator, usePanelRef } from 'react-resizable-panels';
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
import type { ModalContext, FullscreenMode } from '../types';
import type { SectionId } from './panels/UnifiedPanel/SectionContentPanel';
import { SectionContentPanel } from './panels/UnifiedPanel/SectionContentPanel';

const LeftPanel      = React.lazy(() => import('./panels/LeftPanel'));
const PropertiesPanel = React.lazy(() => import('./panels/PropertiesPanel'));
const UnifiedPanel   = React.lazy(() => import('./panels/UnifiedPanel'));
const CharactersModal     = React.lazy(() => import('./modals/CharactersModal'));
const AssetsLibraryModal  = React.lazy(() => import('./modals/AssetsLibraryModal'));
const SettingsModal       = React.lazy(() => import('./modals/SettingsModal'));
const PreviewModal        = React.lazy(() => import('./modals/PreviewModal'));

/**
 * EditorShell — Layout 4-panneaux inspiré de Powtoon :
 *
 *   [Gauche 135px] | [Canvas flex] | [Contenu 240px FIXE] | [Icônes 72px FIXE]
 *
 * Principes Powtoon :
 * - Panel 3 (Contenu) : TOUJOURS visible à 240px, jamais collapsé par défaut.
 *   Son contenu change selon le contexte (section active > propriétés > état vide).
 * - Panel 4 (Icônes) : TOUJOURS visible, jamais interruptible par l'utilisateur.
 * - Canvas : prend l'espace restant, aspect-video 16:9 centré avec marges.
 *
 * Flux de contenu Panel 3 :
 *   activeSection ≠ null → SectionContentPanel (Fond, Texte, Persos…)
 *   élément sélectionné  → PropertiesPanel (propriétés dialogue/personnage)
 *   sinon                → état vide (instruction "cliquez sur un outil")
 */
interface EditorShellProps {
  onBack?: (() => void) | null;
}

export default function EditorShell({ onBack = null }: EditorShellProps) {
  // === DATA LAYER ===
  const scenes = useScenesStore((state) => state.scenes);
  const characters = useCharactersStore((state) => state.characters);
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const lastSaved = useUIStore((state) => state.lastSaved);
  const isSaving = useUIStore((state) => state.isSaving);

  const { selectedElement } = useSelection();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  // === BUSINESS LOGIC LAYER ===
  const editorLogic = useEditorLogic({
    scenes,
    selectedSceneForEdit,
    setSelectedSceneForEdit,
  });

  // === UI STATE ===
  const validation = useValidation();
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [leftPanelActiveTab, setLeftPanelActiveTab] = useState<'scenes' | 'dialogues'>('scenes');
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenMode>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState<ModalContext>({});

  // Section active (icônes UnifiedPanel → contenu Panel 3)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  // Panel refs
  const leftPanelRef    = usePanelRef();
  const contentPanelRef = usePanelRef(); // Panel 3 : section ou propriétés (240px fixe)
  const rightPanelRef   = usePanelRef(); // Panel 4 : barre d'icônes (72px fixe)

  // Graph modal state
  const setGraphModalOpen     = useUIStore((state) => state.setDialogueGraphModalOpen);
  const setGraphSelectedScene = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // === RESET LAYOUT ===
  const handleResetLayout = useCallback(() => {
    leftPanelRef.current?.resize("135px");
    contentPanelRef.current?.resize("240px");
    // Panel 4 peut se collapsser lors du resize — on force expand pour le maintenir visible
    rightPanelRef.current?.resize("72px");
    rightPanelRef.current?.expand();
    setActiveSection(null);
  }, []);

  // === GESTION SECTION (UnifiedPanel → Panel 3) ===
  // Panel 3 est TOUJOURS visible à 240px — handleSectionChange ne redimensionne plus.
  // Il met simplement à jour activeSection pour changer le contenu affiché.
  const handleSectionChange = useCallback((section: SectionId | null) => {
    setActiveSection(section);
  }, []);

  // === KEYBOARD SHORTCUTS ===
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPreview: () => setActiveModal('preview'),
    onCommandPalette: () => setCommandPaletteOpen(true),
  });

  // === FULLSCREEN — collapse/expand panneaux latéraux ===
  // En plein écran, on collapse tout pour maximiser le canvas.
  // À la sortie, on restore Panel 3 à 240px.
  useEffect(() => {
    if (fullscreenMode) {
      leftPanelRef.current?.collapse();
      contentPanelRef.current?.collapse();
      rightPanelRef.current?.collapse();
    } else {
      leftPanelRef.current?.expand();
      rightPanelRef.current?.expand();
      contentPanelRef.current?.expand();
    }
  }, [fullscreenMode]);

  // === ONE-TIME SETUP ===
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

  // === PRESENTATION-LAYER HANDLERS ===
  const handleNavigateTo = (_tab: string, params?: { sceneId?: string }) => {
    editorLogic.handleNavigateTo(_tab, params);
    setShowProblemsPanel(false);
  };

  const handleTabChange = (tab: 'scenes' | 'dialogues') => {
    setLeftPanelActiveTab(tab);
    editorLogic.handleTabChange(tab);
    if (!fullscreenMode) {
      leftPanelRef.current?.resize(tab === 'dialogues' ? "280px" : "135px");
    }
  };

  const handleOpenModal = useCallback((modal: string, context: unknown = {}) => {
    logger.debug('[EditorShell] handleOpenModal called:', { modal, context });
    if (modal === 'graph') {
      if (selectedSceneForEdit) {
        setGraphSelectedScene(selectedSceneForEdit);
        setGraphModalOpen(true);
      }
      return;
    }
    setActiveModal(modal);
    setModalContext(context as ModalContext);
  }, [selectedSceneForEdit, setGraphModalOpen, setGraphSelectedScene]);

  // Compose full Scene from all 3 stores
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const selectedElementLegacy = useMemo(
    () => toSelectedElementType(selectedElement),
    [selectedElement]
  );

  // Détermine si c'est une scène (pas d'élément canvas) — pour Panel 3
  const isSceneSelected = !selectedElement || selectedElement.type === null || selectedElement.type === 'scene';

  // Contenu Panel 3 :
  //   activeSection → SectionContentPanel (Fond, Texte, Persos…)
  //   élément canvas → PropertiesPanel
  //   sinon → état vide (instruction)
  const panel3Content = activeSection !== null ? (
    <SectionContentPanel
      activeSection={activeSection}
      onClose={() => handleSectionChange(null)}
      onOpenModal={handleOpenModal}
    />
  ) : !isSceneSelected ? (
    <PropertiesPanel
      selectedElement={selectedElementLegacy}
      selectedScene={selectedScene}
      characters={characters}
      onOpenModal={handleOpenModal}
    />
  ) : (
    // État vide : aucune section active, aucun élément sélectionné
    <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center select-none">
      <div className="text-[var(--color-text-muted)] opacity-40">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
        Cliquez sur un outil<br/>dans la barre de droite →
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <h1 className="sr-only">AccessCity Studio - Éditeur de Visual Novels</h1>

      <AnnouncementRegion />
      <AssertiveAnnouncementRegion />

      <KeyboardShortcuts
        activeTab="editor"
        setActiveTab={() => {}}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      <CommandPalette
        isOpen={!!commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        mode={typeof commandPaletteOpen === 'string' ? commandPaletteOpen : 'commands'}
        setActiveTab={() => {}}
      />

      <TopBar
        onBack={onBack}
        onOpenModal={(modal) => handleOpenModal(modal, {})}
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

      {showProblemsPanel && (
        <div className="bg-card border-b border-border animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Layout 4-panneaux style Powtoon */}
      <main className="flex-1 overflow-hidden relative" id="main-content" tabIndex={-1}>
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
          <Group id="editor-layout-v4" className="h-full">

            {/* ── Panel 1 : Explorateur gauche (filmstrip scènes) ── */}
            <Panel
              panelRef={leftPanelRef}
              defaultSize={135}
              minSize={56}
              maxSize={200}
              collapsible={true}
              collapsedSize={0}
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
                    onDialogueSelect={editorLogic.handleDialogueSelect}
                    onSceneSelect={editorLogic.handleSceneSelect}
                  />
                </ErrorBoundary>
              </Sidebar>
            </Panel>

            {!fullscreenMode && (
              <Separator
                id="left-center-separator"
                className="w-1 bg-muted hover:bg-blue-500 active:bg-blue-400 transition-colors cursor-col-resize"
                aria-label="Redimensionner panneaux gauche et centre"
              />
            )}

            {/* ── Panel 2 : Canvas principal ── */}
            <Panel
              minSize="400px"
              className="bg-background overflow-hidden"
              id="canvas-panel"
              role="main"
              aria-label="Canvas de scène"
            >
              <h3 className="sr-only">Canvas de scène</h3>
              <ErrorBoundary name="MainCanvas">
                <MainCanvas
                  selectedScene={selectedScene}
                  selectedElement={selectedElementLegacy}
                  onSelectDialogue={editorLogic.handleDialogueSelect}
                  onOpenModal={handleOpenModal}
                  fullscreenMode={fullscreenMode}
                  onFullscreenChange={setFullscreenMode}
                />
              </ErrorBoundary>
            </Panel>

            {!fullscreenMode && (
              <Separator
                id="center-content-separator"
                className="w-1 bg-muted hover:bg-blue-500 active:bg-blue-400 transition-colors cursor-col-resize"
                aria-label="Redimensionner panneaux canvas et contenu"
              />
            )}

            {/* ── Panel 3 : Contenu (Library style Powtoon) ──
                TOUJOURS visible à 240px par défaut.
                Contenu : SectionContentPanel | PropertiesPanel | état vide.
                Aucun resize automatique — Panel 3 est stable, son CONTENU change.
                Pas de Separator à droite → Panel 4 inatteignable par drag. */}
            <Panel
              panelRef={contentPanelRef}
              defaultSize={240}
              minSize={180}
              maxSize={400}
              collapsible={true}
              collapsedSize={0}
              className="bg-card overflow-hidden border-l border-border"
              id="section-content-panel"
              role="complementary"
              aria-label="Contenu de la section ou propriétés de l'élément"
            >
              <ErrorBoundary name="ContentPanel">
                {panel3Content}
              </ErrorBoundary>
            </Panel>

            {/* ── Panel 4 : Barre d'icônes (UnifiedPanel) ──
                TOUJOURS visible, jamais remplacé.
                72px fixe, pas de Separator à gauche → inatteignable par drag utilisateur. */}
            <Panel
              panelRef={rightPanelRef}
              defaultSize={72}
              minSize={72}
              maxSize={72}
              collapsible={true}
              collapsedSize={0}
              className="bg-card border-l border-border overflow-hidden"
              id="icon-bar-panel"
              role="complementary"
              aria-label="Outils d'ajout d'éléments"
            >
              <h3 className="sr-only">Outils</h3>
              <Inspector>
                <ErrorBoundary name="UnifiedPanel">
                  <UnifiedPanel
                    activeSection={activeSection}
                    onSectionChange={handleSectionChange}
                    onResetLayout={handleResetLayout}
                  />
                </ErrorBoundary>
              </Inspector>
            </Panel>

          </Group>
        </React.Suspense>
      </main>

      <footer className="bg-card border-t border-border flex-shrink-0">
        <div className="px-6 py-2 text-center text-xs text-muted-foreground">
          AccessCity Studio - Accessible scenario editor
        </div>
      </footer>

      {/* Modales */}
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
