import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';

/**
 * Characters Store
 * Gere les personnages du projet.
 *
 * State:
 * - characters: array of { id, name, description?, sprites?: { [mood]: url }, moods?: [] }
 *
 * Actions:
 * - addCharacter()
 * - updateCharacter(updated)
 * - deleteCharacter(charId)
 */

const SAMPLE_CHARACTERS = [
  {
    id: "player",
    name: "Joueur",
    description: "",
    sprites: { neutral: "assets/characters/player/neutral.svg" },
    moods: ["neutral"],
  },
  {
    id: "counsellor",
    name: "Conseiller municipal",
    description: "",
    sprites: { neutral: "assets/characters/counsellor/neutral.svg" },
    moods: ["neutral", "professional", "helpful"],
  },
  {
    id: "narrator",
    name: "Narrateur",
    description: "",
    sprites: {},
    moods: [],
  },
];

export const useCharactersStore = create(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set, get) => ({
      // State
      characters: SAMPLE_CHARACTERS,

      // Actions
      addCharacter: () => {
        const id = "char-" + Date.now();
        const newCharacter = {
          id,
          name: "New character",
          description: "",
          sprites: { neutral: "" },
          moods: ["neutral"],
        };

        set((state) => ({
          characters: [...state.characters, newCharacter],
        }), false, 'characters/addCharacter');

        return id;
      },

      updateCharacter: (updated) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === updated.id ? { ...c, ...updated } : c
          ),
        }), false, 'characters/updateCharacter');
      },

      deleteCharacter: (charId) => {
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== charId),
        }), false, 'characters/deleteCharacter');
      },

      // Helpers (selectors)
      getCharacterById: (charId) => {
        return get().characters.find((c) => c.id === charId);
      },
    })),
        { name: 'CharactersStore' }
      ),
      {
        name: 'characters-storage',
        storage: createJSONStorage(() => localStorage),
        version: 1,
      }
    ),
    {
      limit: 50,
      equality: (pastState, currentState) => pastState === currentState,
    }
  )
);

// Subscribe to characters store changes to update autosave timestamp
// Debounced to avoid updating on every keystroke
let charactersSaveTimeout;
const unsubscribeCharacters = useCharactersStore.subscribe(
  (state) => state.characters,
  () => {
    clearTimeout(charactersSaveTimeout);
    charactersSaveTimeout = setTimeout(() => {
      // Dynamically import UIStore to avoid circular dependency
      import('./uiStore.js').then(({ useUIStore }) => {
        useUIStore.getState().setLastSaved(new Date().toISOString());
      });
    }, 1000); // 1 second debounce
  }
);

// Cleanup on HMR (Hot Module Replacement) to prevent memory leaks
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearTimeout(charactersSaveTimeout);
    unsubscribeCharacters();
  });
}
