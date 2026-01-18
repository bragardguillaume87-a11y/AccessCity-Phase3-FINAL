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

const SAMPLE_SCENES: Scene[] = [
  {
    id: "scenetest01",
    title: "Rencontre Mairie",
    description: "Première rencontre avec le conseiller municipal pour discuter du projet AccessCity.",
    backgroundUrl: "",
    characters: [
      // Player character (left position)
      {
        id: "scene-char-player-01",
        characterId: 'player',
        mood: 'neutral',
        position: { x: 20, y: 50 },
        size: { width: 200, height: 300 },
        entranceAnimation: 'fadeIn',
        exitAnimation: 'none',
      },
      // Counsellor character (right position)
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
      {
        id: "dialogue-01-01",
        speaker: "narrator",
        text: "Vous arrivez devant la mairie pour présenter votre projet AccessCity, une initiative visant à rendre la ville plus accessible aux personnes à mobilité réduite.",
        choices: [],
      },
      {
        id: "dialogue-01-02",
        speaker: "counsellor",
        text: "Bonjour ! Bienvenue à la mairie. J'ai hâte de discuter de votre projet avec vous.",
        choices: [],
      },
      {
        id: "dialogue-01-03",
        speaker: "player",
        text: "Bonjour ! Merci de me recevoir.",
        choices: [],
      },
      {
        id: "dialogue-01-04",
        speaker: "counsellor",
        text: "Alors, parlez-moi de ce projet AccessCity. Comment comptez-vous améliorer l'accessibilité de notre ville ?",
        choices: [],
      },
      {
        id: "dialogue-01-05",
        speaker: "player",
        text: "...",
        choices: [
          {
            id: "choice-01-05-01",
            text: "Nous allons cartographier tous les points d'accès problématiques et proposer des solutions concrètes !",
            effects: [{ variable: "Mentale", value: 5, operation: "add" }],
          },
          {
            id: "choice-01-05-02",
            text: "Je n'ai pas beaucoup de temps pour les détails, mais c'est un projet important.",
            effects: [{ variable: "Mentale", value: -5, operation: "add" }],
          },
        ],
      },
      {
        id: "dialogue-01-06",
        speaker: "counsellor",
        text: "Excellent ! J'approuve votre approche. Tenez-moi au courant de vos progrès.",
        choices: [],
      },
    ],
  },
  {
    id: "scenetest02",
    title: "Exploration du quartier",
    description: "Vous commencez à explorer le quartier pour identifier les zones à problèmes.",
    backgroundUrl: "",
    characters: [
      // Player character (default position)
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
        id: "dialogue-02-01",
        speaker: "narrator",
        text: "Une nouvelle journée commence. Vous sortez dans le quartier avec votre carnet de notes pour recenser les obstacles à l'accessibilité.",
        choices: [],
      },
      {
        id: "dialogue-02-02",
        speaker: "player",
        text: "Par où commencer ? Il y a tant à faire...",
        choices: [],
      },
      {
        id: "dialogue-02-03",
        speaker: "narrator",
        text: "Vous remarquez un trottoir avec une marche trop haute devant la pharmacie. C'est un bon point de départ.",
        choices: [],
      },
      {
        id: "dialogue-02-04",
        speaker: "player",
        text: "...",
        choices: [
          {
            id: "choice-02-04-01",
            text: "Je prends une photo et note les dimensions exactes.",
            effects: [{ variable: "Mentale", value: 3, operation: "add" }],
          },
          {
            id: "choice-02-04-02",
            text: "Je note rapidement l'emplacement et continue.",
            effects: [{ variable: "Mentale", value: 1, operation: "add" }],
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

                // Duplicate the dialogue
                const original = list[index];
                const duplicate: Dialogue = {
                  ...original,
                  text: `${original.text} (copie)`,
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
        version: 1,
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
