import React, { useState, useEffect } from 'react';
import StudioShell from './StudioShell.jsx';
import OnboardingModal from './OnboardingModal.jsx';

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

  function handleCompleteOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  function handleSkipOnboarding() {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
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
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
        />
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

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
            AccessCity Studio {demoMode && '(MODE DEMO)'}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">
            Choisis ton espace et ton histoire
          </h1>
          <p className="mt-3 text-slate-700 max-w-2xl mx-auto">
            Un espace correspond a une personne ou a un groupe. 
            Dans cet espace, tu peux creer jusqu a 5 histoires differentes en version gratuite.
          </p>
        </header>

        <section
          aria-labelledby="space-section-title"
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
        >
          <h2
            id="space-section-title"
            className="text-lg font-semibold text-slate-900"
          >
            1. Choisir un espace
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Pour le moment, un seul espace est disponible sur cet ordinateur.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              className="border border-purple-500 bg-purple-50 rounded-xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600"
              aria-pressed="true"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-purple-600">
                Espace actif
              </div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                Espace local {demoMode && '(DEMO)'}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {demoMode ? 'Histoires de demonstration' : 'Histoires creees sur cet ordinateur'}
              </div>
            </button>
          </div>
        </section>

        <section
          aria-labelledby="stories-section-title"
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
        >
          <h2
            id="stories-section-title"
            className="text-lg font-semibold text-slate-900"
          >
            2. Choisir ton histoire dans cet espace
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Chaque histoire est une aventure differente. Tu peux en creer plusieurs.
          </p>

          <div className="mt-4 space-y-2" role="list">
            {stories.length === 0 && (
              <p className="text-sm text-slate-600">
                Aucune histoire pour le moment. Cree ta premiere histoire ci dessous.
              </p>
            )}

            {stories.map(story => (
              <button
                key={story.id}
                type="button"
                role="listitem"
                onClick={() => setSelectedStoryId(story.id)}
                className={
                  'w-full text-left border rounded-xl px-4 py-3 flex items-center justify-between gap-3 ' +
                  (selectedStoryId === story.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50')
                }
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {story.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    {demoMode ? 'Histoire demo' : 'Histoire locale'}
                  </div>
                </div>
                {selectedStoryId === story.id && (
                  <span className="text-xs font-semibold text-purple-700">
                    Selectionnee
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Tu peux avoir jusqu a {MAX_FREE_STORIES} histoires dans cet espace (version gratuite).
          </p>

          <form
            className="mt-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center"
            onSubmit={handleCreateStory}
          >
            <label className="flex-1 text-sm text-slate-800">
              Nom de la nouvelle histoire
              <input
                type="text"
                value={newStoryName}
                onChange={event => setNewStoryName(event.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600"
                placeholder="Exemple : La visite a la mairie"
                disabled={demoMode}
              />
            </label>
            <button
              type="submit"
              className="md:self-end bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600"
              disabled={
                demoMode ||
                !newStoryName.trim() ||
                stories.length >= MAX_FREE_STORIES
              }
            >
              Creer une nouvelle histoire
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenStory}
              disabled={!selectedStory}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
            >
              Ouvrir cette histoire
            </button>
            <button
              type="button"
              onClick={() => selectedStory && handleDeleteStory(selectedStory.id)}
              disabled={!selectedStory || demoMode}
              className="text-sm font-semibold text-red-700 border border-red-200 bg-red-50 px-4 py-2 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
            >
              Supprimer cette histoire
            </button>
          </div>
        </section>

        <footer className="mt-4 text-xs text-slate-500 text-center space-x-4">
          <button type="button" className="underline underline-offset-2">
            Comment ca marche ?
          </button>
          <button type="button" className="underline underline-offset-2">
            Accessibilite
          </button>
          <button type="button" className="underline underline-offset-2">
            A propos d AccessCity
          </button>
          <button 
            type="button" 
            onClick={handleResetOnboarding}
            className="underline underline-offset-2 text-purple-600 hover:text-purple-700"
            title="Revoir la visite guidee"
          >
            Revoir la visite guidee
          </button>
          {!demoMode && (
            <button 
              type="button" 
              onClick={handleActivateDemoMode}
              className="underline underline-offset-2 text-amber-600 hover:text-amber-700"
              title="Activer le mode demonstration"
            >
              Mode Demo
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export default ScenarioEditorShell;