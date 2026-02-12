import { useState, useCallback } from 'react';
import type { Dialogue, DialogueChoice, DialogueAudio, Effect, DiceCheck } from '@/types';
import type { ComplexityLevel } from './useDialogueWizardState';
import type { SituationTemplate } from '@/config/dialogueTemplates';

/** Default stat for dice checks — aligned with GAME_STATS.MENTALE */
const DEFAULT_DICE_STAT = 'mentale';

/**
 * Response data for branch responses (after player choice)
 */
export interface ResponseData {
  speaker: string;
  text: string;
}

/**
 * Form data for dialogue wizard
 */
export interface DialogueFormData {
  speaker: string;
  text: string;
  sfx?: DialogueAudio;
  choices: DialogueChoice[];
  complexityLevel: ComplexityLevel | null;
  responses: ResponseData[];
}

/**
 * Actions for dialogue form
 */
export interface DialogueFormActions {
  updateField: (field: keyof DialogueFormData, value: any) => void;
  setComplexity: (level: ComplexityLevel) => void;
  updateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  updateResponse: (index: number, updates: Partial<ResponseData>) => void;
  addChoice: () => void;
  removeChoice: (index: number) => void;
  applyTemplate: (template: SituationTemplate) => void;
  reset: () => void;
}

/**
 * Infer complexity level from dialogue structure (PHASE 2.3: Updated for 4 levels)
 */
export function inferComplexity(dialogue: Dialogue): ComplexityLevel {
  const choices = dialogue.choices || [];

  // Linear: no choices at all
  if (choices.length === 0) {
    return 'linear';
  }

  // Binary: exactly 2 choices with no effects and no dice
  if (
    choices.length === 2 &&
    choices.every(c => !c.effects?.length && !c.diceCheck)
  ) {
    return 'binary';
  }

  // Dice: has dice check (1-2 tests)
  if (choices.some(c => c.diceCheck)) {
    return 'dice';
  }

  // Expert: everything else (multiple choices with effects)
  return 'expert';
}

/**
 * Generate default choices structure based on complexity level
 * PHASE 2.3: Now handles 4 distinct complexity levels
 */
export function generateDefaultChoices(level: ComplexityLevel): DialogueChoice[] {
  switch (level) {
    case 'linear':
      // Simples: pas de choix (dialogue linéaire)
      return [];

    case 'binary':
      // À choisir: 2 choix simples sans effets
      return [
        {
          id: `choice-${Date.now()}-1`,
          text: '',
          effects: []
        },
        {
          id: `choice-${Date.now()}-2`,
          text: '',
          effects: []
        }
      ];

    case 'dice':
      // Dés magiques: 1 test de dé par défaut
      return [
        {
          id: `choice-${Date.now()}-1`,
          text: '',
          effects: [],
          diceCheck: {
            stat: DEFAULT_DICE_STAT,
            difficulty: 12,
            success: {},
            failure: {}
          }
        }
      ];

    case 'expert':
      // Expert (multi-choix): 2 choix avec effets vides
      return [
        {
          id: `choice-${Date.now()}-1`,
          text: '',
          effects: []
        },
        {
          id: `choice-${Date.now()}-2`,
          text: '',
          effects: []
        }
      ];
  }
}

/**
 * useDialogueForm - Form state management for dialogue wizard
 *
 * Manages dialogue form data including speaker, text, choices,
 * and sound effects. Handles complexity-based choice generation.
 *
 * @param initialDialogue - Existing dialogue to edit (optional)
 * @param initialComplexity - Initial complexity from palette (PHASE 1.4)
 * @returns Tuple of [formData, formActions]
 */
export function useDialogueForm(
  initialDialogue?: Dialogue,
  initialComplexity?: ComplexityLevel | null
): [DialogueFormData, DialogueFormActions] {
  const [formData, setFormData] = useState<DialogueFormData>(() => {
    // PHASE 1.4: Determine initial complexity with priority system
    let complexity: ComplexityLevel | null = null;

    if (initialDialogue) {
      // Priority 1: If editing existing dialogue, infer from its structure
      complexity = inferComplexity(initialDialogue);

      return {
        speaker: initialDialogue.speaker,
        text: initialDialogue.text,
        sfx: initialDialogue.sfx,
        choices: initialDialogue.choices,
        complexityLevel: complexity,
        responses: []
      };
    }

    // Priority 2: If creating new dialogue and initialComplexity provided (from palette)
    if (initialComplexity) {
      complexity = initialComplexity;
    }
    // Priority 3: Default to null (user will choose in wizard)

    return {
      speaker: '',
      text: '',
      choices: [],
      complexityLevel: complexity,
      responses: []
    };
  });

  const updateField = useCallback((field: keyof DialogueFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setComplexity = useCallback((level: ComplexityLevel) => {
    const newChoices = generateDefaultChoices(level);
    setFormData(prev => ({
      ...prev,
      complexityLevel: level,
      choices: newChoices,
      responses: newChoices.map(() => ({ speaker: '', text: '' }))
    }));
  }, []);

  const updateChoice = useCallback((index: number, updates: Partial<DialogueChoice>) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      )
    }));
  }, []);

  const addChoice = useCallback(() => {
    setFormData(prev => {
      // Generate choice appropriate for current complexity level
      const newChoice: DialogueChoice = prev.complexityLevel === 'dice'
        ? {
            id: `choice-${Date.now()}`,
            text: '',
            effects: [],
            diceCheck: {
              stat: DEFAULT_DICE_STAT,
              difficulty: 12,
              success: {},
              failure: {}
            }
          }
        : {
            id: `choice-${Date.now()}`,
            text: '',
            effects: []
          };

      return {
        ...prev,
        choices: [...prev.choices, newChoice]
      };
    });
  }, []);

  const removeChoice = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
      responses: prev.responses.filter((_, i) => i !== index)
    }));
  }, []);

  const updateResponse = useCallback((index: number, updates: Partial<ResponseData>) => {
    setFormData(prev => ({
      ...prev,
      responses: prev.responses.map((r, i) =>
        i === index ? { ...r, ...updates } : r
      )
    }));
  }, []);

  const applyTemplate = useCallback((template: SituationTemplate) => {
    setFormData(prev => ({
      ...prev,
      speaker: template.prefill.speaker ?? prev.speaker,
      text: template.prefill.text ?? prev.text,
      choices: template.prefill.choices
        ? template.prefill.choices.map((c, i) => ({
            id: `choice-tpl-${i}-${Date.now()}`,
            text: c.text,
            effects: c.effects,
            ...(c.diceCheck
              ? {
                  diceCheck: {
                    stat: c.diceCheck.stat,
                    difficulty: c.diceCheck.difficulty,
                    success: {},
                    failure: {},
                  },
                  actionType: 'diceCheck' as const,
                }
              : {}),
          }))
        : prev.choices,
    }));
  }, []);

  const reset = useCallback(() => {
    setFormData({
      speaker: '',
      text: '',
      choices: [],
      complexityLevel: null,
      responses: []
    });
  }, []);

  const actions: DialogueFormActions = {
    updateField,
    setComplexity,
    updateChoice,
    updateResponse,
    addChoice,
    removeChoice,
    applyTemplate,
    reset
  };

  return [formData, actions];
}

export default useDialogueForm;
