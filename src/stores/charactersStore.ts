import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { shallow } from 'zustand/shallow';
import { setupAutoSave } from '../utils/storeSubscribers';
import type { Character } from '../types';

/**
 * Characters Store
 * Manages characters in the project.
 */

// ============================================================================
// TYPES
// ============================================================================

interface CharactersState {
  // State
  characters: Character[];

  // Actions
  addCharacter: () => string;
  updateCharacter: (updated: Partial<Character> & { id: string }) => void;
  deleteCharacter: (charId: string) => void;

  // Import (remplacement complet pour restauration de projet)
  importCharacters: (characters: Character[]) => void;

  // Helpers (selectors)
  getCharacterById: (charId: string) => Character | undefined;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'player',
    name: 'Joueur',
    description: '',
    sprites: { neutral: 'assets/characters/player/neutral.svg' },
    moods: ['neutral'],
  },
  {
    id: 'counsellor',
    name: 'Maire',
    description: '',
    sprites: { neutral: 'assets/characters/counsellor/neutral.svg' },
    moods: ['neutral', 'professional', 'helpful'],
  },
  {
    id: 'narrator',
    name: 'Narrateur',
    description: '',
    sprites: {},
    moods: [],
  },
];

// ============================================================================
// STORE
// ============================================================================

export const useCharactersStore = create<CharactersState>()(
  temporal(
    persist(
      devtools(
        subscribeWithSelector((set, get) => ({
          // State
          characters: SAMPLE_CHARACTERS,

          // Actions
          addCharacter: () => {
            const id = 'char-' + Date.now();
            const newCharacter: Character = {
              id,
              name: 'New character',
              description: '',
              sprites: { neutral: '' },
              moods: ['neutral'],
            };

            set(
              (state) => ({
                characters: [...state.characters, newCharacter],
              }),
              false,
              'characters/addCharacter'
            );

            return id;
          },

          updateCharacter: (updated) => {
            set(
              (state) => ({
                characters: state.characters.map((c) =>
                  c.id === updated.id ? { ...c, ...updated } : c
                ),
              }),
              false,
              'characters/updateCharacter'
            );
          },

          deleteCharacter: (charId) => {
            set(
              (state) => ({
                characters: state.characters.filter((c) => c.id !== charId),
              }),
              false,
              'characters/deleteCharacter'
            );
          },

          importCharacters: (characters) => {
            set(() => ({ characters }), false, 'characters/importCharacters');
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
        // Guard hydratation : si localStorage vide ou corrompu, restaurer SAMPLE_CHARACTERS
        onRehydrateStorage: () => (state) => {
          if (state && state.characters.length === 0) {
            state.characters = SAMPLE_CHARACTERS;
          }
        },
      }
    ),
    {
      limit: 50,
      // PERFORMANCE: Shallow equality — compare chaque champ de l'état partialisé
      equality: shallow,
      // PERFORMANCE: Only track 'characters' in undo history (not actions)
      // @ts-expect-error - Zundo partialize expects subset of state (this is correct behavior)
      partialize: (state) => ({
        characters: state.characters,
      }),
    }
  )
);

// Auto-save subscriber with HMR cleanup (centralized in storeSubscribers.ts)
setupAutoSave(useCharactersStore, (state) => state.characters, 'characters');
