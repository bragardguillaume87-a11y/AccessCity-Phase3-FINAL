import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
// ⚠️ Import direct depuis types.ts (pas depuis index.ts) pour éviter la dépendance circulaire :
// settingsStore → i18n/index → stores barrel → settingsStore
import { GAME_STATS, type SupportedLocale } from '../i18n/types';
import { STAT_BOUNDS } from '@/config/gameConstants';
import { TIMING } from '@/config/timing';
import type { DialogueBoxStyle } from '@/types/scenes';
import type { AssetCollection } from '@/types/collections';
import type { TilesetConfig } from '@/types/tileset';
import type { SpriteSheetConfig } from '@/types/sprite';

// ── Character FX ──────────────────────────────────────────────────────────────

/** Paramètres d'animation des sprites personnages (global projet, persisté). */
export interface CharacterFxSettings {
  breatheEnabled: boolean; // Respiration idle
  breatheIntensity: number; // Amplitude — 0.5 à 2.0
  breatheSpeed: number; // Durée de base en secondes — 3 à 8
  speakingEnabled: boolean; // Pop quand le personnage parle
  speakingIntensity: number; // Intensité du pop — 0.5 à 2.0
  crossfadeEnabled: boolean; // Fondu enchaîné lors du changement d'expression
  crossfadeMs: number; // Durée de la transition — 50 à 600
  pixelArt: boolean; // Désactive l'anti-aliasing (image-rendering: pixelated)
}

