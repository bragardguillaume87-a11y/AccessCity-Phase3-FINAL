import React, { useState, useEffect, useCallback } from 'react';
import type {
  Scene,
  Character,
  SceneCharacter,
  Dialogue,
  SelectedElementType,
  FullscreenMode,
  ModalType,
  Position,
  Size,
  Prop,
  TextBox
} from '@/types';
import type { CanvasProp } from './MainCanvas/components/PropElement';
import type { CanvasTextBox } from './MainCanvas/components/TextBoxElement';
import { useScenesStore, useCharactersStore } from '../../stores/index';
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
import { TIMING } from '@/config/timing';

/**
 * MainCanvas - Center panel for visual scene editing
 * GDevelop-style visual editor with:
 * - Background image preview
 * - Character sprites positioned on scene
 * - Dialogue flow visualization
 * - Quick actions
 */
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
  // Local state (minimal)
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [canvasNode, setCanvasNode] = useState<HTMLDivElement | null>(null);

  // Custom hooks
  const [canvasRef, canvasDimensions] = useCanvasDimensions();
  const { currentDialogueText, currentTime, setCurrentTime } = useDialogueSync(selectedElement, selectedScene);

  const sceneCharacters = selectedScene?.characters || [];
  const dialoguesCount = selectedScene?.dialogues?.length || 0;

  // View state hook (grid, viewState.viewMode, viewState.isPlaying, escape fullscreen)
  const viewState = useCanvasViewState({ fullscreenMode, onFullscreenChange });

  // Actions hook (all store actions + high-level handlers)
  const actions = useCanvasActions({
    selectedScene,
    sceneCharacters,
    setShowAddCharacterModal,
    onOpenModal
  });

  // Selection hook (character/dialogue selection + navigation)
  const selection = useCanvasSelection({
    selectedScene,
    selectedElement,
    onSelectDialogue
  });

  // Helper to get sceneId from selectedElement (only dialogue/sceneCharacter have it)
  const selectedElementSceneId = selectedElement?.type === 'dialogue' || selectedElement?.type === 'sceneCharacter'
    ? selectedElement.sceneId
    : null;

  // Auto-select first dialogue when:
  // 1. Scene changes (new scene selected)
  // 2. Scene gains its first dialogue
  //
  // Skip auto-select when:
  // - No scene or no dialogues
  // - User explicitly selected scene (type='scene') - show UnifiedPanel instead
  // - A dialogue is already selected FOR THIS SCENE (preserve user selection)
  useEffect(() => {
    // Guard: need a scene with dialogues
    if (!selectedScene?.id || !selectedScene.dialogues?.length) {
      logger.debug('[MainCanvas] Auto-select skipped - no scene or no dialogues');
      return;
    }

    // Guard: user explicitly selected scene view (for UnifiedPanel/Add Elements)
    if (selectedElement?.type === 'scene') {
      logger.debug('[MainCanvas] Skipping auto-select - scene type selected (UnifiedPanel mode)');
      return;
    }

    // Guard: don't override existing dialogue selection FOR THIS SCENE
    if (
      selectedElement?.type === 'dialogue' &&
      selectedElementSceneId === selectedScene.id
    ) {
      logger.debug('[MainCanvas] Skipping auto-select - dialogue already selected for this scene');
      return;
    }

    // Auto-select first dialogue
    if (onSelectDialogue) {
      logger.info(`[MainCanvas] Auto-selecting first dialogue for scene: ${selectedScene.id}`);
      onSelectDialogue(selectedScene.id, 0);
    }
  }, [
    selectedScene?.id,                    // Trigger when scene changes
    selectedScene?.dialogues?.length,     // Trigger when dialogues added/removed
    selectedElement?.type,                // Check current selection type
    selectedElementSceneId,               // Check if selection is for current scene
    onSelectDialogue
  ]);

  // Drag & Drop hook (drag over, drop handling)
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

  // Context menu hook (right-click menu for characters)
  const contextMenu = useContextMenu({
    selectedScene,
    characters: actions.characters,
    actions: {
      updateSceneCharacter: actions.updateSceneCharacter,
      removeCharacterFromScene: actions.removeCharacterFromScene
    },
    onOpenModal
  });

  // Compose canvasRef with our own tracking ref
  const composedCanvasRef = useCallback((node: HTMLDivElement | null) => {
    canvasRef(node);
    setCanvasNode(node);
  }, [canvasRef]);

  // Keyboard shortcuts for character manipulation
  useCanvasKeyboard({
    selectedCharacterId: selection.selectedCharacterId,
    selectedScene: selectedScene ?? null,
    sceneCharacters,
    characters: actions.characters,
    removeCharacterFromScene: actions.removeCharacterFromScene,
    updateSceneCharacter: actions.updateSceneCharacter,
    setSelectedCharacterId: selection.setSelectedCharacterId
  });

  // Memoized callbacks for child components (prevents re-renders)
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
      {/* Scene header */}
      <SceneHeader
        scene={selectedScene}
        dialoguesCount={dialoguesCount}
        fullscreenMode={fullscreenMode}
        onFullscreenChange={onFullscreenChange}
      />

      {/* Canvas area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl overflow-hidden border-2 border-border shadow-xl bg-background mb-6">
          {/* Scene Canvas Container */}
          <div
            ref={composedCanvasRef}
            className={`relative aspect-video bg-background transition-all ${
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
            {/* Drop Zone Indicator */}
            <DropZoneIndicator isDragOver={dragDrop.isDragOver} dragType={dragDrop.dragType} />

            {/* Grid Overlay */}
            <CanvasGridOverlay enabled={viewState.gridEnabled && canvasDimensions.width > 0} />

            {/* No background placeholder */}
            {!selectedScene.backgroundUrl && (
              <NoBackgroundPlaceholder onSetBackground={actions.handleSetBackground} />
            )}

            {/* Character Sprites Layer */}
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

            {/* Props Layer */}
            {canvasDimensions.width > 0 && (selectedScene.props || []).map((prop) => {
              // Map Prop to CanvasProp (assetUrl -> emoji)
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

            {/* Text Boxes Layer */}
            {canvasDimensions.width > 0 && (selectedScene.textBoxes || []).map((textBox) => {
              // Map TextBox to CanvasTextBox (content -> text, style.fontSize -> fontSize)
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

            {/* Grid Toggle */}
            <CanvasFloatingControls
              gridEnabled={viewState.gridEnabled}
              onToggleGrid={viewState.setGridEnabled}
            />

            {/* Dialogue Preview Overlay */}
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

          {/* Scene Info Bar */}
          <SceneInfoBar charactersCount={sceneCharacters.length} dialoguesCount={dialoguesCount} />
        </div>

        {/* Dialogue Flow Visualization */}
        {dialoguesCount > 0 && (
          <DialogueFlowVisualization
            selectedScene={selectedScene}
            selectedElement={selectedElement}
            viewMode={viewState.viewMode}
            onViewModeChange={viewState.setViewMode}
            onDialogueClick={selection.handleDialogueClick}
            onOpenModal={onOpenModal}
          />
        )}
      </div>

      {/* Timeline Playhead */}
      <TimelinePlayhead
        currentTime={currentTime}
        duration={Math.max(60, dialoguesCount * 5)}
        dialogues={selectedScene?.dialogues || []}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        isPlaying={viewState.isPlaying}
      />

      {/* Quick actions bar */}
      <QuickActionsBar
        sceneId={selectedScene.id}
        onAddDialogue={actions.handleAddDialogue}
        onSetBackground={actions.handleSetBackground}
      />

      {/* Context Menu - Kid-friendly character menu */}
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

      {/* Add Character Modal */}
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
