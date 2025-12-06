import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext.jsx';
import ScenesPanel from './components/ScenesPanel.jsx';
import DialoguesPanel from './components/DialoguesPanel.jsx';
import BackgroundPanel from './components/BackgroundPanel.jsx';
import CharactersPanel from './components/CharactersPanel.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import ImportPanel from './components/ImportPanel.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import PlayerPreview from './components/PlayerPreview.jsx';
import SkipToContent from './components/SkipToContent.jsx';
import AccessibleTabs, { TabPanel } from './components/AccessibleTabs.jsx';

function StudioShell() {
  const { selectedSceneId, scenes } = useApp();
  const [currentModule, setCurrentModule] = useState('scenes');
  const [showPreview, setShowPreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem('ac_onboarded');
  });

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  const tabs = [
    { id: 'scenes', label: 'Scenes' },
    { id: 'dialogues', label: 'Dialogues' }
  ];

  if (showPreview && selectedScene) {
    return (
      <main
        id="main-content"
        tabIndex="-1"
        role="main"
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 p-6"
      >
        <PlayerPreview scene={selectedScene} onExit={() => setShowPreview(false)} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* Header */}
        <header role="banner" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-700 uppercase tracking-[0.2em]">Editeur de scenarios</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-1">AccessCity Studio</h1>
            <p className="text-slate-700 mt-2">Creez vos scenarios immersifs avec scenes, dialogues et personnages.</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            disabled={!selectedScene}
            aria-label="Previsualiser la scene selectionnee"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previsualiser
          </button>
        </header>

        {/* Navigation tabs */}
        <nav role="navigation" aria-label="Modules de l editeur">
          <AccessibleTabs
            tabs={tabs}
            activeTab={currentModule}
            onChange={setCurrentModule}
            ariaLabel="Modules de l editeur"
          />
        </nav>

        {/* Main content */}
        <main id="main-content" tabIndex="-1" role="main">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenes sidebar */}
            <aside aria-label="Liste des scenes" className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow p-6">
              <ScenesPanel />
            </aside>

            {/* Main panels area */}
            <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Tab panels */}
              <section className="bg-white border border-slate-200 rounded-2xl shadow p-6">
                <TabPanel id="scenes" isActive={currentModule === 'scenes'}>
                  <div className="text-center text-slate-500 py-8">
                    <p>Selectionnez une scene a gauche pour voir ses details.</p>
                  </div>
                </TabPanel>
                <TabPanel id="dialogues" isActive={currentModule === 'dialogues'}>
                  <DialoguesPanel />
                </TabPanel>
              </section>

              {/* Background panel */}
              <section aria-label="Arriere-plan" className="bg-white border border-slate-200 rounded-2xl shadow p-6">
                <BackgroundPanel />
              </section>

              {/* Characters panel */}
              <section aria-label="Personnages" className="bg-white border border-slate-200 rounded-2xl shadow p-6">
                <CharactersPanel />
              </section>

              {/* Import/Export panel */}
              <section aria-label="Import et Export" className="bg-white border border-slate-200 rounded-2xl shadow p-6 xl:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ExportPanel />
                  <ImportPanel />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <SkipToContent />
      <StudioShell />
    </AppProvider>
  );
}

export default App;
