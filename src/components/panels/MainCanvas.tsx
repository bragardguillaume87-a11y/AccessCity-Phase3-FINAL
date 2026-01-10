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
import { useScenesStore, useCharactersStore } from '../../stores/index.js';
import ContextMenu from '../ui/ContextMenu';
import AddCharacterToSceneModal from '../modals/AddCharacterToSceneModal.jsx';
import TimelinePlayhead from './TimelinePlayhead';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useCanvasDimensions } from './MainCanvas/hooks/useCanvasDimensions.js';
import { useDialogueSync } from './MainCanvas/hooks/useDialogueSync.js';
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
import { logger } from '../../utils/logger.js';
import { TIMING } from '@/config/timing';

interface ContextMenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuData {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

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
  // Zustand stores (granular selectors)
  const addDialogue = useScenesStore(state => state.addDialogue);
  const addCharacterToScene = useScenesStore(state => state.addCharacterToScene);
  const removeCharacterFromScene = useScenesStore(state => state.removeCharacterFromScene);
  const updateSceneCharacter = useScenesStore(state => state.updateSceneCharacter);
  const setSceneBackground = useScenesStore(state => state.setSceneBackground);
  const addTextBoxToScene = useScenesStore(state => state.addTextBoxToScene);
  const removeTextBoxFromScene = useScenesStore(state => state.removeTextBoxFromScene);
  const updateTextBox = useScenesStore(state => state.updateTextBox);
  const addPropToScene = useScenesStore(state => state.addPropToScene);
  const removePropFromScene = useScenesStore(state => state.removePropFromScene);
  const updateProp = useScenesStore(state => state.updateProp);
  const characters = useCharactersStore(state => state.characters);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [contextMenuData, setContextMenuData] = useState<ContextMenuData | null>(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'visual' | 'graph'>('visual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);
  const [canvasNode, setCanvasNode] = useState<HTMLDivElement | null>(null);

  const [canvasRef, canvasDimensions] = useCanvasDimensions();
  const { currentDialogueText, currentTime, setCurrentTime } = useDialogueSync(selectedElement, selectedScene);

  // Compose canvasRef with our own tracking ref
  const composedCanvasRef = useCallback((node: HTMLDivElement | null) => {
    canvasRef(node);
    setCanvasNode(node);
  }, [canvasRef]);

  const sceneCharacters = selectedScene?.characters || [];
  const dialoguesCount = selectedScene?.dialogues?.length || 0;

  // Escape key handler to exit fullscreen mode
  useEffect(() => {
    if (!fullscreenMode || !onFullscreenChange) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFullscreenChange(null);
        logger.debug('[MainCanvas] Exiting fullscreen mode via Escape');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenMode, onFullscreenChange]);

  // Keyboard shortcuts for character manipulation
  useCanvasKeyboard({
    selectedCharacterId,
    selectedScene,
    sceneCharacters,
    characters,
    removeCharacterFromScene,
    updateSceneCharacter,
    setSelectedCharacterId
  });

  const handleAddDialogue = () => {
    if (!selectedScene) return;
    const newDialogue: Dialogue = {
      id: `dialogue-${Date.now()}`,
      speaker: '',
      text: 'New dialogue',
      choices: []
    };
    addDialogue(selectedScene.id, newDialogue);
  };

  const handleDialogueClick = useCallback((sceneId: string, dialogueIndex: number) => {
    if (onSelectDialogue) {
      onSelectDialogue(sceneId, dialogueIndex);
    }
    logger.debug(`[MainCanvas] Dialogue ${dialogueIndex} clicked`);
  }, [onSelectDialogue]);

  const handleSetBackground = () => {
    if (onOpenModal && selectedScene) {
      onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
    }
  };

  const handleCharacterClick = (sceneChar: SceneCharacter) => {
    setSelectedCharacterId(sceneChar.id);
    if (onSelectDialogue && selectedScene) {
      onSelectDialogue(selectedScene.id, null, { type: 'sceneCharacter', sceneCharacterId: sceneChar.id });
    }
  };

  const handleCharacterRightClick = (e: React.MouseEvent, sceneChar: SceneCharacter) => {
    e.preventDefault();

    const character = characters.find(c => c.id === sceneChar.characterId);
    const characterName = character?.name || 'Character';

    setContextMenuData({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: `Edit ${characterName}`,
          icon: '✏️',
          onClick: () => {
            if (onOpenModal) {
              onOpenModal('characters', { characterId: sceneChar.characterId });
            }
          }
        },
        {
          label: 'Change Mood',
          icon: '😊',
          onClick: () => {
            const currentMood = sceneChar.mood || 'neutral';
            const newMood = prompt(`Enter mood for ${characterName}:`, currentMood);
            if (newMood && newMood !== currentMood && selectedScene) {
              updateSceneCharacter(selectedScene.id, sceneChar.id, { mood: newMood });
            }
          }
        },
        {
          label: 'Change Entrance Animation',
          icon: '✨',
          onClick: () => {
            const animations = ['none', 'fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown', 'pop', 'bounce'];
            const current = sceneChar.entranceAnimation || 'none';
            const message = `Select entrance animation for ${characterName}:\n\nAvailable animations:\n${animations.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nCurrent: ${current}`;
            const choice = prompt(message, current);

            if (choice && animations.includes(choice.toLowerCase()) && selectedScene) {
              updateSceneCharacter(selectedScene.id, sceneChar.id, {
                entranceAnimation: choice.toLowerCase()
              });
              alert(`Entrance animation set to: ${choice}\n\nReload the scene to see the animation.`);
            }
          }
        },
        {
          label: 'Change Z-Index',
          icon: '🎯',
          onClick: () => {
            const currentZIndex = sceneChar.zIndex || 1;
            const newZIndex = prompt(`Enter Z-Index (layer order) for ${characterName}:`, String(currentZIndex));
            if (newZIndex !== null && selectedScene) {
              const parsedZIndex = parseInt(newZIndex);
              if (!isNaN(parsedZIndex)) {
                updateSceneCharacter(selectedScene.id, sceneChar.id, { zIndex: parsedZIndex });
              }
            }
          }
        },
        {
          label: 'Remove from Scene',
          icon: '🗑️',
          onClick: () => {
            const confirmed = window.confirm(`Remove ${characterName} from this scene?`);
            if (confirmed && selectedScene) {
              removeCharacterFromScene(selectedScene.id, sceneChar.id);
            }
          },
          danger: true
        }
      ]
    });
  };

