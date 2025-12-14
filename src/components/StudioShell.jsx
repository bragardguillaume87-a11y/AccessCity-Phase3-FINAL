import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext.jsx';
<<<<<<< HEAD
import ScenesPanel from './ScenesPanel.jsx';
import DialoguesPanel from './DialoguesPanel.jsx';
import BackgroundPanel from './BackgroundPanel.jsx';
import CharactersPanel from './CharactersPanel.jsx';
import ExportPanel from './ExportPanel.jsx';
import ImportPanel from './ImportPanel.jsx';
import OnboardingModal from './OnboardingModal.jsx';
import PlayerPreview from './PlayerPreview.jsx';
import AccessibleTabs, { TabPanel } from './AccessibleTabs.jsx';
import MainCanvas from './MainCanvas.jsx';
=======
import { useValidation } from '../hooks/useValidation.js';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import ProblemsPanel from './ProblemsPanel.jsx';
import CommandPalette from './CommandPalette.jsx';
>>>>>>> 47b5c6801cbcf41ba9012343a0aa6c2cdd3f48bd

<<<<<<< HEAD
function StudioShell() {
  const { selectedSceneId, scenes } = useApp();
  const [currentModule, setCurrentModule] = useState('scenes');
  const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem('ac_onboarding_completed');
  });
=======
// Lazy import des panels
const ContextPanel = React.lazy(() => import('./ContextPanel.jsx'));
const CharactersPanel = React.lazy(() => import('./CharactersPanel.jsx'));
const AssetsLibraryPanel = React.lazy(() => import('./AssetsLibraryPanel.jsx'));
const ScenesPanel = React.lazy(() => import('./ScenesPanel.jsx'));
const DialoguesPanel = React.lazy(() => import('./DialoguesPanel.jsx'));
const PreviewPanel = React.lazy(() => import('./PreviewPanel.jsx'));
const ExportPanel = React.lazy(() => import('./ExportPanel.jsx'));
>>>>>>> 47b5c6801cbcf41ba9012343a0aa6c2cdd3f48bd

