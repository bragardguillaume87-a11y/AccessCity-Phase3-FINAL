import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/storageKeys';

/**
 * Store onboarding — tutoriels guidés du module Distribution.
 *
 * Persistance (localStorage) : `seenTutorials` uniquement.
 * État de session (non persisté) : `activeTutorialId`, `activeTutorialStep`.
 *
 * Pas de temporal (undo/redo) : l'état de tutoriel ne doit pas être annulable.
 */

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingState {
  // ── Persisté ────────────────────────────────────────────────────────────────
  seenTutorials: string[];

  // ── Session (réinitialisé au chargement) ────────────────────────────────────
  activeTutorialId: string | null;
  activeTutorialStep: number;

  // ── Actions ─────────────────────────────────────────────────────────────────
  startTutorial: (id: string) => void;
  nextStep: (totalSteps: number) => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: (id: string) => void;
  markSeen: (id: string) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
        seenTutorials: [],
        activeTutorialId: null,
        activeTutorialStep: 0,

        startTutorial: (id) =>
          set({ activeTutorialId: id, activeTutorialStep: 0 }, false, 'onboarding/startTutorial'),

        nextStep: (totalSteps) =>
          set(
            (state) => {
              const next = state.activeTutorialStep + 1;
              if (next >= totalSteps) {
                // Dernier pas → marquer comme vu + fermer
                return {
                  seenTutorials: state.seenTutorials.includes(state.activeTutorialId ?? '')
                    ? state.seenTutorials
                    : [...state.seenTutorials, state.activeTutorialId ?? ''].filter(Boolean),
                  activeTutorialId: null,
                  activeTutorialStep: 0,
                };
              }
              return { activeTutorialStep: next };
            },
            false,
            'onboarding/nextStep'
          ),

        prevStep: () =>
          set(
            (state) => ({
              activeTutorialStep: Math.max(0, state.activeTutorialStep - 1),
            }),
            false,
            'onboarding/prevStep'
          ),

        skipTutorial: () =>
          set(
            (state) => ({
              seenTutorials: state.seenTutorials.includes(state.activeTutorialId ?? '')
                ? state.seenTutorials
                : [...state.seenTutorials, state.activeTutorialId ?? ''].filter(Boolean),
              activeTutorialId: null,
              activeTutorialStep: 0,
            }),
            false,
            'onboarding/skipTutorial'
          ),

        completeTutorial: () =>
          set(
            (state) => ({
              seenTutorials: state.seenTutorials.includes(state.activeTutorialId ?? '')
                ? state.seenTutorials
                : [...state.seenTutorials, state.activeTutorialId ?? ''].filter(Boolean),
              activeTutorialId: null,
              activeTutorialStep: 0,
            }),
            false,
            'onboarding/completeTutorial'
          ),

        resetTutorial: (id) =>
          set(
            (state) => ({
              seenTutorials: state.seenTutorials.filter((s) => s !== id),
            }),
            false,
            'onboarding/resetTutorial'
          ),

        markSeen: (id) =>
          set(
            (state) => ({
              seenTutorials: state.seenTutorials.includes(id)
                ? state.seenTutorials
                : [...state.seenTutorials, id],
            }),
            false,
            'onboarding/markSeen'
          ),
      }),
      {
        name: STORAGE_KEYS.DISTRIBUTION_TUTORIAL_SEEN,
        storage: createJSONStorage(() => localStorage),
        // Persister uniquement les tutoriels déjà vus — pas l'état de session
        partialize: (state) => ({ seenTutorials: state.seenTutorials }),
      }
    ),
    { name: 'OnboardingStore' }
  )
);
