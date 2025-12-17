import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../AppContext.jsx';

/**
 * PropertiesPanel - Right sidebar for editing selected element properties
 * Displays editable properties for:
 * - Scene (title, description, background)
 * - Character (name, description, sprites)
 * - Dialogue (speaker, text, choices, effects)
 * ASCII only, form-based editing.
 */
function PropertiesPanel({ selectedElement, selectedScene, characters }) {
  const { updateScene, updateCharacter, updateDialogue } = useApp();
  const [activeTab, setActiveTab] = useState('properties');

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

    return (
      <div className="h-full flex flex-col bg-slate-800">
        <div className="flex-shrink-0 border-b border-slate-700 px-4 py-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Character Properties</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* Moods */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Moods
            </label>
            <div className="text-xs text-slate-500">
              {character.moods && character.moods.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {character.moods.map((mood, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {mood}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic">No moods defined</p>
              )}
            </div>
          </div>

          {/* Sprites */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Sprites
            </label>
            <div className="space-y-2 text-xs">
              {character.sprites && Object.keys(character.sprites).length > 0 ? (
                Object.entries(character.sprites).map(([mood, url]) => (
                  <div key={mood} className="p-2 bg-slate-900 border border-slate-700 rounded-lg">
                    <div className="font-semibold text-slate-400 mb-1">{mood}</div>
                    <div className="text-slate-600 font-mono text-[10px] break-all">{url || '(empty)'}</div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 italic">No sprites defined</p>
              )}
            </div>
          </div>

          {/* Stats */}
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

    return (
      <div className="h-full flex flex-col bg-slate-800">
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
            {dialogue.choices && dialogue.choices.length > 0 ? (
              dialogue.choices.map((choice, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="text-xs font-semibold text-blue-400 mb-1">Choice {idx + 1}</div>
                  <div className="text-sm text-slate-300 mb-2">{choice.text}</div>
                  {choice.effects && choice.effects.length > 0 && (
                    <div className="text-xs text-slate-500">
                      <div className="font-semibold mb-1">Effects:</div>
                      {choice.effects.map((effect, eIdx) => (
                        <div key={eIdx} className="ml-2 text-amber-500">
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
                <p className="text-xs mt-1">Linear dialogue with no branching</p>
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