  const handleAddCharacterToScene = () => {
    if (!selectedScene) return;
    setShowAddCharacterModal(true);
  };

  const handleAddCharacterConfirm = (characterId: string, mood: string, position?: Position) => {
    if (!selectedScene) return;

    let finalPosition = position;

    if (!finalPosition) {
      if (characterId === 'player') {
        finalPosition = { x: 20, y: 50 };
      } else {
        const existingPositions = sceneCharacters.map(sc => sc.position?.x || 50);
        const centerOccupied = existingPositions.some(x => Math.abs(x - 50) < 10);

        if (!centerOccupied) {
          finalPosition = { x: 50, y: 50 };
        } else {
          finalPosition = { x: 80, y: 50 };
        }
      }
    }

    addCharacterToScene(selectedScene.id, characterId, mood, finalPosition);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!canvasNode?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (!selectedScene || !canvasNode) return;

      const rect = canvasNode.getBoundingClientRect();

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const position: Position = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      };

      switch (data.type) {
        case 'background':
          setSceneBackground(selectedScene.id, data.backgroundUrl);
          setDropFeedback('background');
          setTimeout(() => setDropFeedback(null), TIMING.LOADING_MIN_DISPLAY);
          break;

        case 'character':
          addCharacterToScene(selectedScene.id, data.characterId, data.mood, position, 'none');
          setShowAddCharacterModal(false);
          break;

        case 'textbox': {
          const textBox: TextBox = {
            id: `textbox-${Date.now()}`,
            content: data.defaultText || 'Double-click to edit',
            position,
            size: { width: 300, height: 100 },
            style: {
              fontSize: data.fontSize || 16,
              fontWeight: data.fontWeight || 'normal'
            }
          };
          addTextBoxToScene(selectedScene.id, textBox);
          break;
        }

        case 'prop': {
          const prop: Prop = {
            id: `prop-${Date.now()}`,
            assetUrl: data.emoji,
            position,
            size: { width: 80, height: 80 }
          };
          addPropToScene(selectedScene.id, prop);
          break;
        }

        default:
          logger.warn('Unknown drag type:', data.type);
      }
    } catch (error) {
      logger.error('Failed to parse drop data:', error);
    }
  };

  const handleDialogueNavigate = (direction: 'prev' | 'next') => {
    if (!selectedElement || !selectedScene || selectedElement.type !== 'dialogue') return;

    const currentIndex = selectedElement.index;
    const totalDialogues = selectedScene.dialogues.length;

    if (direction === 'prev' && currentIndex > 0) {
      onSelectDialogue?.(selectedScene.id, currentIndex - 1);
    } else if (direction === 'next' && currentIndex < totalDialogues - 1) {
      onSelectDialogue?.(selectedScene.id, currentIndex + 1);
    }
  };

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
              isDragOver ? 'ring-4 ring-blue-500/50 ring-inset' : ''
            } ${
              dropFeedback === 'background' ? 'ring-4 ring-green-500 ring-inset' : ''
            }`}
            style={{
              backgroundImage: selectedScene.backgroundUrl ? `url(${selectedScene.backgroundUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drop Zone Indicator */}
            <DropZoneIndicator isDragOver={isDragOver} />

            {/* Grid Overlay */}
            <CanvasGridOverlay enabled={gridEnabled && canvasDimensions.width > 0} />

            {/* No background placeholder */}
            {!selectedScene.backgroundUrl && (
              <NoBackgroundPlaceholder onSetBackground={handleSetBackground} />
            )}

            {/* Character Sprites Layer */}
            {canvasDimensions.width > 0 && sceneCharacters.map((sceneChar) => {
              const character = characters.find(c => c.id === sceneChar.characterId);
              if (!character) return null;

              return (
                <CharacterSprite
                  key={sceneChar.id}
                  sceneChar={sceneChar}
                  character={character}
                  canvasDimensions={canvasDimensions}
                  gridEnabled={gridEnabled}
                  selectedCharacterId={selectedCharacterId}
                  onCharacterClick={handleCharacterClick}
                  onContextMenu={handleCharacterRightClick}
                  onUpdatePosition={(sceneCharId, updates) =>
                    updateSceneCharacter(selectedScene.id, sceneCharId, updates)
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
                  gridEnabled={gridEnabled}
                  onUpdateProp={(propId, updates) => updateProp(selectedScene.id, propId, updates)}
                  onRemoveProp={(propId) => removePropFromScene(selectedScene.id, propId)}
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
                  gridEnabled={gridEnabled}
                  onUpdateTextBox={(textBoxId, updates) => updateTextBox(selectedScene.id, textBoxId, updates)}
                  onRemoveTextBox={(textBoxId) => removeTextBoxFromScene(selectedScene.id, textBoxId)}
                />
              );
            })}

            {/* Grid Toggle & Add Character Buttons */}
            <CanvasFloatingControls
              gridEnabled={gridEnabled}
              onToggleGrid={setGridEnabled}
              onAddCharacter={handleAddCharacterToScene}
            />

            {/* Dialogue Preview Overlay */}
            {selectedElement?.type === 'dialogue' && selectedElement?.sceneId === selectedScene.id && (() => {
              const dialogue = selectedScene.dialogues[selectedElement.index];
              if (!dialogue) return null;

              const speaker = characters.find(c => c.id === dialogue.speaker);
              const speakerName = speaker?.name || dialogue.speaker || 'Unknown';

              return (
                <DialoguePreviewOverlay
                  dialogue={dialogue}
                  dialogueIndex={selectedElement.index}
                  totalDialogues={selectedScene.dialogues.length}
                  speakerName={speakerName}
                  currentDialogueText={currentDialogueText}
                  onNavigate={handleDialogueNavigate}
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onDialogueClick={handleDialogueClick}
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
        onPlayPause={() => setIsPlaying(!isPlaying)}
        isPlaying={isPlaying}
      />

      {/* Quick actions bar */}
      <QuickActionsBar
        sceneId={selectedScene.id}
        onAddDialogue={handleAddDialogue}
        onSetBackground={handleSetBackground}
      />

      {/* Right Panel Toggle Button */}
      {onToggleRightPanel && (
        <RightPanelToggle isOpen={isRightPanelOpen} onToggle={onToggleRightPanel} />
      )}

      {/* Context Menu */}
      {contextMenuData && (
        <ContextMenu
          x={contextMenuData.x}
          y={contextMenuData.y}
          items={contextMenuData.items}
          onClose={() => setContextMenuData(null)}
        />
      )}

      {/* Add Character Modal */}
      <AddCharacterToSceneModal
        isOpen={showAddCharacterModal}
        onClose={() => setShowAddCharacterModal(false)}
        characters={characters}
        onAddCharacter={handleAddCharacterConfirm}
      />
    </div>
  );
}
