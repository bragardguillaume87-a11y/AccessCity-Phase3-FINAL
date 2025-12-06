import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

/**
 * AppContext centralizes editor state:
 * - scenes: array of { id, title, description, backgroundUrl?, dialogues: [] }
 * - characters: array of { id, name, description?, sprites?: { [mood]: url }, moods?: [] }
 * - variables: { Physique: number, Mentale: number }
 * - context: { title, location, tone, description }
 * - CRUD helpers + selection helpers
 * ASCII only.
 */

const SAMPLE_DATA = {
  characters: [
    { id: 'player', name: 'Joueur', description: '', sprites: { neutral: 'assets/characters/player/neutral.svg' }, moods: ['neutral'] },
    { id: 'counsellor', name: 'Conseiller municipal', description: '', sprites: { neutral: 'assets/characters/counsellor/neutral.svg' }, moods: ['neutral','professional','helpful'] },
    { id: 'narrator', name: 'Narrateur', description: '', sprites: {}, moods: [] }
  ],
  scenes: [
    { id: 'scenetest01', title: 'Rencontre Mairie', description: 'Premiere scene de test.', backgroundUrl: '', dialogues: [
      { speaker: 'narrator', text: 'Vous arrivez devant la mairie.', choices: [] },
      { speaker: 'counsellor', text: 'Bonjour ! Discutons du projet.', choices: [] },
      { speaker: 'player', text: '...', choices: [
        { text: 'Bonjour, motive !', effects: [{ variable: 'Mentale', value: 5, operation: 'add' }] },
        { text: 'Pas beaucoup de temps.', effects: [{ variable: 'Mentale', value: -5, operation: 'add' }] }
      ] }
    ]},
    { id: 'scenetest02', title: 'Suite de laventure', description: 'Deuxieme scene.', backgroundUrl: '', dialogues: [
      { speaker: 'narrator', text: 'Une nouvelle journee commence...', choices: [] }
    ]}
  ]
};

const DEFAULT_CONTEXT_META = {
  title: 'Sans titre',
  location: '',
  tone: 'realiste',
  description: ''
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Core editor state
  const [scenes, setScenes] = useState(SAMPLE_DATA.scenes);
  const [characters, setCharacters] = useState(SAMPLE_DATA.characters);
  const [variables, setVariables] = useState({ Physique: 100, Mentale: 100 });

  // Scenario metadata
  const [contextMeta, setContextMeta] = useState(DEFAULT_CONTEXT_META);

  // Selection state
  const [selectedSceneId, setSelectedSceneId] = useState(scenes.length ? scenes[0].id : null);
  const [selectedSceneForEdit, setSelectedSceneForEdit] = useState(scenes.length ? scenes[0].id : null);

  // Scenes
  const addScene = useCallback(() => {
    const newId = 'scene-' + Date.now();
    const newScene = { id: newId, title: 'New scene', description: '', backgroundUrl: '', dialogues: [] };
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneId(newId);
    setSelectedSceneForEdit(newId);
    return newId;
  }, []);

  const updateScene = useCallback((sceneId, patch) => {
    setScenes(prev => prev.map(s => (s.id === sceneId ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)));
  }, []);

  const deleteScene = useCallback((sceneId) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    setSelectedSceneId(prev => (prev === sceneId ? null : prev));
    setSelectedSceneForEdit(prev => (prev === sceneId ? null : prev));
  }, []);

  // Dialogues
  const addDialogue = useCallback((sceneId, dialogue) => {
    setScenes(prev => prev.map(s => (s.id !== sceneId ? s : { ...s, dialogues: [...(s.dialogues || []), dialogue] })));
  }, []);

  const updateDialogue = useCallback((sceneId, index, patch) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      const list = [...(s.dialogues || [])];
      if (index < 0 || index >= list.length) return s;
      list[index] = { ...list[index], ...(typeof patch === 'function' ? patch(list[index]) : patch) };
      return { ...s, dialogues: list };
    }));
  }, []);

  const deleteDialogue = useCallback((sceneId, index) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      const list = [...(s.dialogues || [])];
      if (index < 0 || index >= list.length) return s;
      list.splice(index, 1);
      return { ...s, dialogues: list };
    }));
  }, []);

  // Characters
  const addCharacter = useCallback(() => {
    const id = 'char-' + Date.now();
    const c = { id, name: 'New character', description: '', sprites: { neutral: '' }, moods: ['neutral'] };
    setCharacters(prev => [...prev, c]);
    return id;
  }, []);

  const updateCharacter = useCallback((updated) => {
    setCharacters(prev => prev.map(c => (c.id === updated.id ? { ...c, ...updated } : c)));
  }, []);

  const deleteCharacter = useCallback((charId) => {
    setCharacters(prev => prev.filter(c => c.id !== charId));
  }, []);

  // Variables
  const setVariable = useCallback((name, value) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  }, []);

  const modifyVariable = useCallback((name, delta) => {
    setVariables(prev => {
      const current = typeof prev[name] === 'number' ? prev[name] : 0;
      const clamped = Math.max(0, Math.min(100, current + delta));
      return { ...prev, [name]: clamped };
    });
  }, []);

  // Context metadata helpers
  const setContextField = useCallback((key, value) => {
    setContextMeta(prev => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({
      // state
      scenes,
      characters,
      variables,
      context: contextMeta,
      selectedSceneId,
      selectedSceneForEdit,
      // selection setters
      setSelectedSceneId,
      setSelectedSceneForEdit,
      // scenes api
      addScene,
      updateScene,
      deleteScene,
      // dialogues api
      addDialogue,
      updateDialogue,
      deleteDialogue,
      // characters api
      addCharacter,
      updateCharacter,
      deleteCharacter,
      // variables api
      setVariable,
      modifyVariable,
      // context meta api
      setContextField
    }),
    [
      scenes,
      characters,
      variables,
      contextMeta,
      selectedSceneId,
      selectedSceneForEdit,
      addScene,
      updateScene,
      deleteScene,
      addDialogue,
      updateDialogue,
      deleteDialogue,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      setVariable,
      modifyVariable,
      setContextField
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

export default AppContext;
