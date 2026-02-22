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
import type { ModalContext } from '../types';
import { SectionContentPanel } from './panels/UnifiedPanel/SectionContentPanel';
import { PANEL_WIDTHS, PANEL_MIN_WIDTHS } from '../config/panelConfig';

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
 *   [Gauche LEFT_DEFAULT] | [Canvas flex] | [Contenu CONTENT_SECTION/PROPERTIES] | [Icônes ICON_BAR]
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
 *
 * État UI (fullscreenMode, activeSection, activeModal, etc.) centralisé dans uiStore.
 * EditorShell garde uniquement la gestion impérative du leftPanelRef.
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

  // === UI STATE (depuis uiStore — plus de local state) ===
  const validation = useValidation();
  const showProblemsPanel = useUIStore(s => s.showProblemsPanel);
  const setShowProblemsPanel = useUIStore(s => s.setShowProblemsPanel);
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore(s => s.setCommandPaletteOpen);
  const fullscreenMode = useUIStore(s => s.fullscreenMode);
  const activeModal = useUIStore(s => s.activeModal);
  const setActiveModal = useUIStore(s => s.setActiveModal);
  const modalContext = useUIStore(s => s.modalContext);
  const setModalContext = useUIStore(s => s.setModalContext);
  const activeSection = useUIStore(s => s.activeSection);
  const setActiveSection = useUIStore(s => s.setActiveSection);

  // État local résiduel (pas de gain à globaliser)
  const [leftPanelActiveTab, setLeftPanelActiveTab] = useState<'scenes' | 'dialogues'>('scenes');

  // Panel refs (Panel 1 uniquement — Panel 3 et 4 sont des divs CSS)
  const leftPanelRef = usePanelRef();

  // Graph modal state
  const setGraphModalOpen     = useUIStore((state) => state.setDialogueGraphModalOpen);
  const setGraphSelectedScene = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // === PANEL 3 WIDTH — dérivé via useMemo (remplace useState + handleSectionChange + useEffect) ===
  //
  // panel3Width = 0             → fermé (aucune section active, aucun élément canvas)
  // panel3Width = CONTENT_SECTION   → section active (SectionContentPanel)
  // panel3Width = CONTENT_PROPERTIES → élément canvas sélectionné (PropertiesPanel)
  //
  // Ce useMemo réagit à fullscreenMode, activeSection et selectedElement.
  // Il remplace : handleSectionChange + selectedElementRef + useEffect sync + setPanel3Width.
  const panel3Width = useMemo(() => {
    if (fullscreenMode) return 0;
    if (activeSection !== null) return PANEL_WIDTHS.CONTENT_SECTION;
    // Panel 3 toujours visible (≥ 240px) conformément au design Powtoon.
    // Quand aucun élément n'est sélectionné, le contenu affiche l'état vide
    // (instruction « cliquez sur un outil »), ce qui évite que le panneau
    // disparaisse après fermeture d'une section.
    return PANEL_WIDTHS.CONTENT_PROPERTIES;
  }, [fullscreenMode, activeSection]);

  // === RESET LAYOUT ===
  const handleResetLayout = useCallback(() => {
    leftPanelRef.current?.resize(`${PANEL_WIDTHS.LEFT_DEFAULT}px`);
    setActiveSection(null);
  }, [setActiveSection]);

  // === KEYBOARD SHORTCUTS ===
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPreview: () => setActiveModal('preview'),
    onCommandPalette: () => setCommandPaletteOpen(true),
  });

  // === FULLSCREEN — collapse/expand panneaux latéraux ===
  // En plein écran : Panel 1 collapse, Panel 3 se ferme via useMemo (max canvas).
  // Panel 4 (icônes) : toujours visible (div CSS, pas de collapse).
  // À la sortie : Panel 1 expand ; Panel 3 restauré automatiquement par useMemo.
  useEffect(() => {
    if (fullscreenMode) {
      leftPanelRef.current?.collapse();
    } else {
      leftPanelRef.current?.expand();
    }
  }, [fullscreenMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      leftPanelRef.current?.resize(tab === 'dialogues' ? `${PANEL_WIDTHS.CONTENT_PROPERTIES}px` : `${PANEL_WIDTHS.LEFT_DEFAULT}px`);
    }
  };

  // handleOpenModal reste nécessaire pour PropertiesPanel (prop) et le cas graph (spécial)
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
  }, [selectedSceneForEdit, setGraphModalOpen, setGraphSelectedScene, setActiveModal, setModalContext]);

  // Compose full Scene from all 3 stores
  const selectedScene = useSceneWithElements(selectedSceneForEdit);
  const selectedElementLegacy = useMemo(
    () => toSelectedElementType(selectedElement),
    [selectedElement]
  );

  // Détermine si c'est une scène (pas d'élément canvas) — pour Panel 3
  const isSceneSelected = !selectedElement || selectedElement.type === null || selectedElement.type === 'scene';

  // Contenu Panel 3 :
  //   activeSection → SectionContentPanel (lit depuis uiStore — aucune prop)
  //   élément canvas → PropertiesPanel
  //   sinon → état vide (instruction)
  const panel3Content = activeSection !== null ? (
    <SectionContentPanel />
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
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <h1 className="sr-only">AccessCity Studio - Éditeur de Visual Novels</h1>

      <AnnouncementRegion />
      <AssertiveAnnouncementRegion />

      {/* KeyboardShortcuts lit commandPaletteOpen + activeModal depuis uiStore directement */}
      <KeyboardShortcuts
        activeTab="editor"
        setActiveTab={() => {}}
      />

      <CommandPalette
        isOpen={!!commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        mode={typeof commandPaletteOpen === 'string' ? (commandPaletteOpen as 'commands' | 'quick-open') : 'commands'}
        setActiveTab={() => {}}
      />

      {/* TopBar lit showProblemsPanel + setShowProblemsPanel depuis uiStore directement */}
      <TopBar
        onBack={onBack}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        validation={validation}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      {showProblemsPanel && (
        <div className="bg-card border-b border-border animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Layout 4-panneaux style Powtoon
          Structure :  [Group: Panel1 + Panel2]  [Panel3 CSS]  [Panel4 CSS]
          Panel 3 et 4 sont des divs CSS — width contrôlée par useMemo.
          Cela évite les limitations de react-resizable-panels (resize() ignoré
          sur un panel collapsed), et donne des transitions CSS fluides. */}
      <main className="flex-1 overflow-hidden relative flex" id="main-content" tabIndex={-1}>
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
          {/* ── Group : Panel 1 (explorer) + Panel 2 (canvas) ──
              flex-1 min-w-0 : prend tout l'espace restant après Panel 3 et Panel 4. */}
          <Group id="editor-layout-v4" className="flex-1 min-w-0 h-full">

            {/* Panel 1 : Explorateur gauche (filmstrip scènes) */}
            <Panel
              panelRef={leftPanelRef}
              defaultSize={PANEL_WIDTHS.LEFT_DEFAULT}
              minSize={PANEL_MIN_WIDTHS.LEFT}
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

            {/* Panel 2 : Canvas principal — lit fullscreenMode depuis uiStore directement */}
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
                />
              </ErrorBoundary>
            </Panel>

          </Group>

          {/* ── Panel 3 : Section/Propriétés (div CSS, width contrôlée par useMemo) ──
              panel3Width = 0 → fermé (overflow-hidden masque tout)
              panel3Width = 256 → section active (SectionContentPanel)
              panel3Width = 280 → élément canvas sélectionné (PropertiesPanel)
              transition-[width] : animation fluide à l'ouverture/fermeture. */}
          {!fullscreenMode && (
            <div
              className="flex-shrink-0 bg-card border-l border-border overflow-hidden transition-[width] duration-150"
              style={{ width: `${panel3Width}px` }}
              id="section-content-panel"
              role="complementary"
              aria-label="Contenu de la section ou propriétés de l'élément"
              aria-hidden={panel3Width === 0}
            >
              <div className="h-full w-full overflow-hidden">
                <ErrorBoundary name="ContentPanel">
                  {panel3Content}
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* ── Panel 4 : Barre d'icônes (div CSS fixe ICON_BAR px) ──
              UnifiedPanel lit activeSection depuis uiStore directement.
              Toujours visible — indépendant de tout état applicatif. */}
          {!fullscreenMode && (
            <div
              className="flex-shrink-0 bg-card border-l border-border overflow-hidden"
              style={{ width: `${PANEL_WIDTHS.ICON_BAR}px` }}
              id="icon-bar-panel"
              role="complementary"
              aria-label="Outils d'ajout d'éléments"
            >
              <h3 className="sr-only">Outils</h3>
              <Inspector>
                <ErrorBoundary name="UnifiedPanel">
                  <UnifiedPanel
                    onResetLayout={handleResetLayout}
                  />
                </ErrorBoundary>
              </Inspector>
            </div>
          )}

        </React.Suspense>
      </main>

      <footer className="bg-card border-t border-border flex-shrink-0">
        <div className="px-6 py-2 text-center text-xs text-muted-foreground">
          AccessCity Studio - Accessible scenario editor
        </div>
      </footer>

      {/* Modales — activeModal et modalContext lus depuis uiStore */}
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
              selectionPurpose={modalContext.purpose}
              selectionSlot={modalContext.slot}
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
