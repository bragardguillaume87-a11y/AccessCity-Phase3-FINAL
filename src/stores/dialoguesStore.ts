import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { Dialogue } from '../types';

/**
 * Dialogues Store
 *
 * **Pattern**: Repository Pattern - gère les dialogues par scène
 * **Séparation**: Extract de scenesStore.ts (Vague 9, Phase 3)
 *
 * Structure: Record<sceneId, Dialogue[]>
 * - Chaque scène a sa liste de dialogues indépendante
 * - Actions CRUD complètes par sceneId
 * - Batch operations pour performance
 */

// ============================================================================
// TYPES
// ============================================================================

interface DialoguesState {
  // State: Dialogues par scène
  dialoguesByScene: Record<string, Dialogue[]>;

  // Queries
  getDialoguesByScene: (sceneId: string) => Dialogue[];
  getDialogueByIndex: (sceneId: string, index: number) => Dialogue | undefined;

  // Actions: CRUD
  addDialogue: (sceneId: string, dialogue: Dialogue) => void;
  addDialogues: (sceneId: string, dialogues: Dialogue[]) => void;
  insertDialoguesAfter: (sceneId: string, afterIndex: number, dialogues: Dialogue[]) => void;
  updateDialogue: (
    sceneId: string,
    index: number,
    patch: Partial<Dialogue> | ((dialogue: Dialogue) => Partial<Dialogue>)
  ) => void;
  deleteDialogue: (sceneId: string, index: number) => void;
  reorderDialogues: (sceneId: string, oldIndex: number, newIndex: number) => void;
  duplicateDialogue: (sceneId: string, index: number) => void;

  // Batch operations (performance)
  batchUpdateDialogues: (
    sceneId: string,
    updates: Array<{ index: number; patch: Partial<Dialogue> }>
  ) => void;

