import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { ComplexityLevel, FullscreenMode, SectionId, ModalContext } from '@/types';

/**
 * UI Store
 * Manages UI state (selections, saving state, screen reader announcements).
 */

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

const GRAPH_THEME_KEY = 'accesscity-graph-theme';
const SERPENTINE_CONFIG_KEY = 'accesscity-serpentine-config';
const PRO_MODE_CONFIG_KEY = 'accesscity-pro-config';

/**
 * Get persisted theme ID from localStorage
 */
function getPersistedThemeId(): string {
  if (typeof window === 'undefined') return 'default';
  try {
    return localStorage.getItem(GRAPH_THEME_KEY) || 'default';
  } catch {
    return 'default';
  }
}

/**
 * Persist theme ID to localStorage
 */
function persistThemeId(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GRAPH_THEME_KEY, themeId);
  } catch {
    // Ignore localStorage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * SERP-5: Serpentine configuration type
 */
export interface SerpentineConfig {
  enabled: boolean;
  mode: 'auto-y' | 'by-count' | 'branch-aware';
  direction: 'zigzag' | 'grid';
  groupSize: number;
}

/**
 * SERP-5: Get persisted serpentine config from localStorage
 */
function getPersistedSerpentineConfig(): SerpentineConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, mode: 'branch-aware', direction: 'grid', groupSize: 6 };
  }
  try {
    const stored = localStorage.getItem(SERPENTINE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const validModes = ['auto-y', 'by-count', 'branch-aware'];
      const validDirections = ['zigzag', 'grid'];
      return {
        enabled: parsed.enabled ?? false,
        mode: validModes.includes(parsed.mode) ? parsed.mode : 'branch-aware',
        direction: validDirections.includes(parsed.direction) ? parsed.direction : 'grid',
        groupSize: parsed.groupSize ?? 6,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { enabled: false, mode: 'branch-aware', direction: 'grid', groupSize: 6 };
}

/**
 * SERP-5: Persist serpentine config to localStorage
 */
function persistSerpentineConfig(config: SerpentineConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERPENTINE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Pro mode configuration type
 */
export interface ProModeConfig {
  enabled: boolean;
  direction: 'TB' | 'LR';
}

function getPersistedProConfig(): ProModeConfig {
  if (typeof window === 'undefined') return { enabled: false, direction: 'TB' };
  try {
    const stored = localStorage.getItem(PRO_MODE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const validDirs = ['TB', 'LR'];
      return {
        enabled: parsed.enabled ?? false,
        direction: validDirs.includes(parsed.direction) ? parsed.direction : 'TB',
      };
    }
  } catch { /* ignore */ }
  return { enabled: false, direction: 'TB' };
}

function persistProConfig(config: ProModeConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRO_MODE_CONFIG_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

// ============================================================================
// TYPES
// ============================================================================

interface UIState {
  // ── Layout / Editor shell state ──────────────────────────────────────
  // These were previously local state in EditorShell and are now global
  // so any component can read/write them without prop drilling.
  fullscreenMode: FullscreenMode;
  activeSection: SectionId | null;
  activeModal: string | null;
  modalContext: ModalContext;
  showProblemsPanel: boolean;
  commandPaletteOpen: boolean | string;

  // State
  selectedSceneId: string | null;
  selectedSceneForEdit: string | null;
  lastSaved: string | null;
  isSaving: boolean;
  announcement: string;
  urgentAnnouncement: string;
  dialogueWizardOpen: boolean;
  dialogueWizardEditIndex: number | undefined;
  dialogueWizardInitialComplexity: ComplexityLevel | null;
  dialogueGraphModalOpen: boolean;
  dialogueGraphSelectedScene: string | null;
  graphThemeId: string;
  // SERP-5: Serpentine layout configuration
  serpentineEnabled: boolean;
  serpentineMode: 'auto-y' | 'by-count' | 'branch-aware';
  serpentineDirection: 'zigzag' | 'grid';
  serpentineGroupSize: number;
  // Pro mode configuration
  proModeEnabled: boolean;
  proModeDirection: 'TB' | 'LR';
  proCollapseEnabled: boolean;
  proExpandedClusters: string[];  // IDs of expanded clusters (all collapsed by default)
  proPaginationEnabled: boolean;
  proPageSize: number;
  proCurrentPage: number;

  // ── Layout actions ───────────────────────────────────────────────────
  setFullscreenMode: (mode: FullscreenMode) => void;
  setActiveSection: (section: SectionId | null) => void;
  setActiveModal: (modal: string | null) => void;
  setModalContext: (ctx: ModalContext) => void;
  setShowProblemsPanel: (show: boolean) => void;
  setCommandPaletteOpen: (open: boolean | string) => void;

  // Actions
  setSelectedSceneId: (sceneId: string | null) => void;
  setSelectedSceneForEdit: (sceneId: string | null) => void;
  setLastSaved: (date: string | null) => void;
  setIsSaving: (isSaving: boolean) => void;
  setAnnouncement: (message: string) => void;
  setUrgentAnnouncement: (message: string) => void;
  setDialogueWizardOpen: (open: boolean) => void;
  setDialogueWizardEditIndex: (index: number | undefined) => void;
  setDialogueWizardInitialComplexity: (complexity: ComplexityLevel | null) => void;
  clearDialogueWizardInitialComplexity: () => void;
  setDialogueGraphModalOpen: (open: boolean) => void;
  setDialogueGraphSelectedScene: (sceneId: string | null) => void;
  setGraphThemeId: (themeId: string) => void;
  // SERP-5: Serpentine layout actions
  setSerpentineEnabled: (enabled: boolean) => void;
  setSerpentineMode: (mode: 'auto-y' | 'by-count' | 'branch-aware') => void;
  setSerpentineDirection: (direction: 'zigzag' | 'grid') => void;
  setSerpentineGroupSize: (size: number) => void;
  updateSerpentineConfig: (updates: Partial<SerpentineConfig>) => void;
  // Pro mode actions
  setProModeEnabled: (enabled: boolean) => void;
  setProModeDirection: (direction: 'TB' | 'LR') => void;
  setProCollapseEnabled: (enabled: boolean) => void;
  toggleClusterExpanded: (clusterId: string) => void;
  collapseAllClusters: () => void;
  expandAllClusters: (clusterIds: string[]) => void;
  setProPaginationEnabled: (enabled: boolean) => void;
  setProPageSize: (size: number) => void;
  setProCurrentPage: (page: number) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector((set) => {
      // SERP-5: Load persisted serpentine config
      const serpentineConfig = getPersistedSerpentineConfig();
      const proConfig = getPersistedProConfig();

      return {
        // Layout / Editor shell state
        fullscreenMode: null,
        activeSection: null,
        activeModal: null,
        modalContext: {},
        showProblemsPanel: false,
        commandPaletteOpen: false,

        // State
        selectedSceneId: null,
        selectedSceneForEdit: null,
        lastSaved: null,
        isSaving: false,
        announcement: '',
        urgentAnnouncement: '',
        dialogueWizardOpen: false,
        dialogueWizardEditIndex: undefined,
        dialogueWizardInitialComplexity: null,
        dialogueGraphModalOpen: false,
        dialogueGraphSelectedScene: null,
        graphThemeId: getPersistedThemeId(),  // PHASE 4: Persist theme selection
        // SERP-5: Serpentine layout state (persisted)
        serpentineEnabled: serpentineConfig.enabled,
        serpentineMode: serpentineConfig.mode,
        serpentineDirection: serpentineConfig.direction,
        serpentineGroupSize: serpentineConfig.groupSize,
        // Pro mode state (persisted)
        proModeEnabled: proConfig.enabled,
        proModeDirection: proConfig.direction,
        proCollapseEnabled: true,  // Clusters collapsed by default in Pro mode
        proExpandedClusters: [],   // All collapsed initially
        proPaginationEnabled: false,
        proPageSize: 8,
        proCurrentPage: 0,

        // Layout actions
        setFullscreenMode: (mode) => {
          set({ fullscreenMode: mode }, false, 'ui/setFullscreenMode');
        },

        setActiveSection: (section) => {
          set({ activeSection: section }, false, 'ui/setActiveSection');
        },

        setActiveModal: (modal) => {
          set({ activeModal: modal }, false, 'ui/setActiveModal');
        },

        setModalContext: (ctx) => {
          set({ modalContext: ctx }, false, 'ui/setModalContext');
        },

        setShowProblemsPanel: (show) => {
          set({ showProblemsPanel: show }, false, 'ui/setShowProblemsPanel');
        },

        setCommandPaletteOpen: (open) => {
          set({ commandPaletteOpen: open }, false, 'ui/setCommandPaletteOpen');
        },

        // Actions
        setSelectedSceneId: (sceneId) => {
          set({ selectedSceneId: sceneId }, false, 'ui/setSelectedSceneId');
        },

      setSelectedSceneForEdit: (sceneId) => {
        set({ selectedSceneForEdit: sceneId }, false, 'ui/setSelectedSceneForEdit');
      },

      setLastSaved: (date) => {
        set({ lastSaved: date }, false, 'ui/setLastSaved');
      },

      setIsSaving: (isSaving) => {
        set({ isSaving }, false, 'ui/setIsSaving');
      },

      setAnnouncement: (message) => {
        set({ announcement: message }, false, 'ui/setAnnouncement');
      },

      setUrgentAnnouncement: (message) => {
        set({ urgentAnnouncement: message }, false, 'ui/setUrgentAnnouncement');
      },

      setDialogueWizardOpen: (open) => {
        set({ dialogueWizardOpen: open }, false, 'ui/setDialogueWizardOpen');
      },

      setDialogueWizardEditIndex: (index) => {
        set({ dialogueWizardEditIndex: index }, false, 'ui/setDialogueWizardEditIndex');
      },

      setDialogueWizardInitialComplexity: (complexity) => {
        set({ dialogueWizardInitialComplexity: complexity }, false, 'ui/setDialogueWizardInitialComplexity');
      },

      clearDialogueWizardInitialComplexity: () => {
        set({ dialogueWizardInitialComplexity: null }, false, 'ui/clearDialogueWizardInitialComplexity');
      },

      setDialogueGraphModalOpen: (open) => {
        set({ dialogueGraphModalOpen: open }, false, 'ui/setDialogueGraphModalOpen');
      },

      setDialogueGraphSelectedScene: (sceneId) => {
        set({ dialogueGraphSelectedScene: sceneId }, false, 'ui/setDialogueGraphSelectedScene');
      },

      setGraphThemeId: (themeId) => {
        persistThemeId(themeId);  // PHASE 4: Persist to localStorage
        set({ graphThemeId: themeId }, false, 'ui/setGraphThemeId');
      },

      // SERP-5: Serpentine layout actions
      updateSerpentineConfig: (updates) => {
        set((state) => {
          const newConfig: SerpentineConfig = {
            enabled: updates.enabled ?? state.serpentineEnabled,
            mode: updates.mode ?? state.serpentineMode,
            direction: updates.direction ?? state.serpentineDirection,
            groupSize: updates.groupSize ?? state.serpentineGroupSize,
          };
          persistSerpentineConfig(newConfig);
          return {
            serpentineEnabled: newConfig.enabled,
            serpentineMode: newConfig.mode,
            serpentineDirection: newConfig.direction,
            serpentineGroupSize: newConfig.groupSize,
          };
        }, false, 'ui/updateSerpentineConfig');
      },

      setSerpentineEnabled: (enabled) => {
        set((state) => {
          const newConfig: SerpentineConfig = { enabled, mode: state.serpentineMode, direction: state.serpentineDirection, groupSize: state.serpentineGroupSize };
          persistSerpentineConfig(newConfig);
          // Mutual exclusion: disable Pro when serpentine is enabled
          if (enabled && state.proModeEnabled) {
            const newProConfig: ProModeConfig = { enabled: false, direction: state.proModeDirection };
            persistProConfig(newProConfig);
            return { serpentineEnabled: enabled, proModeEnabled: false };
          }
          return { serpentineEnabled: enabled };
        }, false, 'ui/setSerpentineEnabled');
      },

      setSerpentineMode: (mode) => {
        set((state) => {
          const newConfig: SerpentineConfig = { enabled: state.serpentineEnabled, mode, direction: state.serpentineDirection, groupSize: state.serpentineGroupSize };
          persistSerpentineConfig(newConfig);
          return { serpentineMode: mode };
        }, false, 'ui/setSerpentineMode');
      },

      setSerpentineDirection: (direction) => {
        set((state) => {
          const newConfig: SerpentineConfig = { enabled: state.serpentineEnabled, mode: state.serpentineMode, direction, groupSize: state.serpentineGroupSize };
          persistSerpentineConfig(newConfig);
          return { serpentineDirection: direction };
        }, false, 'ui/setSerpentineDirection');
      },

      setSerpentineGroupSize: (size) => {
        set((state) => {
          const newConfig: SerpentineConfig = { enabled: state.serpentineEnabled, mode: state.serpentineMode, direction: state.serpentineDirection, groupSize: size };
          persistSerpentineConfig(newConfig);
          return { serpentineGroupSize: size };
        }, false, 'ui/setSerpentineGroupSize');
      },

      // Pro mode actions (mutually exclusive with serpentine)
      setProModeEnabled: (enabled) => {
        set((state) => {
          const newProConfig: ProModeConfig = { enabled, direction: state.proModeDirection };
          persistProConfig(newProConfig);
          // Mutual exclusion: disable serpentine when Pro is enabled
          if (enabled && state.serpentineEnabled) {
            const newSerpConfig: SerpentineConfig = { enabled: false, mode: state.serpentineMode, direction: state.serpentineDirection, groupSize: state.serpentineGroupSize };
            persistSerpentineConfig(newSerpConfig);
            return { proModeEnabled: enabled, serpentineEnabled: false };
          }
          return { proModeEnabled: enabled };
        }, false, 'ui/setProModeEnabled');
      },

      setProModeDirection: (direction) => {
        set((state) => {
          const newConfig: ProModeConfig = { enabled: state.proModeEnabled, direction };
          persistProConfig(newConfig);
          return { proModeDirection: direction };
        }, false, 'ui/setProModeDirection');
      },

      setProCollapseEnabled: (enabled) => {
        set({ proCollapseEnabled: enabled }, false, 'ui/setProCollapseEnabled');
      },

      toggleClusterExpanded: (clusterId) => {
        set((state) => {
          const expanded = state.proExpandedClusters;
          const isExpanded = expanded.includes(clusterId);
          return {
            proExpandedClusters: isExpanded
              ? expanded.filter(id => id !== clusterId)
              : [...expanded, clusterId],
          };
        }, false, 'ui/toggleClusterExpanded');
      },

      collapseAllClusters: () => {
        set({ proExpandedClusters: [] }, false, 'ui/collapseAllClusters');
      },

      expandAllClusters: (clusterIds) => {
        set({ proExpandedClusters: clusterIds }, false, 'ui/expandAllClusters');
      },

      setProPaginationEnabled: (enabled) => {
        set({ proPaginationEnabled: enabled, proCurrentPage: 0 }, false, 'ui/setProPaginationEnabled');
      },

      setProPageSize: (size) => {
        set({ proPageSize: size, proCurrentPage: 0 }, false, 'ui/setProPageSize');
      },

      setProCurrentPage: (page) => {
        set({ proCurrentPage: page }, false, 'ui/setProCurrentPage');
      },
    };
    }),
    { name: 'UIStore' }
  )
);
