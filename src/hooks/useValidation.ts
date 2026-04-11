import { useState, useEffect, useRef } from 'react';
import { useCharactersStore, useSettingsStore } from '../stores/index';
import { useAllScenesWithElements } from '@/stores/selectors';
import type { Scene } from '@/types';
import type { Character } from '@/types/characters';

/**
 * Validation on defined cycles — inspired by Monaco editor / VSCode strategy.
 *
 * Pattern : debounce 500ms → requestIdleCallback
 * - No computation while the user is actively typing
 * - Runs once the user pauses (500ms idle)
 * - Executed during browser idle time (requestIdleCallback) to never block the UI
 * - Fallback to immediate execution on environments without requestIdleCallback
 */

const DEBOUNCE_MS = 500;
const IDLE_TIMEOUT_MS = 2000; // max wait before forcing execution

// ============================================================================
// TYPES
// ============================================================================

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationErrors {
  scenes: Record<string, ValidationError[]>;
  dialogues: Record<string, ValidationError[]>;
  choices: Record<string, ValidationError[]>;
  characters: Record<string, ValidationError[]>;
  variables: Record<string, ValidationError[]>;
  global: ValidationError[];
}

interface ValidationResult {
  errors: ValidationErrors;
  totalErrors: number;
  totalWarnings: number;
  isValid: boolean;
  hasIssues: boolean;
}

const INITIAL_RESULT: ValidationResult = {
  errors: { scenes: {}, dialogues: {}, choices: {}, characters: {}, variables: {}, global: [] },
  totalErrors: 0,
  totalWarnings: 0,
  isValid: true,
  hasIssues: false,
};

// ============================================================================
// PURE COMPUTATION FUNCTIONS (no hooks — unit-testable independently)
// ============================================================================

