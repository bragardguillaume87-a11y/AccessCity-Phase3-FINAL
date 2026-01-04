import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useScenesStore, useCharactersStore } from '../../stores/index.js';
import ContextMenu from '../ui/ContextMenu.jsx';
import AddCharacterToSceneModal from '../modals/AddCharacterToSceneModal.jsx';
import TimelinePlayhead from './TimelinePlayhead.jsx';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useCanvasDimensions } from './MainCanvas/hooks/useCanvasDimensions.js';
import { useDialogueSync } from './MainCanvas/hooks/useDialogueSync.js';
import { EmptySceneState } from './MainCanvas/components/EmptySceneState.jsx';
import { SceneHeader } from './MainCanvas/components/SceneHeader.jsx';
import { CanvasGridOverlay } from './MainCanvas/components/CanvasGridOverlay.jsx';
import { NoBackgroundPlaceholder } from './MainCanvas/components/NoBackgroundPlaceholder.jsx';
import { DropZoneIndicator } from './MainCanvas/components/DropZoneIndicator.jsx';
import { CanvasFloatingControls } from './MainCanvas/components/CanvasFloatingControls.jsx';
import { CharacterSprite } from './MainCanvas/components/CharacterSprite.jsx';
import { PropElement } from './MainCanvas/components/PropElement.jsx';
import { TextBoxElement } from './MainCanvas/components/TextBoxElement.jsx';
import { DialoguePreviewOverlay } from './MainCanvas/components/DialoguePreviewOverlay.jsx';
import { SceneInfoBar } from './MainCanvas/components/SceneInfoBar.jsx';
import { DialogueFlowVisualization } from './MainCanvas/components/DialogueFlowVisualization.jsx';
import { QuickActionsBar } from './MainCanvas/components/QuickActionsBar.jsx';
import { RightPanelToggle } from './MainCanvas/components/RightPanelToggle.jsx';
import { logger } from '../../utils/logger.js';
import { TIMING } from '@/config/timing';

/**
 * MainCanvas - Center panel for visual scene editing
 * GDevelop-style visual editor with:
 * - Background image preview
 * - Character sprites positioned on scene
 * - Dialogue flow visualization
 * - Quick actions
 */
function MainCanvas({ selectedScene, scenes, selectedElement, onSelectDialogue, onOpenModal, onDialogueClick, isRightPanelOpen, onToggleRightPanel, fullscreenMode, onFullscreenChange }) {
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

  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [contextMenuData, setContextMenuData] = useState(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'graph'
  const [isPlaying, setIsPlaying] = useState(false);
  const [dropFeedback, setDropFeedback] = useState(null);

  const canvasRef = useRef(null);
  const canvasDimensions = useCanvasDimensions(canvasRef);
  const { currentDialogueText, currentTime, setCurrentTime } = useDialogueSync(selectedElement, selectedScene);

  const sceneCharacters = selectedScene?.characters || [];
  const dialoguesCount = selectedScene?.dialogues?.length || 0;

  // Escape key handler to exit fullscreen mode
  useEffect(() => {
    if (!fullscreenMode || !onFullscreenChange) return;

    const handleEscape = (e) => {
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
    const newDialogue = {
      id: `dialogue-${Date.now()}`,
      speaker: '',
      text: 'New dialogue',
      choices: []
    };
    addDialogue(selectedScene.id, newDialogue);
  };

  const handleDialogueClick = useCallback((sceneId, dialogueIndex) => {
    if (onSelectDialogue) {
      onSelectDialogue(sceneId, dialogueIndex);
    }
    logger.debug(`[MainCanvas] Dialogue ${dialogueIndex} clicked`);
  }, [onSelectDialogue]);

  const handleSetBackground = () => {
    if (onOpenModal) {
      onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
    }
  };

  const handleCharacterClick = (sceneChar) => {
    setSelectedCharacterId(sceneChar.id);
    if (onSelectDialogue) {
      onSelectDialogue(selectedScene.id, null, { type: 'sceneCharacter', sceneCharacterId: sceneChar.id });
    }
  };

  const handleCharacterRightClick = (e, sceneChar) => {
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
            if (newMood && newMood !== currentMood) {
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

            if (choice && animations.includes(choice.toLowerCase())) {
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
            const newZIndex = prompt(`Enter Z-Index (layer order) for ${characterName}:`, currentZIndex);
            if (newZIndex !== null) {
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
            if (confirmed) {
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

  const handleAddCharacterConfirm = (characterId, mood, position) => {
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
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!canvasRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (!selectedScene) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const position = {
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

        case 'textbox':
          const textBox = {
            id: `textbox-${Date.now()}`,
            text: data.defaultText || 'Double-click to edit',
            fontSize: data.fontSize || 16,
            fontWeight: data.fontWeight || 'normal',
            position,
            size: { width: 300, height: 100 }
          };
          addTextBoxToScene(selectedScene.id, textBox);
          break;

        case 'prop':
          const prop = {
            id: `prop-${Date.now()}`,
            emoji: data.emoji,
            position,
            size: { width: 80, height: 80 }
          };
          addPropToScene(selectedScene.id, prop);
          break;

        default:
          logger.warn('Unknown drag type:', data.type);
      }
    } catch (error) {
      logger.error('Failed to parse drop data:', error);
    }
  };

  const handleDialogueNavigate = (direction) => {
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
            ref={canvasRef}
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
            {canvasDimensions.width > 0 && (selectedScene.props || []).map((prop) => (
              <PropElement
                key={prop.id}
                prop={prop}
                canvasDimensions={canvasDimensions}
                gridEnabled={gridEnabled}
                onUpdateProp={(propId, updates) => updateProp(selectedScene.id, propId, updates)}
                onRemoveProp={(propId) => removePropFromScene(selectedScene.id, propId)}
              />
            ))}

            {/* Text Boxes Layer */}
            {canvasDimensions.width > 0 && (selectedScene.textBoxes || []).map((textBox) => (
              <TextBoxElement
                key={textBox.id}
                textBox={textBox}
                canvasDimensions={canvasDimensions}
                gridEnabled={gridEnabled}
                onUpdateTextBox={(textBoxId, updates) => updateTextBox(selectedScene.id, textBoxId, updates)}
                onRemoveTextBox={(textBoxId) => removeTextBoxFromScene(selectedScene.id, textBoxId)}
              />
            ))}

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

MainCanvas.propTypes = {
  selectedScene: PropTypes.object,
  scenes: PropTypes.array.isRequired,
  selectedElement: PropTypes.object,
  onSelectDialogue: PropTypes.func,
  onOpenModal: PropTypes.func,
  onDialogueClick: PropTypes.func,
  isRightPanelOpen: PropTypes.bool,
  onToggleRightPanel: PropTypes.func,
  fullscreenMode: PropTypes.oneOf([null, 'graph', 'canvas', 'preview']),
  onFullscreenChange: PropTypes.func
};

export default MainCanvas;
