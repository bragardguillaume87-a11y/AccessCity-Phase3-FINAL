import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [scenes, setScenes] = useState([
    {
      id: 'scene_001',
      title: 'Rencontre Mairie',
      description: 'Premiere scene avec accessibilite',
      dialogues: [
        {
          speaker: 'narrator',
          text: 'Vous arrivez devant la mairie.',
          choices: []
        },
        {
          speaker: 'counsellor',
          text: 'Bienvenue ! Parlons accessibilite.',
          choices: [
            { text: 'Je suis motive !', effects: [] },
            { text: 'Pas beaucoup de temps.', effects: [] }
          ]
        }
      ]
    },
    {
      id: 'scene_002',
      title: 'Suite',
      description: 'Deuxieme scene',
      dialogues: [
        {
          speaker: 'narrator',
          text: 'Une nouvelle journee commence...',
          choices: []
        }
      ]
    }
  ]);

  const [characters, setCharacters] = useState([
    {
      id: 'narrator',
      name: 'Narrateur',
      role: 'Voix off',
      avatarUrl: '🎙️'
    },
    {
      id: 'counsellor',
      name: 'Conseiller',
      role: 'Municipal',
      avatarUrl: '👔'
    }
  ]);

  const [selectedSceneForEdit, setSelectedSceneForEdit] = useState('scene_001');
  const [selectedDialogueForEdit, setSelectedDialogueForEdit] = useState(null);

  const addScene = useCallback((title = 'Nouvelle scene') => {
    const newScene = {
      id: `scene_${Date.now()}`,
      title,
      description: '',
      dialogues: []
    };
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneForEdit(newScene.id);
  }, []);

  const updateScene = useCallback((sceneId, updates) => {
    setScenes(prev =>
      prev.map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      )
    );
  }, []);

  const deleteScene = useCallback((sceneId) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    setSelectedSceneForEdit(null);
  }, []);

  const addDialogue = useCallback((sceneId, dialogueData) => {
    setScenes(prev =>
      prev.map(s =>
        s.id === sceneId
          ? { ...s, dialogues: [...(s.dialogues || []), dialogueData] }
          : s
      )
    );
  }, []);

  const updateDialogue = useCallback((sceneId, dialogueIndex, updates) => {
    setScenes(prev =>
      prev.map(s =>
        s.id === sceneId
          ? {
              ...s,
              dialogues: s.dialogues.map((d, idx) =>
                idx === dialogueIndex ? { ...d, ...updates } : d
              )
            }
          : s
      )
    );
  }, []);

  const deleteDialogue = useCallback((sceneId, dialogueIndex) => {
    setScenes(prev =>
      prev.map(s =>
        s.id === sceneId
          ? {
              ...s,
              dialogues: s.dialogues.filter((_, idx) => idx !== dialogueIndex)
            }
          : s
      )
    );
  }, []);

  const addCharacter = useCallback((name = 'Nouveau personnage') => {
    const newCharacter = {
      id: `char_${Date.now()}`,
      name,
      role: '',
      avatarUrl: '👤'
    };
    setCharacters(prev => [...prev, newCharacter]);
  }, []);

  const updateCharacter = useCallback((charId, updates) => {
    setCharacters(prev =>
      prev.map(c =>
        c.id === charId ? { ...c, ...updates } : c
      )
    );
  }, []);

  const deleteCharacter = useCallback((charId) => {
    setCharacters(prev => prev.filter(c => c.id !== charId));
  }, []);

  const value = {
    scenes,
    characters,
    selectedSceneForEdit,
    setSelectedSceneForEdit,
    selectedDialogueForEdit,
    setSelectedDialogueForEdit,
    addScene,
    updateScene,
    deleteScene,
    addDialogue,
    updateDialogue,
    deleteDialogue,
    addCharacter,
    updateCharacter,
    deleteCharacter
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit etre utilise dans AppProvider');
  }
  return context;
}

export { AppContext };
