import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { useUIStore } from '@/stores';
import { useSceneWithElements } from '@/stores/selectors';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import DialogueGraph from '../features/DialogueGraph';
import { DialogueGraphToolbar } from './components/DialogueGraphToolbar';
import { DialogueGraphPalette } from './components/DialogueGraphPalette';
import { DialoguePropertiesPanel } from './components/DialoguePropertiesPanel';
import { ThemeSelector } from './components/ThemeSelector';
import { useDialogueGraphActions } from '@/hooks/useDialogueGraphActions';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useIsCosmosTheme, useGraphTheme } from '@/hooks/useGraphTheme';
import { dialogueNodeId, extractDialogueIndex } from '@/config/handleConfig';
import { GraphPagination } from './components/GraphPagination';
import { GraphIntegrityPanel } from './components/GraphIntegrityPanel';
import { useGraphIntegrityCheck } from '@/hooks/useGraphIntegrityCheck';

// PHASE 4 (Option 4): Lazy load CosmosBackground for bundle optimization
// Only loaded when Cosmos theme is active (~117KB with canvas-confetti)
const CosmosBackground = React.lazy(() =>
  import('../features/CosmosBackground').then(module => ({ default: module.CosmosBackground }))
);
// PHASE 5: Accessibility imports
import { useGraphKeyboardNav, GraphLiveRegion } from '@/hooks/useGraphKeyboardNav';
import { AccessibilityToolbar, useAccessibilityShortcuts, type AccessibilityMode } from './components/AccessibilityToolbar';
import { GraphListView } from './components/GraphListView';
import './styles/a11y.css';

/**
 * DialogueGraphModal - Full-screen modal for interactive dialogue graph editing
 *
 * PHASE 1: ✅ Basic modal with existing DialogueGraph component
 * PHASE 2: ✅ Interactive editing (Hybrid approach: Toolbar + Palette + Double-click wizard + Drag handles)
 * PHASE 3: ✅ Panneau de propriétés latéral (édition rapide speaker + text)
 * PHASE 4: ✅ Design amélioré avec système de thèmes (Cosmos pour enfants)
 * PHASE 5: ✅ Accessibilité complète (keyboard nav, screen reader, alternate modes)
 */
