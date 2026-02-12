import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { toAbsoluteAssetPath } from '../utils/pathUtils';
import { setupAutoSave } from '../utils/storeSubscribers';
import type { Scene, Dialogue, SceneCharacter, TextBox, Prop, Position } from '../types';

/**
 * Scenes Store
 * Manages scenes, their dialogues, and characters placed on the scene.
 */

// ============================================================================
// TYPES
// ============================================================================

interface ScenesState {
  // State
  scenes: Scene[];

  // Actions: Scenes
  addScene: () => string;
  updateScene: (sceneId: string, patch: Partial<Scene> | ((scene: Scene) => Partial<Scene>)) => void;
  deleteScene: (sceneId: string) => void;
  reorderScenes: (newScenesOrder: Scene[]) => void;
  setSceneBackground: (sceneId: string, backgroundUrl: string) => void;

  // PERFORMANCE: Batch operations to reduce re-renders
  batchUpdateScenes: (updates: Array<{ sceneId: string; patch: Partial<Scene> }>) => void;

  // Actions: Dialogues
  addDialogue: (sceneId: string, dialogue: Dialogue) => void;
  addDialogues: (sceneId: string, dialogues: Dialogue[]) => void;
  insertDialoguesAfter: (sceneId: string, afterIndex: number, dialogues: Dialogue[]) => void;
  updateDialogue: (sceneId: string, index: number, patch: Partial<Dialogue> | ((dialogue: Dialogue) => Partial<Dialogue>)) => void;
  deleteDialogue: (sceneId: string, index: number) => void;
  reorderDialogues: (sceneId: string, oldIndex: number, newIndex: number) => void;
  duplicateDialogue: (sceneId: string, index: number) => void;

  // PERFORMANCE: Batch dialogue operations
  batchUpdateDialogues: (sceneId: string, updates: Array<{ index: number; patch: Partial<Dialogue> }>) => void;

  // Actions: Scene Characters
  addCharacterToScene: (
    sceneId: string,
    characterId: string,
    mood?: string,
    position?: Position,
    entranceAnimation?: string
  ) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharId: string) => void;
  updateSceneCharacter: (sceneId: string, sceneCharId: string, updates: Partial<SceneCharacter>) => void;
  updateCharacterAnimation: (sceneId: string, characterInstanceId: string, animations: Partial<Pick<SceneCharacter, 'entranceAnimation' | 'exitAnimation'>>) => void;
  updateCharacterPosition: (sceneId: string, sceneCharacterId: string, updates: { x?: number; y?: number; scale?: number }) => void;

  // Actions: Text Boxes
  addTextBoxToScene: (sceneId: string, textBox: TextBox) => void;
  removeTextBoxFromScene: (sceneId: string, textBoxId: string) => void;
  updateTextBox: (sceneId: string, textBoxId: string, updates: Partial<TextBox>) => void;

  // Actions: Props
  addPropToScene: (sceneId: string, prop: Prop) => void;
  removePropFromScene: (sceneId: string, propId: string) => void;
  updateProp: (sceneId: string, propId: string, updates: Partial<Prop>) => void;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

