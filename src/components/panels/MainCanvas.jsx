import React from 'react';
import PropTypes from 'prop-types';

/**
 * MainCanvas - Center panel for visual scene editing
 * Displays the selected scene with:
 * - Background preview
 * - Dialogue flow visualization (placeholder for now)
 * - Quick actions
 * ASCII only, prepared for future visual editor.
 */
function MainCanvas({ selectedScene, scenes, selectedElement }) {
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
        {/* Background preview (if available) */}
        {selectedScene.backgroundUrl && (
          <div className="mb-6 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
            <div className="bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300">
              Scene Background
            </div>
            <div className="aspect-video bg-slate-900 flex items-center justify-center">
              <img
                src={selectedScene.backgroundUrl}
                alt={`Background for ${selectedScene.title}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center text-slate-600">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="ml-3 text-sm">Image not available</span>
              </div>
            </div>
          </div>
        )}

        {/* Dialogues flow visualization (placeholder) */}
        {dialoguesCount > 0 ? (
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
        ) : (
          <div className="text-center py-12 text-slate-600">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm font-medium">No dialogues in this scene</p>
            <p className="text-xs text-slate-700 mt-1">
              Use the Dialogues panel to add interactions
            </p>
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
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              aria-label="Add dialogue to scene"
            >
              + Add Dialogue
            </button>
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              aria-label="Set scene background"
            >
              Set Background
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

MainCanvas.propTypes = {
  selectedScene: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    backgroundUrl: PropTypes.string,
    dialogues: PropTypes.array
  }),
  scenes: PropTypes.array.isRequired,
  selectedElement: PropTypes.shape({
    type: PropTypes.string,
    sceneId: PropTypes.string,
    index: PropTypes.number
  })
};

export default MainCanvas;
