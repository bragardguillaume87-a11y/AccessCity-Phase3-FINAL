import React, { useState, useEffect } from 'react';
import StudioShell from './StudioShell.jsx';
import OnboardingModal from './OnboardingModal.jsx';
import { useValidation } from '../hooks/useValidation.js';

/**
 * ScenarioEditorShell
 * 
 * MVP: ecran d accueil tres simple pour:
 * - choisir un "espace" local (pour l instant un seul, "Espace local")
 * - lister quelques histoires (stockees dans localStorage)
 * - creer / ouvrir une histoire
 * - ensuite afficher StudioShell pour editer les scenes et dialogues
 * 
 * NOTE IMPORTANTE:
 * - Version MVP tres simple, pas de profils multiples reels
 * - Pas de persistance avancee: on utilise localStorage avec une seule cle
 * - Le but est de preparer la structure et de valider le flow UX
 */

const STORAGE_KEY = 'ac_scenario_stories_v1';
const ONBOARDING_KEY = 'ac_onboarding_completed';

const DEMO_STORIES = [
  {
    id: 'demo-1',
    name: 'La visite a la mairie',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    name: 'Le trajet en bus accessible',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    name: 'Au restaurant avec des amis',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function loadStoriesFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load stories from storage', e);
    return [];
  }
}

function saveStoriesToStorage(stories) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error('Failed to save stories to storage', e);
  }
}

