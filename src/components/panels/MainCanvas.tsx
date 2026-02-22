import { useState, useEffect, useCallback, useMemo } from 'react';
import { buildFilterCSS } from '@/utils/backgroundFilter';
import { getSceneDuration, getDialogueIndexAtTime } from '@/utils/dialogueDuration';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores';
import { GAME_STATS } from '@/i18n/types';
import { CompactStatHUD } from '@/components/ui/compact-stat-hud';
import { REFERENCE_CANVAS_WIDTH } from '@/config/canvas';
import type { GameStats } from '@/types';
import type {
  Scene,
  SceneCharacter,
  SelectedElementType,
  ModalContext,
  Prop,
  TextBox
} from '@/types';
import type { CanvasProp } from './MainCanvas/components/PropElement';
import type { CanvasTextBox } from './MainCanvas/components/TextBoxElement';
import { CharacterContextMenu } from './MainCanvas/components/CharacterContextMenu';
import AddCharacterToSceneModal from '../modals/AddCharacterToSceneModal';
import TimelinePlayhead from './TimelinePlayhead';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useCanvasDimensions } from './MainCanvas/hooks/useCanvasDimensions';
import { useDialogueSync } from './MainCanvas/hooks/useDialogueSync';
import { useCanvasViewState } from './MainCanvas/hooks/useCanvasViewState';
import { useCanvasSelection } from './MainCanvas/hooks/useCanvasSelection';
import { useCanvasDragDrop } from './MainCanvas/hooks/useCanvasDragDrop';
import { useContextMenu } from './MainCanvas/hooks/useContextMenu';
import { useCanvasActions } from './MainCanvas/hooks/useCanvasActions';
import { EmptySceneState } from './MainCanvas/components/EmptySceneState';
import { SceneHeader } from './MainCanvas/components/SceneHeader';
import { CanvasGridOverlay } from './MainCanvas/components/CanvasGridOverlay';
import { NoBackgroundPlaceholder } from './MainCanvas/components/NoBackgroundPlaceholder';
import { DropZoneIndicator } from './MainCanvas/components/DropZoneIndicator';
import { CanvasFloatingControls } from './MainCanvas/components/CanvasFloatingControls';
import { CharacterSprite } from './MainCanvas/components/CharacterSprite';
import { PropElement } from './MainCanvas/components/PropElement';
import { TextBoxElement } from './MainCanvas/components/TextBoxElement';
import { DialoguePreviewOverlay } from './MainCanvas/components/DialoguePreviewOverlay';
import { SceneInfoBar } from './MainCanvas/components/SceneInfoBar';
// import { DialogueFlowVisualization } from './MainCanvas/components/DialogueFlowVisualization'; // masquée — doublon avec graphe Panel 3
import { QuickActionsBar } from './MainCanvas/components/QuickActionsBar';
import { logger } from '../../utils/logger';
import { CANVAS_PRESENTATION } from '@/config/canvas';

const EMPTY_CHARACTERS: SceneCharacter[] = [];
const EMPTY_TEXTBOXES: TextBox[] = [];
const EMPTY_PROPS: Prop[] = [];

/**
 * Calcule les dimensions explicites du canvas (équivalent "object-fit: contain").
 * Remplace le combo CSS `width:100% + aspectRatio:16/9 + maxHeight:100%` qui
 * ne garantit pas un comportement "contain" correct quand la hauteur est contrainte.
 */
function computeCanvasSize(centerW: number, centerH: number, zoom: number): { width: number; height: number } {
  if (centerW === 0 || centerH === 0) {
    return { width: 320, height: Math.round(320 / CANVAS_PRESENTATION.ASPECT_RATIO) };
  }
  const availableW = centerW - CANVAS_PRESENTATION.CENTER_PADDING;
  const availableH = centerH - CANVAS_PRESENTATION.CENTER_PADDING;
  const baseW = Math.min(availableW, availableH * CANVAS_PRESENTATION.ASPECT_RATIO);
  const zoomedW = Math.max(320, Math.round(baseW * zoom));
  return { width: zoomedW, height: Math.round(zoomedW / CANVAS_PRESENTATION.ASPECT_RATIO) };
}

