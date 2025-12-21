import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';

/**
 * Settings Store
 * Gere les metadonnees du projet, les parametres editeur et les variables du jeu.
 *
 * State:
 * - projectData: { title, location, tone, description }
 * - projectSettings: { project: {...}, editor: {...}, game: {...} }
 * - variables: { Physique: number, Mentale: number, ... }
 *
 * Actions:
 * - setContextField(key, value)
 * - updateProjectData(updates)
 * - updateProjectSettings(updates)
 * - setVariable(name, value)
 * - modifyVariable(name, delta)
 */

const DEFAULT_PROJECT_DATA = {
  title: "Sans titre",
  location: "",
  tone: "realiste",
  description: "",
};

const DEFAULT_PROJECT_SETTINGS = {
  project: {
    title: "Untitled Project",
    author: "",
    description: "",
    version: "1.0.0",
  },
  editor: {
    theme: "dark",
    autosave: true,
    autosaveInterval: 30000,
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
  },
  game: {
    variables: {
      Empathie: { initial: 0, min: 0, max: 100 },
      Autonomie: { initial: 0, min: 0, max: 100 },
      Confiance: { initial: 0, min: 0, max: 100 },
    },
  },
};

const DEFAULT_VARIABLES = {
  Physique: 100,
  Mentale: 100,
};

export const useSettingsStore = create(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // State
        projectData: DEFAULT_PROJECT_DATA,
        projectSettings: DEFAULT_PROJECT_SETTINGS,
        variables: DEFAULT_VARIABLES,

        // Actions: Project Data (context)
        setContextField: (key, value) => {
          set((state) => ({
            projectData: { ...state.projectData, [key]: value },
          }), false, 'settings/setContextField');
        },

        updateProjectData: (updates) => {
          set((state) => ({
            projectData: { ...state.projectData, ...updates },
          }), false, 'settings/updateProjectData');
        },

        // Actions: Project Settings
        updateProjectSettings: (updates) => {
          set((state) => ({
            projectSettings: {
              ...state.projectSettings,
              ...updates,
              project: {
                ...state.projectSettings.project,
                ...(updates.project || {}),
              },
              editor: {
                ...state.projectSettings.editor,
                ...(updates.editor || {}),
              },
              game: {
                ...state.projectSettings.game,
                ...(updates.game || {}),
              },
            },
          }), false, 'settings/updateProjectSettings');
        },

        // Actions: Variables
        setVariable: (name, value) => {
          set((state) => ({
            variables: { ...state.variables, [name]: value },
          }), false, 'settings/setVariable');
        },

        modifyVariable: (name, delta) => {
          set((state) => {
            const current = typeof state.variables[name] === 'number'
              ? state.variables[name]
              : 0;
            const clamped = Math.max(0, Math.min(100, current + delta));
            return {
              variables: { ...state.variables, [name]: clamped },
            };
          }, false, 'settings/modifyVariable');
        },
      })),
      {
        name: 'accesscity-settings',
        partialize: (state) => ({
          projectData: state.projectData,
          projectSettings: state.projectSettings,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
