import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useScenesStore, useCharactersStore } from '../../stores/index.js';

/**
 * ExplorerPanel - Left sidebar for project navigation
 * Displays hierarchical tree of:
 * - Scenes (with dialogues count)
 * - Characters
 * ASCII only, accessible navigation.
 */
function ExplorerPanel({
  scenes,
  characters,
  selectedSceneId,
  selectedElement,
  onSceneSelect,
  onCharacterSelect,
  onDialogueSelect
}) {
  // Zustand actions (granular selectors)
  const addScene = useScenesStore(state => state.addScene);
  const deleteScene = useScenesStore(state => state.deleteScene);
  const addCharacter = useCharactersStore(state => state.addCharacter);
  const deleteCharacter = useCharactersStore(state => state.deleteCharacter);

  const [expandedScenes, setExpandedScenes] = useState(new Set([selectedSceneId]));
  const [activeSection, setActiveSection] = useState('scenes');

  const toggleSceneExpanded = (sceneId) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const handleAddScene = () => {
    const newId = addScene();
    setExpandedScenes(prev => new Set([...prev, newId]));
  };

  const handleDeleteScene = (sceneId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this scene?')) {
      deleteScene(sceneId);
    }
  };

  const handleDeleteCharacter = (charId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this character?')) {
      deleteCharacter(charId);
    }
  };

  const isSceneSelected = (sceneId) => {
    return selectedElement?.type === 'scene' && selectedElement?.id === sceneId;
  };

  const isCharacterSelected = (charId) => {
    return selectedElement?.type === 'character' && selectedElement?.id === charId;
  };

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Section tabs */}
      <div className="flex border-b border-slate-700 flex-shrink-0" role="tablist" aria-label="Explorer sections">
        <button
          role="tab"
          aria-selected={activeSection === 'scenes'}
          aria-controls="scenes-panel"
          onClick={() => setActiveSection('scenes')}
          className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
            activeSection === 'scenes'
              ? 'bg-slate-700 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          Scenes ({scenes.length})
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'characters'}
          aria-controls="characters-panel"
          onClick={() => setActiveSection('characters')}
          className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
            activeSection === 'characters'
              ? 'bg-slate-700 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          Characters ({characters.length})
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Scenes section */}
        {activeSection === 'scenes' && (
          <div id="scenes-panel" role="tabpanel" aria-labelledby="scenes-tab" className="p-2">
            <div className="mb-2">
              <button
                onClick={handleAddScene}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                aria-label="Ajouter une nouvelle scène"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle Scène
              </button>
            </div>

            <nav aria-label="Scenes list" role="tree">
              {scenes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <p>No scenes yet</p>
                  <p className="text-xs mt-1">Click above to create one</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {scenes.map((scene) => {
                    const isExpanded = expandedScenes.has(scene.id);
                    const isSelected = isSceneSelected(scene.id);
                    const dialoguesCount = scene.dialogues?.length || 0;

                    return (
                      <li key={scene.id} role="treeitem" aria-expanded={isExpanded}>
                        <div
                          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                          onClick={() => onSceneSelect(scene.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSceneExpanded(scene.id);
                            }}
                            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>

                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                          </svg>

                          <span className="flex-1 truncate text-sm font-medium">
                            {scene.title || 'Untitled scene'}
                          </span>

                          {dialoguesCount > 0 && (
                            <span className="flex-shrink-0 text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">
                              {dialoguesCount}
                            </span>
                          )}

                          <button
                            onClick={(e) => handleDeleteScene(scene.id, e)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity"
                            aria-label="Delete scene"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Dialogues list (when expanded) */}
                        {isExpanded && dialoguesCount > 0 && (
                          <ul className="ml-6 mt-1 space-y-0.5" role="group">
                            {scene.dialogues.map((dialogue, idx) => {
                              const isDlgSelected = selectedElement?.type === 'dialogue' &&
                                selectedElement?.sceneId === scene.id &&
                                selectedElement?.index === idx;

                              return (
                                <li key={idx} role="treeitem">
                                  <div
                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors ${
                                      isDlgSelected
                                        ? 'bg-blue-500 text-white'
                                        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                    }`}
                                    onClick={() => onDialogueSelect(scene.id, idx)}
                                  >
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <span className="flex-1 truncate">
                                      {dialogue.speaker || 'Unknown'}: {dialogue.text?.substring(0, 30) || '...'}
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </div>
        )}

        {/* Characters section */}
        {activeSection === 'characters' && (
          <div id="characters-panel" role="tabpanel" aria-labelledby="characters-tab" className="p-2">
            <div className="mb-2">
              <button
                onClick={addCharacter}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                aria-label="Add new character"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Character
              </button>
            </div>

            <nav aria-label="Characters list">
              {characters.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <p>No characters yet</p>
                  <p className="text-xs mt-1">Click above to create one</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {characters.map((char) => {
                    const isSelected = isCharacterSelected(char.id);

                    return (
                      <li key={char.id}>
                        <div
                          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                          onClick={() => onCharacterSelect(char.id)}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>

                          <span className="flex-1 truncate text-sm font-medium">
                            {char.name || 'Unnamed character'}
                          </span>

                          <button
                            onClick={(e) => handleDeleteCharacter(char.id, e)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity"
                            aria-label="Delete character"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

ExplorerPanel.propTypes = {
  scenes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    dialogues: PropTypes.array
  })).isRequired,
  characters: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string
  })).isRequired,
  selectedSceneId: PropTypes.string,
  selectedElement: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string,
    sceneId: PropTypes.string,
    index: PropTypes.number
  }),
  onSceneSelect: PropTypes.func.isRequired,
  onCharacterSelect: PropTypes.func.isRequired,
  onDialogueSelect: PropTypes.func.isRequired
};

export default ExplorerPanel;