export interface MainCanvasProps {
  selectedScene: Scene | undefined;
  selectedElement: SelectedElementType;
  onSelectDialogue?: (sceneId: string, index: number | null, metadata?: unknown) => void;
}

export default function MainCanvas({
  selectedScene,
  selectedElement,
  onSelectDialogue,
}: MainCanvasProps) {
  // fullscreenMode + setFullscreenMode read from store (no prop drilling)
  const fullscreenMode = useUIStore(s => s.fullscreenMode);
  const setFullscreenMode = useUIStore(s => s.setFullscreenMode);

  // Local openModal handler — delegates to store for internal use
  const handleOpenModal = useCallback((modal: string, context: unknown = {}) => {
    const store = useUIStore.getState();
    store.setActiveModal(modal);
    store.setModalContext(context as ModalContext);
  }, []);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [canvasNode, setCanvasNode] = useState<HTMLDivElement | null>(null);
  const [canvasRef, canvasDimensions] = useCanvasDimensions();
  const [centerDivRef, centerSize] = useCanvasDimensions();
  const { currentDialogueText, currentTime, setCurrentTime } = useDialogueSync(selectedElement, selectedScene);

  const sceneId = selectedScene?.id;
  const sceneCharacters = useSceneElementsStore((s) =>
    sceneId ? (s.elementsByScene[sceneId]?.characters || EMPTY_CHARACTERS) : EMPTY_CHARACTERS
  );
  const sceneTextBoxes = useSceneElementsStore((s) =>
    sceneId ? (s.elementsByScene[sceneId]?.textBoxes || EMPTY_TEXTBOXES) : EMPTY_TEXTBOXES
  );
  const sceneProps = useSceneElementsStore((s) =>
    sceneId ? (s.elementsByScene[sceneId]?.props || EMPTY_PROPS) : EMPTY_PROPS
  );
  const dialoguesCount = useDialoguesStore((s) =>
    sceneId ? (s.dialoguesByScene[sceneId]?.length || 0) : 0
  );
  // ⚠️ selectedScene.dialogues est TOUJOURS [] (Phase 3 store split).
  // Utiliser ce sélecteur réactif pour toutes les lectures de dialogues.
  const sceneDialogues = useDialoguesStore((s) =>
    sceneId ? (s.dialoguesByScene[sceneId] || []) : []
  );

  const enableStatsHUD = useSettingsStore(s => s.enableStatsHUD);
  const variables = useSettingsStore(s => s.variables) as GameStats;

  const viewState = useCanvasViewState();
  const canvasSize = computeCanvasSize(centerSize.width, centerSize.height, viewState.canvasZoom);
  const actions = useCanvasActions({
    selectedScene,
    sceneCharacters,
    setShowAddCharacterModal,
  });
  const selection = useCanvasSelection({
    selectedScene,
    selectedElement,
    onSelectDialogue
  });

  const selectedElementSceneId = selectedElement?.type === 'dialogue' || selectedElement?.type === 'sceneCharacter'
    ? selectedElement.sceneId : null;

  // Auto-select first dialogue when scene changes or gains dialogues
  useEffect(() => {
    if (!selectedScene?.id || !dialoguesCount) return;
    if (selectedElement?.type === 'scene') return;
    if (selectedElement?.type === 'dialogue' && selectedElementSceneId === selectedScene.id) return;

    if (onSelectDialogue) {
      logger.info(`[MainCanvas] Auto-selecting first dialogue for scene: ${selectedScene.id}`);
      onSelectDialogue(selectedScene.id, 0);
    }
  }, [selectedScene?.id, dialoguesCount, selectedElement?.type, selectedElementSceneId, onSelectDialogue]);

  const dragDrop = useCanvasDragDrop({
    selectedScene,
    canvasNode,
    actions: {
      setSceneBackground: actions.setSceneBackground,
      addCharacterToScene: actions.addCharacterToScene,
      addTextBoxToScene: actions.addTextBoxToScene,
      addPropToScene: actions.addPropToScene,
      setShowAddCharacterModal
    }
  });

  const contextMenu = useContextMenu({
    selectedScene,
    selectedElement,
    characters: actions.characters,
    sceneCharacters,
    actions: {
      updateSceneCharacter: actions.updateSceneCharacter,
      removeCharacterFromScene: actions.removeCharacterFromScene
    },
    onOpenModal: handleOpenModal
  });

  const composedCanvasRef = useCallback((node: HTMLDivElement | null) => {
    canvasRef(node);
    setCanvasNode(node);
  }, [canvasRef]);

  useCanvasKeyboard({
    selectedCharacterId: selection.selectedCharacterId,
    selectedScene: selectedScene ?? null,
    sceneCharacters,
    characters: actions.characters,
    removeCharacterFromScene: actions.removeCharacterFromScene,
    updateSceneCharacter: actions.updateSceneCharacter,
    setSelectedCharacterId: selection.setSelectedCharacterId
  });

  const handleUpdateCharacterPosition = useCallback(
    (sceneCharId: string, updates: Partial<SceneCharacter>) => {
      if (selectedScene?.id) {
        actions.updateSceneCharacter(selectedScene.id, sceneCharId, updates);
      }
    },
    [selectedScene?.id, actions.updateSceneCharacter]
  );

  const handleUpdateProp = useCallback(
    (propId: string, updates: Partial<Prop>) => {
      if (selectedScene?.id) {
        actions.updateProp(selectedScene.id, propId, updates);
      }
    },
    [selectedScene?.id, actions.updateProp]
  );

  const handleRemoveProp = useCallback(
    (propId: string) => {
      if (selectedScene?.id) {
        actions.removePropFromScene(selectedScene.id, propId);
      }
    },
    [selectedScene?.id, actions.removePropFromScene]
  );

  const handleUpdateTextBox = useCallback(
    (textBoxId: string, updates: Partial<TextBox>) => {
      if (selectedScene?.id) {
        actions.updateTextBox(selectedScene.id, textBoxId, updates);
      }
    },
    [selectedScene?.id, actions.updateTextBox]
  );

  const handleRemoveTextBox = useCallback(
    (textBoxId: string) => {
      if (selectedScene?.id) {
        actions.removeTextBoxFromScene(selectedScene.id, textBoxId);
      }
    },
    [selectedScene?.id, actions.removeTextBoxFromScene]
  );

  // Active mood overrides from the currently selected dialogue (characterMoods field)
  // ⚠️ Lit depuis sceneDialogues (dialoguesStore), PAS selectedScene.dialogues (toujours vide)
  const activeMoodOverrides = useMemo<Record<string, string>>(() => {
    if (selectedElement?.type !== 'dialogue' || selectedElement.sceneId !== selectedScene?.id) return {};
    const dialogue = sceneDialogues[selectedElement.index];
    return dialogue?.characterMoods || {};
  }, [selectedElement, selectedScene?.id, sceneDialogues]);

  // Scene duration computed from real text length estimates
  const sceneDuration = useMemo(
    () => Math.max(5, getSceneDuration(sceneDialogues)),
    [sceneDialogues]
  );

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      // Convert time → dialogue index → select in editor
      const dialogues = useDialoguesStore.getState().dialoguesByScene[sceneId || ''] || [];
      if (dialogues.length > 0 && onSelectDialogue && selectedScene?.id) {
        const idx = getDialogueIndexAtTime(dialogues, time);
        onSelectDialogue(selectedScene.id, idx);
      }
    },
    [setCurrentTime, sceneId, selectedScene?.id, onSelectDialogue]
  );

  const handlePlayPause = useCallback(() => {
    const newIsPlaying = !viewState.isPlaying;
    viewState.setIsPlaying(newIsPlaying);
    // Auto-select first dialogue when starting playback with no dialogue selected
    if (newIsPlaying && selectedScene?.id && dialoguesCount > 0) {
      const noDialogueSelected =
        !selectedElement ||
        selectedElement.type !== 'dialogue' ||
        selectedElement.sceneId !== selectedScene.id;
      if (noDialogueSelected) {
        onSelectDialogue?.(selectedScene.id, 0);
      }
    }
  }, [viewState.isPlaying, viewState.setIsPlaying, selectedScene, selectedElement, onSelectDialogue]);

  const handleCloseAddCharacterModal = useCallback(
    () => setShowAddCharacterModal(false),
    []
  );

  if (!selectedScene) {
    return <EmptySceneState />;
  }

  return (
    <div className="h-full flex flex-col">
      <SceneHeader
        scene={selectedScene}
        dialoguesCount={dialoguesCount}
        fullscreenMode={fullscreenMode}
        onFullscreenChange={setFullscreenMode}
      />

      {/* Zone canvas + lecteur — flex-col simple, pas de librairie tierce */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Canvas — flex-1 prend tout l'espace vertical disponible */}
        <div ref={centerDivRef} className="flex-1 min-h-0 p-6 flex items-center justify-center overflow-hidden" style={{ backgroundColor: CANVAS_PRESENTATION.SURROUND_COLOR }}>
          <div
            className="rounded-xl overflow-hidden border-2 border-border shadow-xl bg-background transition-all duration-150"
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              minWidth: '320px',
            }}
          >
            <div
              ref={composedCanvasRef}
              className={`relative w-full h-full bg-background transition-all ${
                dragDrop.isDragOver ? 'ring-4 ring-blue-500/50 ring-inset' : ''
              } ${
                dragDrop.dropFeedback === 'background' ? 'ring-4 ring-green-500 ring-inset' : ''
              }`}
              onDragOver={dragDrop.handleDragOver}
              onDragLeave={dragDrop.handleDragLeave}
              onDrop={dragDrop.handleDrop}
            >
              {/* ── Fond — div séparée pour que le filtre n'affecte PAS les personnages ── */}
              {selectedScene.backgroundUrl && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${selectedScene.backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: buildFilterCSS(selectedScene.backgroundFilter),
                  }}
                />
              )}

              <DropZoneIndicator isDragOver={dragDrop.isDragOver} dragType={dragDrop.dragType} />

              <CanvasGridOverlay enabled={viewState.gridEnabled && canvasDimensions.width > 0} />

              {!selectedScene.backgroundUrl && (
                <NoBackgroundPlaceholder onSetBackground={actions.handleSetBackground} />
              )}

              {canvasDimensions.width > 0 && sceneCharacters.map((sceneChar) => {
                const character = actions.characters.find(c => c.id === sceneChar.characterId);
                if (!character) return null;

                return (
                  <CharacterSprite
                    key={sceneChar.id}
                    sceneChar={sceneChar}
                    character={character}
                    canvasDimensions={canvasDimensions}
                    gridEnabled={viewState.gridEnabled}
                    selectedCharacterId={selection.selectedCharacterId ?? undefined}
                    activeMoodOverride={activeMoodOverrides[sceneChar.id]}
                    onCharacterClick={selection.handleCharacterClick}
                    onContextMenu={contextMenu.handleCharacterRightClick}
                    onUpdatePosition={handleUpdateCharacterPosition}
                    onFlipHorizontal={() => contextMenu.handleFlipHorizontal(sceneChar.id)}
                    onRemove={() => contextMenu.handleRemove(sceneChar.id)}
                    onPositionChange={(x, y) => selectedScene?.id && actions.updateSceneCharacter(selectedScene.id, sceneChar.id, { position: { x, y } })}
                    onScaleChange={(scale) => selectedScene?.id && actions.updateSceneCharacter(selectedScene.id, sceneChar.id, { scale })}
                  />
                );
              })}

              {canvasDimensions.width > 0 && sceneProps.map((prop) => {
                const canvasProp: CanvasProp = {
                  id: prop.id,
                  emoji: prop.assetUrl,
                  position: prop.position,
                  size: prop.size
                };
                return (
                  <PropElement
                    key={prop.id}
                    prop={canvasProp}
                    canvasDimensions={canvasDimensions}
                    gridEnabled={viewState.gridEnabled}
                    onUpdateProp={handleUpdateProp}
                    onRemoveProp={handleRemoveProp}
                  />
                );
              })}

              {canvasDimensions.width > 0 && sceneTextBoxes.map((textBox) => {
                const canvasTextBox: CanvasTextBox = {
                  id: textBox.id,
                  text: textBox.content,
                  fontSize: textBox.style?.fontSize as number | undefined,
                  fontWeight: textBox.style?.fontWeight as string | undefined,
                  color: textBox.style?.color as string | undefined,
                  textAlign: textBox.style?.textAlign as string | undefined,
                  position: textBox.position,
                  size: textBox.size
                };
                return (
                  <TextBoxElement
                    key={textBox.id}
                    textBox={canvasTextBox}
                    canvasDimensions={canvasDimensions}
                    gridEnabled={viewState.gridEnabled}
                    onUpdateTextBox={handleUpdateTextBox}
                    onRemoveTextBox={handleRemoveTextBox}
                  />
                );
              })}

              <CanvasFloatingControls
                gridEnabled={viewState.gridEnabled}
                onToggleGrid={viewState.setGridEnabled}
              />

              {enableStatsHUD && (
                <div className="absolute top-4 left-4 z-10">
                  <CompactStatHUD
                    physique={variables[GAME_STATS.PHYSIQUE] ?? 100}
                    mentale={variables[GAME_STATS.MENTALE] ?? 100}
                    scaleFactor={canvasSize.width > 0 ? canvasSize.width / REFERENCE_CANVAS_WIDTH : 1}
                  />
                </div>
              )}

              {selectedElement?.type === 'dialogue' && selectedElement?.sceneId === selectedScene.id && (() => {
                const dialogue = selectedScene.dialogues[selectedElement.index];
                if (!dialogue) return null;

                const speaker = actions.characters.find(c => c.id === dialogue.speaker);
                const speakerName = speaker?.name || dialogue.speaker || 'Unknown';

                return (
                  <DialoguePreviewOverlay
                    dialogue={dialogue}
                    dialogueIndex={selectedElement.index}
                    totalDialogues={selectedScene.dialogues.length}
                    speakerName={speakerName}
                    currentDialogueText={currentDialogueText}
                    onNavigate={selection.handleDialogueNavigate}
                    isAutoPlaying={viewState.isPlaying}
                    onAutoPlayComplete={() => viewState.setIsPlaying(false)}
                    canvasWidth={canvasSize.width}
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {/* Lecteur — hauteur naturelle (flex-shrink-0), toujours collé sous le canvas */}
        <div className="flex-shrink-0 flex flex-col bg-background border-t border-border overflow-hidden">
          <SceneInfoBar charactersCount={sceneCharacters.length} dialoguesCount={dialoguesCount} />
          <TimelinePlayhead
            currentTime={currentTime}
            duration={sceneDuration}
            dialogues={selectedScene?.dialogues || []}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
            isPlaying={viewState.isPlaying}
            canvasZoom={viewState.canvasZoom}
            onZoomIn={viewState.zoomIn}
            onZoomOut={viewState.zoomOut}
            onResetZoom={viewState.resetZoom}
          />
          {/* DialogueFlowVisualization masquée — doublon avec le graphe de dialogues (Panel 3)
          {dialoguesCount > 0 && (
            <div className="max-h-48 overflow-y-auto border-t border-border">
              <DialogueFlowVisualization
                selectedScene={selectedScene}
                selectedElement={selectedElement}
                viewMode={viewState.viewMode}
                onViewModeChange={viewState.setViewMode}
                onDialogueClick={selection.handleDialogueClick}
                onOpenModal={onOpenModal}
              />
            </div>
          )}
          */}
        </div>

      </div>

      <QuickActionsBar
        sceneId={selectedScene.id}
        onAddDialogue={actions.handleAddDialogue}
        onSetBackground={actions.handleSetBackground}
      />

      {contextMenu.contextMenuData && (
        <CharacterContextMenu
          x={contextMenu.contextMenuData.x}
          y={contextMenu.contextMenuData.y}
          sceneChar={contextMenu.contextMenuData.sceneChar}
          character={contextMenu.contextMenuData.character}
          onClose={contextMenu.closeContextMenu}
          onEdit={contextMenu.handleEdit}
          onChangeMood={contextMenu.handleChangeMood}
          onChangeAnimation={contextMenu.handleChangeAnimation}
          onChangeLayer={contextMenu.handleChangeLayer}
          onFlipHorizontal={contextMenu.handleFlipHorizontal}
          onRemove={contextMenu.handleRemove}
        />
      )}

      <AddCharacterToSceneModal
        isOpen={showAddCharacterModal}
        onClose={handleCloseAddCharacterModal}
        characters={actions.characters}
        onAddCharacter={(characterId, mood, position) =>
          actions.handleAddCharacterConfirm(characterId, mood, position ?? undefined)
        }
      />
    </div>
  );
}

