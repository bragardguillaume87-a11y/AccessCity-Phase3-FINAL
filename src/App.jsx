import React, { useState } from 'react';
import { AppProvider } from './AppContext.jsx';
import ScenesPanel from './components/ScenesPanel.jsx';
import DialoguesPanel from './components/DialoguesPanel.jsx';

function StudioShell() {
  const [currentModule, setCurrentModule] = useState('scenes');

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
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow p-6">
            {currentModule === 'scenes' && (
              <div className="text-center text-slate-500 py-12">
                <p>Selectionnez une scene a gauche pour voir ses details.</p>
              </div>
            )}
            {currentModule === 'dialogues' && <DialoguesPanel />}
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