function computeScenesValidation(scenes: Scene[]) {
  const errors: {
    scenes: Record<string, ValidationError[]>;
    dialogues: Record<string, ValidationError[]>;
    choices: Record<string, ValidationError[]>;
  } = { scenes: {}, dialogues: {}, choices: {} };
  let totalErrors = 0;
  let totalWarnings = 0;
  const sceneIds = new Set<string>();

  scenes.forEach((scene) => {
    const sceneErrors: ValidationError[] = [];

    if (!scene.id || scene.id.trim() === '') {
      sceneErrors.push({ field: 'id', message: 'ID manquant', severity: 'error' });
      totalErrors++;
    } else {
      if (sceneIds.has(scene.id)) {
        sceneErrors.push({ field: 'id', message: 'ID dupliqué', severity: 'error' });
        totalErrors++;
      }
      sceneIds.add(scene.id);
    }

    if (!scene.title || scene.title.trim() === '') {
      sceneErrors.push({ field: 'title', message: 'Titre manquant', severity: 'warning' });
      totalWarnings++;
    }

    if (!scene.dialogues || scene.dialogues.length === 0) {
      sceneErrors.push({ field: 'dialogues', message: 'Aucun dialogue', severity: 'warning' });
      totalWarnings++;
    }

    if (sceneErrors.length > 0) errors.scenes[scene.id] = sceneErrors;

    const dialogueIds = new Set((scene.dialogues || []).map((d) => d.id));

    (scene.dialogues || []).forEach((dialogue, dIdx) => {
      const dialogueErrors: ValidationError[] = [];
      const dialogueKey = `${scene.id}-${dIdx}`;

      if (!dialogue.speaker || dialogue.speaker.trim() === '') {
        dialogueErrors.push({ field: 'speaker', message: 'Locuteur manquant', severity: 'error' });
        totalErrors++;
      }
      if (!dialogue.text || dialogue.text.trim() === '') {
        dialogueErrors.push({ field: 'text', message: 'Texte manquant', severity: 'error' });
        totalErrors++;
      }
      if (dialogueErrors.length > 0) errors.dialogues[dialogueKey] = dialogueErrors;

      (dialogue.choices || []).forEach((choice, cIdx) => {
        const choiceErrors: ValidationError[] = [];
        const choiceKey = `${scene.id}-${dIdx}-${cIdx}`;

        if (!choice.text || choice.text.trim() === '') {
          choiceErrors.push({
            field: 'text',
            message: 'Texte du choix manquant',
            severity: 'error',
          });
          totalErrors++;
        }

        if (!choice.nextSceneId) {
          if (choice.nextDialogueId === '') {
            choiceErrors.push({
              field: 'nextDialogueId',
              message: 'Lien navigation vide (utilisera dialogue suivant)',
              severity: 'warning',
            });
            totalWarnings++;
          } else if (choice.nextDialogueId && !dialogueIds.has(choice.nextDialogueId)) {
            choiceErrors.push({
              field: 'nextDialogueId',
              message: `Dialogue cible "${choice.nextDialogueId}" introuvable dans la scène`,
              severity: 'error',
            });
            totalErrors++;
          }
        }

        if (choice.diceCheck) {
          const { success, failure } = choice.diceCheck;
          if (!success?.nextSceneId) {
            if (success?.nextDialogueId === '') {
              choiceErrors.push({
                field: 'diceCheck.success',
                message: 'Lien succès dé vide (utilisera dialogue suivant)',
                severity: 'warning',
              });
              totalWarnings++;
            } else if (success?.nextDialogueId && !dialogueIds.has(success.nextDialogueId)) {
              choiceErrors.push({
                field: 'diceCheck.success',
                message: `Dialogue cible succès "${success.nextDialogueId}" introuvable`,
                severity: 'error',
              });
              totalErrors++;
            }
          }
          if (!failure?.nextSceneId) {
            if (failure?.nextDialogueId === '') {
              choiceErrors.push({
                field: 'diceCheck.failure',
                message: 'Lien échec dé vide (utilisera dialogue suivant)',
                severity: 'warning',
              });
              totalWarnings++;
            } else if (failure?.nextDialogueId && !dialogueIds.has(failure.nextDialogueId)) {
              choiceErrors.push({
                field: 'diceCheck.failure',
                message: `Dialogue cible échec "${failure.nextDialogueId}" introuvable`,
                severity: 'error',
              });
              totalErrors++;
            }
          }
        }

        if (choiceErrors.length > 0) errors.choices[choiceKey] = choiceErrors;
      });
    });
  });

  return { errors, totalErrors, totalWarnings };
}

function computeCharactersValidation(characters: Character[]) {
  const errors: Record<string, ValidationError[]> = {};
  let totalErrors = 0;
  let totalWarnings = 0;

  characters.forEach((character) => {
    const charErrors: ValidationError[] = [];

    if (!character.name || character.name.trim() === '') {
      charErrors.push({ field: 'name', message: 'Nom manquant', severity: 'error' });
      totalErrors++;
    }
    if (!character.sprites || Object.keys(character.sprites).length === 0) {
      charErrors.push({ field: 'sprites', message: 'Aucun sprite défini', severity: 'warning' });
      totalWarnings++;
    }
    if (charErrors.length > 0) errors[character.id] = charErrors;
  });

  return { errors, totalErrors, totalWarnings };
}

function computeVariablesValidation(variables: Record<string, unknown>) {
  const errors: Record<string, ValidationError[]> = {};
  const totalErrors = 0;
  let totalWarnings = 0;

  Object.entries(variables).forEach(([name, value]) => {
    const varErrors: ValidationError[] = [];
    if (typeof value === 'number' && (value < 0 || value > 100)) {
      varErrors.push({
        field: 'value',
        message: 'Valeur hors limites (0-100)',
        severity: 'warning',
      });
      totalWarnings++;
    }
    if (varErrors.length > 0) errors[name] = varErrors;
  });

  return { errors, totalErrors, totalWarnings };
}

