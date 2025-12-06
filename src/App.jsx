import React, { useState } from 'react';
import { AppProvider } from './AppContext.jsx';
import StepNavigation from './components/StepNavigation.jsx';
import SlidePanel from './components/SlidePanel.jsx';
import PreviewCanvas from './components/PreviewCanvas.jsx';
import DemoDataButton from './components/DemoDataButton.jsx';
import AudioToggle from './components/AudioToggle.jsx';

function StudioShell() {
  const [currentModule, setCurrentModule] = useState('scenes');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-purple-200 uppercase tracking-[0.2em]">Créateur de scénarios immersifs</p>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-1">AccessCity Studio</h1>
            <p className="text-slate-300 mt-2">Interface powtoon/violet avec scènes, dialogues, prévisualisation et export.</p>
          </div>
          <div className="flex items-center gap-3">
            <DemoDataButton />
            <AudioToggle />
          </div>
        </header>

        {/* Steps */}
        <div className="bg-slate-900/60 border border-purple-500/30 rounded-2xl px-4 py-3 shadow-xl">
          <StepNavigation currentModule={currentModule} setModule={setCurrentModule} />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-slate-900/60 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <SlidePanel />
          </div>
          <div className="xl:col-span-2 bg-slate-900/60 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden min-h-[70vh]">
            <PreviewCanvas />
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
