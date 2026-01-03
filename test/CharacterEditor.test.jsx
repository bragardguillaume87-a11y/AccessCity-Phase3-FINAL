// --- TESTS STORE Zustand (CRUD, validation, accessibilité) ---
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
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import trapFocus from "../utils/trapFocus.js";
import { useUndoRedo } from "../hooks/useUndoRedo.js";
import { DEFAULTS } from "../config/constants.js";

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function buildDefaultCharacter(character) {
  const base = character || {};
  const moods =
    Array.isArray(base.moods) && base.moods.length ? base.moods : ["neutral"];
  const sprites =
    typeof base.sprites === "object" && base.sprites ? base.sprites : {};
  const defaultMood =
    base.defaultMood && moods.includes(base.defaultMood)
      ? base.defaultMood
      : moods[0];

  const moodLabels =
    typeof base.moodLabels === "object" && base.moodLabels
      ? base.moodLabels
      : {};
  const moodIcons =
    typeof base.moodIcons === "object" && base.moodIcons ? base.moodIcons : {};

  return {
    id: base.id || "character",
    name: base.name || "",
    role: base.role || "npc",
    description: base.description || "",
    moods,
    sprites,
    defaultMood,
    moodLabels,
    moodIcons,
    position: {
      x: typeof base.position?.x === "number" ? base.position.x : 0,
      y: typeof base.position?.y === "number" ? base.position.y : 0,
    },
  };
}

function getPresetByKey(key) {
  return DEFAULTS.CHARACTER_MOODS_LIST.find((m) => m.key === key) || null;
}