function computeCrossDomainValidation(
  scenes: Scene[],
  characters: Character[],
  variables: Record<string, unknown>
) {
  const errors: Record<string, ValidationError[]> = {};
  const totalErrors = 0;
  let totalWarnings = 0;
  const characterIdSet = new Set(characters.map((c) => c.id));

  scenes.forEach((scene) => {
    (scene.dialogues || []).forEach((dialogue, dIdx) => {
      if (dialogue.speaker && dialogue.speaker.trim() !== '') {
        if (!characterIdSet.has(dialogue.speaker)) {
          const key = `${scene.id}-${dIdx}`;
          if (!errors[key]) errors[key] = [];
          errors[key].push({
            field: 'speaker',
            message: 'Personnage inexistant',
            severity: 'warning',
          });
          totalWarnings++;
        }
      }

      (dialogue.choices || []).forEach((choice, cIdx) => {
        (choice.effects || []).forEach((effect) => {
          // Guard : seuls les StatEffect ont un champ 'variable' (union discriminée)
          if (!('variable' in effect)) return;
          if (!(effect.variable in (variables ?? {}))) {
            const key = `${scene.id}-${dIdx}-${cIdx}`;
            if (!errors[key]) errors[key] = [];
            errors[key].push({
              field: 'effects',
              message: `Variable "${effect.variable}" inexistante`,
              severity: 'warning',
            });
            totalWarnings++;
          }
        });
      });
    });
  });

  return { errors, totalErrors, totalWarnings };
}

function mergeValidation(
  scenesV: ReturnType<typeof computeScenesValidation>,
  charactersV: ReturnType<typeof computeCharactersValidation>,
  variablesV: ReturnType<typeof computeVariablesValidation>,
  crossV: ReturnType<typeof computeCrossDomainValidation>
): ValidationResult {
  const mergedDialogues = { ...scenesV.errors.dialogues };
  Object.entries(crossV.errors).forEach(([key, errs]: [string, ValidationError[]]) => {
    if (key.includes('-') && !key.split('-')[2]) {
      mergedDialogues[key] = [...(mergedDialogues[key] || []), ...errs];
    }
  });

  const mergedChoices = { ...scenesV.errors.choices };
  Object.entries(crossV.errors).forEach(([key, errs]: [string, ValidationError[]]) => {
    if (key.split('-').length === 3) {
      mergedChoices[key] = [...(mergedChoices[key] || []), ...errs];
    }
  });

  const totalErrors =
    scenesV.totalErrors + charactersV.totalErrors + variablesV.totalErrors + crossV.totalErrors;
  const totalWarnings =
    scenesV.totalWarnings +
    charactersV.totalWarnings +
    variablesV.totalWarnings +
    crossV.totalWarnings;

  return {
    errors: {
      scenes: scenesV.errors.scenes,
      dialogues: mergedDialogues,
      choices: mergedChoices,
      characters: charactersV.errors,
      variables: variablesV.errors,
      global: [],
    },
    totalErrors,
    totalWarnings,
    isValid: totalErrors === 0,
    hasIssues: totalErrors > 0 || totalWarnings > 0,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useValidation(): ValidationResult {
  const scenes = useAllScenesWithElements();
  const characters = useCharactersStore((state) => state.characters);
  const variables = useSettingsStore((state) => state.variables);

  const [result, setResult] = useState<ValidationResult>(INITIAL_RESULT);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any pending work
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (idleRef.current && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(idleRef.current);
    }

    // Wait 500ms after the last change (user pauses typing)
    debounceRef.current = setTimeout(() => {
      const runValidation = () => {
        const scenesV = computeScenesValidation(scenes);
        const charactersV = computeCharactersValidation(characters);
        const variablesV = computeVariablesValidation(variables);
        const crossV = computeCrossDomainValidation(scenes, characters, variables);
        setResult(mergeValidation(scenesV, charactersV, variablesV, crossV));
      };

      // Run during browser idle time to never block UI interactions
      if (typeof requestIdleCallback === 'function') {
        idleRef.current = requestIdleCallback(runValidation, { timeout: IDLE_TIMEOUT_MS });
      } else {
        runValidation(); // Safari / SSR fallback
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (idleRef.current && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleRef.current);
      }
    };
  }, [scenes, characters, variables]);

  return result;
}
