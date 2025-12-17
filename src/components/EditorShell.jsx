import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext.jsx';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import ProblemsPanel from './ProblemsPanel.jsx';
import CommandPalette from './CommandPalette.jsx';
import { useValidation } from '../hooks/useValidation.js';

const ExplorerPanel = React.lazy(() => import('./panels/ExplorerPanel.jsx'));
const MainCanvas = React.lazy(() => import('./panels/MainCanvas.jsx'));
const PropertiesPanel = React.lazy(() => import('./panels/PropertiesPanel.jsx'));

/**
 * EditorShell - New 3-pane editor layout (GDevelop-like)
 * Replaces StudioShell progressively with:
 * - Left: ExplorerPanel (scenes/dialogues/characters tree)
 * - Center: MainCanvas (visual editing, scene preview)
 * - Right: PropertiesPanel (properties of selected element)
 * ASCII only, no hardcoded French strings.
 */
export default function EditorShell() {
  const {
    scenes,
    characters,
    selectedSceneForEdit,
    setSelectedSceneForEdit,
    lastSaved,
    isSaving,
    undo,
    redo,
    canUndo,
    canRedo
  } = useApp();

  const validation = useValidation();
  const [, _forceUpdate] = useState(0);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

  // Force re-render every second for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      _forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to calculate time since last save
  const getTimeSinceLastSave = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  // Handler for ProblemsPanel navigation
  const handleNavigateTo = (tab, params) => {
    if (params?.sceneId) {
      setSelectedSceneForEdit(params.sceneId);
    }
    setShowProblemsPanel(false);
  };

  // Handler for scene selection from Explorer
  const handleSceneSelect = (sceneId) => {
    setSelectedSceneForEdit(sceneId);
    setSelectedElement({ type: 'scene', id: sceneId });
  };

  // Handler for character selection from Explorer
  const handleCharacterSelect = (charId) => {
    setSelectedElement({ type: 'character', id: charId });
  };

  // Handler for dialogue selection from Explorer
  const handleDialogueSelect = (sceneId, dialogueIndex) => {
    setSelectedSceneForEdit(sceneId);
    setSelectedElement({ type: 'dialogue', sceneId, index: dialogueIndex });
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneForEdit);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts
        activeTab="editor"
        setActiveTab={() => {}}
        onOpenCommandPalette={(mode) => setCommandPaletteOpen(mode || true)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={!!commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        mode={typeof commandPaletteOpen === 'string' ? commandPaletteOpen : 'commands'}
        setActiveTab={() => {}}
      />

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  AccessCity Studio
                </div>
                <h1 className="text-xl font-bold text-white mt-0.5">
                  Editor
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Undo/Redo buttons */}
              <div className="flex items-center gap-1 border-r border-slate-600 pr-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                    canUndo
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                  title="Undo | Shortcut: Ctrl+Z"
                  aria-label="Undo"
                >
                  ↶
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                    canRedo
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                  title="Redo | Shortcut: Ctrl+Y"
                  aria-label="Redo"
                >
                  ↷
                </button>
              </div>

              {/* Validation badge (clickable) */}
              {validation.hasIssues && (
                <button
                  onClick={() => setShowProblemsPanel(!showProblemsPanel)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-md ${
                    validation.totalErrors > 0
                      ? 'bg-red-900/30 border-red-600 text-red-300 hover:bg-red-900/50'
                      : 'bg-amber-900/30 border-amber-600 text-amber-300 hover:bg-amber-900/50'
                  }`}
                  title="Click to see details"
                  aria-label={`${validation.totalErrors} errors, ${validation.totalWarnings} warnings`}
                >
                  <span className="font-bold text-xs">
                    {validation.totalErrors > 0 ? '!' : '⚠'}
                  </span>
                  <div className="text-xs font-semibold">
                    {validation.totalErrors > 0 && <div>{validation.totalErrors}</div>}
                    {validation.totalWarnings > 0 && <div>{validation.totalWarnings}</div>}
                  </div>
                </button>
              )}

              {/* Auto-save indicator */}
              <div className="text-right">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Saved {getTimeSinceLastSave()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    <span>Not saved yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problems Panel (displayed at top when activated) */}
      {showProblemsPanel && (
        <div className="bg-slate-800 border-b border-slate-700 animate-fadeIn flex-shrink-0">
          <ProblemsPanel onNavigateTo={handleNavigateTo} />
        </div>
      )}

      {/* Main 3-pane layout */}
      <main className="flex-1 flex overflow-hidden" id="main-content" tabIndex="-1">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading editor...</p>
            </div>
          </div>
        }>
          {/* Left panel: Explorer */}
          <aside
            className="w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0 overflow-y-auto"
            role="complementary"
            aria-label="Project explorer"
          >
            <ExplorerPanel
              scenes={scenes}
              characters={characters}
              selectedSceneId={selectedSceneForEdit}
              selectedElement={selectedElement}
              onSceneSelect={handleSceneSelect}
              onCharacterSelect={handleCharacterSelect}
              onDialogueSelect={handleDialogueSelect}
            />
          </aside>

          {/* Center panel: Main Canvas */}
          <div className="flex-1 bg-slate-900 overflow-auto" role="main">
            <MainCanvas
              selectedScene={selectedScene}
              scenes={scenes}
              selectedElement={selectedElement}
            />
          </div>

          {/* Right panel: Properties */}
          <aside
            className="w-80 bg-slate-800 border-l border-slate-700 flex-shrink-0 overflow-y-auto"
            role="complementary"
            aria-label="Properties panel"
          >
            <PropertiesPanel
              selectedElement={selectedElement}
              selectedScene={selectedScene}
              characters={characters}
            />
          </aside>
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 flex-shrink-0">
        <div className="px-6 py-2 text-center text-xs text-slate-500">
          AccessCity Studio - Accessible scenario editor
        </div>
      </footer>
    </div>
  );
}
