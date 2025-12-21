import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { toAbsoluteAssetPath } from '../utils/pathUtils.js';

/**
 * Scenes Store
 * Gere les scenes, leurs dialogues, et les personnages places sur la scene.
 *
 * State:
 * - scenes: array of { id, title, description, backgroundUrl?, dialogues: [], characters?: [] }
 *
 * Actions:
 * - addScene()
 * - updateScene(sceneId, patch)
 * - deleteScene(sceneId)
 * - reorderScenes(newScenesOrder)
 * - addDialogue(sceneId, dialogue)
 * - addDialogues(sceneId, dialogues)
 * - updateDialogue(sceneId, index, patch)
 * - deleteDialogue(sceneId, index)
 * - addCharacterToScene(sceneId, characterId, mood, position)
 * - removeCharacterFromScene(sceneId, sceneCharId)
 * - updateSceneCharacter(sceneId, sceneCharId, updates)
 */

const SAMPLE_SCENES = [
  {
    id: "scenetest01",
    title: "Rencontre Mairie",
    description: "Premiere scene de test.",
    backgroundUrl: "",
    dialogues: [
      {
        id: "dialogue-01-01",
        speaker: "narrator",
        text: "Vous arrivez devant la mairie.",
        choices: [],
      },
      {
        id: "dialogue-01-02",
        speaker: "counsellor",
        text: "Bonjour ! Discutons du projet.",
        choices: [],
      },
      {
        id: "dialogue-01-03",
        speaker: "player",
        text: "...",
        choices: [
          {
            id: "choice-01-03-01",
            text: "Bonjour, motive !",
            effects: [{ variable: "Mentale", value: 5, operation: "add" }],
          },
          {
            id: "choice-01-03-02",
            text: "Pas beaucoup de temps.",
            effects: [{ variable: "Mentale", value: -5, operation: "add" }],
          },
        ],
      },
    ],
  },
  {
    id: "scenetest02",
    title: "Suite de laventure",
    description: "Deuxieme scene.",
    backgroundUrl: "",
    dialogues: [
      {
        id: "dialogue-02-01",
        speaker: "narrator",
        text: "Une nouvelle journee commence...",
        choices: [],
      },
    ],
  },
];

export const useScenesStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      scenes: SAMPLE_SCENES,

      // Actions: Scenes
      addScene: () => {
        const newId = "scene-" + Date.now();
        const newScene = {
          id: newId,
          title: "New scene",
          description: "",
          backgroundUrl: toAbsoluteAssetPath(""),
          dialogues: [],
          characters: [],
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

            // Normalise backgroundUrl si present dans le patch
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

      // Actions: Scene Characters
      addCharacterToScene: (sceneId, characterId, mood = 'neutral', position = { x: 50, y: 50 }) => {
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
    })),
    { name: 'ScenesStore' }
  )
);
