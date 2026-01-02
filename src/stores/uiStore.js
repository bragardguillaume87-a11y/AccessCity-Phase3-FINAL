import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * UI Store
 * Gere l'etat de l'interface utilisateur (selections, saving state, etc.).
 *
 * State:
 * - selectedSceneId: string | null
 * - selectedSceneForEdit: string | null
 * - lastSaved: Date | null
 * - isSaving: boolean
 * - announcement: string (for screen reader announcements)
 * - urgentAnnouncement: string (for critical screen reader alerts)
 *
 * Actions:
 * - setSelectedSceneId(sceneId)
 * - setSelectedSceneForEdit(sceneId)
 * - setLastSaved(date)
 * - setIsSaving(isSaving)
 * - setAnnouncement(message)
 * - setUrgentAnnouncement(message)
 */

export const useUIStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      selectedSceneId: null,
      selectedSceneForEdit: null,
      lastSaved: null,
      isSaving: false,
      announcement: '',
      urgentAnnouncement: '',

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
    })),
    { name: 'UIStore' }
  )
);
