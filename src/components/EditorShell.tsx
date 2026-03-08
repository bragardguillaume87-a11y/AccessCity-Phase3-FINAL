import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Map, LayoutDashboard, Play, type LucideIcon } from 'lucide-react';
import { useUIStore, useScenesStore, useCharactersStore, useDialoguesStore } from '../stores/index.ts';
import type { StudioModule } from '../types';
import { useSceneWithElements } from '../stores/selectors/index';
import { isCinematicScene } from '../types/scenes';
import { useSelection, toSelectedElementType } from '../hooks/useSelection.ts';
import { isDialogueSelection, isSceneSelection } from '../stores/selectionStore.types';
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
import { CinematicInlinePlayer } from './panels/CinematicInlinePlayer';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger';
import { isFirstLaunch, loadDefaultProject } from '../utils/loadDefaultProject';
import type { ModalContext } from '../types';
import { SectionContentPanel } from './panels/UnifiedPanel/SectionContentPanel';
import { PANEL_WIDTHS, PANEL_MIN_WIDTHS } from '../config/panelConfig';

// ⚠️ Module-level constants — zundo 2.x / Zustand 5 incompatibility guard.
// Lors du démontage du composant, le middleware temporal peut brièvement retourner
// undefined. Ces constantes stables évitent des crashes et des nouvelles références.
import type { SceneMetadata } from '../types/scenes';
import type { Character } from '../types/characters';
const EMPTY_SCENES: SceneMetadata[] = [];
const EMPTY_CHARACTERS: Character[] = [];

const LeftPanel      = React.lazy(() => import('./panels/LeftPanel'));
const PropertiesPanel = React.lazy(() => import('./panels/PropertiesPanel'));
const UnifiedPanel   = React.lazy(() => import('./panels/UnifiedPanel'));
const CharactersModal     = React.lazy(() => import('./modals/CharactersModal'));
const AssetsLibraryModal  = React.lazy(() => import('./modals/AssetsLibraryModal'));
const SettingsModal       = React.lazy(() => import('./modals/SettingsModal'));
const PreviewModal        = React.lazy(() => import('./modals/PreviewModal'));
const ExportModal         = React.lazy(() => import('./modals/ExportModal'));
const CinematicEditorModal = React.lazy(() =>
  import('./modals/CinematicEditor').then(m => ({ default: m.CinematicEditor }))
);
const TopdownEditor = React.lazy(() => import('./modules/TopdownEditor/TopdownEditor'));
const GamePreview    = React.lazy(() => import('./modules/GamePreview/GamePreview'));

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

// ============================================================================
// MODULE LOADING FALLBACK
// ============================================================================

function ModuleLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto" />
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement du module…</p>
      </div>
    </div>
  );
}

// ============================================================================
// STUDIO MODULE SWITCHER
// ============================================================================

const MODULE_TABS: Array<{ id: StudioModule; label: string; Icon: LucideIcon }> = [
  { id: 'vn-editor',   label: 'Visual Novel', Icon: BookOpen },
  { id: 'topdown',     label: 'Carte 2D',     Icon: Map },
  { id: 'ui-builder',  label: 'Interface',    Icon: LayoutDashboard },
  { id: 'preview',     label: 'Prévisualiser', Icon: Play },
];