  // Cascade delete (appelé par scenesStore)
  deleteAllDialoguesForScene: (sceneId: string) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère un ID unique pour dialogue
 */
function generateDialogueId(): string {
  return `dialogue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Génère un ID unique pour choice
 */
function generateChoiceId(index: number): string {
  return `choice-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// SAMPLE DATA - Dialogues de démonstration
// ============================================================================

const SAMPLE_DIALOGUES: Record<string, Dialogue[]> = {
  scenetest01: [
    { id: 'd01-00', speaker: 'narrator', text: "Vous arrivez devant la mairie pour présenter AccessCity — une initiative pour rendre la ville accessible à tous.", choices: [], stageDirections: "Le joueur s'arrête devant l'entrée principale." },
    { id: 'd01-01', speaker: 'counsellor', text: "Bonjour ! Je suis le conseiller Dupont. J'ai entendu parler de votre projet — je suis impatient d'en savoir plus.", choices: [], speakerMood: 'happy' },
    { id: 'd01-02', speaker: 'player', text: "Merci de me recevoir, monsieur. AccessCity vise à cartographier et corriger tous les obstacles à l'accessibilité dans notre quartier.", choices: [] },
    { id: 'd01-03', speaker: 'counsellor', text: "Intéressant. Quelle sera votre première priorité sur le terrain ?", choices: [
      { id: 'c01-03-A', text: "Les rampes d'accès : elles bloquent les fauteuils roulants.", effects: [{ variable: 'mentale', value: 5, operation: 'add' }], actionType: 'continue', nextDialogueId: 'd01-04' },
      { id: 'c01-03-B', text: 'La signalétique : les personnes malvoyantes sont aussi concernées.', effects: [{ variable: 'mentale', value: 3, operation: 'add' }], actionType: 'continue', nextDialogueId: 'd01-05' }
    ]},
    { id: 'd01-04', speaker: 'counsellor', text: 'Excellent choix ! Les rampes sont souvent négligées. Votre approche est très concrète.', choices: [], isResponse: true, speakerMood: 'happy', nextDialogueId: 'd01-06' },
    { id: 'd01-05', speaker: 'counsellor', text: 'Très juste ! La signalétique profite à tout le monde — et c\'est souvent peu coûteux à corriger.', choices: [], isResponse: true, speakerMood: 'happy', nextDialogueId: 'd01-06' },
    { id: 'd01-06', speaker: 'counsellor', text: "Avant de vous accorder un budget, je dois m'assurer que vous pouvez défendre ce projet devant le conseil. Êtes-vous prêt ?", choices: [
      { id: 'c01-06-dice', text: 'Je tente de convaincre le conseil !', effects: [], actionType: 'diceCheck', diceCheck: { stat: 'mentale', difficulty: 50, success: { nextDialogueId: 'd01-07' }, failure: { nextDialogueId: 'd01-08' } }}
    ], stageDirections: 'Le jet de dés détermine si le joueur convainc le conseil municipal.' },
    { id: 'd01-07', speaker: 'counsellor', text: "Remarquable ! Votre discours a convaincu le conseil à l'unanimité. Le budget est accordé !", choices: [], speakerMood: 'happy', nextDialogueId: 'd01-09' },
    { id: 'd01-08', speaker: 'counsellor', text: 'Le conseil hésite encore. Revenez avec des données de terrain plus précises et nous reconsidérerons.', choices: [], speakerMood: 'neutral', nextDialogueId: 'd01-09' },
    { id: 'd01-09', speaker: 'narrator', text: "La rencontre s'est terminée. Votre aventure pour rendre la ville accessible à tous ne fait que commencer.", choices: [], stageDirections: 'Le joueur quitte la salle du conseil avec ses notes.' }
  ],
  scenetest02: [
    { id: 'd02-00', speaker: 'narrator', text: "Une nouvelle journée commence. Carnet en main, vous sortez recenser les obstacles à l'accessibilité.", choices: [] },
    { id: 'd02-01', speaker: 'player', text: 'Par où commencer ? Le quartier est vaste...', choices: [] },
    { id: 'd02-02', speaker: 'narrator', text: "Devant la pharmacie, une marche de 12 cm bloque les fauteuils roulants. C'est un bon point de départ.", choices: [] },
    { id: 'd02-03', speaker: 'player', text: '...', choices: [
      { id: 'c02-03-A', text: 'Je mesure et photographie le problème avec précision.', effects: [{ variable: 'mentale', value: 5, operation: 'add' }], actionType: 'continue' },
      { id: 'c02-03-B', text: "Je note l'emplacement et continue rapidement.", effects: [{ variable: 'mentale', value: 2, operation: 'add' }], actionType: 'continue' }
    ]}
  ]
};

// ============================================================================
// STORE
// ============================================================================

export const useDialoguesStore = create<DialoguesState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set, get) => ({
          // ============================================================
          // STATE INITIAL
          // ============================================================
          dialoguesByScene: SAMPLE_DIALOGUES,

          // ============================================================
          // QUERIES
          // ============================================================

          getDialoguesByScene: (sceneId) => {
            return get().dialoguesByScene[sceneId] || [];
          },

          getDialogueByIndex: (sceneId, index) => {
            const dialogues = get().dialoguesByScene[sceneId];
            return dialogues?.[index];
          },

          // ============================================================
          // ACTIONS: CREATE
          // ============================================================

          /**
           * Ajoute un dialogue à la fin de la liste pour une scène
           */
          addDialogue: (sceneId, dialogue) => {
            set(
              (state) => ({
                dialoguesByScene: {
                  ...state.dialoguesByScene,
                  [sceneId]: [...(state.dialoguesByScene[sceneId] || []), dialogue],
                },
              }),
              false,
              'dialogues/addDialogue'
            );
          },

          /**
           * Ajoute plusieurs dialogues à la fin
           */
          addDialogues: (sceneId, dialogues) => {
            set(
              (state) => ({
                dialoguesByScene: {
                  ...state.dialoguesByScene,
                  [sceneId]: [...(state.dialoguesByScene[sceneId] || []), ...dialogues],
                },
              }),
              false,
              'dialogues/addDialogues'
            );
          },

          /**
           * Insère dialogues APRÈS un index donné
           */
          insertDialoguesAfter: (sceneId, afterIndex, dialogues) => {
            set(
              (state) => {
                const existing = state.dialoguesByScene[sceneId] || [];
                const before = existing.slice(0, afterIndex + 1);
                const after = existing.slice(afterIndex + 1);
                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: [...before, ...dialogues, ...after],
                  },
                };
              },
              false,
              'dialogues/insertDialoguesAfter'
            );
          },