export default function StudioShell() {
  const [activeTab, setActiveTab] = useState('context');
  const { lastSaved, isSaving, undo, redo, canUndo, canRedo, setSelectedSceneForEdit } = useApp();
  const validation = useValidation();
  const [, forceUpdate] = useState(0);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Force re-render toutes les secondes pour mettre a jour le temps ecoule
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper pour calculer le temps ecoulé depuis la dernière sauvegarde
  const getTimeSinceLastSave = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const tabs = [
    { id: 'scenes', label: 'Scenes' },
    { id: 'dialogues', label: 'Dialogues' }
  
        { id: 'editor', label: 'Éditeur' },
    { id: 'context', label: '1. Contexte', icon: '📝', description: 'Definir le cadre du scenario' },
    { id: 'characters', label: '2. Personnages', icon: '👥', description: 'Creer les personnages' },
    { id: 'scenes', label: '3. Scenes', icon: '🎬', description: 'Construire l\'histoire scene par scene' },
    { id: 'dialogues', label: '4. Dialogues', icon: '💬', description: 'Ecrire les interactions et choix' },
    { id: 'library', label: 'Bibliothèque', icon: '📚', description: 'Gérer les assets du projet', isAnnex: true },
    { id: 'preview', label: 'Preview', icon: '▶️', description: 'Tester le scenario en direct', isAnnex: true },
    { id: 'export', label: 'Export', icon: '📦', description: 'Exporter le projet JSON', isAnnex: true }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  // Handler pour la navigation depuis ProblemsPanel
  const handleNavigateTo = (tab, params) => {
    setActiveTab(tab);
    if (params?.sceneId) {
      setSelectedSceneForEdit(params.sceneId);
    }
    setShowProblemsPanel(false);
  };

  // Mode preview: on masque header/nav pour une experience plein ecran
  if (activeTab === 'preview') {
    return (
      <div className="min-h-screen bg-slate-900">
        <React.Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-300">Chargement de la preview...</p>
            </div>
          </div>
        }>
          <PreviewPanel onPrev={() => setActiveTab('dialogues')} onNext={() => setActiveTab('export')} />
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Raccourcis clavier globaux */}
      <KeyboardShortcuts
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={(mode) => setCommandPaletteOpen(mode || true)}
      />

<<<<<<< HEAD
        <nav role="navigation" aria-label="Modules de l editeur">
          <AccessibleTabs
            tabs={tabs}
                activeTab={activeTab}            onChange={setActiveTab}
            ariaLabel="Modules de l editeur"
          />
        </nav>
=======
      {/* Command Palette */}
      <CommandPalette
        isOpen={!!commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        mode={typeof commandPaletteOpen === 'string' ? commandPaletteOpen : 'commands'}
        setActiveTab={setActiveTab}
      />
>>>>>>> 47b5c6801cbcf41ba9012343a0aa6c2cdd3f48bd

      <header className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Editeur Local
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                🎮 AccessCity Studio V2
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Generateur de scenarios interactifs complets
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Boutons Undo/Redo */}
              <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    canUndo
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Annuler | Raccourci: Ctrl+Z"
                >
                  ↶ Annuler
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    canRedo
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Refaire | Raccourci: Ctrl+Y"
                >
                  ↷ Refaire
                </button>
              </div>

<<<<<<< HEAD
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {activeTab === 'editor' && (
                                              <MainCanvas
                                                                selectedScene={selectedScene}
                                                                                  scenes={scenes}
                                                                                                    onSceneSelect={(id) => {}}
                                                                                                                    />
                                                                                                                                  )}
              <section className="md:col-span-2 xl:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <TabPanel id="scenes" isActive={currentModule === 'scenes'}>
                  <div className="text-center text-slate-500 py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <p className="font-medium text-slate-600">Aucune scene selectionnee</p>
                    <p className="text-sm mt-2">Selectionnez une scene a gauche pour voir ses details</p>
=======
              {/* Badge de validation globale (cliquable) */}
              {validation.hasIssues && (
                <button
                  onClick={() => setShowProblemsPanel(!showProblemsPanel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all hover:shadow-md ${
                    validation.totalErrors > 0
                      ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                      : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  }`}
                  title="Cliquez pour voir les détails"
                >
                  <span className="font-bold text-sm">
                    {validation.totalErrors > 0 ? '🔴' : '⚠️'}
                  </span>
                  <div className="text-xs font-semibold">
                    {validation.totalErrors > 0 && <div>{validation.totalErrors} erreur{validation.totalErrors > 1 ? 's' : ''}</div>}
                    {validation.totalWarnings > 0 && <div>{validation.totalWarnings} avertissement{validation.totalWarnings > 1 ? 's' : ''}</div>}
>>>>>>> 47b5c6801cbcf41ba9012343a0aa6c2cdd3f48bd
                  </div>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Indicateur d'auto-sauvegarde */}
              <div className="text-right">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sauvegarde...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sauvegarde il y a {getTimeSinceLastSave()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    <span>Pas encore sauvegarde</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setActiveTab('preview')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                aria-label="Aller a la previsualisation"
                title="Prévisualiser | Raccourci: Ctrl+Shift+V"
              >
                Previsualiser
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-2" role="tablist">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const prevTab = index > 0 ? tabs[index - 1] : null;
              const showSeparator = tab.isAnnex && !prevTab?.isAnnex;

              return (
                <React.Fragment key={tab.id}>
                  {showSeparator && (
                    <div className="h-8 w-px bg-slate-300 mx-1" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : tab.isAnnex
                        ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex="-1" className="max-w-7xl mx-auto px-6 py-8">
        {/* Problems Panel (affiché en haut quand activé) */}
        {showProblemsPanel && (
          <div className="mb-6 animate-fadeIn">
            <ProblemsPanel onNavigateTo={handleNavigateTo} />
          </div>
        )}

        <div className="animate-fadeIn">
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <p className="text-sm text-blue-800 font-medium">
              {currentTab?.description}
            </p>
          </div>

          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Chargement...</p>
              </div>
            </div>
          }>
            {activeTab === 'context' && <ContextPanel onNext={() => setActiveTab('characters')} />}
            {activeTab === 'characters' && <CharactersPanel onPrev={() => setActiveTab('context')} onNext={() => setActiveTab('scenes')} />}
            {activeTab === 'library' && <AssetsLibraryPanel onPrev={() => setActiveTab('characters')} onNext={() => setActiveTab('scenes')} />}
            {activeTab === 'scenes' && <ScenesPanel onPrev={() => setActiveTab('characters')} onNext={() => setActiveTab('dialogues')} />}
            {activeTab === 'dialogues' && <DialoguesPanel onPrev={() => setActiveTab('scenes')} onNext={() => setActiveTab('preview')} />}
            {activeTab === 'preview' && <PreviewPanel onPrev={() => setActiveTab('dialogues')} onNext={() => setActiveTab('export')} />}
            {activeTab === 'export' && <ExportPanel onPrev={() => setActiveTab('preview')} />}
          </React.Suspense>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-slate-500">
          AccessCity Studio V2 - Editeur de scenarios accessibles
        </div>
      </footer>
    </div>
  );
}