function StudioModuleSwitcher({
  activeModule,
  onModuleChange,
}: {
  activeModule: StudioModule;
  onModuleChange: (m: StudioModule) => void;
}) {
  return (
    <nav
      className="flex-shrink-0 flex items-center gap-1 px-3 h-9 bg-card border-b border-border"
      aria-label="Modules du studio"
    >
      {MODULE_TABS.map(({ id, label, Icon }) => {
        const isActive = activeModule === id;
        return (
          <button
            key={id}
            onClick={() => onModuleChange(id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid transparent',
            }}
            aria-pressed={isActive}
            aria-label={label}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================================
// STUDIO MODULE PLACEHOLDER (Sprints 2-5)
// ============================================================================

const MODULE_PLACEHOLDER_LABELS: Record<StudioModule, { emoji: string; title: string; description: string }> = {
  'vn-editor':  { emoji: '📖', title: 'Visual Novel',  description: '' },
  'topdown':    { emoji: '🗺️',  title: 'Éditeur de carte 2D', description: 'Placez des tuiles, définissez les zones de collision et les triggers de dialogue.' },
  'ui-builder': { emoji: '🎨', title: 'Constructeur d\'interface', description: 'Construisez les HUD, menus et écrans du jeu par glisser-déposer.' },
  'preview':    { emoji: '🎮', title: 'Prévisualisation', description: 'Jouez votre jeu topdown avec les dialogues intégrés.' },
};

function StudioModulePlaceholder({ module }: { module: StudioModule }) {
  const info = MODULE_PLACEHOLDER_LABELS[module];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background select-none">
      <span style={{ fontSize: 48 }} aria-hidden="true">{info.emoji}</span>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-base)' }}>
        {info.title}
      </h2>
      <p className="text-sm max-w-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
        {info.description}
      </p>
      <p className="text-xs px-3 py-1 rounded-full border border-border" style={{ color: 'var(--color-text-muted)' }}>
        En développement — Sprint {module === 'topdown' ? 2 : module === 'preview' ? 3 : 5}
      </p>
    </div>
  );
}

// ============================================================================
// EDITOR SHELL
// ============================================================================

export default function EditorShell({ onBack = null }: EditorShellProps) {
  // === DATA LAYER ===
  // Guard défensif : state?.scenes — zundo 2.x peut retourner undefined pendant le démontage.
  const scenes = useScenesStore((state) => state?.scenes ?? EMPTY_SCENES);
  const characters = useCharactersStore((state) => state?.characters ?? EMPTY_CHARACTERS);
  const selectedSceneForEdit = useUIStore((state) => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore((state) => state.setSelectedSceneForEdit);
  const lastSaved = useUIStore((state) => state.lastSaved);
  const isSaving = useUIStore((state) => state.isSaving);

  const { selectedElement } = useSelection();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  // === SYNC ÉDITEUR → APERÇU ===
  // Résout l'élément sélectionné vers un ID de dialogue pour PreviewPlayer.
  // Réactif : se recalcule si selectedElement ou les dialogues changent.
  // isDialogueSelection / isSceneSelection = type guards discriminés (selectionStore.types).
  const dialoguesByScene = useDialoguesStore(s => s.dialoguesByScene);
  const previewDialogueId = useMemo(() => {
    if (!isDialogueSelection(selectedElement)) return null;
    return dialoguesByScene[selectedElement.sceneId]?.[selectedElement.index]?.id ?? null;
  }, [selectedElement, dialoguesByScene]);
  // previewSceneId est déclaré après selectedScene (dépendance) — voir ligne suivant selectedScene

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
  const cinematicEditorOpen = useUIStore(s => s.cinematicEditorOpen);
  const activeSection = useUIStore(s => s.activeSection);
  const setActiveSection = useUIStore(s => s.setActiveSection);
  const activeModule = useUIStore(s => s.activeModule);
  const setActiveModule = useUIStore(s => s.setActiveModule);

  // === PREMIER LANCEMENT — chargement du projet par défaut bundlé ===
  // Si /public/default-project.json est présent et que c'est la première ouverture
  // (STORAGE_KEYS.ONBOARDING_COMPLETED absent), importe silencieusement le projet.
  useEffect(() => {
    if (!isFirstLaunch()) return;
    loadDefaultProject().then(loaded => {
      if (loaded) logger.info('[EditorShell] Projet par défaut chargé au premier lancement.');
    });
  }, []);

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
    // Panel 3 visible uniquement si un élément canvas est sélectionné (PropertiesPanel).
    // Les dialogues sont édités inline dans le panel gauche — pas de panel 3 pour eux.
    const hasElement = selectedElement && selectedElement.type !== null
      && selectedElement.type !== 'scene'
      && selectedElement.type !== 'dialogue';
    if (hasElement) return PANEL_WIDTHS.CONTENT_PROPERTIES;
    return 0;
  }, [fullscreenMode, activeSection, selectedElement]);

  // === RESET LAYOUT ===
  const handleResetLayout = useCallback(() => {
    // ⚠️ resize() doit recevoir un NUMBER (pixels auto-convertis en %).
    // resize("300px") = parseFloat("300px") = 300 → 300% du container (énorme!) — BUG CONFIRMÉ.
    // resize(300) = 300 / groupWidth * 100 → pourcentage correct en pixels.
    leftPanelRef.current?.resize(PANEL_WIDTHS.LEFT_DEFAULT);
    setActiveSection(null);
  }, [setActiveSection, leftPanelRef]);

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
    // Supprime les anciennes clés de layout (migrations précédentes) pour éviter les conflits.
    const oldKeys = [
      'react-resizable-panels:layout',
      'react-resizable-panels:editor-main-group'
    ];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        logger.debug('[EditorShell] Ancienne clé layout supprimée :', key);
      }
    });
  }, []);

  // === PRESENTATION-LAYER HANDLERS ===
  const handleNavigateTo = (_tab: string, params?: { sceneId?: string }) => {
    editorLogic.handleNavigateTo(_tab, params);
    setShowProblemsPanel(false);
  };

  const handleTabChange = (tab: 'scenes' | 'dialogues') => {
    setLeftPanelActiveTab(tab);
    editorLogic.handleTabChange(tab);
    // Redimensionnement automatique selon l'onglet — animé via transition CSS sur flex-basis.
    // Scènes = compact (240px), Dialogues = largeur confortable (300px).
    const targetWidth = tab === 'dialogues' ? PANEL_WIDTHS.LEFT_DIALOGUES : PANEL_WIDTHS.LEFT_DEFAULT;
    leftPanelRef.current?.resize(targetWidth);
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

  // Scène de départ pour le preview : dialogue sélectionné > scène sélectionnée > scène courante
  const previewSceneId = useMemo(() => {
    if (isDialogueSelection(selectedElement)) return selectedElement.sceneId;
    if (isSceneSelection(selectedElement)) return selectedElement.id;
    return modalContext.sceneId || selectedScene?.id;
  }, [selectedElement, modalContext.sceneId, selectedScene]);
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

      {/* ── Studio Module Switcher ── */}
      <StudioModuleSwitcher activeModule={activeModule} onModuleChange={setActiveModule} />

      {showProblemsPanel && activeModule === 'vn-editor' && (
        <div className="bg-card border-b border-border animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* ── Non-VN modules ── */}
      {activeModule === 'topdown' && (
        <React.Suspense fallback={<ModuleLoadingFallback />}>
          <TopdownEditor />
        </React.Suspense>
      )}
      {activeModule === 'preview' && (
        <React.Suspense fallback={<ModuleLoadingFallback />}>
          <GamePreview />
        </React.Suspense>
      )}
      {activeModule === 'ui-builder' && (
        <StudioModulePlaceholder module={activeModule} />
      )}

      {/* Layout 4-panneaux style Powtoon
          Structure :  [Group: Panel1 + Panel2]  [Panel3 CSS]  [Panel4 CSS]
          Panel 3 et 4 sont des divs CSS — width contrôlée par useMemo.
          Cela évite les limitations de react-resizable-panels (resize() ignoré
          sur un panel collapsed), et donne des transitions CSS fluides. */}
      <main className="flex-1 overflow-hidden relative flex" id="main-content" tabIndex={-1} style={{ display: activeModule === 'vn-editor' ? undefined : 'none' }}>
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

            {/* Panel 1 : Explorateur gauche (filmstrip scènes)
                 ⚠️ minSize/maxSize en NOMBRES = pixels (voir lt() dans react-resizable-panels v4)
                 minSize=260px garantit que la corbeille ne déborde pas (calcul : 260-24-17-24-16 = 179px ≥ 164px needed) */}
            <Panel
              panelRef={leftPanelRef}
              defaultSize={PANEL_WIDTHS.LEFT_DEFAULT}
              minSize={PANEL_MIN_WIDTHS.LEFT}
              collapsible={true}
              collapsedSize={0}
              className="bg-card border-r border-border overflow-hidden"
              style={{ transition: 'flex-basis 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
              id="explorer-panel"
              role="complementary"
              aria-label="Explorateur de scènes et personnages"
            >
              <h3 className="sr-only">Explorateur de scènes</h3>
              <Sidebar className="h-full">
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
              {/* GUARD : scènes cinématiques → placeholder dédié, MainCanvas ne monte pas.
                  Évite que les hooks de MainCanvas (useDialogueSync, useCanvasKeyboard, etc.)
                  s'exécutent pour un type de scène qu'ils ne gèrent pas. */}
              {isCinematicScene(selectedScene) ? (
                <CinematicInlinePlayer
                  scene={selectedScene!}
                  characters={characters}
                />
              ) : (
                <ErrorBoundary name="MainCanvas">
                  <MainCanvas
                    selectedScene={selectedScene}
                    selectedElement={selectedElementLegacy}
                    onSelectDialogue={editorLogic.handleDialogueSelect}
                  />
                </ErrorBoundary>
              )}
            </Panel>

          </Group>

          {/* ── Panel 3 : Section/Propriétés (SlidePanel Framer Motion) ──
              panel3Width = 0 → fermé, AnimatePresence joue exit width→0
              panel3Width = 380 → section active (SectionContentPanel)
              panel3Width = 320 → élément canvas sélectionné (PropertiesPanel)
              Montage/démontage animé : width 0→N (open) et N→0 (close). */}
          <AnimatePresence initial={false}>
            {panel3Width > 0 && (
              <motion.div
                key="panel3"
                initial={{ width: 0 }}
                animate={{ width: panel3Width }}
                exit={{ width: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex-shrink-0 bg-card border-l border-border overflow-hidden"
                id="section-content-panel"
                role="complementary"
                aria-label="Contenu de la section ou propriétés de l'élément"
              >
                <div className="h-full overflow-hidden" style={{ width: panel3Width }}>
                  <ErrorBoundary name="ContentPanel">
                    {panel3Content}
                  </ErrorBoundary>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              initialSceneId={previewSceneId}
              initialDialogueId={previewDialogueId}
            />
          </ErrorBoundary>
        )}
        {activeModal === 'export' && (
          <ErrorBoundary name="ExportModal">
            <ExportModal onClose={() => setActiveModal(null)} />
          </ErrorBoundary>
        )}
        {cinematicEditorOpen && (
          <ErrorBoundary name="CinematicEditor">
            <CinematicEditorModal />
          </ErrorBoundary>
        )}
      </React.Suspense>
    </div>
  );
}
