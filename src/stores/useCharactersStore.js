import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

// État initial du formulaire (draft)
const INITIAL_FORM_STATE = {
  id: null,
  name: "",
  description: "",
  moods: ["neutral"],
  sprites: {},
};

// Validation du draft (nom, humeurs, unicité, etc.)
const validateDraft = (draft, characters) => {
  const errors = {};
  const warnings = {};

  // Nom obligatoire, max 50, unique
  if (!draft.name || !draft.name.trim()) {
    errors.name = ["Le nom du personnage est requis."];
  } else if (draft.name.length > 50) {
    errors.name = ["Le nom doit faire moins de 50 caractères."];
  } else {
    const duplicate = characters.some(
      (c) =>
        c.id !== draft.id &&
        c.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
    );
    if (duplicate) {
      errors.name = ["Ce nom existe déjà."];
    }
  }

  // Au moins une humeur
  if (!draft.moods || draft.moods.length === 0) {
    errors.moods = ["Au moins une humeur est requise."];
  } else {
    const uniqueMoods = new Set(draft.moods.map((m) => m.toLowerCase().trim()));
    if (uniqueMoods.size !== draft.moods.length) {
      errors.moods = ["Les humeurs doivent être uniques."];
    }
    if (draft.moods.some((m) => m.length > 20)) {
      errors.moods = ["Chaque humeur doit faire moins de 20 caractères."];
    }
  }

  // Sprites manquants (avertissement)
  const missingSprites = draft.moods.filter((m) => !draft.sprites[m]);
  if (missingSprites.length > 0) {
    warnings.sprites = [
      `${missingSprites.length} humeur(s) sans sprite associé.`,
    ];
  }

  return {
    errors,
    warnings,
    isValid: Object.keys(errors).length === 0,
  };
};

// Store Zustand avec immer et devtools
export const useCharactersStore = create(
  persist(
    devtools(
      immer((set, get) => ({
        characters: [],
        formState: {
          data: { ...INITIAL_FORM_STATE },
          errors: {},
          warnings: {},
          hasChanges: false,
          isValid: false,
        },
        isEditing: false,
        // Historique pour undo/redo
        history: {
          past: [],
          future: [],
        },
        // Actions principales
        startEditing: (id) => {
          const char = get().characters.find((c) => c.id === id);
          set((state) => {
            state.isEditing = true;
            state.formState = {
              data: char
                ? { ...char }
                : { ...INITIAL_FORM_STATE, id: uuidv4() },
              errors: {},
              warnings: {},
              hasChanges: false,
              isValid: false,
            };
          });
          // Validation initiale
          const { errors, warnings, isValid } = validateDraft(
            char ? { ...char } : { ...INITIAL_FORM_STATE, id },
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        cancelEditing: () => {
          set((state) => {
            state.isEditing = false;
            state.formState = {
              data: { ...INITIAL_FORM_STATE },
              errors: {},
              warnings: {},
              hasChanges: false,
              isValid: false,
            };
          });
        },
        updateFormField: (field, value) => {
          set((state) => {
            // Ajout à l'historique avant modif
            state.history.past.push(JSON.stringify(state.formState.data));
            state.history.future = [];
            state.formState.data[field] = value;
            state.formState.hasChanges = true;
          });
          // Validation après modif
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        undo: () => {
          set((state) => {
            if (state.history.past.length === 0) return;
            const previous = state.history.past.pop();
            state.history.future.push(JSON.stringify(state.formState.data));
            state.formState.data = JSON.parse(previous);
            state.formState.hasChanges = true;
          });
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        redo: () => {
          set((state) => {
            if (state.history.future.length === 0) return;
            const next = state.history.future.pop();
            state.history.past.push(JSON.stringify(state.formState.data));
            state.formState.data = JSON.parse(next);
            state.formState.hasChanges = true;
          });
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        addMood: (mood) => {
          set((state) => {
            if (!state.formState.data.moods.includes(mood)) {
              state.formState.data.moods.push(mood);
              state.formState.hasChanges = true;
            }
          });
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        removeMood: (mood) => {
          set((state) => {
            state.formState.data.moods = state.formState.data.moods.filter(
              (m) => m !== mood
            );
            state.formState.hasChanges = true;
          });
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        updateSprite: (mood, spriteUrl) => {
          set((state) => {
            state.formState.data.sprites[mood] = spriteUrl;
            state.formState.hasChanges = true;
          });
          const { errors, warnings, isValid } = validateDraft(
            get().formState.data,
            get().characters
          );
          set((state) => {
            state.formState.errors = errors;
            state.formState.warnings = warnings;
            state.formState.isValid = isValid;
          });
        },
        saveForm: () => {
          const { isValid, data } = get().formState;
          if (!isValid) return false;
          set((state) => {
            const idx = state.characters.findIndex((c) => c.id === data.id);
            if (idx >= 0) {
              state.characters[idx] = { ...data, lastModified: Date.now() };
            } else {
              state.characters.push({ ...data, lastModified: Date.now() });
            }
            state.isEditing = false;
            state.formState = {
              data: { ...INITIAL_FORM_STATE },
              errors: {},
              warnings: {},
              hasChanges: false,
              isValid: false,
            };
          });
          return true;
        },
        deleteCharacter: (id) => {
          set((state) => {
            state.characters = state.characters.filter((c) => c.id !== id);
          });
        },
      })),
      { name: "CharactersStore" }
    ),
    {
      name: "characters-storage",
      partialize: (state) => ({ characters: state.characters }),
    }
  )
);
