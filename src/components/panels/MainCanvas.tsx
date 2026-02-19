import { useState, useEffect, useCallback } from 'react';
import { useSceneElementsStore } from '@/stores/sceneElementsStore';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { GAME_STATS } from '@/i18n/types';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { BarChart3 } from 'lucide-react';
import { StatBar } from '@/components/ui/stat-bar';
import type { GameStats } from '@/types';
import type {
  Scene,
  SceneCharacter,
  SelectedElementType,
  FullscreenMode,
  ModalType,
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
import { DialogueFlowVisualization } from './MainCanvas/components/DialogueFlowVisualization';
import { QuickActionsBar } from './MainCanvas/components/QuickActionsBar';
import { logger } from '../../utils/logger';

const EMPTY_CHARACTERS: SceneCharacter[] = [];
const EMPTY_TEXTBOXES: TextBox[] = [];
const EMPTY_PROPS: Prop[] = [];

const CANVAS_ASPECT_RATIO = 16 / 9;
const CANVAS_CENTER_PADDING = 48; // p-6 = 24px × 2 côtés

/**
 * Calcule les dimensions explicites du canvas (équivalent "object-fit: contain").
 * Remplace le combo CSS `width:100% + aspectRatio:16/9 + maxHeight:100%` qui
 * ne garantit pas un comportement "contain" correct quand la hauteur est contrainte.
 */
function computeCanvasSize(centerW: number, centerH: number, zoom: number): { width: number; height: number } {
  if (centerW === 0 || centerH === 0) {
    return { width: 320, height: Math.round(320 / CANVAS_ASPECT_RATIO) };
  }
  const availableW = centerW - CANVAS_CENTER_PADDING;
  const availableH = centerH - CANVAS_CENTER_PADDING;
  const baseW = Math.min(availableW, availableH * CANVAS_ASPECT_RATIO);
  const zoomedW = Math.max(320, Math.round(baseW * zoom));
  return { width: zoomedW, height: Math.round(zoomedW / CANVAS_ASPECT_RATIO) };
}

export interface MainCanvasProps {
  selectedScene: Scene | undefined;
  selectedElement: SelectedElementType;
  onSelectDialogue?: (sceneId: string, index: number | null, metadata?: unknown) => void;
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
  fullscreenMode: FullscreenMode;
  onFullscreenChange: (mode: FullscreenMode) => void;
}

export default function MainCanvas({
  selectedScene,
  selectedElement,
  onSelectDialogue,
  onOpenModal,
  fullscreenMode,
  onFullscreenChange
}: MainCanvasProps) {
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

  const enableStatsHUD = useSettingsStore(s => s.enableStatsHUD);
  const variables = useSettingsStore(s => s.variables) as GameStats;

  const viewState = useCanvasViewState({ fullscreenMode, onFullscreenChange });
  const canvasSize = computeCanvasSize(centerSize.width, centerSize.height, viewState.canvasZoom);
  const actions = useCanvasActions({
    selectedScene,
    sceneCharacters,
    setShowAddCharacterModal,
    onOpenModal
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
    if (!selectedScene?.id || !selectedScene.dialogues?.length) return;
    if (selectedElement?.type === 'scene') return;
    if (selectedElement?.type === 'dialogue' && selectedElementSceneId === selectedScene.id) return;

    if (onSelectDialogue) {
      logger.info(`[MainCanvas] Auto-selecting first dialogue for scene: ${selectedScene.id}`);
      onSelectDialogue(selectedScene.id, 0);
    }
  }, [selectedScene?.id, selectedScene?.dialogues?.length, selectedElement?.type, selectedElementSceneId, onSelectDialogue]);

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
    characters: actions.characters,
    sceneCharacters,
    actions: {
      updateSceneCharacter: actions.updateSceneCharacter,
      removeCharacterFromScene: actions.removeCharacterFromScene
    },
    onOpenModal
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

  const handleSeek = useCallback(
    (time: number) => setCurrentTime(time),
    [setCurrentTime]
  );

  const handlePlayPause = useCallback(
    () => viewState.setIsPlaying(!viewState.isPlaying),
    [viewState.isPlaying, viewState.setIsPlaying]
  );

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
        onFullscreenChange={onFullscreenChange}
      />

      {/* Wrapper flex-1 + position:relative → l'enfant absolute inset-0 a une hauteur EXPLICITE,
          ce qui permet à Group (height:100% interne) de se résoudre correctement.
          Sans ça, height:100% sur le Group ne trouve pas de hauteur définie dans son parent
          flex-1 et reste à sa taille contenu. */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
      <div className="absolute inset-0">
      {/* Split vertical : panel canvas (haut) + panel lecteur/timeline (bas) */}
      <Group orientation="vertical" className="h-full">

        {/* Panel haut — vue des personnages + décor */}
        <Panel defaultSize={65} minSize={30}>
          <div ref={centerDivRef} className="h-full bg-[#0f1117] p-6 flex items-center justify-center overflow-hidden">
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
                style={{
                  backgroundImage: selectedScene.backgroundUrl ? `url(${selectedScene.backgroundUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onDragOver={dragDrop.handleDragOver}
                onDragLeave={dragDrop.handleDragLeave}
                onDrop={dragDrop.handleDrop}
              >
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
                      onCharacterClick={selection.handleCharacterClick}
                      onContextMenu={contextMenu.handleCharacterRightClick}
                      onUpdatePosition={handleUpdateCharacterPosition}
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
                  <div className="absolute top-4 left-4 z-10 bg-card/85 backdrop-blur-sm rounded-lg border border-border p-3 w-48 space-y-2 shadow-lg">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Stats HUD
                    </div>
                    <StatBar label="Physique" icon="💪" value={variables[GAME_STATS.PHYSIQUE] ?? 100} size="sm" />
                    <StatBar label="Mentale" icon="🧠" value={variables[GAME_STATS.MENTALE] ?? 100} size="sm" />
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
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </Panel>

        <Separator className="h-1.5 bg-border hover:bg-primary/40 cursor-row-resize transition-colors" />

        {/* Panel bas — lecteur : SceneInfoBar + Timeline + Déroulement */}
        <Panel defaultSize={35} minSize={15}>
          <div className="h-full flex flex-col bg-background overflow-hidden">
            <SceneInfoBar charactersCount={sceneCharacters.length} dialoguesCount={dialoguesCount} />
            <TimelinePlayhead
              currentTime={currentTime}
              duration={Math.max(60, dialoguesCount * 5)}
              dialogues={selectedScene?.dialogues || []}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
              isPlaying={viewState.isPlaying}
              canvasZoom={viewState.canvasZoom}
              onZoomIn={viewState.zoomIn}
              onZoomOut={viewState.zoomOut}
              onResetZoom={viewState.resetZoom}
            />
            {dialoguesCount > 0 && (
              <div className="flex-1 overflow-y-auto border-t border-border">
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
          </div>
        </Panel>

      </Group>
      </div>{/* fin absolute inset-0 */}
      </div>{/* fin wrapper flex-1 relative */}

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

