import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { ComplexityLevel } from '@/components/dialogue-editor/DialogueWizard/hooks/useDialogueWizardState';

/**
 * UI Store
 * Manages UI state (selections, saving state, screen reader announcements).
 */

// ============================================================================
// PERSISTENCE HELPERS
// ============================================================================

const GRAPH_THEME_KEY = 'accesscity-graph-theme';
const SERPENTINE_CONFIG_KEY = 'accesscity-serpentine-config';

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
interface SerpentineConfig {
  enabled: boolean;
  mode: 'auto-y' | 'by-count';
  groupSize: number;
}

/**
 * SERP-5: Get persisted serpentine config from localStorage
 */
function getPersistedSerpentineConfig(): SerpentineConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, mode: 'auto-y', groupSize: 6 };
  }
  try {
    const stored = localStorage.getItem(SERPENTINE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        enabled: parsed.enabled ?? false,
        mode: parsed.mode ?? 'auto-y',
        groupSize: parsed.groupSize ?? 6,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { enabled: false, mode: 'auto-y', groupSize: 6 };
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

// ============================================================================
// TYPES
// ============================================================================

interface UIState {
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
  serpentineMode: 'auto-y' | 'by-count';
  serpentineGroupSize: number;

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
  setSerpentineMode: (mode: 'auto-y' | 'by-count') => void;
  setSerpentineGroupSize: (size: number) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector((set) => {
      // SERP-5: Load persisted serpentine config
      const serpentineConfig = getPersistedSerpentineConfig();

      return {
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
        serpentineGroupSize: serpentineConfig.groupSize,

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
      setSerpentineEnabled: (enabled) => {
        set((state) => {
          const newConfig = {
            enabled,
            mode: state.serpentineMode,
            groupSize: state.serpentineGroupSize,
          };
          persistSerpentineConfig(newConfig);
          return { serpentineEnabled: enabled };
        }, false, 'ui/setSerpentineEnabled');
      },

      setSerpentineMode: (mode) => {
        set((state) => {
          const newConfig = {
            enabled: state.serpentineEnabled,
            mode,
            groupSize: state.serpentineGroupSize,
          };
          persistSerpentineConfig(newConfig);
          return { serpentineMode: mode };
        }, false, 'ui/setSerpentineMode');
      },

      setSerpentineGroupSize: (size) => {
        set((state) => {
          const newConfig = {
            enabled: state.serpentineEnabled,
            mode: state.serpentineMode,
            groupSize: size,
          };
          persistSerpentineConfig(newConfig);
          return { serpentineGroupSize: size };
        }, false, 'ui/setSerpentineGroupSize');
      },
    };
    }),
    { name: 'UIStore' }
  )
);
