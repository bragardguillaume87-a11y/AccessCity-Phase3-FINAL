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
import ContextMenu from '../ui/ContextMenu';
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
import { RightPanelToggle } from './MainCanvas/components/RightPanelToggle';
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
  scenes: Scene[];
  selectedElement: SelectedElementType;
  onSelectDialogue?: (sceneId: string, index: number | null, metadata?: unknown) => void;
  onOpenModal?: (modal: ModalType | string, context?: unknown) => void;
  onDialogueClick?: (sceneId: string, dialogueIndex: number) => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  fullscreenMode: FullscreenMode;
  onFullscreenChange: (mode: FullscreenMode) => void;
}

export default function MainCanvas({
  selectedScene,
  scenes,
  selectedElement,
  onSelectDialogue,
  onOpenModal,
  onDialogueClick,
  isRightPanelOpen,
  onToggleRightPanel,
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

  // Auto-select first dialogue when scene loads (if no dialogue is selected)
  useEffect(() => {
    logger.debug(`[MainCanvas] Auto-select check - Scene: ${selectedScene?.name}, Dialogues: ${selectedScene?.dialogues?.length || 0}, SelectedElement: ${selectedElement?.type}`);

    if (
      selectedScene &&
      selectedScene.dialogues?.length > 0 &&
      selectedElement?.type !== 'dialogue' &&
      onSelectDialogue
    ) {
      logger.info(`[MainCanvas] Auto-selecting first dialogue for scene: ${selectedScene.name} (${selectedScene.id})`);
      onSelectDialogue(selectedScene.id, 0);
    }
  }, [selectedScene?.id, selectedScene?.name, selectedScene?.dialogues?.length, selectedElement?.type, onSelectDialogue]);

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
    selectedScene,
    sceneCharacters,
    characters: actions.characters,
    removeCharacterFromScene: actions.removeCharacterFromScene,
    updateSceneCharacter: actions.updateSceneCharacter,
    setSelectedCharacterId: selection.setSelectedCharacterId
  });

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
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900 mb-6">
          {/* Scene Canvas Container */}
          <div
            ref={composedCanvasRef}
            className={`relative aspect-video bg-slate-950 transition-all ${
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
            <DropZoneIndicator isDragOver={dragDrop.isDragOver} />

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
                  selectedCharacterId={selection.selectedCharacterId}
                  onCharacterClick={selection.handleCharacterClick}
                  onContextMenu={contextMenu.handleCharacterRightClick}
                  onUpdatePosition={(sceneCharId, updates) =>
                    actions.updateSceneCharacter(selectedScene.id, sceneCharId, updates)
                  }
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
                  onUpdateProp={(propId, updates) => actions.updateProp(selectedScene.id, propId, updates)}
                  onRemoveProp={(propId) => actions.removePropFromScene(selectedScene.id, propId)}
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
                  onUpdateTextBox={(textBoxId, updates) => actions.updateTextBox(selectedScene.id, textBoxId, updates)}
                  onRemoveTextBox={(textBoxId) => actions.removeTextBoxFromScene(selectedScene.id, textBoxId)}
                />
              );
            })}

            {/* Grid Toggle & Add Character Buttons */}
            <CanvasFloatingControls
              gridEnabled={viewState.gridEnabled}
              onToggleGrid={viewState.setGridEnabled}
              onAddCharacter={actions.handleAddCharacterToScene}
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
        onSeek={(time) => setCurrentTime(time)}
        onPlayPause={() => viewState.setIsPlaying(!viewState.isPlaying)}
        isPlaying={viewState.isPlaying}
      />

      {/* Quick actions bar */}
      <QuickActionsBar
        sceneId={selectedScene.id}
        onAddDialogue={actions.handleAddDialogue}
        onSetBackground={actions.handleSetBackground}
      />

      {/* Right Panel Toggle Button */}
      {onToggleRightPanel && (
        <RightPanelToggle isOpen={isRightPanelOpen} onToggle={onToggleRightPanel} />
      )}

      {/* Context Menu */}
      {contextMenu.contextMenuData && (
        <ContextMenu
          x={contextMenu.contextMenuData.x}
          y={contextMenu.contextMenuData.y}
          items={contextMenu.contextMenuData.items}
          onClose={contextMenu.closeContextMenu}
        />
      )}

      {/* Add Character Modal */}
      <AddCharacterToSceneModal
        isOpen={showAddCharacterModal}
        onClose={() => setShowAddCharacterModal(false)}
        characters={actions.characters}
        onAddCharacter={actions.handleAddCharacterConfirm}
      />
    </div>
  );
}
