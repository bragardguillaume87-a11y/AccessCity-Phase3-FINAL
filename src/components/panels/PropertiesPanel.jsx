import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../AppContext.jsx';
import { AvatarPicker } from '../tabs/characters/components/AvatarPicker.jsx';
import { duplicateDialogue } from '../../utils/duplication.js';

/**
 * PropertiesPanel - Right sidebar for editing selected element properties
 * Displays editable properties for:
 * - Scene (title, description, background)
 * - Character (name, description, sprites)
 * - Dialogue (speaker, text, choices, effects)
 * ASCII only, form-based editing.
 */
function PropertiesPanel({ selectedElement, selectedScene, characters }) {
  const { updateScene, updateCharacter, updateDialogue, addCharacter, addDialogue, scenes } = useApp();
  const [activeTab, setActiveTab] = useState('properties');
  const [newMood, setNewMood] = useState('');
  const [activeMood, setActiveMood] = useState('neutral');

  // Sync activeMood when character changes
  useEffect(() => {
    if (selectedElement?.type === 'character') {
      const char = characters.find(c => c.id === selectedElement.id);
      if (char && char.moods && char.moods.length > 0) {
        setActiveMood(char.moods[0]);
      } else {
        setActiveMood('neutral');
      }
    }
  }, [selectedElement, characters]);

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-slate-500 max-w-xs">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-400 mb-1">No selection</h3>
          <p className="text-xs text-slate-600">
            Select a scene, character, or dialogue to view its properties
          </p>
        </div>
      </div>
    );
  }

  // Render scene properties
  if (selectedElement.type === 'scene' && selectedScene) {
    return (
      <div className="h-full flex flex-col bg-slate-800">
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Scene Properties</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="scene-title" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Title
            </label>
            <input
              id="scene-title"
              type="text"
              value={selectedScene.title || ''}
              onChange={(e) => updateScene(selectedScene.id, { title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter scene title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="scene-description" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="scene-description"
              value={selectedScene.description || ''}
              onChange={(e) => updateScene(selectedScene.id, { description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the scene"
            />
          </div>

          {/* Background URL */}
          <div>
            <label htmlFor="scene-background" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Background Image URL
            </label>
            <input
              id="scene-background"
              type="text"
              value={selectedScene.backgroundUrl || ''}
              onChange={(e) => updateScene(selectedScene.id, { backgroundUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="assets/backgrounds/scene.jpg"
            />
            {selectedScene.backgroundUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={selectedScene.backgroundUrl}
                  alt="Background preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Statistics</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Dialogues:</span>
                <span className="text-slate-300 font-semibold">{selectedScene.dialogues?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scene ID:</span>
                <span className="text-slate-300 font-mono text-[10px]">{selectedScene.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render character properties
  if (selectedElement.type === 'character') {
    const character = characters.find(c => c.id === selectedElement.id);
    if (!character) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Character not found</p>
        </div>
      );
    }

    const isSystemCharacter = character.id === 'player' || character.id === 'narrator';

    // Calculate usage statistics
    const appearancesCount = scenes.filter(scene =>
      scene.dialogues?.some(d => d.speaker === character.id)
    ).length;
    const linesCount = scenes.reduce((total, scene) => {
      const sceneLines = scene.dialogues?.filter(d => d.speaker === character.id).length || 0;
      return total + sceneLines;
    }, 0);

    const handleAddMood = () => {
      if (!newMood.trim()) return;
      const moods = character.moods || [];
      if (moods.includes(newMood.trim())) {
        alert('This mood already exists');
        return;
      }
      updateCharacter({
        ...character,
        moods: [...moods, newMood.trim()],
        sprites: { ...character.sprites, [newMood.trim()]: '' }
      });
      setNewMood('');
      setActiveMood(newMood.trim());
    };

    const handleRemoveMood = (moodToRemove) => {
      if (moodToRemove === 'neutral') {
        alert('Cannot remove the "neutral" mood');
        return;
      }
      const moods = (character.moods || []).filter(m => m !== moodToRemove);
      const sprites = { ...character.sprites };
      delete sprites[moodToRemove];
      updateCharacter({ ...character, moods, sprites });
      if (activeMood === moodToRemove) {
        setActiveMood(moods[0] || 'neutral');
      }
    };

    const handleDuplicate = () => {
      const duplicate = {
        ...character,
        name: `${character.name} (copy)`,
        sprites: { ...character.sprites },
        moods: [...(character.moods || [])]
      };
      delete duplicate.id;
      addCharacter(duplicate);
    };

    return (
      <div className="h-full flex flex-col bg-slate-800">
        {/* Header with duplicate button */}
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Character Properties</h3>
          <button
            onClick={handleDuplicate}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
            title="Duplicate this character"
          >
            📋 Duplicate
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* System character badge */}
          {isSystemCharacter && (
            <div className="px-3 py-2 bg-amber-900/30 border border-amber-600 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">System Character (Protected)</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="char-name" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Name
            </label>
            <input
              id="char-name"
              type="text"
              value={character.name || ''}
              onChange={(e) => updateCharacter({ ...character, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Character name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="char-description" className="block text-xs font-semibold text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              id="char-description"
              value={character.description || ''}
              onChange={(e) => updateCharacter({ ...character, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the character"
            />
          </div>

          {/* Moods (editable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Moods
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {(character.moods || ['neutral']).map((mood) => (
                  <div
                    key={mood}
                    className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all ${
                      activeMood === mood
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    onClick={() => setActiveMood(mood)}
                  >
                    <span className="text-xs font-medium">{mood}</span>
                    {mood !== 'neutral' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMood(mood);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        title="Remove mood"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add mood */}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newMood}
                  onChange={(e) => setNewMood(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMood()}
                  placeholder="Add mood (e.g., happy, angry)"
                  className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddMood}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Sprites (with AvatarPicker) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Avatar for "{activeMood}"
            </label>
            <AvatarPicker
              currentSprites={character.sprites || {}}
              onSelect={(mood, url) => {
                updateCharacter({
                  ...character,
                  sprites: { ...(character.sprites || {}), [mood]: url }
                });
              }}
              mood={activeMood}
              labels={{}}
            />
          </div>

          {/* Usage Statistics */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Usage Statistics</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Appears in scenes:</span>
                <span className="text-slate-300 font-semibold">{appearancesCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total lines:</span>
                <span className="text-slate-300 font-semibold">{linesCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Moods defined:</span>
                <span className="text-slate-300 font-semibold">{(character.moods || []).length}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sprites assigned:</span>
                <span className="text-slate-300 font-semibold">
                  {Object.values(character.sprites || {}).filter(Boolean).length} / {(character.moods || []).length}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Info</h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Character ID:</span>
                <span className="text-slate-300 font-mono text-[10px]">{character.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render dialogue properties
  if (selectedElement.type === 'dialogue' && selectedScene) {
    const dialogue = selectedScene.dialogues?.[selectedElement.index];
    if (!dialogue) {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <p className="text-sm text-slate-500">Dialogue not found</p>
        </div>
      );
    }

    const handleDuplicateDialogue = () => {
      const duplicated = duplicateDialogue(dialogue);
      addDialogue(selectedScene.id, duplicated);
    };

    return (
      <div className="h-full flex flex-col bg-slate-800">
        {/* Header with duplicate button */}
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Dialogue Properties</h3>
          <button
            onClick={handleDuplicateDialogue}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
            title="Duplicate this dialogue"
          >
            📋 Duplicate
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-slate-700">
          <div className="flex px-4" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'properties'}
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-3 text-xs font-semibold transition-colors ${
                activeTab === 'properties'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Properties
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'choices'}
              onClick={() => setActiveTab('choices')}
              className={`px-4 py-3 text-xs font-semibold transition-colors ${
                activeTab === 'choices'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Choices ({dialogue.choices?.length || 0})
            </button>
          </div>
        </div>

        {/* Properties tab */}
        {activeTab === 'properties' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Speaker */}
            <div>
              <label htmlFor="dialogue-speaker" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Speaker
              </label>
              <select
                id="dialogue-speaker"
                value={dialogue.speaker || ''}
                onChange={(e) => updateDialogue(selectedScene.id, selectedElement.index, { speaker: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select speaker --</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text */}
            <div>
              <label htmlFor="dialogue-text" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Text
              </label>
              <textarea
                id="dialogue-text"
                value={dialogue.text || ''}
                onChange={(e) => updateDialogue(selectedScene.id, selectedElement.index, { text: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter dialogue text"
              />
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Info</h4>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Index:</span>
                  <span className="text-slate-300 font-semibold">{selectedElement.index}</span>
                </div>
                <div className="flex justify-between">
                  <span>Choices:</span>
                  <span className="text-slate-300 font-semibold">{dialogue.choices?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Choices tab */}
        {activeTab === 'choices' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Add Choice button */}
            <button
              onClick={() => {
                const newChoice = {
                  id: `choice-${Date.now()}`,
                  text: 'New choice',
                  nextScene: '',
                  effects: []
                };
                const updatedChoices = [...(dialogue.choices || []), newChoice];
                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
              }}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Add Choice
            </button>

            {dialogue.choices && dialogue.choices.length > 0 ? (
              dialogue.choices.map((choice, choiceIdx) => (
                <div key={choiceIdx} className="p-4 bg-slate-900 border-2 border-slate-700 rounded-lg space-y-3">
                  {/* Choice header */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-400">Choice {choiceIdx + 1}</div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete choice ${choiceIdx + 1}?`)) {
                          const updatedChoices = dialogue.choices.filter((_, i) => i !== choiceIdx);
                          updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Choice text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Choice Text
                    </label>
                    <input
                      type="text"
                      value={choice.text || ''}
                      onChange={(e) => {
                        const updatedChoices = [...dialogue.choices];
                        updatedChoices[choiceIdx] = { ...updatedChoices[choiceIdx], text: e.target.value };
                        updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Accept the mission"
                    />
                  </div>

                  {/* Next scene */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Next Scene ID
                    </label>
                    <input
                      type="text"
                      value={choice.nextScene || ''}
                      onChange={(e) => {
                        const updatedChoices = [...dialogue.choices];
                        updatedChoices[choiceIdx] = { ...updatedChoices[choiceIdx], nextScene: e.target.value };
                        updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., scene-2 (optional)"
                    />
                  </div>

                  {/* Dice roll toggle */}
                  <div className="pt-3 border-t border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={choice.diceRoll?.enabled || false}
                        onChange={(e) => {
                          const updatedChoices = [...dialogue.choices];
                          if (!updatedChoices[choiceIdx].diceRoll) {
                            updatedChoices[choiceIdx].diceRoll = {
                              enabled: false,
                              difficulty: 12,
                              successOutcome: { message: '', moral: 0, illustration: '' },
                              failureOutcome: { message: '', moral: 0, illustration: '' }
                            };
                          }
                          updatedChoices[choiceIdx].diceRoll.enabled = e.target.checked;
                          updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                        }}
                        className="w-4 h-4 text-purple-600 border-slate-600 rounded focus:ring-2 focus:ring-purple-500 bg-slate-800"
                      />
                      <span className="text-xs font-semibold text-purple-400">
                        🎲 Enable dice roll
                      </span>
                    </label>
                  </div>

                  {/* Dice configuration */}
                  {choice.diceRoll?.enabled && (
                    <div className="p-3 border border-purple-500/30 rounded-lg bg-purple-900/20 space-y-3">
                      {/* Difficulty */}
                      <div>
                        <label className="block text-xs font-semibold text-purple-300 mb-1.5">
                          Difficulty (1-20)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={choice.diceRoll?.difficulty || 12}
                          onChange={(e) => {
                            const updatedChoices = [...dialogue.choices];
                            if (!updatedChoices[choiceIdx].diceRoll) {
                              updatedChoices[choiceIdx].diceRoll = {
                                enabled: true,
                                difficulty: 12,
                                successOutcome: { message: '', moral: 0, illustration: '' },
                                failureOutcome: { message: '', moral: 0, illustration: '' }
                              };
                            }
                            updatedChoices[choiceIdx].diceRoll.difficulty = parseInt(e.target.value) || 12;
                            updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-purple-500/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-purple-400 mt-1">Player must roll this score or higher (d20)</p>
                      </div>

                      {/* Success outcome */}
                      <div className="p-3 border border-green-500/30 rounded-lg bg-green-900/20">
                        <h4 className="text-xs font-bold text-green-300 mb-2">✅ On Success</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Message</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.successOutcome?.message || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  message: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="e.g., Found a spot!"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Moral Impact</label>
                            <input
                              type="number"
                              value={choice.diceRoll?.successOutcome?.moral || 0}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  moral: parseInt(e.target.value) || 0
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-green-400 mb-1">Illustration</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.successOutcome?.illustration || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.successOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.successOutcome,
                                  illustration: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="parking-success.png"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Failure outcome */}
                      <div className="p-3 border border-red-500/30 rounded-lg bg-red-900/20">
                        <h4 className="text-xs font-bold text-red-300 mb-2">❌ On Failure</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Message</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.failureOutcome?.message || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  message: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="e.g., No spots..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Moral Impact</label>
                            <input
                              type="number"
                              value={choice.diceRoll?.failureOutcome?.moral || 0}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  moral: parseInt(e.target.value) || 0
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="-3"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-red-400 mb-1">Illustration</label>
                            <input
                              type="text"
                              value={choice.diceRoll?.failureOutcome?.illustration || ''}
                              onChange={(e) => {
                                const updatedChoices = [...dialogue.choices];
                                if (!updatedChoices[choiceIdx].diceRoll) {
                                  updatedChoices[choiceIdx].diceRoll = {
                                    enabled: true,
                                    difficulty: 12,
                                    successOutcome: { message: '', moral: 0, illustration: '' },
                                    failureOutcome: { message: '', moral: 0, illustration: '' }
                                  };
                                }
                                updatedChoices[choiceIdx].diceRoll.failureOutcome = {
                                  ...updatedChoices[choiceIdx].diceRoll.failureOutcome,
                                  illustration: e.target.value
                                };
                                updateDialogue(selectedScene.id, selectedElement.index, { choices: updatedChoices });
                              }}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="parking-fail.png"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Effects (legacy support - read-only for now) */}
                  {choice.effects && choice.effects.length > 0 && (
                    <div className="pt-3 border-t border-slate-700">
                      <div className="text-xs font-semibold text-amber-400 mb-2">Effects (legacy):</div>
                      {choice.effects.map((effect, eIdx) => (
                        <div key={eIdx} className="text-xs text-amber-500 ml-2">
                          {effect.variable}: {effect.operation} {effect.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-600">
                <p className="text-sm">No choices for this dialogue</p>
                <p className="text-xs mt-1">Click "+ Add Choice" to create branching</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <p className="text-sm text-slate-500">Unknown element type</p>
    </div>
  );
}

PropertiesPanel.propTypes = {
  selectedElement: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string,
    sceneId: PropTypes.string,
    index: PropTypes.number
  }),
  selectedScene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    backgroundUrl: PropTypes.string,
    dialogues: PropTypes.array
  }),
  characters: PropTypes.array.isRequired
};

export default PropertiesPanel;
