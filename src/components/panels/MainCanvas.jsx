import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../AppContext.jsx';
import ContextMenu from '../ui/ContextMenu.jsx';

/**
 * MainCanvas - Center panel for visual scene editing
 * GDevelop-style visual editor with:
 * - Background image preview
 * - Character sprites positioned on scene
 * - Dialogue flow visualization
 * - Quick actions
 */
function MainCanvas({ selectedScene, scenes, selectedElement, onOpenModal }) {
  const { addDialogue, characters, addCharacterToScene, removeCharacterFromScene, updateSceneCharacter } = useApp();
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [contextMenuData, setContextMenuData] = useState(null);

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
          label: 'Position Character',
          icon: '🎯',
          onClick: () => {
            alert('Drag character sprites to reposition (coming soon)');
          },
          disabled: true
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

    // Simple MVP: prompt for character selection
    if (characters.length === 0) {
      alert('No characters available. Create characters first using the Characters modal.');
      return;
    }

    const characterList = characters.map((c, idx) => `${idx + 1}. ${c.name} (${c.id})`).join('\n');
    const choice = prompt(`Select character to add:\n\n${characterList}\n\nEnter character number (1-${characters.length}):`);

    if (!choice) return;

    const index = parseInt(choice) - 1;
    if (index >= 0 && index < characters.length) {
      const character = characters[index];
      addCharacterToScene(selectedScene.id, character.id, 'neutral', { x: 50, y: 50 });
    } else {
      alert('Invalid character number');
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

  const dialoguesCount = selectedScene.dialogues?.length || 0;
  const sceneCharacters = selectedScene.characters || [];

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
          {/* Scene Canvas Container */}
          <div
            className="relative aspect-video bg-slate-950 flex items-center justify-center"
            style={{
              backgroundImage: selectedScene.backgroundUrl ? `url(${selectedScene.backgroundUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* No background placeholder */}
            {!selectedScene.backgroundUrl && (
              <div className="text-center text-slate-700">
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
            {sceneCharacters.map((sceneChar) => {
              const character = characters.find(c => c.id === sceneChar.characterId);
              if (!character) return null;

              const sprite = character.sprites?.[sceneChar.mood || 'neutral'];
              const position = sceneChar.position || { x: 50, y: 50 };

              return (
                <div
                  key={sceneChar.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => handleCharacterClick(sceneChar)}
                  onContextMenu={(e) => handleCharacterRightClick(e, sceneChar)}
                >
                  {/* Character Sprite */}
                  {sprite ? (
                    <img
                      src={sprite}
                      alt={character.name}
                      className="h-32 w-auto drop-shadow-lg group-hover:scale-110 transition-transform"
                      draggable="false"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}

                  {/* Fallback for broken images */}
                  <div className="hidden w-16 h-16 bg-slate-700 rounded-full items-center justify-center border-2 border-slate-600">
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
              );
            })}

            {/* Add Character Button (floating) */}
            <button
              onClick={handleAddCharacterToScene}
              className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Character to Scene
            </button>
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
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Dialogue Flow
            </h3>

            {selectedScene.dialogues.map((dialogue, idx) => {
              const isSelected = selectedElement?.type === 'dialogue' &&
                selectedElement?.sceneId === selectedScene.id &&
                selectedElement?.index === idx;

              return (
                <div
                  key={idx}
                  className={`rounded-lg border-2 p-4 transition-all ${
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
    </div>
  );
}

MainCanvas.propTypes = {
  selectedScene: PropTypes.object,
  scenes: PropTypes.array.isRequired,
  selectedElement: PropTypes.object,
  onOpenModal: PropTypes.func
};

export default MainCanvas;
