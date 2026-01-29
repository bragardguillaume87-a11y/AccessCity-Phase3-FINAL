import { useState, useCallback } from 'react';
import type { Dialogue, DialogueChoice, DialogueAudio, Effect, DiceCheck } from '@/types';
import type { ComplexityLevel } from './useDialogueWizardState';

/**
 * Form data for dialogue wizard
 */
export interface DialogueFormData {
  speaker: string;
  text: string;
  sfx?: DialogueAudio;
  choices: DialogueChoice[];
  complexityLevel: ComplexityLevel | null;
}

/**
 * Actions for dialogue form
 */
export interface DialogueFormActions {
  updateField: (field: keyof DialogueFormData, value: any) => void;
  setComplexity: (level: ComplexityLevel) => void;
  updateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  addChoice: () => void;
  removeChoice: (index: number) => void;
  reset: () => void;
}

/**
 * Infer complexity level from dialogue structure
 */
export function inferComplexity(dialogue: Dialogue): ComplexityLevel {
  const choices = dialogue.choices || [];

  // Simple: exactly 2 choices with no effects and no dice
  if (
    choices.length === 2 &&
    choices.every(c => !c.effects?.length && !c.diceCheck)
  ) {
    return 'simple';
  }

  // Medium: has dice check
  if (choices.some(c => c.diceCheck)) {
    return 'medium';
  }

  // Complex: everything else (multiple choices with effects)
  return 'complex';
}

/**
 * Generate default choices structure based on complexity level
 */
export function generateDefaultChoices(level: ComplexityLevel): DialogueChoice[] {
  switch (level) {
    case 'simple':
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

    case 'medium':
      return [
        {
          id: `choice-${Date.now()}-1`,
          text: '',
          effects: [],
          diceCheck: {
            stat: 'Empathie',
            difficulty: 12,
            success: {},
            failure: {}
          }
        }
      ];

    case 'complex':
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
 * @returns Tuple of [formData, formActions]
 */
export function useDialogueForm(
  initialDialogue?: Dialogue
): [DialogueFormData, DialogueFormActions] {
  const [formData, setFormData] = useState<DialogueFormData>(() => {
    if (initialDialogue) {
      return {
        speaker: initialDialogue.speaker,
        text: initialDialogue.text,
        sfx: initialDialogue.sfx,
        choices: initialDialogue.choices,
        complexityLevel: inferComplexity(initialDialogue)
      };
    }

    return {
      speaker: '',
      text: '',
      choices: [],
      complexityLevel: null
    };
  });

  const updateField = useCallback((field: keyof DialogueFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setComplexity = useCallback((level: ComplexityLevel) => {
    setFormData(prev => ({
      ...prev,
      complexityLevel: level,
      choices: generateDefaultChoices(level)
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
    setFormData(prev => ({
      ...prev,
      choices: [
        ...prev.choices,
        {
          id: `choice-${Date.now()}`,
          text: '',
          effects: []
        }
      ]
    }));
  }, []);

  const removeChoice = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }));
  }, []);

  const reset = useCallback(() => {
    setFormData({
      speaker: '',
      text: '',
      choices: [],
      complexityLevel: null
    });
  }, []);

  const actions: DialogueFormActions = {
    updateField,
    setComplexity,
    updateChoice,
    addChoice,
    removeChoice,
    reset
  };

  return [formData, actions];
}

export default useDialogueForm;