export const DEFAULT_CHARACTER_FX: CharacterFxSettings = {
  breatheEnabled: true,
  breatheIntensity: 1.0,
  breatheSpeed: 5,
  speakingEnabled: true,
  speakingIntensity: 1.0,
  crossfadeEnabled: true,
  crossfadeMs: 250,
  pixelArt: false,
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
    variables: Record<
      string,
      {
        initial: number;
        min: number;
        max: number;
      }
    >;
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
  /** Volume des sons UI procéduraux (typewriter, boutons, transitions). 0–1, 0 = muet. */
  uiSoundsVolume: number;
  /** Style de frappe typewriter : 'mecanique' | 'vintage' | 'gaming' | '8bit' | 'doux'. */
  uiSoundStyle: string;
  /** Intervalle minimum entre deux ticks (ms). 35 = rapide, 65 = normal, 130 = lent. */
  uiSoundsTickInterval: number;
  /** Collections d'assets personnalisées (dossiers utilisateur) — persistées avec le projet. */
  assetCollections: AssetCollection[];

  // Actions
  updateProjectData: (updates: Partial<ProjectData>) => void;
  updateProjectSettings: (updates: Partial<ProjectSettings>) => void;
  modifyVariable: (name: string, delta: number) => void;
  setEnableStatsHUD: (enabled: boolean) => void;
  updateDialogueBoxDefaults: (style: Partial<DialogueBoxStyle>) => void;
  setCharacterFx: (patch: Partial<CharacterFxSettings>) => void;
  setUiSoundsVolume: (v: number) => void;
  setUiSoundStyle: (style: string) => void;
  setUiSoundsTickInterval: (ms: number) => void;
  addAssetCollection: (name: string) => string;
  removeAssetCollection: (id: string) => void;
  renameAssetCollection: (id: string, name: string) => void;
  addAssetToCollection: (collectionId: string, assetId: string) => void;
  removeAssetFromCollection: (collectionId: string, assetId: string) => void;
  /** Noms d'affichage personnalisés par assetPath. Ne renomme pas le fichier. */
  assetDisplayNames: Record<string, string>;
  setAssetDisplayName: (assetPath: string, displayName: string) => void;
  /**
   * Configuration de découpe par asset (clé = asset URL display-ready).
   * Persistée — l'utilisateur n'a pas à reconfigurer à chaque session.
   */
  tilesetConfigs: Record<string, TilesetConfig>;
  setTilesetConfig: (assetUrl: string, config: TilesetConfig) => void;
  /** Configuration des spritesheets de personnages/monstres (clé = asset URL display-ready) */
  spriteSheetConfigs: Record<string, SpriteSheetConfig>;
  setSpriteSheetConfig: (assetUrl: string, config: SpriteSheetConfig) => void;
  removeSpriteSheetConfig: (assetUrl: string) => void;
  removeTilesetConfig: (assetUrl: string) => void;
  /**
   * URLs d'assets masqués dans la palette de l'éditeur (ne supprime pas le fichier).
   * Clé = asset URL display-ready ou path.
   */
  hiddenAssetPaths: string[];
  hideAsset: (path: string) => void;
  unhideAsset: (path: string) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_PROJECT_DATA: ProjectData = {
  title: 'Sans titre',
  location: '',
  tone: 'realiste',
  description: '',
};

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  project: {
    title: 'Untitled Project',
    author: '',
    description: '',
    version: '1.0.0',
  },
  editor: {
    theme: 'dark',
    autosave: true,
    autosaveInterval: TIMING.AUTOSAVE_INTERVAL_MS,
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
  },
  game: {
    variables: {
      [GAME_STATS.PHYSIQUE]: {
        initial: STAT_BOUNDS.MAX,
        min: STAT_BOUNDS.MIN,
        max: STAT_BOUNDS.MAX,
      },
      [GAME_STATS.MENTALE]: {
        initial: STAT_BOUNDS.MAX,
        min: STAT_BOUNDS.MIN,
        max: STAT_BOUNDS.MAX,
      },
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
        uiSoundsVolume: 0.3,
        uiSoundStyle: 'mecanique',
        uiSoundsTickInterval: 65,
        assetCollections: [],
        assetDisplayNames: {},
        tilesetConfigs: {},
        spriteSheetConfigs: {},
        hiddenAssetPaths: [],

        updateProjectData: (updates) => {
          set(
            (state) => ({
              projectData: { ...state.projectData, ...updates },
            }),
            false,
            'settings/updateProjectData'
          );
        },

        // Actions: Project Settings
        updateProjectSettings: (updates) => {
          set(
            (state) => ({
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
            }),
            false,
            'settings/updateProjectSettings'
          );
        },

        // Actions: Variables
        modifyVariable: (name, delta) => {
          set(
            (state) => {
              const current = typeof state.variables[name] === 'number' ? state.variables[name] : 0;
              const clamped = Math.max(STAT_BOUNDS.MIN, Math.min(STAT_BOUNDS.MAX, current + delta));
              return {
                variables: { ...state.variables, [name]: clamped },
              };
            },
            false,
            'settings/modifyVariable'
          );
        },

        // Actions: Stats HUD
        setEnableStatsHUD: (enabled) => {
          set({ enableStatsHUD: enabled }, false, 'settings/setEnableStatsHUD');
        },

        // Actions: Character FX
        setCharacterFx: (patch) => {
          set(
            (state) => ({
              characterFx: { ...state.characterFx, ...patch },
            }),
            false,
            'settings/setCharacterFx'
          );
        },

        // Actions: UI Sounds
        setUiSoundsVolume: (v) => {
          set({ uiSoundsVolume: Math.max(0, Math.min(1, v)) }, false, 'settings/setUiSoundsVolume');
        },
        setUiSoundStyle: (style) => {
          set({ uiSoundStyle: style }, false, 'settings/setUiSoundStyle');
        },
        setUiSoundsTickInterval: (ms) => {
          set(
            { uiSoundsTickInterval: Math.max(35, Math.min(130, ms)) },
            false,
            'settings/setUiSoundsTickInterval'
          );
        },

        // Actions: Asset Collections
        addAssetCollection: (name) => {
          const id = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          set(
            (state) => ({
              assetCollections: [...state.assetCollections, { id, name, assetIds: [] }],
            }),
            false,
            'settings/addAssetCollection'
          );
          return id;
        },
        removeAssetCollection: (id) => {
          set(
            (state) => ({
              assetCollections: state.assetCollections.filter((c) => c.id !== id),
            }),
            false,
            'settings/removeAssetCollection'
          );
        },
        renameAssetCollection: (id, name) => {
          set(
            (state) => ({
              assetCollections: state.assetCollections.map((c) =>
                c.id === id ? { ...c, name } : c
              ),
            }),
            false,
            'settings/renameAssetCollection'
          );
        },
        addAssetToCollection: (collectionId, assetId) => {
          set(
            (state) => ({
              assetCollections: state.assetCollections.map((c) =>
                c.id === collectionId && !c.assetIds.includes(assetId)
                  ? { ...c, assetIds: [...c.assetIds, assetId] }
                  : c
              ),
            }),
            false,
            'settings/addAssetToCollection'
          );
        },
        removeAssetFromCollection: (collectionId, assetId) => {
          set(
            (state) => ({
              assetCollections: state.assetCollections.map((c) =>
                c.id === collectionId
                  ? { ...c, assetIds: c.assetIds.filter((id) => id !== assetId) }
                  : c
              ),
            }),
            false,
            'settings/removeAssetFromCollection'
          );
        },
        setAssetDisplayName: (assetPath, displayName) => {
          set(
            (state) => ({
              assetDisplayNames: { ...state.assetDisplayNames, [assetPath]: displayName },
            }),
            false,
            'settings/setAssetDisplayName'
          );
        },

        setTilesetConfig: (assetUrl, config) => {
          set(
            (state) => ({
              tilesetConfigs: { ...state.tilesetConfigs, [assetUrl]: config },
            }),
            false,
            'settings/setTilesetConfig'
          );
        },

        setSpriteSheetConfig: (assetUrl, config) => {
          set(
            (state) => ({
              spriteSheetConfigs: { ...state.spriteSheetConfigs, [assetUrl]: config },
            }),
            false,
            'settings/setSpriteSheetConfig'
          );
        },

        removeTilesetConfig: (assetUrl) => {
          set(
            (state) => {
              const next = { ...state.tilesetConfigs };
              delete next[assetUrl];
              return { tilesetConfigs: next };
            },
            false,
            'settings/removeTilesetConfig'
          );
        },

        removeSpriteSheetConfig: (assetUrl) => {
          set(
            (state) => {
              const next = { ...state.spriteSheetConfigs };
              delete next[assetUrl];
              return { spriteSheetConfigs: next };
            },
            false,
            'settings/removeSpriteSheetConfig'
          );
        },

        hideAsset: (path) => {
          set(
            (state) => ({
              hiddenAssetPaths: state.hiddenAssetPaths.includes(path)
                ? state.hiddenAssetPaths
                : [...state.hiddenAssetPaths, path],
            }),
            false,
            'settings/hideAsset'
          );
        },

        unhideAsset: (path) => {
          set(
            (state) => ({
              hiddenAssetPaths: state.hiddenAssetPaths.filter((p) => p !== path),
            }),
            false,
            'settings/unhideAsset'
          );
        },

        // Actions: Dialogue Box Defaults
        updateDialogueBoxDefaults: (style) => {
          set(
            (state) => ({
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
            }),
            false,
            'settings/updateDialogueBoxDefaults'
          );
        },
      })),
      {
        name: 'accesscity-settings',
        version: 1,
        migrate: (persisted: Record<string, unknown>) => {
          // v1 — AnimationRange: {startFrame, endFrame} → {frames: number[]}
          const configs =
            (persisted?.spriteSheetConfigs as Record<string, Record<string, unknown>>) ?? {};
          for (const key of Object.keys(configs)) {
            const cfg = configs[key] as Record<string, Record<string, unknown>> | undefined;
            if (!cfg?.animations) continue;
            for (const tag of Object.keys(cfg.animations)) {
              const anim = cfg.animations[tag] as Record<string, unknown> | undefined;
              if (anim && !Array.isArray(anim.frames) && anim.startFrame !== undefined) {
                const sf = anim.startFrame as number;
                const ef = (anim.endFrame as number | undefined) ?? sf;
                const lo = Math.min(sf, ef);
                const hi = Math.max(sf, ef);
                anim.frames = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
                delete anim.startFrame;
                delete anim.endFrame;
              }
            }
          }
          return persisted;
        },
        partialize: (state) => ({
          projectData: state.projectData,
          projectSettings: state.projectSettings,
          language: state.language,
          enableStatsHUD: state.enableStatsHUD,
          characterFx: state.characterFx,
          uiSoundsVolume: state.uiSoundsVolume,
          uiSoundStyle: state.uiSoundStyle,
          uiSoundsTickInterval: state.uiSoundsTickInterval,
          assetCollections: state.assetCollections,
          tilesetConfigs: state.tilesetConfigs,
          spriteSheetConfigs: state.spriteSheetConfigs,
          hiddenAssetPaths: state.hiddenAssetPaths,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
