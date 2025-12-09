import React, { useState } from 'react';
import { useApp } from '../AppContext.jsx';
import ScenesPanel from './ScenesPanel.jsx';
import DialoguesPanel from './DialoguesPanel.jsx';
import BackgroundPanel from './BackgroundPanel.jsx';
import CharactersPanel from './CharactersPanel.jsx';
import ExportPanel from './ExportPanel.jsx';
import ImportPanel from './ImportPanel.jsx';
import OnboardingModal from './OnboardingModal.jsx';
import PlayerPreview from './PlayerPreview.jsx';
import AccessibleTabs, { TabPanel } from './AccessibleTabs.jsx';

function StudioShell() {
  const { selectedSceneId, scenes } = useApp();
  const [currentModule, setCurrentModule] = useState('scenes');
  const [showPreview, setShowPreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem('ac_onboarding_completed');
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
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
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Previsualiser
          </button>
        </header>

        <nav role="navigation" aria-label="Modules de l editeur">
          <AccessibleTabs
            tabs={tabs}
            activeTab={currentModule}
            onChange={setCurrentModule}
            ariaLabel="Modules de l editeur"
          />
        </nav>

        <main id="main-content" tabIndex="-1" role="main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside
              aria-label="Liste des scenes"
              className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
            >
              <ScenesPanel />
            </aside>

            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <section className="md:col-span-2 xl:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <TabPanel id="scenes" isActive={currentModule === 'scenes'}>
                  <div className="text-center text-slate-500 py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <p className="font-medium text-slate-600">Aucune scene selectionnee</p>
                    <p className="text-sm mt-2">Selectionnez une scene a gauche pour voir ses details</p>
                  </div>
                </TabPanel>
                <TabPanel id="dialogues" isActive={currentModule === 'dialogues'}>
                  <DialoguesPanel />
                </TabPanel>
              </section>

              <section
                aria-label="Arriere-plan"
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden"
              >
                <BackgroundPanel />
              </section>

              <section
                aria-label="Personnages"
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden"
              >
                <CharactersPanel />
              </section>

              <section
                aria-label="Import et Export"
                className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
              >
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

export default StudioShell;
