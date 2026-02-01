import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * UI Store
 * Manages UI state (selections, saving state, screen reader announcements).
 */

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
  dialogueGraphModalOpen: boolean;
  dialogueGraphSelectedScene: string | null;

  // Actions
  setSelectedSceneId: (sceneId: string | null) => void;
  setSelectedSceneForEdit: (sceneId: string | null) => void;
  setLastSaved: (date: string | null) => void;
  setIsSaving: (isSaving: boolean) => void;
  setAnnouncement: (message: string) => void;
  setUrgentAnnouncement: (message: string) => void;
  setDialogueWizardOpen: (open: boolean) => void;
  setDialogueWizardEditIndex: (index: number | undefined) => void;
  setDialogueGraphModalOpen: (open: boolean) => void;
  setDialogueGraphSelectedScene: (sceneId: string | null) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // State
      selectedSceneId: null,
      selectedSceneForEdit: null,
      lastSaved: null,
      isSaving: false,
      announcement: '',
      urgentAnnouncement: '',
      dialogueWizardOpen: false,
      dialogueWizardEditIndex: undefined,
      dialogueGraphModalOpen: false,
      dialogueGraphSelectedScene: null,

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

      setDialogueGraphModalOpen: (open) => {
        set({ dialogueGraphModalOpen: open }, false, 'ui/setDialogueGraphModalOpen');
      },

      setDialogueGraphSelectedScene: (sceneId) => {
        set({ dialogueGraphSelectedScene: sceneId }, false, 'ui/setDialogueGraphSelectedScene');
      },
    })),
    { name: 'UIStore' }
  )
);