function ScenarioEditorShell() {
  const [currentView, setCurrentView] = useState('home');
  const [stories, setStories] = useState(() => loadStoriesFromStorage());
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [newStoryName, setNewStoryName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !window.localStorage.getItem(ONBOARDING_KEY);
  });
  const [demoMode, setDemoMode] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [realStories, setRealStories] = useState([]);
  const [storyNameError, setStoryNameError] = useState(false);

  const MAX_FREE_STORIES = 5;

  const selectedStory = stories.find(s => s.id === selectedStoryId) || null;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleCloseOnboarding() {
    // OnboardingModal already writes ONBOARDING_KEY before closing.
    setShowOnboarding(false);
  }

  function handleResetOnboarding() {
    window.localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }

  function handleActivateDemoMode() {
    setRealStories(stories);
    setStories(DEMO_STORIES);
    setDemoMode(true);
    setSelectedStoryId(null);
    setShowOnboarding(true);
  }

  function handleExitDemoMode() {
    setStories(realStories);
    setDemoMode(false);
    setSelectedStoryId(null);
  }

  function handleCreateStory(event) {
    event.preventDefault();
    const trimmed = newStoryName.trim();
    if (!trimmed) {
      // Déclencher animation shake-error
      setStoryNameError(true);
      setTimeout(() => setStoryNameError(false), 400);
      return;
    }
    if (demoMode) {
      window.alert('Tu es en mode demo. Les modifications ne seront pas sauvegardees.');
      return;
    }
    if (stories.length >= MAX_FREE_STORIES) {
      window.alert('Tu as deja 5 histoires dans cet espace (version gratuite). Supprime une histoire ou passe en version atelier.');
      return;
    }
    const newStory = {
      id: Date.now().toString(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const nextStories = [...stories, newStory];
    setStories(nextStories);
    saveStoriesToStorage(nextStories);
    setNewStoryName('');
    setSelectedStoryId(newStory.id);
  }

  function handleOpenStory() {
    if (!selectedStory) {
      return;
    }
    setCurrentView('editor');
  }

  function handleBackToHome() {
    setCurrentView('home');
  }

  function handleDeleteStory(storyId) {
    if (demoMode) {
      window.alert('Tu es en mode demo. Les modifications ne seront pas sauvegardees.');
      return;
    }
    const story = stories.find(s => s.id === storyId);
    if (!story) {
      return;
    }
    const confirmMessage = 'Es tu sur de vouloir supprimer cette histoire ? Cette action est definitive.';
    const ok = window.confirm(confirmMessage);
    if (!ok) {
      return;
    }
    const nextStories = stories.filter(s => s.id !== storyId);
    setStories(nextStories);
    saveStoriesToStorage(nextStories);
    if (selectedStoryId === storyId) {
      setSelectedStoryId(null);
    }
  }

  function handleDevResetAll() {
    const confirmMessage = 'ATTENTION DEV : Cela va supprimer TOUTES les histoires et reinitialiser l\'onboarding. Confirmer ?';
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    window.location.reload();
  }

  function handleDevResetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
    setShowDevTools(false);
  }

  function handleDevLoadDemo() {
    setStories(DEMO_STORIES);
    saveStoriesToStorage(DEMO_STORIES);
    setShowDevTools(false);
  }

  function handleDevClearStories() {
    const confirmed = window.confirm('Supprimer toutes les histoires (onboarding preserve) ?');
    if (!confirmed) return;
    
    localStorage.removeItem(STORAGE_KEY);
    setStories([]);
    setSelectedStoryId(null);
    setShowDevTools(false);
  }

  if (currentView === 'editor' && selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
        {demoMode && (
          <div className="bg-amber-500 text-white text-center py-2 px-4 font-semibold text-sm">
            MODE DEMO - Les modifications ne seront pas sauvegardees
            <button
              onClick={handleExitDemoMode}
              className="ml-4 underline hover:text-amber-100"
            >
              Quitter le mode demo
            </button>
          </div>
        )}
        <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                Espace local {demoMode && '(DEMO)'}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                Histoire : {selectedStory.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleBackToHome}
              className="text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-700"
            >
              Retour a l accueil
            </button>
          </div>
        </header>
        <StudioShell />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {demoMode && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 font-semibold text-sm">
          🎭 MODE DEMO - Les modifications ne seront pas sauvegardees
          <button
            onClick={handleExitDemoMode}
            className="ml-4 underline hover:text-amber-100"
          >
            Quitter le mode demo
          </button>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal onClose={handleCloseOnboarding} />
      )}

      {showDevTools && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white rounded-lg shadow-2xl p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              🛠️ Outils Developpeur
            </h3>
            <button
              onClick={() => setShowDevTools(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleDevResetOnboarding}
              className="w-full text-left text-xs bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded transition-colors"
            >
              Reset Onboarding
            </button>
            <button
              onClick={handleDevLoadDemo}
              className="w-full text-left text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
            >
              Charger histoires demo
            </button>
            <button
              onClick={handleDevClearStories}
              className="w-full text-left text-xs bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded transition-colors"
            >
              Supprimer histoires
            </button>
            <button
              onClick={handleDevResetAll}
              className="w-full text-left text-xs bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
            >
              RESET COMPLET
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Raccourci : Ctrl+Shift+D
          </p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section - Compact Game-like */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-game-purple to-game-pink text-white rounded-full text-xs font-bold mb-3 shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
            <span className="uppercase tracking-wider">AccessCity Studio {demoMode && '· DEMO'}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-game-purple via-game-pink to-game-teal mb-2 leading-tight">
            Bienvenue dans ton Studio
          </h1>

          <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-4">
            Cree des <span className="text-game-purple font-bold">scenarios interactifs</span> accessibles pour sensibiliser aux <span className="text-game-teal font-bold">situations de handicap</span>
          </p>

          {/* Compact badges */}
          <div className="flex justify-center gap-2 text-xs">
            <span className="px-2 py-1 bg-game-purple/10 border border-game-purple/30 rounded-lg text-game-purple font-semibold">🎮 Interface ludique</span>
            <span className="px-2 py-1 bg-game-teal/10 border border-game-teal/30 rounded-lg text-game-teal font-semibold">♿ Accessible WCAG AA</span>
            <span className="px-2 py-1 bg-game-orange/10 border border-game-orange/30 rounded-lg text-game-orange font-semibold">⚡ Facile à utiliser</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* COLONNE GAUCHE - ESPACE */}
          <section
            aria-labelledby="space-section-title"
            className="bg-white border border-game-purple/20 rounded-xl shadow-sm hover:shadow-md p-4 h-fit transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-game-purple to-game-pink rounded-lg flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h2
                  id="space-section-title"
                  className="text-base font-bold text-slate-900"
                >
                  🏝️ Ton Espace
                </h2>
                <p className="text-xs text-game-purple font-medium">
                  Environnement de travail
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-game-purple/5 to-game-teal/5 border border-game-purple/20 rounded-lg p-4 hover:border-game-purple/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-game-purple to-game-pink text-white rounded-full text-[10px] font-bold uppercase">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Actif
                </span>
                <svg className="w-6 h-6 text-game-purple/30 group-hover:text-game-purple/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-game-purple transition-colors">
                Espace local {demoMode && '(DEMO)'}
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                {demoMode ? '🎭 Histoires de demonstration' : '💾 Histoires creees sur cet ordinateur'}
              </p>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-md border border-game-purple/10">
                <svg className="w-4 h-4 text-game-purple" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
                <span className="text-xs font-bold text-slate-900">{stories.length}/{MAX_FREE_STORIES} histoires</span>
              </div>
            </div>

            <div className="mt-3 px-3 py-2 bg-game-purple/5 rounded-lg border border-game-purple/10">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <span className="text-game-purple font-bold">💡</span> Un espace regroupe plusieurs histoires. Version gratuite : <span className="font-bold text-game-purple">{MAX_FREE_STORIES} max</span>.
              </p>
            </div>
          </section>

          {/* COLONNE DROITE - HISTOIRES */}
          <section
            aria-labelledby="stories-section-title"
            className="bg-white border border-game-teal/20 rounded-xl shadow-sm hover:shadow-md p-4 transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-game-teal to-game-blue rounded-lg flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h2
                  id="stories-section-title"
                  className="text-base font-bold text-slate-900"
                >
                  📚 Tes Quêtes
                </h2>
                <p className="text-xs text-game-teal font-medium">
                  Selectionne ou cree une aventure
                </p>
              </div>
            </div>

            {/* Liste des histoires */}
            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2" role="list">
              {stories.length === 0 && (
                <div className="text-center py-12 px-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune histoire pour le moment</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Commence par creer ta premiere histoire ci-dessous
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    Remplis le formulaire plus bas
                  </div>
                </div>
              )}

              {stories.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  role="listitem"
                  onClick={() => setSelectedStoryId(story.id)}
                  className={`
                    magnetic-lift-teal group w-full text-left border rounded-lg px-3 py-2.5
                    ${selectedStoryId === story.id
                      ? 'border-game-teal bg-gradient-to-r from-game-teal/10 to-game-blue/10 shadow-depth-sm'
                      : 'border-slate-200 bg-white hover:border-game-teal/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${selectedStoryId === story.id
                        ? 'bg-gradient-to-br from-game-teal to-game-blue'
                        : 'bg-slate-100 group-hover:bg-game-teal/10'
                      }
                    `}>
                      <svg className={`w-5 h-5 transition-all ${selectedStoryId === story.id ? 'text-white' : 'text-slate-600 group-hover:text-game-teal'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate mb-0.5 transition-colors ${selectedStoryId === story.id ? 'text-game-teal' : 'text-slate-900'}`}>
                        {story.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${demoMode ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
                          {demoMode ? '🎭' : '💾'} {demoMode ? 'Demo' : 'Local'}
                        </span>
                        {story.updatedAt && (
                          <span className="text-slate-400">
                            {new Date(story.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {selectedStoryId === story.id && (
                          <span className="ml-auto text-game-teal font-bold">✓ Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Indicateur de quota - Compact */}
            {stories.length > 0 && (
              <div className="mb-4 bg-gradient-to-r from-game-orange/5 to-game-pink/5 border border-game-orange/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">📊 Quota</span>
                  <span className={`text-sm font-bold ${
                    stories.length >= MAX_FREE_STORIES ? 'text-red-600' : 'text-game-teal'
                  }`}>{stories.length}/{MAX_FREE_STORIES}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all progress-bar-shimmer ${
                      stories.length >= MAX_FREE_STORIES
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : stories.length >= MAX_FREE_STORIES * 0.8
                        ? 'bg-gradient-to-r from-game-orange to-game-orange-hover'
                        : 'bg-gradient-to-r from-game-teal to-game-blue'
                    }`}
                    style={{ width: `${(stories.length / MAX_FREE_STORIES) * 100}%` }}
                  />
                </div>
                <p className={`mt-2 text-[11px] ${stories.length >= MAX_FREE_STORIES ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                  {stories.length >= MAX_FREE_STORIES
                    ? '⚠️ Limite atteinte !'
                    : `✨ ${MAX_FREE_STORIES - stories.length} quête${MAX_FREE_STORIES - stories.length > 1 ? 's' : ''} restante${MAX_FREE_STORIES - stories.length > 1 ? 's' : ''}`}
                </p>
              </div>
            )}

            {/* Formulaire de création - Compact */}
            <div className="bg-gradient-to-br from-game-purple/5 to-game-pink/5 border border-dashed border-game-purple/30 rounded-lg p-3 hover:border-game-purple/50 transition-all">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-4 h-4 text-game-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <h3 className="text-sm font-bold text-slate-900">✨ Nouvelle Quête</h3>
              </div>

              <form onSubmit={handleCreateStory} className="space-y-2">
                <input
                  id="new-story-name"
                  type="text"
                  value={newStoryName}
                  onChange={event => {
                    setNewStoryName(event.target.value);
                    if (storyNameError) setStoryNameError(false);
                  }}
                  className={`w-full border bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    storyNameError
                      ? 'shake-error'
                      : 'border-game-purple/30 focus:border-game-purple focus:ring-game-purple/20'
                  }`}
                  placeholder="Ex: La visite a la mairie"
                  disabled={demoMode}
                />
                <button
                  type="submit"
                  className="btn-gradient-primary w-full text-white font-semibold px-3 py-2 rounded-lg disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-game-purple focus-visible:outline-offset-2"
                  disabled={
                    demoMode ||
                    !newStoryName.trim() ||
                    stories.length >= MAX_FREE_STORIES
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Créer cette quête
                </button>
              </form>
            </div>

            {/* Actions sur l'histoire selectionnee - Compact */}
            <div className="pt-4 border-t border-game-teal/20 space-y-2">
              <button
                type="button"
                onClick={handleOpenStory}
                disabled={!selectedStory}
                className="btn-gradient-teal w-full text-white font-semibold px-4 py-2.5 rounded-lg disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-game-teal focus-visible:outline-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
                <span className="text-sm">
                  {selectedStory ? `🚀 Lancer "${selectedStory.name}"` : '⚠️ Sélectionne une quête'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectedStory && handleDeleteStory(selectedStory.id)}
                disabled={!selectedStory || demoMode}
                className="w-full text-sm font-semibold text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-red-400 focus-visible:outline-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Supprimer
              </button>
            </div>
          </section>
        </div>

        {/* Footer ameliore */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
            <button type="button" className="hover:text-slate-700 underline-offset-2 hover:underline transition-colors">
              Comment ca marche ?
            </button>
            <button type="button" className="hover:text-slate-700 underline-offset-2 hover:underline transition-colors">
              Accessibilite
            </button>
            <button type="button" className="hover:text-slate-700 underline-offset-2 hover:underline transition-colors">
              A propos d'AccessCity
            </button>
            <button
              type="button"
              onClick={handleResetOnboarding}
              className="text-purple-600 hover:text-purple-700 underline-offset-2 hover:underline transition-colors font-semibold"
              title="Revoir la visite guidee"
            >
              🎓 Revoir la visite guidee
            </button>
            {!demoMode && (
              <button
                type="button"
                onClick={handleActivateDemoMode}
                className="text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors font-semibold"
                title="Activer le mode demonstration"
              >
                🎭 Mode Demo
              </button>
            )}
          </div>
          <p className="text-center mt-6 text-xs text-slate-400">
            Fait avec ❤️ pour l'accessibilite • AccessCity Studio v2.0
          </p>
        </footer>
      </div>
    </div>
  );
}

export default ScenarioEditorShell;