// ─── Scene 1 : Rencontre Mairie ──────────────────────────────────────────────
// Structure linéaire : 10 dialogues illustrant tous les types disponibles.
//
// Rangée 0 (→) : d0 narrateur · d1 conseiller · d2 joueur · d3 conseiller(choix binaire) · d4 réponse-A · d5 réponse-B
// Rangée 1 (←) : d6 conseiller(dés) · d7 succès · d8 échec · d9 narrateur(fin)
//
// Types utilisés :
//   • Dialogue simple   — d0, d1, d2, d7, d8, d9
//   • Choix binaire     — d3 (2 branches → d4 ou d5, convergent sur d6)
//   • Réponse (isResponse) — d4, d5
//   • Dés magiques      — d6 (DiceCheck stat:Mentale, difficulty:50)
const SAMPLE_SCENES: Scene[] = [
  {
    id: "scenetest01",
    title: "Rencontre Mairie",
    description: "Première rencontre avec le conseiller municipal pour le projet AccessCity.",
    backgroundUrl: "",
    characters: [
      {
        id: "scene-char-player-01",
        characterId: 'player',
        mood: 'neutral',
        position: { x: 20, y: 50 },
        size: { width: 200, height: 300 },
        entranceAnimation: 'fadeIn',
        exitAnimation: 'none',
      },
      {
        id: "scene-char-counsellor-01",
        characterId: 'counsellor',
        mood: 'neutral',
        position: { x: 80, y: 50 },
        size: { width: 200, height: 300 },
        entranceAnimation: 'slideInRight',
        exitAnimation: 'none',
      }
    ],
    textBoxes: [],
    props: [],
    dialogues: [
      // ── d0 · Narrateur simple ────────────────────────────────────────────
      {
        id: "d01-00",
        speaker: "narrator",
        text: "Vous arrivez devant la mairie pour présenter AccessCity — une initiative pour rendre la ville accessible à tous.",
        choices: [],
        stageDirections: "Le joueur s'arrête devant l'entrée principale.",
      },
      // ── d1 · Conseiller simple ───────────────────────────────────────────
      {
        id: "d01-01",
        speaker: "counsellor",
        text: "Bonjour ! Je suis le conseiller Dupont. J'ai entendu parler de votre projet — je suis impatient d'en savoir plus.",
        choices: [],
        speakerMood: "happy",
      },
      // ── d2 · Joueur simple ───────────────────────────────────────────────
      {
        id: "d01-02",
        speaker: "player",
        text: "Merci de me recevoir, monsieur. AccessCity vise à cartographier et corriger tous les obstacles à l'accessibilité dans notre quartier.",
        choices: [],
      },
      // ── d3 · Choix binaire ───────────────────────────────────────────────
      {
        id: "d01-03",
        speaker: "counsellor",
        text: "Intéressant. Quelle sera votre première priorité sur le terrain ?",
        choices: [
          {
            id: "c01-03-A",
            text: "Les rampes d'accès : elles bloquent les fauteuils roulants.",
            effects: [{ variable: "mentale", value: 5, operation: "add" }],
            actionType: "continue",
            nextDialogueId: "d01-04",
          },
          {
            id: "c01-03-B",
            text: "La signalétique : les personnes malvoyantes sont aussi concernées.",
            effects: [{ variable: "mentale", value: 3, operation: "add" }],
            actionType: "continue",
            nextDialogueId: "d01-05",
          },
        ],
      },
      // ── d4 · Réponse A (isResponse) ──────────────────────────────────────
      {
        id: "d01-04",
        speaker: "counsellor",
        text: "Excellent choix ! Les rampes sont souvent négligées. Votre approche est très concrète.",
        choices: [],
        isResponse: true,
        speakerMood: "happy",
        nextDialogueId: "d01-06",
      },
      // ── d5 · Réponse B (isResponse) ──────────────────────────────────────
      {
        id: "d01-05",
        speaker: "counsellor",
        text: "Très juste ! La signalétique profite à tout le monde — et c'est souvent peu coûteux à corriger.",
        choices: [],
        isResponse: true,
        speakerMood: "happy",
        nextDialogueId: "d01-06",
      },
      // ── d6 · Dés magiques ─────────────────────────────────────────────────
      {
        id: "d01-06",
        speaker: "counsellor",
        text: "Avant de vous accorder un budget, je dois m'assurer que vous pouvez défendre ce projet devant le conseil. Êtes-vous prêt ?",
        choices: [
          {
            id: "c01-06-dice",
            text: "Je tente de convaincre le conseil !",
            effects: [],
            actionType: "diceCheck",
            diceCheck: {
              stat: "mentale",
              difficulty: 50,
              success: { nextDialogueId: "d01-07" },
              failure: { nextDialogueId: "d01-08" },
            },
          },
        ],
        stageDirections: "Le jet de dés détermine si le joueur convainc le conseil municipal.",
      },
      // ── d7 · Succès dés ───────────────────────────────────────────────────
      {
        id: "d01-07",
        speaker: "counsellor",
        text: "Remarquable ! Votre discours a convaincu le conseil à l'unanimité. Le budget est accordé !",
        choices: [],
        speakerMood: "happy",
        nextDialogueId: "d01-09",
      },
      // ── d8 · Échec dés ────────────────────────────────────────────────────
      {
        id: "d01-08",
        speaker: "counsellor",
        text: "Le conseil hésite encore. Revenez avec des données de terrain plus précises et nous reconsidérerons.",
        choices: [],
        speakerMood: "neutral",
        nextDialogueId: "d01-09",
      },
      // ── d9 · Narrateur fin ────────────────────────────────────────────────
      {
        id: "d01-09",
        speaker: "narrator",
        text: "La rencontre s'est terminée. Votre aventure pour rendre la ville accessible à tous ne fait que commencer.",
        choices: [],
        stageDirections: "Le joueur quitte la salle du conseil avec ses notes.",
      },
    ],
  },
  // ─── Scene 2 : Exploration du quartier ─────────────────────────────────────
  {
    id: "scenetest02",
    title: "Exploration du quartier",
    description: "Recensez les obstacles à l'accessibilité dans le quartier.",
    backgroundUrl: "",
    characters: [
      {
        id: "scene-char-player-02",
        characterId: 'player',
        mood: 'neutral',
        position: { x: 20, y: 50 },
        size: { width: 200, height: 300 },
        entranceAnimation: 'fadeIn',
        exitAnimation: 'none',
      }
    ],
    textBoxes: [],
    props: [],
    dialogues: [
      {
        id: "d02-00",
        speaker: "narrator",
        text: "Une nouvelle journée commence. Carnet en main, vous sortez recenser les obstacles à l'accessibilité.",
        choices: [],
      },
      {
        id: "d02-01",
        speaker: "player",
        text: "Par où commencer ? Le quartier est vaste...",
        choices: [],
      },
      {
        id: "d02-02",
        speaker: "narrator",
        text: "Devant la pharmacie, une marche de 12 cm bloque les fauteuils roulants. C'est un bon point de départ.",
        choices: [],
      },
      {
        id: "d02-03",
        speaker: "player",
        text: "...",
        choices: [
          {
            id: "c02-03-A",
            text: "Je mesure et photographie le problème avec précision.",
            effects: [{ variable: "mentale", value: 5, operation: "add" }],
            actionType: "continue",
          },
          {
            id: "c02-03-B",
            text: "Je note l'emplacement et continue rapidement.",
            effects: [{ variable: "mentale", value: 2, operation: "add" }],
            actionType: "continue",
          },
        ],
      },
    ],
  },
];

