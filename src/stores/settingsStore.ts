import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';

/**
 * Settings Store
 * Manages project metadata, editor settings, and game variables.
 */

// ============================================================================
// TYPES
// ============================================================================

interface ProjectData {
  title: string;
  location: string;
  tone: string;
  description: string;
}

interface ProjectSettings {
  project: {
    title: string;
    author: string;
    description: string;
    version: string;
  };
  editor: {
    theme: string;
    autosave: boolean;
    autosaveInterval: number;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
  };
  game: {
    variables: Record<string, {
      initial: number;
      min: number;
      max: number;
    }>;
  };
}

interface GameVariables {
  [key: string]: number;
}

interface SettingsState {
  // State
  projectData: ProjectData;
  projectSettings: ProjectSettings;
  variables: GameVariables;

  // Actions
  setContextField: (key: keyof ProjectData, value: string) => void;
  updateProjectData: (updates: Partial<ProjectData>) => void;
  updateProjectSettings: (updates: Partial<ProjectSettings>) => void;
  setVariable: (name: string, value: number) => void;
  modifyVariable: (name: string, delta: number) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_PROJECT_DATA: ProjectData = {
  title: "Sans titre",
  location: "",
  tone: "realiste",
  description: "",
};

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
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

const DEFAULT_VARIABLES: GameVariables = {
  Physique: 100,
  Mentale: 100,
};

// ============================================================================
// STORE
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
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
