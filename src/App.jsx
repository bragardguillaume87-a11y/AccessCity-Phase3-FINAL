import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext.jsx';
import ScenesPanel from './components/ScenesPanel.jsx';
import DialoguesPanel from './components/DialoguesPanel.jsx';
import BackgroundPanel from './components/BackgroundPanel.jsx';
import CharactersPanel from './components/CharactersPanel.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import PlayerPreview from './components/PlayerPreview.jsx';

function StudioShell() {
  const { selectedSceneId, scenes } = useApp();
  const [currentModule, setCurrentModule] = useState('scenes');
  const [showPreview, setShowPreview] = useState(false);

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  if (showPreview && selectedScene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 p-6">
        <PlayerPreview scene={selectedScene} onExit={() => setShowPreview(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600 uppercase tracking-[0.2em]">Editeur de scenarios</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-1">AccessCity Studio</h1>
            <p className="text-slate-600 mt-2">Creez vos scenarios immersifs avec scenes, dialogues et personnages.</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            disabled={!selectedScene}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previsualiser
          </button>
        </header>

        {/* Tabs pour modules */}
        <div className="flex gap-4 border-b border-slate-300">
          <button
            onClick={() => setCurrentModule('scenes')}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              currentModule === 'scenes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scenes
          </button>
          <button
            onClick={() => setCurrentModule('dialogues')}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              currentModule === 'dialogues'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dialogues
          </button>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow p-6">
            <ScenesPanel />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
              {currentModule === 'scenes' && (
                <div className="text-center text-slate-500 py-8">
                  <p>Selectionnez une scene a gauche pour voir ses details.</p>
                </div>
              )}
              {currentModule === 'dialogues' && <DialoguesPanel />}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
              <BackgroundPanel />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow p-6">
              <CharactersPanel />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow p-6 xl:col-span-3">
              <ExportPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <StudioShell />
    </AppProvider>
  );
}

export default App;
