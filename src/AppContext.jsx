import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useUndoRedo } from './hooks/useUndoRedo.js';

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
  const initialEditorState = {
    scenes: SAMPLE_DATA.scenes,
    characters: SAMPLE_DATA.characters,
    variables: { Physique: 100, Mentale: 100 },
    projectData: DEFAULT_CONTEXT_META
  };

  const {
    state: editorState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo(initialEditorState, 50);

  const scenes = editorState.scenes;
  const characters = editorState.characters;
  const variables = editorState.variables;
  const projectData = editorState.projectData;

  const updateEditorState = useCallback((updater) => {
    pushState(typeof updater === 'function' ? updater(editorState) : updater);
  }, [editorState, pushState]);

  const [selectedSceneId, setSelectedSceneId] = useState(scenes.length ? scenes[0].id : null);
  const [selectedSceneForEdit, setSelectedSceneForEdit] = useState(scenes.length ? scenes[0].id : null);

  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const autoSaveData = {
      scenes,
      characters,
      variables,
      projectData,
      timestamp: new Date().toISOString()
    };

    setIsSaving(true);
    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('accesscity-autosave', JSON.stringify(autoSaveData));
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        console.error('[AutoSave] Failed to save:', error);
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [scenes, characters, variables, projectData]);

  const addScene = useCallback(() => {
    const newId = 'scene-' + Date.now();
    const newScene = { id: newId, title: 'New scene', description: '', backgroundUrl: '', dialogues: [] };
    updateEditorState(state => ({ ...state, scenes: [...state.scenes, newScene] }));
    setSelectedSceneId(newId);
    setSelectedSceneForEdit(newId);
    return newId;
  }, [updateEditorState]);

  const updateScene = useCallback((sceneId, patch) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => (s.id === sceneId ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s))
    }));
  }, [updateEditorState]);

  const deleteScene = useCallback((sceneId) => {
    updateEditorState(state => ({ ...state, scenes: state.scenes.filter(s => s.id !== sceneId) }));
    setSelectedSceneId(prev => (prev === sceneId ? null : prev));
    setSelectedSceneForEdit(prev => (prev === sceneId ? null : prev));
  }, [updateEditorState]);

  const reorderScenes = useCallback((newScenesOrder) => {
    updateEditorState(state => ({ ...state, scenes: newScenesOrder }));
  }, [updateEditorState]);

  const addDialogue = useCallback((sceneId, dialogue) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => (s.id !== sceneId ? s : { ...s, dialogues: [...(s.dialogues || []), dialogue] }))
    }));
  }, [updateEditorState]);

  const addDialogues = useCallback((sceneId, dialogues) => {
    if (!dialogues || dialogues.length === 0) return;
    
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => 
        s.id !== sceneId 
          ? s 
          : { ...s, dialogues: [...(s.dialogues || []), ...dialogues] }
      )
    }));
  }, [updateEditorState]);

  const updateDialogue = useCallback((sceneId, index, patch) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => {
        if (s.id !== sceneId) return s;
        const list = [...(s.dialogues || [])];
        if (index < 0 || index >= list.length) return s;
        list[index] = { ...list[index], ...(typeof patch === 'function' ? patch(list[index]) : patch) };
        return { ...s, dialogues: list };
      })
    }));
  }, [updateEditorState]);

  const deleteDialogue = useCallback((sceneId, index) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => {
        if (s.id !== sceneId) return s;
        const list = [...(s.dialogues || [])];
        if (index < 0 || index >= list.length) return s;
        list.splice(index, 1);
        return { ...s, dialogues: list };
      })
    }));
  }, [updateEditorState]);

  const addCharacter = useCallback(() => {
    const id = 'char-' + Date.now();
    const c = { id, name: 'New character', description: '', sprites: { neutral: '' }, moods: ['neutral'] };
    updateEditorState(state => ({ ...state, characters: [...state.characters, c] }));
    return id;
  }, [updateEditorState]);

  const updateCharacter = useCallback((updated) => {
    updateEditorState(state => ({
      ...state,
      characters: state.characters.map(c => (c.id === updated.id ? { ...c, ...updated } : c))
    }));
  }, [updateEditorState]);

  const deleteCharacter = useCallback((charId) => {
    updateEditorState(state => ({ ...state, characters: state.characters.filter(c => c.id !== charId) }));
  }, [updateEditorState]);

  const setVariable = useCallback((name, value) => {
    updateEditorState(state => ({ ...state, variables: { ...state.variables, [name]: value } }));
  }, [updateEditorState]);

  const modifyVariable = useCallback((name, delta) => {
    updateEditorState(state => {
      const current = typeof state.variables[name] === 'number' ? state.variables[name] : 0;
      const clamped = Math.max(0, Math.min(100, current + delta));
      return { ...state, variables: { ...state.variables, [name]: clamped } };
    });
  }, [updateEditorState]);

  const setContextField = useCallback((key, value) => {
    updateEditorState(state => ({ ...state, projectData: { ...state.projectData, [key]: value } }));
  }, [updateEditorState]);

  const updateProjectData = useCallback((updates) => {
    updateEditorState(state => ({ ...state, projectData: { ...state.projectData, ...updates } }));
  }, [updateEditorState]);

  // Scene character management
  const addCharacterToScene = useCallback((sceneId, characterId, mood = 'neutral', position = { x: 50, y: 50 }) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => s.id !== sceneId ? s : {
        ...s,
        characters: [
          ...(s.characters || []),
          {
            id: `scene-char-${Date.now()}`,
            characterId,
            mood,
            position
          }
        ]
      })
    }));
  }, [updateEditorState]);

  const removeCharacterFromScene = useCallback((sceneId, sceneCharId) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => s.id !== sceneId ? s : {
        ...s,
        characters: (s.characters || []).filter(sc => sc.id !== sceneCharId)
      })
    }));
  }, [updateEditorState]);

  const updateSceneCharacter = useCallback((sceneId, sceneCharId, updates) => {
    updateEditorState(state => ({
      ...state,
      scenes: state.scenes.map(s => s.id !== sceneId ? s : {
        ...s,
        characters: (s.characters || []).map(sc => sc.id !== sceneCharId ? sc : { ...sc, ...updates })
      })
    }));
  }, [updateEditorState]);

  const value = useMemo(
    () => ({
      scenes,
      characters,
      variables,
      context: projectData,
      projectData,
      selectedSceneId,
      selectedSceneForEdit,
      lastSaved,
      isSaving,
      undo,
      redo,
      canUndo,
      canRedo,
      setSelectedSceneId,
      setSelectedSceneForEdit,
      addScene,
      updateScene,
      deleteScene,
      reorderScenes,
      addDialogue,
      addDialogues,
      updateDialogue,
      deleteDialogue,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      setVariable,
      modifyVariable,
      setContextField,
      updateProjectData,
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter
    }),
    [
      scenes,
      characters,
      variables,
      projectData,
      selectedSceneId,
      selectedSceneForEdit,
      lastSaved,
      isSaving,
      undo,
      redo,
      canUndo,
      canRedo,
      addScene,
      updateScene,
      deleteScene,
      reorderScenes,
      addDialogue,
      addDialogues,
      updateDialogue,
      deleteDialogue,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      setVariable,
      modifyVariable,
      setContextField,
      updateProjectData,
      addCharacterToScene,
      removeCharacterFromScene,
      updateSceneCharacter
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