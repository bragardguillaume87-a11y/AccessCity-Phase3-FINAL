import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useScenesStore, useCharactersStore, useSettingsStore, useUIStore } from '../../stores/index.js';
import ContextMenu from '../ui/ContextMenu.jsx';
import AddCharacterToSceneModal from '../modals/AddCharacterToSceneModal.jsx';
import DialogueGraph from '../features/DialogueGraph.jsx';
import TimelinePlayhead from './TimelinePlayhead.jsx';
import { Z_INDEX } from '../../utils/zIndexLayers.js';
import { Button } from '../ui/button.jsx';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import { UserPlus, List, Network, Grid3x3, ChevronLeft, ChevronRight, Maximize2, Minimize2, Eye } from 'lucide-react';
import { useTypewriter } from '../../hooks/useTypewriter.js';
import { logger } from '../../utils/logger.js';

/**
 * Animation variants for character entrance/exit animations
 */
const CHARACTER_ANIMATION_VARIANTS = {
  // No animation
  none: {
    initial: { opacity: 1, scale: 1, x: 0, y: 0 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
    exit: { opacity: 1, scale: 1, x: 0, y: 0 }
  },
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  },
  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { x: -100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { x: 100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { y: 100, opacity: 0, transition: { duration: 0.3 } }
  },
  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { y: -100, opacity: 0, transition: { duration: 0.3 } }
  },
  // Pop animations
  pop: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, type: 'spring', bounce: 0.5 } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
  },
  // Bounce animation
  bounce: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, type: 'spring', bounce: 0.6 } },
    exit: { y: 50, opacity: 0, transition: { duration: 0.3 } }
  }
};

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
  const addScene = useScenesStore(state => state.addScene);
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
  const projectSettings = useSettingsStore(state => state.projectSettings);
  const selectedSceneForEdit = useUIStore(state => state.selectedSceneForEdit);
  const setSelectedSceneForEdit = useUIStore(state => state.setSelectedSceneForEdit);

  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [contextMenuData, setContextMenuData] = useState(null);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'graph'
  const [gridEnabled, setGridEnabled] = useState(true); // Grid toggle state
  const [currentTime, setCurrentTime] = useState(0); // Timeline playhead time
  const [isPlaying, setIsPlaying] = useState(false); // Timeline playback state
  const [dropFeedback, setDropFeedback] = useState(null); // Visual feedback for drops (e.g., 'background')

  // PHASE 6: Fullscreen mode is now managed by parent EditorShell (via props)

  // Typewriter animation state (PHASE 1)
  const [currentDialogueText, setCurrentDialogueText] = useState('');
  const { displayText, isComplete, skip } = useTypewriter(currentDialogueText, {
    speed: 40,
    cursor: true,
    contextAware: true, // Pauses naturelles sur ponctuation
    onComplete: () => logger.debug('[Typewriter] Animation terminée')
  });

  // Update typewriter text when selected dialogue changes (PHASE 1)
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedScene) {
      const dialogue = selectedScene.dialogues?.[selectedElement.index];
      setCurrentDialogueText(dialogue?.text || '');
    } else {
      setCurrentDialogueText('');
    }
  }, [selectedElement, selectedScene]);

  // PHASE 3: Update timeline playhead when dialogue selection changes (ACTION 2)
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedScene && selectedScene.dialogues) {
      const duration = Math.max(60, selectedScene.dialogues.length * 5);
      const dialogueDuration = duration / Math.max(1, selectedScene.dialogues.length);
      const dialogueTime = selectedElement.index * dialogueDuration;
      setCurrentTime(dialogueTime);
    }
  }, [selectedElement, selectedScene]);

  // PHASE 3: Auto-scroll to dialogue in DialoguesPanel when selected (ACTION 3)
  useEffect(() => {
    if (selectedElement?.type === 'dialogue' && selectedElement?.sceneId && selectedElement?.index !== undefined) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const dialogueElement = document.querySelector(
          `[data-dialogue-id="${selectedElement.sceneId}-${selectedElement.index}"]`
        );
        if (dialogueElement) {
          dialogueElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          logger.debug(`[PHASE 3] Auto-scroll to dialogue ${selectedElement.index}`);
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedElement]);

  // PHASE 6: Escape key handler to exit fullscreen mode
  useEffect(() => {
    if (!fullscreenMode || !onFullscreenChange) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onFullscreenChange(null);
        logger.debug('[PHASE 6] Exiting fullscreen mode via Escape');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenMode, onFullscreenChange]);

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

  // PHASE 3: Unified dialogue click handler (delegates to onSelectDialogue, effects handle the rest)
  const handleDialogueClick = useCallback((sceneId, dialogueIndex) => {
    // Simply call onSelectDialogue - the useEffect hooks will handle:
    // - ACTION 1: Preview + typewriter (lines 116-123)
    // - ACTION 2: Timeline playhead update (lines 126-133)
    // - ACTION 3: Auto-scroll to dialogue (lines 136-155)
    if (onSelectDialogue) {
      onSelectDialogue(sceneId, dialogueIndex);
    }
    logger.debug(`[PHASE 3] Dialogue ${dialogueIndex} clicked - effects will sync all 3 actions`);
  }, [onSelectDialogue]);

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
              // Force re-render by temporarily removing and re-adding
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

      if (!selectedScene) return;

      // Calculate position from drop coordinates (for positioned elements)
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp to 0-100 range
      const position = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      };

      switch (data.type) {
        case 'background':
          setSceneBackground(selectedScene.id, data.backgroundUrl);
          // Flash green border feedback
          setDropFeedback('background');
          setTimeout(() => setDropFeedback(null), 500);
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

  if (!selectedScene) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-500 max-w-md">
          <svg className="w-20 h-20 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-400 mb-2">Aucune scène sélectionnée</h2>
          <p className="text-sm text-slate-600">
            Sélectionnez une scène dans l'Explorateur pour commencer
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

            {/* PHASE 6: Fullscreen Mode Buttons + PHASE 7: Gaming animations */}
            <div className="flex items-center gap-1 ml-2 border-l border-slate-600 pl-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFullscreenChange?.(fullscreenMode === 'graph' ? null : 'graph')}
                  className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'graph' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                  aria-label="Mode Graph fullscreen"
                  title="Graph fullscreen (Escape pour quitter)"
                >
                  <Network className="w-4 h-4" aria-hidden="true" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFullscreenChange?.(fullscreenMode === 'canvas' ? null : 'canvas')}
                  className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'canvas' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                  aria-label="Mode Canvas fullscreen"
                  title="Canvas fullscreen (Escape pour quitter)"
                >
                  <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFullscreenChange?.(fullscreenMode === 'preview' ? null : 'preview')}
                  className={`h-8 px-2 transition-all duration-200 ${fullscreenMode === 'preview' ? 'bg-[var(--color-primary)] text-white shadow-[0_0_12px_var(--color-primary)]' : ''}`}
                  aria-label="Mode Preview fullscreen"
                  title="Preview fullscreen (Escape pour quitter)"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Button>
              </motion.div>

              {/* Exit fullscreen button (visible only when in fullscreen) - PHASE 7: Animated entrance */}
              <AnimatePresence>
                {fullscreenMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFullscreenChange?.(null)}
                      className="h-8 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-all duration-200"
                      aria-label="Quitter le mode fullscreen"
                      title="Quitter fullscreen (Escape)"
                    >
                      <Minimize2 className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl font-medium">
                  Déposez le personnage ici
                </div>
              </div>
            )}
            {/* Grid Overlay */}
            {gridEnabled && canvasDimensions.width > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: Z_INDEX.CANVAS_GRID }}
              >
                <defs>
                  <pattern
                    id="grid"
                    width={24}
                    height={24}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="var(--color-border-base)"
                      strokeWidth="1"
                      opacity="0.3"
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
                <p className="text-sm font-medium">Aucun décor défini</p>
                <Button
                  variant="gaming-primary"
                  size="sm"
                  onClick={handleSetBackground}
                  className="mt-2"
                >
                  Choisir décor
                </Button>
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

              // Grid settings - snap to grid when grid is enabled
              const gridSize = 24; // Match grid pattern size
              const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

              // Get animation variant (default to 'none' if not set or invalid)
              const entranceAnimation = sceneChar.entranceAnimation || 'none';
              const animationVariant = CHARACTER_ANIMATION_VARIANTS[entranceAnimation] || CHARACTER_ANIMATION_VARIANTS.none;

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
                  <motion.div
                    className="w-full h-full cursor-move"
                    onClick={() => handleCharacterClick(sceneChar)}
                    onContextMenu={(e) => handleCharacterRightClick(e, sceneChar)}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={animationVariant}
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
                  </motion.div>
                </Rnd>
              );
            })}

            {/* Props Layer (emoji objects) */}
            {canvasDimensions.width > 0 && (selectedScene.props || []).map((prop) => {
              const position = prop.position || { x: 50, y: 50 };
              const size = prop.size || { width: 80, height: 80 };

              // Convert percentage position to pixels (accounting for center transform)
              const pixelX = percentToPixels(position.x, canvasDimensions.width) - (size.width / 2);
              const pixelY = percentToPixels(position.y, canvasDimensions.height) - (size.height / 2);

              // Grid settings - snap to grid when grid is enabled
              const gridSize = 24; // Match grid pattern size
              const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

              return (
                <Rnd
                  key={prop.id}
                  size={{ width: size.width, height: size.height }}
                  position={{ x: pixelX, y: pixelY }}
                  onDragStop={(e, d) => {
                    // Convert pixel position back to percentage (accounting for center transform)
                    const centerX = d.x + (size.width / 2);
                    const centerY = d.y + (size.height / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateProp(selectedScene.id, prop.id, {
                      position: { x: newPercentX, y: newPercentY }
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newWidth = parseInt(ref.style.width);
                    const newHeight = parseInt(ref.style.height);

                    // Convert pixel position back to percentage
                    const centerX = position.x + (newWidth / 2);
                    const centerY = position.y + (newHeight / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateProp(selectedScene.id, prop.id, {
                      position: { x: newPercentX, y: newPercentY },
                      size: { width: newWidth, height: newHeight }
                    });
                  }}
                  dragGrid={dragGrid}
                  resizeGrid={dragGrid}
                  lockAspectRatio={true}
                  style={{ zIndex: Z_INDEX.CANVAS_PROPS }}
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
                  <div className="w-full h-full cursor-move relative">
                    {/* Emoji Prop */}
                    <div className="w-full h-full flex items-center justify-center text-[4rem] group-hover:scale-105 transition-transform select-none">
                      {prop.emoji}
                    </div>

                    {/* Delete button (on hover) */}
                    <button
                      onClick={() => {
                        const confirmed = window.confirm('Remove this prop from the scene?');
                        if (confirmed) {
                          removePropFromScene(selectedScene.id, prop.id);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow-lg"
                      aria-label="Remove prop"
                      title="Remove prop"
                    >
                      ×
                    </button>
                  </div>
                </Rnd>
              );
            })}

            {/* Text Boxes Layer */}
            {canvasDimensions.width > 0 && (selectedScene.textBoxes || []).map((textBox) => {
              const position = textBox.position || { x: 50, y: 50 };
              const size = textBox.size || { width: 300, height: 100 };

              // Convert percentage position to pixels (accounting for center transform)
              const pixelX = percentToPixels(position.x, canvasDimensions.width) - (size.width / 2);
              const pixelY = percentToPixels(position.y, canvasDimensions.height) - (size.height / 2);

              // Grid settings - snap to grid when grid is enabled
              const gridSize = 24; // Match grid pattern size
              const dragGrid = gridEnabled ? [gridSize, gridSize] : [1, 1];

              return (
                <Rnd
                  key={textBox.id}
                  size={{ width: size.width, height: size.height }}
                  position={{ x: pixelX, y: pixelY }}
                  onDragStop={(e, d) => {
                    // Convert pixel position back to percentage (accounting for center transform)
                    const centerX = d.x + (size.width / 2);
                    const centerY = d.y + (size.height / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateTextBox(selectedScene.id, textBox.id, {
                      position: { x: newPercentX, y: newPercentY }
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newWidth = parseInt(ref.style.width);
                    const newHeight = parseInt(ref.style.height);

                    // Convert pixel position back to percentage
                    const centerX = position.x + (newWidth / 2);
                    const centerY = position.y + (newHeight / 2);
                    const newPercentX = pixelsToPercent(centerX, canvasDimensions.width);
                    const newPercentY = pixelsToPercent(centerY, canvasDimensions.height);

                    updateTextBox(selectedScene.id, textBox.id, {
                      position: { x: newPercentX, y: newPercentY },
                      size: { width: newWidth, height: newHeight }
                    });
                  }}
                  dragGrid={dragGrid}
                  resizeGrid={dragGrid}
                  style={{ zIndex: Z_INDEX.CANVAS_TEXTBOXES }}
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
                  <div className="w-full h-full cursor-move relative bg-white/90 backdrop-blur-sm border-2 border-slate-400 rounded-lg p-3 shadow-lg hover:border-blue-500 transition-all">
                    {/* ContentEditable Text */}
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newText = e.currentTarget.textContent;
                        if (newText !== textBox.text) {
                          updateTextBox(selectedScene.id, textBox.id, { text: newText });
                        }
                      }}
                      className="w-full h-full outline-none overflow-auto"
                      style={{
                        fontSize: `${textBox.fontSize || 16}px`,
                        fontWeight: textBox.fontWeight || 'normal',
                        color: textBox.color || '#1e293b',
                        textAlign: textBox.textAlign || 'left'
                      }}
                    >
                      {textBox.text}
                    </div>

                    {/* Delete button (on hover) */}
                    <button
                      onClick={() => {
                        const confirmed = window.confirm('Remove this text box from the scene?');
                        if (confirmed) {
                          removeTextBoxFromScene(selectedScene.id, textBox.id);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold shadow-lg"
                      aria-label="Remove text box"
                      title="Remove text box"
                    >
                      ×
                    </button>
                  </div>
                </Rnd>
              );
            })}

            {/* Grid Toggle & Add Character Buttons (floating - top-right) */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
              {/* Grid Toggle */}
              <label className="flex items-center gap-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border-2 border-[var(--color-border-base)] px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={gridEnabled}
                  onChange={(e) => setGridEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                  aria-label="Toggle grid overlay"
                />
                <Grid3x3 className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Grid</span>
              </label>

              {/* Add Character Button */}
              <Button
                variant="gaming-accent"
                size="sm"
                onClick={handleAddCharacterToScene}
                className="shadow-2xl"
                title="Ajouter un personnage à la scène"
                aria-label="Ajouter un personnage à la scène"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter personnage
              </Button>
            </div>

            {/* Dialogue Preview Overlay - ÉPURÉ (PHASE 1) */}
            {selectedElement?.type === 'dialogue' && selectedElement?.sceneId === selectedScene.id && (() => {
              const dialogue = selectedScene.dialogues[selectedElement.index];
              if (!dialogue) return null;

              const speaker = characters.find(c => c.id === dialogue.speaker);
              const speakerName = speaker?.name || dialogue.speaker || 'Unknown';

              return (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent px-4 py-3 pointer-events-none"
                  style={{ zIndex: Z_INDEX.CANVAS_DIALOGUE_OVERLAY }}
                >
                  {/* Dialogue Box - ÉPURÉ (50% plus petit) */}
                  <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-lg max-w-2xl mx-auto pointer-events-auto">
                    {/* Speaker Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-2 py-0.5 bg-blue-600 rounded-lg">
                        <span className="text-white font-bold text-xs">{speakerName}</span>
                      </div>
                      <div className="flex-1 h-px bg-slate-700" />
                      <span className="text-xs text-slate-500 font-medium">PREVIEW</span>
                    </div>

                    {/* Dialogue Text avec Typewriter + Skip */}
                    <p
                      className="text-white text-sm leading-relaxed mb-3 cursor-pointer transition-opacity hover:opacity-90"
                      onClick={() => skip()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          skip();
                        }
                      }}
                      aria-label="Cliquez ou appuyez sur espace pour passer l'animation"
                    >
                      {displayText || '(empty dialogue)'}
                    </p>

                    {/* Choices */}
                    {dialogue.choices && dialogue.choices.length > 0 && (
                      <div className="space-y-1.5">
                        {dialogue.choices.map((choice, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-blue-500 rounded-lg px-3 py-2 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-200 text-sm group-hover:text-white transition-colors">
                                {choice.text}
                              </span>
                              {choice.effects && choice.effects.length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-amber-900/30 border border-amber-700 text-amber-300 rounded">
                                  {choice.effects.length} effet{choice.effects.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Navigation Controls - Gaming Style */}
                    <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedElement.index > 0) {
                              onSelectDialogue?.(selectedScene.id, selectedElement.index - 1);
                            }
                          }}
                          disabled={selectedElement.index === 0}
                          className="h-7 px-2 text-xs hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                          aria-label="Dialogue précédent"
                        >
                          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
                          Précédent
                        </Button>
                        <Button
                          variant="gaming-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedElement.index < selectedScene.dialogues.length - 1) {
                              onSelectDialogue?.(selectedScene.id, selectedElement.index + 1);
                            }
                          }}
                          disabled={selectedElement.index >= selectedScene.dialogues.length - 1}
                          className="h-7 px-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                          aria-label="Dialogue suivant"
                        >
                          Suivant
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{selectedElement.index + 1} / {selectedScene.dialogues.length}</span>
                        <span className="opacity-70">{isComplete ? '✓' : '...'}</span>
                      </div>
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
                Déroulement
              </h3>

              {/* View mode toggle */}
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList>
                  <TabsTrigger value="visual">
                    <List className="h-4 w-4" />
                    Liste
                  </TabsTrigger>
                  <TabsTrigger value="graph">
                    <Network className="h-4 w-4" />
                    Arbre
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Conditional rendering: Visual list or Graph view */}
            {viewMode === 'graph' ? (
              // Graph view with ReactFlow
              <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-950" style={{ height: '600px' }}>
                <DialogueGraph
                  selectedScene={selectedScene}
                  selectedElement={selectedElement}
                  onSelectDialogue={handleDialogueClick}
                  onOpenModal={onOpenModal}
                />
              </div>
            ) : (
              // Visual list view (existing) - PHASE 3: Using unified handler
              <div className="space-y-4">
                {selectedScene.dialogues.map((dialogue, idx) => {
                  const isSelected = selectedElement?.type === 'dialogue' &&
                    selectedElement?.sceneId === selectedScene.id &&
                    selectedElement?.index === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleDialogueClick(selectedScene.id, idx)}
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
                                      ({choice.effects.length} effet{choice.effects.length !== 1 ? 's' : ''})
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

      {/* Timeline Playhead */}
      <TimelinePlayhead
        currentTime={currentTime}
        duration={Math.max(60, dialoguesCount * 5)} // 5 seconds per dialogue, min 60s
        dialogues={selectedScene?.dialogues || []}
        onSeek={(time) => setCurrentTime(time)}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        isPlaying={isPlaying}
      />

      {/* Quick actions bar (bottom) */}
      <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Scene ID: <span className="text-slate-400 font-mono">{selectedScene.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="gaming-success"
              size="sm"
              onClick={handleAddDialogue}
              aria-label="Ajouter un dialogue à la scène"
            >
              + Ajouter dialogue
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSetBackground}
              aria-label="Définir l'arrière-plan de la scène"
            >
              Choisir décor
            </Button>
          </div>
        </div>
      </div>

      {/* PHASE 4: Right Panel Toggle Button + PHASE 7: Gaming animations */}
      {onToggleRightPanel && (
        <motion.div
          className="fixed right-0 top-1/2 -translate-y-1/2"
          style={{ zIndex: Z_INDEX.CANVAS_FLOATING_BUTTONS }}
          initial={{ x: 0 }}
          whileHover={{ x: -4, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRightPanel}
            className="h-12 w-8 rounded-l-lg rounded-r-none bg-[var(--color-bg-elevated)] border-2 border-r-0 border-[var(--color-border-base)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)] hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] shadow-lg transition-all duration-300"
            aria-label={isRightPanelOpen ? 'Masquer le panneau éléments' : 'Afficher le panneau éléments'}
            title={isRightPanelOpen ? 'Masquer le panneau éléments' : 'Afficher le panneau éléments'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isRightPanelOpen ? 0 : 180 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {isRightPanelOpen ? (
                <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
              )}
            </motion.div>
          </Button>
        </motion.div>
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
  isRightPanelOpen: PropTypes.bool,
  onToggleRightPanel: PropTypes.func,
  fullscreenMode: PropTypes.oneOf([null, 'graph', 'canvas', 'preview']),
  onFullscreenChange: PropTypes.func
};

export default MainCanvas;
