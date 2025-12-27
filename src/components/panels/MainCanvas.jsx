import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { useScenesStore, useCharactersStore, useSettingsStore } from '../../stores/index.js';
import ContextMenu from '../ui/ContextMenu.jsx';
import AddCharacterToSceneModal from '../modals/AddCharacterToSceneModal.jsx';
import DialogueGraph from '../features/DialogueGraph.jsx';
import { Z_INDEX } from '../../utils/zIndexLayers.js';

/**
 * MainCanvas - Center panel for visual scene editing
 * GDevelop-style visual editor with:
 * - Background image preview
 * - Character sprites positioned on scene
 * - Dialogue flow visualization
 * - Quick actions
 */
function MainCanvas({ selectedScene, scenes, selectedElement, onSelectDialogue, onOpenModal }) {
  // Zustand stores (granular selectors)
  const addDialogue = useScenesStore(state => state.addDialogue);
  const addCharacterToScene = useScenesStore(state => state.addCharacterToScene);
  const removeCharacterFromScene = useScenesStore(state => state.removeCharacterFromScene);
  const updateSceneCharacter = useScenesStore(state => state.updateSceneCharacter);
  const characters = useCharactersStore(state => state.characters);
  const projectSettings = useSettingsStore(state => state.projectSettings);

  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [contextMenuData, setContextMenuData] = useState(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'graph'

  // Define sceneCharacters early to avoid reference errors in useEffect
  const sceneCharacters = selectedScene?.characters || [];
  const dialoguesCount = selectedScene?.dialogues?.length || 0;

  // Update canvas dimensions on mount, resize, and scene change
  // Uses ResizeObserver for reliable dimension tracking
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        requestAnimationFrame(() => {
          const { width, height } = canvasRef.current.getBoundingClientRect();
          if (width > 0 && height > 0) {
            setCanvasDimensions({ width, height });
          }
        });
      }
    };

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(updateDimensions);

    if (canvasRef.current) {
      // Start observing the canvas element
      resizeObserver.observe(canvasRef.current);
      // Initial dimension update
      updateDimensions();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedScene]);

  // Keyboard shortcuts for character manipulation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCharacterId || !selectedScene) return;

      const selectedChar = sceneCharacters.find(sc => sc.id === selectedCharacterId);
      if (!selectedChar) return;

      // Delete key - remove character
      if (e.key === 'Delete') {
        e.preventDefault();
        const character = characters.find(c => c.id === selectedChar.characterId);
        const confirmed = window.confirm(`Remove ${character?.name || 'character'} from this scene?`);
        if (confirmed) {
          removeCharacterFromScene(selectedScene.id, selectedChar.id);
          setSelectedCharacterId(null);
        }
        return;
      }

      // Arrow keys - nudge character position
      const nudgeAmount = e.shiftKey ? 1 : 0.5; // 1% with Shift, 0.5% without
      const currentPosition = selectedChar.position || { x: 50, y: 50 };
      let newPosition = { ...currentPosition };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newPosition.x = Math.max(0, currentPosition.x - nudgeAmount);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newPosition.x = Math.min(100, currentPosition.x + nudgeAmount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newPosition.y = Math.max(0, currentPosition.y - nudgeAmount);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newPosition.y = Math.min(100, currentPosition.y + nudgeAmount);
          break;
        default:
          return;
      }

      updateSceneCharacter(selectedScene.id, selectedChar.id, { position: newPosition });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCharacterId, selectedScene, sceneCharacters, characters, removeCharacterFromScene, updateSceneCharacter]);

  // Convert percentage to pixels
  const percentToPixels = (percent, dimension) => {
    return (percent / 100) * dimension;
  };

  // Convert pixels to percentage
  const pixelsToPercent = (pixels, dimension) => {
    return (pixels / dimension) * 100;
  };

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

  const handleSetBackground = () => {
    if (onOpenModal) {
      onOpenModal('assets', { category: 'backgrounds', targetSceneId: selectedScene.id });
    } else {
      alert('Open Assets modal (backgrounds) - To be integrated with EditorShell modal state');
    }
  };

  const handleCharacterClick = (sceneChar) => {
    setSelectedCharacterId(sceneChar.id);
    // Notify parent to show scene character properties
    if (onSelectDialogue) {
      // Use a special type to distinguish from global character selection
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

    // Intelligent auto-positioning based on character type
    let finalPosition = position;

    if (!finalPosition) {
      // Auto-position based on character ID
      if (characterId === 'player') {
        // PLAYER always goes to the left by default
        finalPosition = { x: 20, y: 50 };
      } else {
        // Other characters go to center or right based on scene occupancy
        const existingPositions = sceneCharacters.map(sc => sc.position?.x || 50);
        const centerOccupied = existingPositions.some(x => Math.abs(x - 50) < 10);

        if (!centerOccupied) {
          finalPosition = { x: 50, y: 50 }; // Center
        } else {
          finalPosition = { x: 80, y: 50 }; // Right
        }
      }
    }

    addCharacterToScene(selectedScene.id, characterId, mood, finalPosition);
  };

  // Drag & Drop handlers for character placement
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set to false if leaving the canvas entirely
    if (!canvasRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'character' && selectedScene) {
        // Calculate position from drop coordinates
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp to 0-100 range
        const position = {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y))
        };

        // Add character at drop position
        addCharacterToScene(selectedScene.id, data.characterId, data.mood, position);

        // Close modal if open
        setShowAddCharacterModal(false);
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  if (!selectedScene) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-500 max-w-md">
          <svg className="w-20 h-20 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-400 mb-2">No scene selected</h2>
          <p className="text-sm text-slate-600">
            Select a scene from the Explorer panel to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scene header */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedScene.title || 'Untitled scene'}
                </h2>
                {selectedScene.description && (
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedScene.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-700 px-3 py-1 rounded-full">
              {dialoguesCount} dialogue{dialoguesCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Visual Scene Editor */}
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900 mb-6">
          {/* Scene Canvas Container - Drop Zone */}
          <div
            ref={canvasRef}
            className={`relative aspect-video bg-slate-950 flex items-center justify-center transition-all ${
              isDragOver ? 'ring-4 ring-blue-500/50 ring-inset' : ''
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
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium">
                  Déposez le personnage ici
                </div>
              </div>
            )}
            {/* Grid Overlay */}
            {projectSettings?.editor?.showGrid && canvasDimensions.width > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: Z_INDEX.CANVAS_GRID }}
              >
                <defs>
                  <pattern
                    id="grid"
                    width={projectSettings.editor.gridSize}
                    height={projectSettings.editor.gridSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${projectSettings.editor.gridSize} 0 L 0 0 0 ${projectSettings.editor.gridSize}`}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.5)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            {/* No background placeholder */}
            {!selectedScene.backgroundUrl && (
              <div className="text-center text-slate-700" style={{ zIndex: Z_INDEX.CANVAS_BACKGROUND }}>
                <svg className="w-20 h-20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No background set</p>
                <button
                  onClick={handleSetBackground}
                  className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Set Background
                </button>
              </div>
            )}

            {/* Character Sprites Layer */}
            {canvasDimensions.width > 0 && sceneCharacters.map((sceneChar) => {
              const character = characters.find(c => c.id === sceneChar.characterId);
              if (!character) return null;

              const sprite = character.sprites?.[sceneChar.mood || 'neutral'];
              const position = sceneChar.position || { x: 50, y: 50 };
              const scale = sceneChar.scale || 1.0;
              // Clamp z-index to valid range (1-10)
              const zIndex = Math.max(Z_INDEX.CANVAS_CHARACTER_MIN, Math.min(Z_INDEX.CANVAS_CHARACTER_MAX, sceneChar.zIndex || 1));

              // Default character size
              const baseWidth = 128;
              const baseHeight = 128;
              const scaledWidth = baseWidth * scale;
              const scaledHeight = baseHeight * scale;

              // Convert percentage position to pixels (accounting for center transform)
              const pixelX = percentToPixels(position.x, canvasDimensions.width) - (scaledWidth / 2);
              const pixelY = percentToPixels(position.y, canvasDimensions.height) - (scaledHeight / 2);

              // Grid settings
              const gridSize = projectSettings?.editor?.gridSize || 20;
              const snapToGrid = projectSettings?.editor?.snapToGrid || false;
              const dragGrid = snapToGrid ? [gridSize, gridSize] : [1, 1];

              return (
                <Rnd
                  key={sceneChar.id}
                  size={{ width: scaledWidth, height: scaledHeight }}
                  position={{ x: pixelX, y: pixelY }}
                  onDragStop={(e, d) => {
                    // Convert pixel position back to percentage (accounting for center transform)
                    const centerX = d.x + (scaledWidth / 2);
                    const centerY = d.y + (scaledHeight / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateSceneCharacter(selectedScene.id, sceneChar.id, {
                      position: { x: newPercentX, y: newPercentY }
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    // Calculate new scale based on new width
                    const newWidth = parseInt(ref.style.width);
                    const newScale = newWidth / baseWidth;

                    // Convert pixel position back to percentage
                    const centerX = position.x + (newWidth / 2);
                    const centerY = position.y + (parseInt(ref.style.height) / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateSceneCharacter(selectedScene.id, sceneChar.id, {
                      position: { x: newPercentX, y: newPercentY },
                      scale: newScale
                    });
                  }}
                  dragGrid={dragGrid}
                  resizeGrid={dragGrid}
                  lockAspectRatio={true}
                  style={{ zIndex }}
                  className="group"
                  enableResizing={{
                    top: false,
                    right: true,
                    bottom: true,
                    left: false,
                    topRight: false,
                    bottomRight: true,
                    bottomLeft: false,
                    topLeft: false
                  }}
                >
                  <div
                    className="w-full h-full cursor-move"
                    onClick={() => handleCharacterClick(sceneChar)}
                    onContextMenu={(e) => handleCharacterRightClick(e, sceneChar)}
                  >
                    {/* Character Sprite */}
                    {sprite ? (
                      <img
                        src={sprite}
                        alt={character.name}
                        className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform pointer-events-none"
                        draggable="false"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}

                    {/* Fallback for broken images */}
                    <div className="hidden w-full h-full bg-slate-700 rounded-full items-center justify-center border-2 border-slate-600">
                      <span className="text-2xl">👤</span>
                    </div>

                    {/* Character Label (on hover) */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {character.name}
                    </div>

                    {/* Selection indicator */}
                    {selectedCharacterId === sceneChar.id && (
                      <div className="absolute inset-0 -m-2 border-4 border-blue-500 rounded-lg animate-pulse pointer-events-none" />
                    )}
                  </div>
                </Rnd>
              );
            })}

            {/* Add Character Button (floating) */}
            <button
              onClick={handleAddCharacterToScene}
              className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              style={{ zIndex: Z_INDEX.CANVAS_FLOATING_BUTTONS }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Character to Scene
            </button>

            {/* Dialogue Preview Overlay */}
            {selectedElement?.type === 'dialogue' && selectedElement?.sceneId === selectedScene.id && (() => {
              const dialogue = selectedScene.dialogues[selectedElement.index];
              if (!dialogue) return null;

              const speaker = characters.find(c => c.id === dialogue.speaker);
              const speakerName = speaker?.name || dialogue.speaker || 'Unknown';

              return (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent px-8 py-6 pointer-events-none"
                  style={{ zIndex: Z_INDEX.CANVAS_DIALOGUE_OVERLAY }}
                >
                  {/* Dialogue Box */}
                  <div className="bg-slate-900/90 backdrop-blur-sm border-2 border-slate-700 rounded-xl p-5 shadow-2xl max-w-4xl mx-auto pointer-events-auto">
                    {/* Speaker Name */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-3 py-1 bg-blue-600 rounded-lg">
                        <span className="text-white font-bold text-sm">{speakerName}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-700" />
                      <span className="text-xs text-slate-500 font-medium">PREVIEW</span>
                    </div>

                    {/* Dialogue Text */}
                    <p className="text-white text-base leading-relaxed mb-4">
                      {dialogue.text || '(empty dialogue)'}
                    </p>

                    {/* Choices */}
                    {dialogue.choices && dialogue.choices.length > 0 && (
                      <div className="space-y-2">
                        {dialogue.choices.map((choice, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-blue-500 rounded-lg px-4 py-2.5 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-200 text-sm group-hover:text-white transition-colors">
                                {choice.text}
                              </span>
                              {choice.effects && choice.effects.length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
                                  {choice.effects.length} effect{choice.effects.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Navigation Hint */}
                    <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                      <span>Dialogue {selectedElement.index + 1} of {selectedScene.dialogues.length}</span>
                      <span>Click dialogue in list below to preview</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Scene Info Bar */}
          <div className="bg-slate-800 px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs">
            <div className="text-slate-400">
              Characters in scene: <span className="text-white font-semibold">{sceneCharacters.length}</span>
            </div>
            <div className="text-slate-400">
              Dialogues: <span className="text-white font-semibold">{dialoguesCount}</span>
            </div>
          </div>
        </div>

        {/* Dialogue Flow Visualization */}
        {dialoguesCount > 0 && (
          <div className="space-y-4">
            {/* Header with toggle buttons */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Dialogue Flow
              </h3>

              {/* View mode toggle */}
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                    viewMode === 'visual'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-label="Visual list view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
                    viewMode === 'graph'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-label="Graph view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Graph
                </button>
              </div>
            </div>

            {/* Conditional rendering: Visual list or Graph view */}
            {viewMode === 'graph' ? (
              // Graph view with ReactFlow
              <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-950" style={{ height: '600px' }}>
                <DialogueGraph
                  selectedScene={selectedScene}
                  selectedElement={selectedElement}
                  onSelectDialogue={onSelectDialogue}
                  onOpenModal={onOpenModal}
                />
              </div>
            ) : (
              // Visual list view (existing)
              <div className="space-y-4">
                {selectedScene.dialogues.map((dialogue, idx) => {
                  const isSelected = selectedElement?.type === 'dialogue' &&
                    selectedElement?.sceneId === selectedScene.id &&
                    selectedElement?.index === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectDialogue?.(selectedScene.id, idx)}
                      className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-blue-400 mb-1">
                            {dialogue.speaker || 'Unknown'}
                          </div>
                          <p className="text-sm text-slate-300">
                            {dialogue.text || '(empty dialogue)'}
                          </p>
                          {dialogue.choices && dialogue.choices.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-semibold text-slate-500 uppercase">
                                Choices:
                              </div>
                              {dialogue.choices.map((choice, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="text-sm text-slate-400 pl-4 border-l-2 border-slate-600 hover:border-blue-500 transition-colors"
                                >
                                  {choice.text}
                                  {choice.effects && choice.effects.length > 0 && (
                                    <span className="ml-2 text-xs text-amber-500">
                                      ({choice.effects.length} effect{choice.effects.length !== 1 ? 's' : ''})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick actions bar (bottom) */}
      <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Scene ID: <span className="text-slate-400 font-mono">{selectedScene.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddDialogue}
              className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              aria-label="Add dialogue to scene"
            >
              + Add Dialogue
            </button>
            <button
              onClick={handleSetBackground}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              aria-label="Set scene background"
            >
              Set Background
            </button>
          </div>
        </div>
      </div>

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
  onOpenModal: PropTypes.func
};

export default MainCanvas;
