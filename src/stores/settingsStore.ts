import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { GAME_STATS, type SupportedLocale } from '../i18n';
import { STAT_BOUNDS } from '@/config/gameConstants';
import { TIMING } from '@/config/timing';
import type { DialogueBoxStyle } from '@/types/scenes';

// ── Character FX ──────────────────────────────────────────────────────────────

/** Paramètres d'animation des sprites personnages (global projet, persisté). */
export interface CharacterFxSettings {
  breatheEnabled:    boolean;  // Respiration idle
  breatheIntensity:  number;   // Amplitude — 0.5 à 2.0
  breatheSpeed:      number;   // Durée de base en secondes — 3 à 8
  speakingEnabled:   boolean;  // Pop quand le personnage parle
  speakingIntensity: number;   // Intensité du pop — 0.5 à 2.0
  crossfadeEnabled:  boolean;  // Fondu enchaîné lors du changement d'expression
  crossfadeMs:       number;   // Durée de la transition — 50 à 600
  pixelArt:          boolean;  // Désactive l'anti-aliasing (image-rendering: pixelated)
}

export const DEFAULT_CHARACTER_FX: CharacterFxSettings = {
  breatheEnabled:    true,
  breatheIntensity:  1.0,
  breatheSpeed:      5,
  speakingEnabled:   true,
  speakingIntensity: 1.0,
  crossfadeEnabled:  true,
  crossfadeMs:       250,
  pixelArt:          false,
};

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
    /** Global dialogue box visual defaults. Per-dialogue boxStyle overrides these. */
    dialogueBoxDefaults?: DialogueBoxStyle;
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
  language: SupportedLocale;
  enableStatsHUD: boolean;
  characterFx: CharacterFxSettings;

  // Actions
  setContextField: (key: keyof ProjectData, value: string) => void;
  updateProjectData: (updates: Partial<ProjectData>) => void;
  updateProjectSettings: (updates: Partial<ProjectSettings>) => void;
  setVariable: (name: string, value: number) => void;
  modifyVariable: (name: string, delta: number) => void;
  setLanguage: (lang: SupportedLocale) => void;
  setEnableStatsHUD: (enabled: boolean) => void;
  updateDialogueBoxDefaults: (style: Partial<DialogueBoxStyle>) => void;
  setCharacterFx: (patch: Partial<CharacterFxSettings>) => void;
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
    autosaveInterval: TIMING.AUTOSAVE_INTERVAL_MS,
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
  },
  game: {
    variables: {
      [GAME_STATS.PHYSIQUE]: { initial: STAT_BOUNDS.MAX, min: STAT_BOUNDS.MIN, max: STAT_BOUNDS.MAX },
      [GAME_STATS.MENTALE]: { initial: STAT_BOUNDS.MAX, min: STAT_BOUNDS.MIN, max: STAT_BOUNDS.MAX },
    },
  },
};

const DEFAULT_VARIABLES: GameVariables = {
  [GAME_STATS.PHYSIQUE]: STAT_BOUNDS.MAX,
  [GAME_STATS.MENTALE]: STAT_BOUNDS.MAX,
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
        language: 'fr' as SupportedLocale,
        enableStatsHUD: false,
        characterFx: DEFAULT_CHARACTER_FX,

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
            const clamped = Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, current + delta));
            return {
              variables: { ...state.variables, [name]: clamped },
            };
          }, false, 'settings/modifyVariable');
        },

        // Actions: Language
        setLanguage: (lang) => {
          set({ language: lang }, false, 'settings/setLanguage');
        },

        // Actions: Stats HUD
        setEnableStatsHUD: (enabled) => {
          set({ enableStatsHUD: enabled }, false, 'settings/setEnableStatsHUD');
        },

        // Actions: Character FX
        setCharacterFx: (patch) => {
          set((state) => ({
            characterFx: { ...state.characterFx, ...patch },
          }), false, 'settings/setCharacterFx');
        },

        // Actions: Dialogue Box Defaults
        updateDialogueBoxDefaults: (style) => {
          set((state) => ({
            projectSettings: {
              ...state.projectSettings,
              game: {
                ...state.projectSettings.game,
                dialogueBoxDefaults: {
                  ...state.projectSettings.game.dialogueBoxDefaults,
                  ...style,
                },
              },
            },
          }), false, 'settings/updateDialogueBoxDefaults');
        },
      })),
      {
        name: 'accesscity-settings',
        partialize: (state) => ({
          projectData: state.projectData,
          projectSettings: state.projectSettings,
          language: state.language,
          enableStatsHUD: state.enableStatsHUD,
          characterFx: state.characterFx,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