          // ============================================================
          // ACTIONS: UPDATE
          // ============================================================

          /**
           * Met à jour un dialogue par index
           */
          updateDialogue: (sceneId, index, patch) => {
            set(
              (state) => {
                const dialogues = state.dialoguesByScene[sceneId];
                if (!dialogues || !dialogues[index]) return state;

                const dialogue = dialogues[index];
                const updates = typeof patch === 'function' ? patch(dialogue) : patch;

                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: dialogues.map((d, i) =>
                      i === index ? { ...d, ...updates } : d
                    ),
                  },
                };
              },
              false,
              'dialogues/updateDialogue'
            );
          },

          /**
           * Batch update : met à jour plusieurs dialogues en une seule opération
           */
          batchUpdateDialogues: (sceneId, updates) => {
            set(
              (state) => {
                const dialogues = state.dialoguesByScene[sceneId];
                if (!dialogues) return state;

                const updated = [...dialogues];
                updates.forEach(({ index, patch }) => {
                  if (updated[index]) {
                    updated[index] = { ...updated[index], ...patch };
                  }
                });

                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: updated,
                  },
                };
              },
              false,
              'dialogues/batchUpdateDialogues'
            );
          },

          // ============================================================
          // ACTIONS: DELETE
          // ============================================================

          /**
           * Supprime un dialogue par index
           */
          deleteDialogue: (sceneId, index) => {
            set(
              (state) => {
                const dialogues = state.dialoguesByScene[sceneId];
                if (!dialogues) return state;

                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: dialogues.filter((_, i) => i !== index),
                  },
                };
              },
              false,
              'dialogues/deleteDialogue'
            );
          },

          /**
           * CASCADE DELETE: Supprime tous les dialogues d'une scène
           * Appelé par scenesStore.deleteScene()
           */
          deleteAllDialoguesForScene: (sceneId) => {
            set(
              (state) => {
                const { [sceneId]: _, ...rest } = state.dialoguesByScene;
                return {
                  dialoguesByScene: rest,
                };
              },
              false,
              'dialogues/deleteAllDialoguesForScene'
            );
          },

          // ============================================================
          // ACTIONS: REORDER
          // ============================================================

          /**
           * Réordonne un dialogue (drag-and-drop)
           */
          reorderDialogues: (sceneId, oldIndex, newIndex) => {
            set(
              (state) => {
                const dialogues = state.dialoguesByScene[sceneId];
                if (!dialogues) return state;

                // Bounds check
                if (
                  oldIndex < 0 ||
                  oldIndex >= dialogues.length ||
                  newIndex < 0 ||
                  newIndex >= dialogues.length
                ) {
                  return state;
                }

                const reordered = [...dialogues];
                const [moved] = reordered.splice(oldIndex, 1);
                reordered.splice(newIndex, 0, moved);

                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: reordered,
                  },
                };
              },
              false,
              'dialogues/reorderDialogues'
            );
          },

          // ============================================================
          // ACTIONS: DUPLICATE
          // ============================================================

          /**
           * Duplique un dialogue avec nouveaux IDs
           */
          duplicateDialogue: (sceneId, index) => {
            set(
              (state) => {
                const dialogues = state.dialoguesByScene[sceneId];
                if (!dialogues || !dialogues[index]) return state;

                const original = dialogues[index];

                // Clone avec NEW IDs
                const cloned: Dialogue = {
                  ...original,
                  id: generateDialogueId(),
                };

                // Clone choices avec NEW IDs si présents
                if (original.choices && original.choices.length > 0) {
                  cloned.choices = original.choices.map((choice, i) => ({
                    ...choice,
                    id: generateChoiceId(i),
                  }));
                }

                // Insérer après l'original
                const updated = [...dialogues];
                updated.splice(index + 1, 0, cloned);

                return {
                  dialoguesByScene: {
                    ...state.dialoguesByScene,
                    [sceneId]: updated,
                  },
                };
              },
              false,
              'dialogues/duplicateDialogue'
            );
          },
        })),
        { name: 'DialoguesStore' }
      ),
      {
        name: 'dialogues-storage',
        storage: createJSONStorage(() => localStorage),
        version: 1,
      }
    ),
    {
      limit: 50,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    }
  )
);
