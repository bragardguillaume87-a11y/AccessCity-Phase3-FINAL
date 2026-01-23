import React, { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import SkipToContent from './components/SkipToContent';
import HomePage from './components/HomePage';
import EditorShell from './components/EditorShell';
import TokensDemo from "./pages/TokensDemo";
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
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [newQuestName, setNewQuestName] = useState("");
  // Check URL for demo mode (?demo=true) and tokens mode (?tokens=true)
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = urlParams.get('demo') === 'true';
  const isTokensMode = urlParams.get('tokens') === 'true';
  const [currentView, setCurrentView] = useState(
    isTokensMode ? "tokens-demo" :
    "home"
  ); // 'home' | 'editor' | 'tokens-demo'

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
  function handleSelectQuest(id: string) {
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
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <SkipToContent />
      {currentView === "tokens-demo" ? (
        <TokensDemo />
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
      <Toaster position="top-right" richColors closeButton duration={5000} theme="dark" />
    </TooltipProvider>
  );
}

export default App;
