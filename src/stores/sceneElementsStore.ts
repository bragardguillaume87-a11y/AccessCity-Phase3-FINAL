import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { SceneCharacter, TextBox, Prop } from '../types';

/** Scene Elements Store — Repository pattern for visual elements per scene */

export interface SceneElements {
  characters: SceneCharacter[];
  textBoxes: TextBox[];
  props: Prop[];
}

interface SceneElementsState {
  elementsByScene: Record<string, SceneElements>;
  getElementsForScene: (sceneId: string) => SceneElements;
  getCharactersForScene: (sceneId: string) => SceneCharacter[];
  addCharacterToScene: (
    sceneId: string,
    characterId: string,
    mood?: string,
    position?: { x: number; y: number },
    entranceAnimation?: string
  ) => void;
  removeCharacterFromScene: (sceneId: string, sceneCharacterId: string) => void;
  updateSceneCharacter: (
    sceneId: string,
    sceneCharacterId: string,
    updates: Partial<SceneCharacter>
  ) => void;
  updateCharacterAnimation: (
    sceneId: string,
    characterInstanceId: string,
    animations: {
      entranceAnimation?: string;
      exitAnimation?: string;
    }
  ) => void;
  updateCharacterPosition: (
    sceneId: string,
    sceneCharacterId: string,
    updates: Partial<Pick<SceneCharacter, 'position' | 'zIndex' | 'scale'>>
  ) => void;
  addTextBoxToScene: (sceneId: string, textBox: Omit<TextBox, 'id'>) => void;
  removeTextBoxFromScene: (sceneId: string, textBoxId: string) => void;
  updateTextBox: (sceneId: string, textBoxId: string, updates: Partial<TextBox>) => void;
  addPropToScene: (sceneId: string, prop: Omit<Prop, 'id'>) => void;
  removePropFromScene: (sceneId: string, propId: string) => void;
  updateProp: (sceneId: string, propId: string, updates: Partial<Prop>) => void;
  deleteAllElementsForScene: (sceneId: string) => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyElements(): SceneElements {
  return {
    characters: [],
    textBoxes: [],
    props: [],
  };
}

const SAMPLE_ELEMENTS: Record<string, SceneElements> = {
  scenetest01: {
    characters: [
      { id: 'scene-char-player-01', characterId: 'player', mood: 'neutral', position: { x: 20, y: 50 }, size: { width: 200, height: 300 }, entranceAnimation: 'fadeIn', exitAnimation: 'none' },
      { id: 'scene-char-counsellor-01', characterId: 'counsellor', mood: 'neutral', position: { x: 80, y: 50 }, size: { width: 200, height: 300 }, entranceAnimation: 'slideInRight', exitAnimation: 'none' }
    ],
    textBoxes: [],
    props: []
  },
  scenetest02: {
    characters: [
      { id: 'scene-char-player-02', characterId: 'player', mood: 'neutral', position: { x: 20, y: 50 }, size: { width: 200, height: 300 }, entranceAnimation: 'fadeIn', exitAnimation: 'none' }
    ],
    textBoxes: [],
    props: []
  }
};

export const useSceneElementsStore = create<SceneElementsState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set, get) => ({
          elementsByScene: SAMPLE_ELEMENTS,

          getElementsForScene: (sceneId) => {
            return get().elementsByScene[sceneId] || createEmptyElements();
          },

          getCharactersForScene: (sceneId) => {
            return get().elementsByScene[sceneId]?.characters || [];
          },

          addCharacterToScene: (sceneId, characterId, mood, position, entranceAnimation) => {
            set(
              (state) => {
                const existing = state.elementsByScene[sceneId] || createEmptyElements();

                const sceneChar: SceneCharacter = {
                  id: generateId('scene-char'),
                  characterId,
                  mood: mood || 'neutre',
                  position: position || { x: 50, y: 70 },
                  size: { width: 200, height: 300 },
                  zIndex: 1,
                  scale: 1,
                  entranceAnimation: entranceAnimation || 'fadeIn',
                  exitAnimation: 'fadeOut',
                };

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...existing,
                      characters: [...existing.characters, sceneChar],
                    },
                  },
                };
              },
              false,
              'sceneElements/addCharacterToScene'
            );
          },

          removeCharacterFromScene: (sceneId, sceneCharacterId) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      characters: elements.characters.filter((c) => c.id !== sceneCharacterId),
                    },
                  },
                };
              },
              false,
              'sceneElements/removeCharacterFromScene'
            );
          },

          updateSceneCharacter: (sceneId, sceneCharacterId, updates) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      characters: elements.characters.map((c) =>
                        c.id === sceneCharacterId ? { ...c, ...updates } : c
                      ),
                    },
                  },
                };
              },
              false,
              'sceneElements/updateSceneCharacter'
            );
          },

          updateCharacterAnimation: (sceneId, characterInstanceId, animations) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      characters: elements.characters.map((c) =>
                        c.id === characterInstanceId
                          ? {
                              ...c,
                              ...(animations.entranceAnimation !== undefined && {
                                entranceAnimation: animations.entranceAnimation,
                              }),
                              ...(animations.exitAnimation !== undefined && {
                                exitAnimation: animations.exitAnimation,
                              }),
                            }
                          : c
                      ),
                    },
                  },
                };
              },
              false,
              'sceneElements/updateCharacterAnimation'
            );
          },

          updateCharacterPosition: (sceneId, sceneCharacterId, updates) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      characters: elements.characters.map((c) =>
                        c.id === sceneCharacterId ? { ...c, ...updates } : c
                      ),
                    },
                  },
                };
              },
              false,
              'sceneElements/updateCharacterPosition'
            );
          },

          addTextBoxToScene: (sceneId, textBox) => {
            set(
              (state) => {
                const existing = state.elementsByScene[sceneId] || createEmptyElements();

                const newTextBox: TextBox = {
                  id: generateId('textbox'),
                  ...textBox,
                };

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...existing,
                      textBoxes: [...existing.textBoxes, newTextBox],
                    },
                  },
                };
              },
              false,
              'sceneElements/addTextBoxToScene'
            );
          },

          removeTextBoxFromScene: (sceneId, textBoxId) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      textBoxes: elements.textBoxes.filter((t) => t.id !== textBoxId),
                    },
                  },
                };
              },
              false,
              'sceneElements/removeTextBoxFromScene'
            );
          },

          updateTextBox: (sceneId, textBoxId, updates) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      textBoxes: elements.textBoxes.map((t) =>
                        t.id === textBoxId ? { ...t, ...updates } : t
                      ),
                    },
                  },
                };
              },
              false,
              'sceneElements/updateTextBox'
            );
          },

          addPropToScene: (sceneId, prop) => {
            set(
              (state) => {
                const existing = state.elementsByScene[sceneId] || createEmptyElements();

                const newProp: Prop = {
                  id: generateId('prop'),
                  ...prop,
                };

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...existing,
                      props: [...existing.props, newProp],
                    },
                  },
                };
              },
              false,
              'sceneElements/addPropToScene'
            );
          },

          removePropFromScene: (sceneId, propId) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      props: elements.props.filter((p) => p.id !== propId),
                    },
                  },
                };
              },
              false,
              'sceneElements/removePropFromScene'
            );
          },

          updateProp: (sceneId, propId, updates) => {
            set(
              (state) => {
                const elements = state.elementsByScene[sceneId];
                if (!elements) return state;

                return {
                  elementsByScene: {
                    ...state.elementsByScene,
                    [sceneId]: {
                      ...elements,
                      props: elements.props.map((p) => (p.id === propId ? { ...p, ...updates } : p)),
                    },
                  },
                };
              },
              false,
              'sceneElements/updateProp'
            );
          },

          deleteAllElementsForScene: (sceneId) => {
            set(
              (state) => {
                const { [sceneId]: _, ...rest } = state.elementsByScene;
                return {
                  elementsByScene: rest,
                };
              },
              false,
              'sceneElements/deleteAllElementsForScene'
            );
          },
        })),
        { name: 'SceneElementsStore' }
      ),
      {
        name: 'scene-elements-storage',
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
