it("undo/redo fonctionne sur le nom", () => {
  act(() => {
    useCharactersStore.getState().startEditing();
    useCharactersStore.getState().updateFormField("name", "Arthur");
    useCharactersStore.getState().updateFormField("name", "Lancelot");
    useCharactersStore.getState().undo();
  });
  expect(useCharactersStore.getState().formState.data.name).toBe("Arthur");
  act(() => {
    useCharactersStore.getState().redo();
  });
  expect(useCharactersStore.getState().formState.data.name).toBe("Lancelot");
});
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react-dom/test-utils";
import { useCharactersStore } from "../src/stores/useCharactersStore";

beforeEach(() => {
  useCharactersStore.setState({
    characters: [],
    formState: {
      data: {
        id: null,
        name: "",
        description: "",
        moods: ["neutral"],
        sprites: {},
      },
      errors: {},
      warnings: {},
      hasChanges: false,
      isValid: false,
    },
    isEditing: false,
  });
});

describe("useCharactersStore", () => {
  it("ajoute un personnage valide", () => {
    act(() => {
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "Arthur");
      useCharactersStore.getState().updateFormField("description", "Héros");
      useCharactersStore.getState().addMood("joyeux");
      useCharactersStore.getState().saveForm();
    });
    const chars = useCharactersStore.getState().characters;
    expect(chars.length).toBe(1);
    expect(chars[0].name).toBe("Arthur");
    expect(chars[0].description).toBe("Héros");
    expect(chars[0].moods).toContain("joyeux");
  });

  it("refuse un nom vide", () => {
    act(() => {
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "");
    });
    const { isValid, errors } = useCharactersStore.getState().formState;
    expect(isValid).toBe(false);
    expect(errors.name).toBeDefined();
  });

  it("refuse les doublons de nom", () => {
    act(() => {
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "Arthur");
      useCharactersStore.getState().saveForm();
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "Arthur");
    });
    const { isValid, errors } = useCharactersStore.getState().formState;
    expect(isValid).toBe(false);
    expect(errors.name).toBeDefined();
  });

  it("refuse moins d'une humeur", () => {
    act(() => {
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "Arthur");
      useCharactersStore.getState().updateFormField("moods", []);
    });
    const { isValid, errors } = useCharactersStore.getState().formState;
    expect(isValid).toBe(false);
    expect(errors.moods).toBeDefined();
  });

  it("supprime un personnage", () => {
    act(() => {
      useCharactersStore.getState().startEditing();
      useCharactersStore.getState().updateFormField("name", "Arthur");
      useCharactersStore.getState().saveForm();
      const id = useCharactersStore.getState().characters[0].id;
      useCharactersStore.getState().deleteCharacter(id);
    });
    expect(useCharactersStore.getState().characters.length).toBe(0);
  });
});