export default function CharacterEditor({ character, onSave, onClose }) {
  const titleId = useId();
  const descId = useId();

  const initial = useMemo(() => buildDefaultCharacter(character), [character]);
  const {
    state: edited,
    setState: setEdited,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initial);

  const [selectedMood, setSelectedMood] = useState(
    initial.defaultMood || "neutral"
  );
  const [errors, setErrors] = useState({});
  const [liveMessage, setLiveMessage] = useState("");
  const [addMoodSelect, setAddMoodSelect] = useState("happy");

  const dialogRef = useRef(null);
  const prevActiveRef = useRef(null);
  const moodButtonsRef = useRef([]);

  const moodColors = useMemo(
    () => ({
      neutral: "bg-gray-50 border-gray-200 text-gray-900",
      happy: "bg-yellow-50 border-yellow-200 text-yellow-950",
      sad: "bg-blue-50 border-blue-200 text-blue-950",
      angry: "bg-red-50 border-red-200 text-red-950",
      surprised: "bg-purple-50 border-purple-200 text-purple-950",
      scared: "bg-orange-50 border-orange-200 text-orange-950",
      confused: "bg-slate-50 border-slate-200 text-slate-950",
      serious: "bg-indigo-50 border-indigo-200 text-indigo-950",
    }),
    []
  );

  const getMoodColor = (mood) =>
    moodColors[mood] || "bg-game-purple/10 border-game-purple text-game-purple";

  function labelForMood(mood) {
    const preset = getPresetByKey(mood);
    return edited.moodLabels?.[mood] || preset?.label || mood;
  }

  function iconForMood(mood) {
    const preset = getPresetByKey(mood);
    return edited.moodIcons?.[mood] || preset?.icon || "*";
  }

  const selectedSpriteUrl = edited?.sprites?.[selectedMood] || "";

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    prevActiveRef.current = document.activeElement;

    if (dialogRef.current) dialogRef.current.focus();
    const cleanup = trapFocus(dialogRef.current);

    return () => {
      document.body.style.overflow = prevOverflow;
      cleanup();
      if (
        prevActiveRef.current &&
        typeof prevActiveRef.current.focus === "function"
      ) {
        try {
          prevActiveRef.current.focus();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!edited.moods.includes(selectedMood)) {
      setSelectedMood(edited.moods[0] || "neutral");
    }
  }, [edited.moods, selectedMood]);

  function validate(next) {
    const e = {};
    if (!String(next.name || "").trim()) e.name = "Name is required.";
    return e;
  }

  function announce(msg) {
    setLiveMessage(msg);
    window.clearTimeout(announce._t);
    announce._t = window.setTimeout(() => setLiveMessage(""), 1200);
  }

  function applyChange(patchFn, msg) {
    setEdited((prev) => {
      const next = patchFn(prev);
      const nextErrors = validate(next);
      setErrors(nextErrors);
      return next;
    });
    if (msg) announce(msg);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      announce("Undo.");
      return;
    }

    if (
      (mod && e.key.toLowerCase() === "y") ||
      (mod && e.shiftKey && e.key.toLowerCase() === "z")
    ) {
      e.preventDefault();
      redo();
      announce("Redo.");
      return;
    }
  }

  function handleSave() {
    const nextErrors = validate(edited);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Fix errors before saving.");
      return;
    }
    onSave(edited);
  }

  function handleFileUpload(mood, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev?.target?.result || "";
      applyChange((prev) => {
        const nextSprites = { ...(prev.sprites || {}) };
        nextSprites[mood] = result;
        return { ...prev, sprites: nextSprites };
      }, "Image loaded.");
      setSelectedMood(mood);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveSprite(mood) {
    applyChange((prev) => {
      const nextSprites = { ...(prev.sprites || {}) };
      nextSprites[mood] = "";
      return { ...prev, sprites: nextSprites };
    }, "Image removed.");
  }

  function addMoodFromPreset(moodKey) {
    if (edited.moods.includes(moodKey)) {
      announce("Mood already added.");
      return;
    }

    const preset = getPresetByKey(moodKey);

    applyChange((prev) => {
      const nextMoods = [...prev.moods, moodKey];
      const nextSprites = { ...(prev.sprites || {}), [moodKey]: "" };
      const nextLabels = { ...(prev.moodLabels || {}) };
      const nextIcons = { ...(prev.moodIcons || {}) };

      if (preset) {
        nextLabels[moodKey] = preset.label;
        nextIcons[moodKey] = preset.icon;
      }

      const nextDefaultMood =
        prev.defaultMood && nextMoods.includes(prev.defaultMood)
          ? prev.defaultMood
          : nextMoods[0];

      return {
        ...prev,
        moods: nextMoods,
        sprites: nextSprites,
        moodLabels: nextLabels,
        moodIcons: nextIcons,
        defaultMood: nextDefaultMood,
      };
    }, "Mood added.");

    setSelectedMood(moodKey);
  }

  function handleRemoveMood(moodKey) {
    if (edited.moods.length <= 1) {
      announce("At least one mood is required.");
      return;
    }

    applyChange((prev) => {
      const nextMoods = prev.moods.filter((m) => m !== moodKey);
      const nextSprites = { ...(prev.sprites || {}) };
      delete nextSprites[moodKey];

      const nextLabels = { ...(prev.moodLabels || {}) };
      const nextIcons = { ...(prev.moodIcons || {}) };
      delete nextLabels[moodKey];
      delete nextIcons[moodKey];

      const nextDefault = nextMoods.includes(prev.defaultMood)
        ? prev.defaultMood
        : nextMoods[0];
      const nextSelected = nextMoods.includes(selectedMood)
        ? selectedMood
        : nextMoods[0];
      window.setTimeout(() => setSelectedMood(nextSelected), 0);

      return {
        ...prev,
        moods: nextMoods,
        sprites: nextSprites,
        moodLabels: nextLabels,
        moodIcons: nextIcons,
        defaultMood: nextDefault,
      };
    }, "Mood removed.");
  }

  function handleMoodRovingKeyDown(e, index) {
    const total = edited.moods.length;
    if (total <= 1) return;

    const move = (nextIndex) => {
      const safe = (nextIndex + total) % total;
      const mood = edited.moods[safe];
      setSelectedMood(mood);
      const btn = moodButtonsRef.current[safe];
      if (btn && typeof btn.focus === "function") btn.focus();
    };

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(total - 1);
    }
  }

  const canSave =
    Object.keys(errors).length === 0 &&
    String(edited.name || "").trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm animate-modalBackdrop"
        onMouseDown={onClose}
      />

      <div
        ref={dialogRef}
        className="relative w-full max-w-5xl outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="rounded-2xl shadow-soft-lg border border-white/30 overflow-hidden bg-white animate-modalPop">
          <div className="relative px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-game-purple via-game-pink to-game-teal">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_0%,white,transparent_55%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-white text-xl sm:text-2xl font-extrabold tracking-tight"
                >
                  Character editor
                </h2>
                <p id={descId} className="text-white/90 text-sm sm:text-base">
                  Tab moves. Esc closes. Ctrl+Z undo. Ctrl+Y redo.
                </p>
              </div>

              <button
                type="button"
                className="magnetic-lift inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  x
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-game-purple/5 to-white p-4 sm:p-5 shadow-soft">
                <h3 className="font-bold text-slate-900 text-lg">
                  1) Identity
                </h3>

                <div className="mt-3 space-y-3">
                  <div>
                    <label
                      htmlFor="char-name"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Name (required)
                    </label>
                    <input
                      id="char-name"
                      type="text"
                      value={edited.name}
                      onChange={(e) =>
                        applyChange((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="mt-1 w-full h-12 rounded-xl border border-slate-300 px-4 text-base focus:border-game-blue"
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={
                        errors.name ? "char-name-error" : undefined
                      }
                      placeholder="Example: Town councillor"
                      autoComplete="off"
                    />
                    {errors.name ? (
                      <p
                        id="char-name-error"
                        className="mt-2 text-sm text-red-700"
                        role="alert"
                      >
                        {errors.name}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">
                        Keep it short and easy to read.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="char-desc"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Description
                    </label>
                    <textarea
                      id="char-desc"
                      value={edited.description}
                      onChange={(e) =>
                        applyChange((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1 w-full min-h-[96px] rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-game-blue"
                      placeholder="Describe this character..."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft">
                <h3 className="font-bold text-slate-900 text-lg">2) Moods</h3>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="add-mood"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Add a mood
                    </label>
                    <select
                      id="add-mood"
                      value={addMoodSelect}
                      onChange={(e) => setAddMoodSelect(e.target.value)}
                      className="mt-1 w-full h-12 rounded-xl border border-slate-300 px-4 text-base focus:border-game-blue bg-white"
                    >
                      {DEFAULTS.CHARACTER_MOODS_LIST.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-600">
                      Child friendly list (recommended).
                    </p>
                  </div>

                  <button
                    type="button"
                    className="magnetic-lift h-12 px-4 rounded-xl bg-game-purple text-white font-semibold shadow-soft hover:shadow-soft-lg"
                    onClick={() => addMoodFromPreset(addMoodSelect)}
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-800">
                    Choose a mood to edit
                  </label>

                  <div
                    role="radiogroup"
                    aria-label="Mood selection"
                    className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {edited.moods.map((mood, idx) => {
                      const selected = mood === selectedMood;
                      const hasSprite = Boolean(
                        edited.sprites && edited.sprites[mood]
                      );

                      return (
                        <button
                          key={mood}
                          type="button"
                          ref={(el) => {
                            moodButtonsRef.current[idx] = el;
                          }}
                          role="radio"
                          aria-checked={selected ? "true" : "false"}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => setSelectedMood(mood)}
                          onKeyDown={(e) => handleMoodRovingKeyDown(e, idx)}
                          className={[
                            "mood-card",
                            "magnetic-lift",
                            "rounded-2xl border px-3 py-3 text-left min-h-[64px]",
                            getMoodColor(mood),
                            selected
                              ? "ring-2 ring-game-blue ring-offset-2"
                              : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span aria-hidden="true" className="text-xl">
                                {iconForMood(mood)}
                              </span>
                              <span className="font-semibold">
                                {labelForMood(mood)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {hasSprite ? "IMG" : "No"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="default-mood"
                        className="block text-sm font-semibold text-slate-800"
                      >
                        Default mood
                      </label>
                      <select
                        id="default-mood"
                        value={edited.defaultMood}
                        onChange={(e) =>
                          applyChange(
                            (prev) => ({
                              ...prev,
                              defaultMood: e.target.value,
                            }),
                            "Default mood updated."
                          )
                        }
                        className="mt-1 w-full h-12 rounded-xl border border-slate-300 px-4 text-base focus:border-game-blue bg-white"
                      >
                        {edited.moods.map((m) => (
                          <option key={m} value={m}>
                            {labelForMood(m)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="magnetic-lift h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold self-end"
                      onClick={() => handleRemoveMood(selectedMood)}
                    >
                      Remove selected mood
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft">
                <h3 className="font-bold text-slate-900 text-lg">
                  3) Position
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="pos-x"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      X
                    </label>
                    <input
                      id="pos-x"
                      type="number"
                      inputMode="numeric"
                      value={edited.position?.x ?? 0}
                      onChange={(e) => {
                        const x = clampNumber(e.target.value, -9999, 9999);
                        applyChange(
                          (prev) => ({
                            ...prev,
                            position: { ...(prev.position || {}), x },
                          }),
                          "Position updated."
                        );
                      }}
                      className="mt-1 w-full h-12 rounded-xl border border-slate-300 px-4 text-base focus:border-game-blue"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pos-y"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Y
                    </label>
                    <input
                      id="pos-y"
                      type="number"
                      inputMode="numeric"
                      value={edited.position?.y ?? 0}
                      onChange={(e) => {
                        const y = clampNumber(e.target.value, -9999, 9999);
                        applyChange(
                          (prev) => ({
                            ...prev,
                            position: { ...(prev.position || {}), y },
                          }),
                          "Position updated."
                        );
                      }}
                      className="mt-1 w-full h-12 rounded-xl border border-slate-300 px-4 text-base focus:border-game-blue"
                    />
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-game-purple/5 to-white p-4 sm:p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      Live preview
                    </h3>
                    <p className="mt-1 text-sm text-slate-700">
                      Mood:{" "}
                      <span className="font-semibold">
                        {labelForMood(selectedMood)}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="magnetic-lift h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold disabled:opacity-50"
                      onClick={undo}
                      disabled={!canUndo}
                      aria-disabled={!canUndo ? "true" : "false"}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="magnetic-lift h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold disabled:opacity-50"
                      onClick={redo}
                      disabled={!canRedo}
                      aria-disabled={!canRedo ? "true" : "false"}
                    >
                      Redo
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="relative aspect-[4/3] bg-slate-50 grid place-items-center">
                    {selectedSpriteUrl ? (
                      <img
                        src={selectedSpriteUrl}
                        alt={(edited.name || "Character") + " sprite"}
                        className="max-h-full max-w-full object-contain animate-previewSwap"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <div className="text-4xl" aria-hidden="true">
                          {iconForMood(selectedMood)}
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          No image for this mood yet.
                        </p>
                      </div>
                    )}

                    <div className="absolute left-3 top-3 px-3 py-1 rounded-full text-xs font-bold bg-white/80 border border-white shadow-soft">
                      {edited.name || "Unnamed"}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <label className="magnetic-lift inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-game-teal text-white font-semibold shadow-soft cursor-pointer">
                          <span aria-hidden="true">Up</span>
                          <span>Upload image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleFileUpload(selectedMood, e)}
                          />
                        </label>

                        <button
                          type="button"
                          className="magnetic-lift h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold"
                          onClick={() => handleRemoveSprite(selectedMood)}
                        >
                          Remove image
                        </button>
                      </div>

                      <div className="text-sm text-slate-700">
                        Default:{" "}
                        <span className="font-semibold">
                          {labelForMood(edited.defaultMood)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sr-only" aria-live="polite">
                  {liveMessage}
                </div>
                {liveMessage ? (
                  <div className="mt-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2 animate-toastIn">
                    {liveMessage}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <button
                    type="button"
                    className="magnetic-lift h-12 px-5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                    onClick={onClose}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="magnetic-lift h-12 px-5 rounded-xl bg-game-purple text-white font-extrabold shadow-soft hover:shadow-soft-lg disabled:opacity-50"
                    onClick={handleSave}
                    disabled={!canSave}
                    aria-disabled={!canSave ? "true" : "false"}
                  >
                    Save
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
