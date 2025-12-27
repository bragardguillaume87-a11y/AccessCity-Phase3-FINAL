import React, { useState } from "react";
import { AppProvider } from "./AppContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import SkipToContent from "./components/SkipToContent.jsx";
import HomePage from "./components/HomePage.jsx";
import EditorShell from "./components/EditorShell.jsx";
import DesignSystemDemo from "./pages/DesignSystemDemo.jsx";
import { Toaster } from "sonner";

// État initial des quêtes (données de démo)
const DEMO_QUESTS = [
  {
    id: "demo-1",
    name: "La visite à la mairie",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function App() {
  const [quests, setQuests] = useState(() => {
    // On peut charger depuis localStorage ici si besoin
    return DEMO_QUESTS;
  });
  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [newQuestName, setNewQuestName] = useState("");
  // Check URL for demo mode (?demo=true)
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
  const [currentView, setCurrentView] = useState(isDemoMode ? "design-demo" : "home"); // 'home' | 'editor' | 'design-demo'

  // Créer une nouvelle quête
  function handleCreateQuest() {
    if (!newQuestName.trim()) return;
    if (quests.length >= 5) return;
    const newQuest = {
      id: `quest-${Date.now()}`,
      name: newQuestName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuests([...quests, newQuest]);
    setNewQuestName("");
    setSelectedQuestId(newQuest.id);
  }

  // Sélectionner une quête
  function handleSelectQuest(id) {
    setSelectedQuestId(id);
  }

  // Lancer l'éditeur pour la quête sélectionnée
  function handleLaunchEditor() {
    if (!selectedQuestId) return;
    setCurrentView("editor");
  }

  // Supprimer la quête sélectionnée
  function handleDeleteQuest() {
    if (!selectedQuestId) return;
    setQuests(quests.filter((q) => q.id !== selectedQuestId));
    setSelectedQuestId(null);
  }

  // Retour à l'accueil
  function handleBackHome() {
    setCurrentView("home");
  }

  return (
    <AppProvider>
      <ToastProvider>
        <SkipToContent />
        {currentView === "design-demo" ? (
          <DesignSystemDemo />
        ) : currentView === "editor" ? (
          <EditorShell onBack={handleBackHome} />
        ) : (
          <HomePage
            quests={quests}
            selectedQuestId={selectedQuestId}
            newQuestName={newQuestName}
            onNewQuestNameChange={setNewQuestName}
            onCreateQuest={handleCreateQuest}
            onSelectQuest={handleSelectQuest}
            onLaunchEditor={handleLaunchEditor}
            onDeleteQuest={handleDeleteQuest}
          />
        )}
        <Toaster position="top-center" richColors closeButton />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