export function DialogueGraphModal() {
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    sceneId?: string;
    index?: number;
  } | null>(null);

  // Persist properties panel position across node selections (drag behavior)
  const [propertiesPanelPos, setPropertiesPanelPos] = useState<{ x: number; y: number } | undefined>(undefined);

  // State for auto-layout: increment to force graph recalculation
  const [layoutVersion, setLayoutVersion] = useState(0);

  // Integrity panel visibility
  const [integrityPanelOpen, setIntegrityPanelOpen] = useState(false);

  // PHASE 3.5: State for layout direction (TB = vertical, LR = horizontal)
  // PHASE 3.6: Default to LR (horizontal) for better readability
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('LR');

  // PHASE 4: Theme system
  const isCosmosTheme = useIsCosmosTheme();
  const theme = useGraphTheme();

  // PHASE 5: Accessibility state
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>('visual');

  // UI Store
  const isOpen = useUIStore((state) => state.dialogueGraphModalOpen);
  const setIsOpen = useUIStore((state) => state.setDialogueGraphModalOpen);
  const selectedSceneId = useUIStore((state) => state.dialogueGraphSelectedScene);
  const setSelectedSceneId = useUIStore((state) => state.setDialogueGraphSelectedScene);

  // Pro mode: override layoutDirection when enabled
  const proModeEnabled = useUIStore((state) => state.proModeEnabled);
  const proModeDirection = useUIStore((state) => state.proModeDirection);
  const proPaginationEnabled = useUIStore((state) => state.proPaginationEnabled);
  const setProCurrentPage = useUIStore((state) => state.setProCurrentPage);

  // Animation slide+fade lors du changement de page
  const [graphAnimStyle, setGraphAnimStyle] = useState<React.CSSProperties>({
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'opacity 0.22s ease, transform 0.25s ease',
  });
  const isAnimating = useRef(false);

  // Scene with full data from all 3 stores (see CLAUDE.md §6.6)
  const selectedScene = useSceneWithElements(selectedSceneId ?? undefined);

  // PHASE 2: Actions for interactive editing
  const actions = useDialogueGraphActions(selectedScene?.id || '');

  // Effective layout direction: Pro mode overrides the local toggle
  const effectiveLayoutDirection = proModeEnabled ? proModeDirection : layoutDirection;

  // Define handleClose early (needed by keyboard nav hook)
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedSceneId(null);
    setSelectedElement(null);
  }, [setIsOpen, setSelectedSceneId]);

  // Reset page 0 à chaque changement de scène ou ouverture de la modale
  useEffect(() => {
    setProCurrentPage(0);
  }, [selectedSceneId, setProCurrentPage]);

  // Animation slide+fade lors du changement de page (public jeune)
  const handlePageChange = useCallback((newPage: number, direction: 'forward' | 'backward') => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setSelectedElement(null); // Désélectionner le nœud courant

    const exitX = direction === 'forward' ? '-50px' : '50px';
    const enterX = direction === 'forward' ? '50px' : '-50px';

    // Phase 1 : sortie (slide + fondu)
    setGraphAnimStyle({ opacity: 0, transform: `translateX(${exitX})`, transition: 'opacity 0.18s ease, transform 0.18s ease' });

    setTimeout(() => {
      // Phase 2 : changer la page + position initiale d'entrée (sans transition)
      setProCurrentPage(newPage);
      setGraphAnimStyle({ opacity: 0, transform: `translateX(${enterX})`, transition: 'none' });

      // Phase 3 : animer l'entrée au prochain frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGraphAnimStyle({ opacity: 1, transform: 'translateX(0)', transition: 'opacity 0.25s ease, transform 0.28s ease' });
          setTimeout(() => { isAnimating.current = false; }, 300);
        });
      });
    }, 200);
  }, [setProCurrentPage]);

  // PHASE 5: Accessibility hooks
  // Get nodes from scene for keyboard navigation (simplified type for navigation only)
  // ✅ useMemo + EMPTY_GRAPH_NODES — évite une nouvelle référence à chaque render
  //    (|| [] inline crée un tableau différent à chaque fois → instabilité deps useGraphKeyboardNav)
  const EMPTY_GRAPH_NODES = useMemo(() => [], []);
  const graphNodes = useMemo(
    () => selectedScene?.dialogues.map((_d, i) => ({
      id: dialogueNodeId(selectedScene.id, i),
      position: { x: i * 400, y: 0 }, // Approximate positions for navigation
      data: {} as Record<string, unknown> // Type-safe for Node interface
    })) ?? EMPTY_GRAPH_NODES,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedScene?.id, selectedScene?.dialogues.length, EMPTY_GRAPH_NODES]
  );

  // Keyboard navigation handlers
  const handleKeyboardSelectNode = useCallback((nodeId: string | null) => {
    if (!nodeId || !selectedScene) {
      setSelectedElement(null);
      return;
    }
    const index = extractDialogueIndex(nodeId);
    if (!isNaN(index)) {
      setSelectedElement({ type: 'dialogue', sceneId: selectedScene.id, index });
    }
  }, [selectedScene]);

  const handleKeyboardEditNode = useCallback((nodeId: string) => {
    actions.handleNodeDoubleClick(nodeId);
  }, [actions]);

  const handleKeyboardDeleteNode = useCallback((nodeId: string) => {
    actions.handleDeleteNode(nodeId);
    setSelectedElement(null);
  }, [actions]);

  const handleKeyboardDuplicateNode = useCallback((nodeId: string) => {
    actions.handleDuplicateNode(nodeId);
  }, [actions]);

  // Keyboard navigation hook
  const { announcements } = useGraphKeyboardNav({
    nodes: graphNodes,
    selectedNodeId: selectedElement ? dialogueNodeId(selectedElement.sceneId!, selectedElement.index!) : null,
    onSelectNode: handleKeyboardSelectNode,
    onEditNode: handleKeyboardEditNode,
    onDeleteNode: handleKeyboardDeleteNode,
    onDuplicateNode: handleKeyboardDuplicateNode,
    onClose: handleClose,
    isEnabled: isOpen && accessibilityMode !== 'list'
  });

  // Accessibility mode shortcuts (Ctrl+K, Ctrl+L, Ctrl+H)
  useAccessibilityShortcuts(setAccessibilityMode, isOpen);

  // Handler for list view dialogue selection
  const handleListSelectDialogue = useCallback((index: number) => {
    if (selectedScene) {
      setSelectedElement({ type: 'dialogue', sceneId: selectedScene.id, index });
    }
  }, [selectedScene]);

  const handleListEditDialogue = useCallback((index: number) => {
    if (selectedScene) {
      const nodeId = dialogueNodeId(selectedScene.id, index);
      actions.handleNodeDoubleClick(nodeId);
    }
  }, [selectedScene, actions]);

  const handleSelectDialogue = useCallback((sceneId: string, dialogueIndex: number) => {
    // Set selected element for properties panel (PHASE 3)
    // Also used for keyboard shortcuts (Delete, Duplicate)
    if (dialogueIndex >= 0) {
      setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
    } else {
      // Deselect if index is -1
      setSelectedElement(null);
    }
  }, []);

  // PHASE 2: Toolbar actions
  const handleDelete = () => {
    if (!selectedElement) return;
    const nodeId = dialogueNodeId(selectedElement.sceneId!, selectedElement.index!);
    actions.handleDeleteNode(nodeId);
    setSelectedElement(null);
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const nodeId = dialogueNodeId(selectedElement.sceneId!, selectedElement.index!);
    actions.handleDuplicateNode(nodeId);
    // Selection will stay on the original node
  };

  const handleAutoLayout = () => {
    // Force graph recalculation by changing layoutVersion key
    setLayoutVersion((v) => v + 1);
  };

  const handleToggleLayout = () => {
    // Toggle between vertical (TB) and horizontal (LR) layout
    setLayoutDirection((d) => (d === 'TB' ? 'LR' : 'TB'));
    setLayoutVersion((v) => v + 1); // Force Dagre recalculation
  };

  // Undo/Redo
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  // Graph integrity check
  const integrityIssues = useGraphIntegrityCheck(selectedScene?.dialogues ?? []);
  const handleToggleIntegrityPanel = useCallback(() => setIntegrityPanelOpen(v => !v), []);
  const handleIntegritySelectDialogue = useCallback((dialogueIndex: number) => {
    if (selectedScene) {
      setSelectedElement({ type: 'dialogue', sceneId: selectedScene.id, index: dialogueIndex });
    }
  }, [selectedScene]);

  // Terminal node actions (last node panel)
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);

  const handleTerminalAddDialogue = useCallback(() => {
    actions.handleCreateDialogue('linear');
  }, [actions]);

  const handleTerminalOpenWizard = useCallback(() => {
    if (!selectedElement) return;
    const nodeId = dialogueNodeId(selectedElement.sceneId!, selectedElement.index!);
    actions.handleNodeDoubleClick(nodeId);
  }, [selectedElement, actions]);

  const handleTerminalConcludeStory = useCallback(() => {
    if (!selectedElement || selectedElement.index === undefined) return;
    updateDialogue(selectedElement.sceneId!, selectedElement.index, { isConclusion: true });
  }, [selectedElement, updateDialogue]);

  // Keyboard shortcuts for undo/redo (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, undo, redo]);

  if (!selectedScene) return null;

  // PHASE 5: CSS classes for accessibility modes
  const a11yClasses = [
    'dialogue-graph-modal',
    accessibilityMode === 'keyboard' && 'keyboard-mode',
    accessibilityMode === 'highContrast' && 'high-contrast-mode',
    accessibilityMode === 'list' && 'list-mode'
  ].filter(Boolean).join(' ');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] p-0 gap-0 bg-[var(--color-bg-base)] flex flex-col ${a11yClasses}`}>
        <DialogTitle className="sr-only">Éditeur Nodal</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Éditeur Nodal - {selectedScene.title}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {selectedScene.dialogues.length} dialogue{selectedScene.dialogues.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* PHASE 4: Theme selector (close button is provided by DialogContent) */}
          <div className="flex items-center gap-4 mr-8">
            <ThemeSelector />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* PHASE 5: Screen reader live region */}
          <GraphLiveRegion announcements={announcements} />

          {/* PHASE 5: List View Mode - Alternative to graph for screen readers */}
          {accessibilityMode === 'list' ? (
            <GraphListView
              sceneId={selectedScene.id}
              selectedDialogueIndex={selectedElement?.index ?? null}
              onSelectDialogue={handleListSelectDialogue}
              onEditDialogue={handleListEditDialogue}
            />
          ) : (
            <>
              {/* PHASE 2: Toolbar (flottant, se décale quand le panneau propriétés est ouvert) */}
              <DialogueGraphToolbar
                selectedNodeId={
                  selectedElement
                    ? dialogueNodeId(selectedElement.sceneId!, selectedElement.index!)
                    : null
                }
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onAutoLayout={handleAutoLayout}
                onToggleLayout={handleToggleLayout}
                layoutDirection={effectiveLayoutDirection}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                integrityIssueCount={integrityIssues.length}
                onToggleIntegrityPanel={handleToggleIntegrityPanel}
                integrityPanelOpen={integrityPanelOpen}
              />

              {/* PHASE 2: Palette (flottant en haut à gauche) */}
              <DialogueGraphPalette onCreate={actions.handleCreateDialogue} />

              {/* Graph Canvas */}
              <div
                className="flex-1 relative h-full overflow-hidden"
                style={{
                  backgroundColor: theme.background.value,
                  transition: 'background-color 0.3s ease',
                }}
              >
                {/* Couche animée : slide+fade lors du changement de page */}
                <div
                  className="absolute inset-0"
                  style={{
                    ...graphAnimStyle,
                    pointerEvents: isAnimating.current ? 'none' : 'auto',
                  }}
                >
                  {/* PHASE 4: Animated background for Cosmos + Blender themes (lazy loaded) */}
                  {(isCosmosTheme || theme.background.type === 'animated') && (
                    <Suspense fallback={null}>
                      <CosmosBackground />
                    </Suspense>
                  )}

                  {/* ReactFlow Graph */}
                  <DialogueGraph
                    key={layoutVersion}
                    selectedScene={selectedScene}
                    selectedElement={selectedElement}
                    onSelectDialogue={handleSelectDialogue}
                    editMode={true}
                    layoutDirection={effectiveLayoutDirection}
                  />
                </div>

                {/* Panneaux flottants — toujours visibles (non animés) */}
                {integrityPanelOpen && (
                  <GraphIntegrityPanel
                    issues={integrityIssues}
                    onClose={() => setIntegrityPanelOpen(false)}
                    onSelectDialogue={handleIntegritySelectDialogue}
                  />
                )}

                {selectedElement && selectedElement.index !== undefined && (
                  <DialoguePropertiesPanel
                    sceneId={selectedElement.sceneId || ''}
                    dialogueIndex={selectedElement.index}
                    onClose={() => setSelectedElement(null)}
                    isLastNode={selectedElement.index === (selectedScene?.dialogues.length ?? 0) - 1}
                    onAddDialogue={handleTerminalAddDialogue}
                    onOpenWizard={handleTerminalOpenWizard}
                    onConcludeStory={handleTerminalConcludeStory}
                    initialPosition={propertiesPanelPos}
                    onPositionChange={setPropertiesPanelPos}
                  />
                )}

                {/* Pagination — active pour tous dès que le nombre de nœuds dépasse la taille de page */}
                {proPaginationEnabled && (
                  <GraphPagination
                    totalDialogues={selectedScene.dialogues.length}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </>
          )}

          {/* PHASE 5: Accessibility Toolbar (bottom left) */}
          <AccessibilityToolbar
            currentMode={accessibilityMode}
            onModeChange={setAccessibilityMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DialogueGraphModal;