// ============================================================================
// STORE
// ============================================================================

export const useScenesStore = create<ScenesState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set) => ({
          // State
          scenes: SAMPLE_SCENES,

          // Actions: Scenes
          addScene: () => {
            const newId = "scene-" + Date.now();
            const newScene: Scene = {
              id: newId,
              title: "New scene",
              description: "",
              backgroundUrl: toAbsoluteAssetPath(""),
              dialogues: [],
              characters: [
                // Player character is always present by default (left position)
                {
                  id: `scene-char-player-${Date.now()}`,
                  characterId: 'player',
                  mood: 'neutral',
                  position: { x: 20, y: 50 },
                  size: { width: 200, height: 300 },
                  entranceAnimation: 'fadeIn',
                  exitAnimation: 'none',
                }
              ],
              textBoxes: [],
              props: [],
            };

            set((state) => ({
              scenes: [...state.scenes, newScene],
            }), false, 'scenes/addScene');

            return newId;
          },

          updateScene: (sceneId, patch) => {
            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                let next = {
                  ...s,
                  ...(typeof patch === 'function' ? patch(s) : patch),
                };

                // Normalize backgroundUrl if present in the patch
                if (Object.prototype.hasOwnProperty.call(next, 'backgroundUrl')) {
                  next.backgroundUrl = toAbsoluteAssetPath(next.backgroundUrl);
                }

                return next;
              }),
            }), false, 'scenes/updateScene');
          },

          deleteScene: (sceneId) => {
            set((state) => ({
              scenes: state.scenes.filter((s) => s.id !== sceneId),
            }), false, 'scenes/deleteScene');
          },

          reorderScenes: (newScenesOrder) => {
            set({ scenes: newScenesOrder }, false, 'scenes/reorderScenes');
          },

          setSceneBackground: (sceneId, backgroundUrl) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : { ...s, backgroundUrl: toAbsoluteAssetPath(backgroundUrl) }
              ),
            }), false, 'scenes/setSceneBackground');
          },

          // PERFORMANCE: Batch scene updates (single re-render for multiple changes)
          batchUpdateScenes: (updates) => {
            if (!updates || updates.length === 0) return;

            // Create a Map for O(1) lookup
            const updatesMap = new Map(updates.map(u => [u.sceneId, u.patch]));

            set((state) => ({
              scenes: state.scenes.map((s) => {
                const patch = updatesMap.get(s.id);
                if (!patch) return s;

                let next = { ...s, ...patch };

                // Normalize backgroundUrl if present
                if (Object.prototype.hasOwnProperty.call(next, 'backgroundUrl')) {
                  next.backgroundUrl = toAbsoluteAssetPath(next.backgroundUrl);
                }

                return next;
              }),
            }), false, 'scenes/batchUpdateScenes');
          },

          // Actions: Dialogues
          addDialogue: (sceneId, dialogue) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : { ...s, dialogues: [...(s.dialogues || []), dialogue] }
              ),
            }), false, 'scenes/addDialogue');
          },

          addDialogues: (sceneId, dialogues) => {
            if (!dialogues || dialogues.length === 0) return;

            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : { ...s, dialogues: [...(s.dialogues || []), ...dialogues] }
              ),
            }), false, 'scenes/addDialogues');
          },

          insertDialoguesAfter: (sceneId, afterIndex, dialogues) => {
            if (!dialogues || dialogues.length === 0) return;

            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];
                // Insert dialogues after the specified index
                list.splice(afterIndex + 1, 0, ...dialogues);

                return { ...s, dialogues: list };
              }),
            }), false, 'scenes/insertDialoguesAfter');
          },

          updateDialogue: (sceneId, index, patch) => {
            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];
                if (index < 0 || index >= list.length) return s;

                list[index] = {
                  ...list[index],
                  ...(typeof patch === 'function' ? patch(list[index]) : patch),
                };

                return { ...s, dialogues: list };
              }),
            }), false, 'scenes/updateDialogue');
          },

          deleteDialogue: (sceneId, index) => {
            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];
                if (index < 0 || index >= list.length) return s;

                list.splice(index, 1);
                return { ...s, dialogues: list };
              }),
            }), false, 'scenes/deleteDialogue');
          },

          reorderDialogues: (sceneId, oldIndex, newIndex) => {
            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];
                if (oldIndex < 0 || oldIndex >= list.length || newIndex < 0 || newIndex >= list.length) return s;

                // Reorganize: remove then insert
                const [movedItem] = list.splice(oldIndex, 1);
                list.splice(newIndex, 0, movedItem);

                return { ...s, dialogues: list };
              }),
            }), false, 'scenes/reorderDialogues');
          },

          duplicateDialogue: (sceneId, index) => {
            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];
                if (index < 0 || index >= list.length) return s;

                // Duplicate the dialogue with a NEW unique ID
                const original = list[index];
                const duplicate: Dialogue = {
                  ...original,
                  id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  text: `${original.text} (copie)`,
                  // Also duplicate choices with new IDs to avoid conflicts
                  choices: original.choices.map((choice, i) => ({
                    ...choice,
                    id: `choice-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                  })),
                };

                // Insert just after the original
                list.splice(index + 1, 0, duplicate);

                return { ...s, dialogues: list };
              }),
            }), false, 'scenes/duplicateDialogue');
          },

          // PERFORMANCE: Batch dialogue updates (single re-render for multiple changes)
          batchUpdateDialogues: (sceneId, updates) => {
            if (!updates || updates.length === 0) return;

            // Create a Map for O(1) lookup
            const updatesMap = new Map(updates.map(u => [u.index, u.patch]));

            set((state) => ({
              scenes: state.scenes.map((s) => {
                if (s.id !== sceneId) return s;

                const list = [...(s.dialogues || [])];

                // Apply all updates in one pass
                const updatedList = list.map((dialogue, idx) => {
                  const patch = updatesMap.get(idx);
                  return patch ? { ...dialogue, ...patch } : dialogue;
                });

                return { ...s, dialogues: updatedList };
              }),
            }), false, 'scenes/batchUpdateDialogues');
          },

          // Actions: Scene Characters
          addCharacterToScene: (sceneId, characterId, mood = 'neutral', position = { x: 50, y: 50 }, entranceAnimation = 'none') => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      characters: [
                        ...(s.characters || []),
                        {
                          id: `scene-char-${Date.now()}`,
                          characterId,
                          mood,
                          position,
                          size: { width: 200, height: 300 },
                          entranceAnimation,
                          exitAnimation: 'none',
                        },
                      ],
                    }
              ),
            }), false, 'scenes/addCharacterToScene');
          },

          removeCharacterFromScene: (sceneId, sceneCharId) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      characters: (s.characters || []).filter(
                        (sc) => sc.id !== sceneCharId
                      ),
                    }
              ),
            }), false, 'scenes/removeCharacterFromScene');
          },

          updateSceneCharacter: (sceneId, sceneCharId, updates) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      characters: (s.characters || []).map((sc) =>
                        sc.id !== sceneCharId ? sc : { ...sc, ...updates }
                      ),
                    }
              ),
            }), false, 'scenes/updateSceneCharacter');
          },

          updateCharacterAnimation: (sceneId, characterInstanceId, animations) => {
            set((state) => ({
              scenes: state.scenes.map((scene) => {
                if (scene.id !== sceneId) return scene;

                return {
                  ...scene,
                  characters: (scene.characters || []).map((char) => {
                    if (char.id !== characterInstanceId) return char;

                    return {
                      ...char,
                      ...animations // { entranceAnimation, exitAnimation }
                    };
                  })
                };
              })
            }), false, 'scenes/updateCharacterAnimation');
          },

          // PHASE 8: Character Positioning Quick Tools
          updateCharacterPosition: (sceneId, sceneCharacterId, updates) => {
            set((state) => ({
              scenes: state.scenes.map((scene) => {
                if (scene.id !== sceneId) return scene;

                return {
                  ...scene,
                  characters: (scene.characters || []).map((char) => {
                    if (char.id !== sceneCharacterId) return char;

                    // Merge position updates (x, y) and scale
                    const updatedChar = { ...char };

                    if (updates.x !== undefined || updates.y !== undefined) {
                      updatedChar.position = {
                        x: updates.x ?? char.position?.x ?? 50,
                        y: updates.y ?? char.position?.y ?? 50
                      };
                    }

                    if (updates.scale !== undefined) {
                      updatedChar.scale = updates.scale;
                    }

                    return updatedChar;
                  })
                };
              })
            }), false, 'scenes/updateCharacterPosition');
          },

          // Actions: Text Boxes
          addTextBoxToScene: (sceneId, textBox) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      textBoxes: [
                        ...(s.textBoxes || []),
                        textBox
                      ],
                    }
              ),
            }), false, 'scenes/addTextBoxToScene');
          },

          removeTextBoxFromScene: (sceneId, textBoxId) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      textBoxes: (s.textBoxes || []).filter(
                        (tb) => tb.id !== textBoxId
                      ),
                    }
              ),
            }), false, 'scenes/removeTextBoxFromScene');
          },

          updateTextBox: (sceneId, textBoxId, updates) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      textBoxes: (s.textBoxes || []).map((tb) =>
                        tb.id !== textBoxId ? tb : { ...tb, ...updates }
                      ),
                    }
              ),
            }), false, 'scenes/updateTextBox');
          },

          // Actions: Props
          addPropToScene: (sceneId, prop) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      props: [
                        ...(s.props || []),
                        prop
                      ],
                    }
              ),
            }), false, 'scenes/addPropToScene');
          },

          removePropFromScene: (sceneId, propId) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      props: (s.props || []).filter(
                        (p) => p.id !== propId
                      ),
                    }
              ),
            }), false, 'scenes/removePropFromScene');
          },

          updateProp: (sceneId, propId, updates) => {
            set((state) => ({
              scenes: state.scenes.map((s) =>
                s.id !== sceneId
                  ? s
                  : {
                      ...s,
                      props: (s.props || []).map((p) =>
                        p.id !== propId ? p : { ...p, ...updates }
                      ),
                    }
              ),
            }), false, 'scenes/updateProp');
          },
        })),
        { name: 'ScenesStore' }
      ),
      {
        name: 'scenes-storage',
        storage: createJSONStorage(() => localStorage),
        version: 2, // bump → forces localStorage reset, loads new SAMPLE_SCENES
      }
    ),
    {
      limit: 50,
      // PERFORMANCE: Only compare reference equality (fast)
      equality: (pastState, currentState) => pastState === currentState,
      // PERFORMANCE: Only track 'scenes' in undo history (not actions)
      // @ts-expect-error - Zundo partialize expects subset of state (this is correct behavior)
      partialize: (state) => ({
        scenes: state.scenes
      }),
    }
  )
);

// Auto-save subscriber with HMR cleanup (centralized in storeSubscribers.ts)
setupAutoSave(useScenesStore, (state) => state.scenes, 'scenes');
