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

  const MAX_FREE_STORIES = 5;

  const selectedStory = stories.find(s => s.id === selectedStoryId) || null;

  function handleCloseOnboarding() {
    // OnboardingModal already writes ONBOARDING_KEY before closing.
    setShowOnboarding(false);
  }

  function handleResetOnboarding() {
    window.localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }

  function handleCreateStory(event) {
    event.preventDefault();
    const trimmed = newStoryName.trim();
    if (!trimmed) {
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

  if (currentView === 'editor' && selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
        <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                Espace local
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
      {showOnboarding && (
        <OnboardingModal onClose={handleCloseOnboarding} />
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
            AccessCity Studio
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
                Espace local
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Histoires creees sur cet ordinateur
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
                    Histoire locale
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
              />
            </label>
            <button
              type="submit"
              className="md:self-end bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600"
              disabled={
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
              disabled={!selectedStory}
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
        </footer>
      </div>
    </div>
  );
}

export default ScenarioEditorShell;