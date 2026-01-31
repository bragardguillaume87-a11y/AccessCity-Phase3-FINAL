import { useMemo } from 'react';
import type { DialogueFormData } from './useDialogueForm';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * useChoiceValidation - Validate choices based on complexity level
 *
 * Performs validation specific to each complexity level:
 * - Simple: 2 choices with text + navigation
 * - Medium: Dice check with stat, difficulty, and success/failure branches
 * - Complex: 2-4 choices with effects or navigation
 *
 * @param formData - Current form data
 * @returns Validation result with errors
 */
export function useChoiceValidation(
  formData: DialogueFormData
): ValidationResult {
  return useMemo(() => {
    const errors: string[] = [];

    // Basic text validation
    if (!formData.text || formData.text.trim().length < 10) {
      errors.push("Le texte doit faire au moins 10 caractères");
    }

    if (formData.text && formData.text.length > 500) {
      errors.push("Le texte ne peut pas dépasser 500 caractères");
    }

    // Complexity-specific validation
    if (!formData.complexityLevel) {
      // If no complexity selected yet, skip choice validation
      return { isValid: formData.text.trim().length >= 10, errors };
    }

    switch (formData.complexityLevel) {
      case 'simple': {
        if (formData.choices.length !== 2) {
          errors.push("Le mode simple nécessite exactement 2 choix");
        }

        formData.choices.forEach((choice, index) => {
          if (!choice.text || choice.text.trim().length < 5) {
            errors.push(`Choix ${index + 1}: Le texte est trop court (minimum 5 caractères)`);
          }

          // Navigation is optional in simple mode:
          // - If responses are created, the wizard auto-links nextDialogueId
          // - If no responses, the engine auto-advances to next dialogue
        });
        break;
      }

      case 'medium': {
        if (formData.choices.length === 0) {
          errors.push("Aucun choix configuré");
          break;
        }

        const choice = formData.choices[0];

        if (!choice.text || choice.text.trim().length < 5) {
          errors.push("Le texte du choix est trop court (minimum 5 caractères)");
        }

        if (!choice.diceCheck) {
          errors.push("Configuration des dés manquante");
        } else {
          if (!choice.diceCheck.stat) {
            errors.push("Choisis une compétence pour le test de dés");
          }

          if (
            choice.diceCheck.difficulty === undefined ||
            choice.diceCheck.difficulty < 1 ||
            choice.diceCheck.difficulty > 20
          ) {
            errors.push("La difficulté doit être entre 1 et 20");
          }

          // Validate success branch
          const success = choice.diceCheck.success;
          if (success && !success.nextSceneId && !success.nextDialogueId) {
            errors.push("La branche succès doit mener quelque part");
          }

          // Validate failure branch
          const failure = choice.diceCheck.failure;
          if (failure && !failure.nextSceneId && !failure.nextDialogueId) {
            errors.push("La branche échec doit mener quelque part");
          }
        }
        break;
      }

      case 'complex': {
        if (formData.choices.length < 2) {
          errors.push("Le mode expert nécessite au moins 2 choix");
        }

        if (formData.choices.length > 4) {
          errors.push("Maximum 4 choix autorisés");
        }

        formData.choices.forEach((choice, index) => {
          if (!choice.text || choice.text.trim().length < 5) {
            errors.push(`Choix ${index + 1}: Le texte est trop court (minimum 5 caractères)`);
          }

          const hasEffects = choice.effects && choice.effects.length > 0;
          const hasNavigation = choice.nextSceneId || choice.nextDialogueId;

          if (!hasEffects && !hasNavigation) {
            errors.push(
              `Choix ${index + 1}: Doit avoir au moins un effet ou mener quelque part`
            );
          }
        });
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [formData]);
}

export default useChoiceValidation;
