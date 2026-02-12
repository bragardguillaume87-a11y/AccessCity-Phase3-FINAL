import { useState, useCallback, useMemo } from 'react';

/**
 * Dialogue wizard step identifiers
 */
export type DialogueWizardStep = 'complexity' | 'template' | 'basics' | 'choices' | 'responses' | 'review';

/**
 * Complexity level for dialogue creation (PHASE 2.2: Expanded to 4 levels)
 * - linear: Dialogue without choices (linear story)
 * - binary: Dialogue with 2 simple choices
 * - dice: Dialogue with dice checks (1-2 tests)
 * - expert: Dialogue with multiple choices and effects (2-4 choices)
 */
export type ComplexityLevel = 'linear' | 'binary' | 'dice' | 'expert';

/**
 * Step configuration
 */
export interface StepConfig {
  id: DialogueWizardStep;
  label: string;
  icon: string; // Emoji for kid-friendly display
  description: string;
}

/**
 * Dialogue wizard state
 */
export interface DialogueWizardState {
  currentStep: DialogueWizardStep;
  stepIndex: number;
  canProceed: boolean;
  canGoBack: boolean;
  isComplete: boolean;
  visitedSteps: Set<DialogueWizardStep>;
  complexityLevel: ComplexityLevel | null;
}

/**
 * Dialogue wizard actions
 */
export interface DialogueWizardActions {
  goToStep: (step: DialogueWizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setCanProceed: (canProceed: boolean) => void;
  setComplexity: (level: ComplexityLevel) => void;
  reset: () => void;
}

/**
 * Step order configuration
 */
export const DIALOGUE_WIZARD_STEPS: StepConfig[] = [
  {
    id: 'complexity',
    label: 'Niveau',
    icon: '🎮',
    description: 'Choisis le type de dialogue'
  },
  {
    id: 'template',
    label: 'Modèle',
    icon: '📋',
    description: 'Choisis une situation de départ (optionnel)'
  },
  {
    id: 'basics',
    label: 'Dialogue',
    icon: '💬',
    description: 'Qui parle et que dit-il ?'
  },
  {
    id: 'choices',
    label: 'Choix',
    icon: '🎯',
    description: 'Crée les options pour le joueur'
  },
  {
    id: 'responses',
    label: 'Réponses',
    icon: '💡',
    description: 'Que se passe-t-il après le choix ?'
  },
  {
    id: 'review',
    label: 'Terminé !',
    icon: '🎉',
    description: 'Vérifie et sauvegarde'
  }
];

const STEP_ORDER: DialogueWizardStep[] = DIALOGUE_WIZARD_STEPS.map(s => s.id);

/**
 * useDialogueWizardState - State machine for dialogue wizard
 *
 * Manages the 4-step wizard flow with validation gates
 * between steps and complexity level tracking.
 *
 * Steps:
 * 1. complexity - Choose Linear/Binary/Dice/Expert (4 options)
 * 2. basics - Speaker + dialogue text + SFX
 * 3. choices - Create choices (adaptive based on complexity)
 * 4. review - Preview + save
 */
export function useDialogueWizardState(
  initialComplexity?: ComplexityLevel,
  /** When true (editing mode), skip the complexity step and start at basics */
  isEditing: boolean = false,
): [DialogueWizardState, DialogueWizardActions] {
  // When editing an existing dialogue, skip step 0 (complexity already known)
  const initialStep: DialogueWizardStep = isEditing ? 'basics' : 'complexity';
  const initialVisited: Set<DialogueWizardStep> = isEditing
    ? new Set(['complexity', 'basics'])
    : new Set(['complexity']);

  const [currentStep, setCurrentStep] = useState<DialogueWizardStep>(initialStep);
  const [visitedSteps, setVisitedSteps] = useState<Set<DialogueWizardStep>>(initialVisited);
  const [canProceed, setCanProceed] = useState(isEditing || (initialComplexity ? true : false));
  const [complexityLevel, setComplexityLevelState] = useState<ComplexityLevel | null>(
    initialComplexity || null
  );

  const stepIndex = useMemo(() =>
    STEP_ORDER.indexOf(currentStep),
    [currentStep]
  );

  const canGoBack = stepIndex > 0;
  const isComplete = currentStep === 'review';

  const state: DialogueWizardState = {
    currentStep,
    stepIndex,
    canProceed,
    canGoBack,
    isComplete,
    visitedSteps,
    complexityLevel
  };

  const goToStep = useCallback((step: DialogueWizardStep) => {
    // Only allow going to visited steps or the next step
    const targetIndex = STEP_ORDER.indexOf(step);
    if (targetIndex <= stepIndex || visitedSteps.has(step)) {
      setCurrentStep(step);
      setVisitedSteps(prev => new Set([...prev, step]));
    }
  }, [stepIndex, visitedSteps]);

  const nextStep = useCallback(() => {
    if (!canProceed) return;

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      let nextStepId = STEP_ORDER[nextIndex];

      // Skip 'template' step for linear and binary (no templates for those levels)
      if (
        nextStepId === 'template' &&
        (complexityLevel === 'linear' || complexityLevel === 'binary' || complexityLevel === null)
      ) {
        const skipIndex = nextIndex + 1;
        if (skipIndex < STEP_ORDER.length) {
          nextStepId = STEP_ORDER[skipIndex];
        }
      }

      setCurrentStep(nextStepId);
      setVisitedSteps(prev => new Set([...prev, nextStepId]));
      // Template step is optional → always proceed-able (no validation gate)
      setCanProceed(nextStepId === 'template' ? true : false);
    }
  }, [stepIndex, canProceed, complexityLevel]);

  const previousStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  }, [stepIndex]);

  const setComplexity = useCallback((level: ComplexityLevel) => {
    setComplexityLevelState(level);
    setCanProceed(true); // Complexity selection auto-validates
  }, []);

  const reset = useCallback(() => {
    setCurrentStep('complexity');
    setVisitedSteps(new Set(['complexity']));
    setCanProceed(false);
    setComplexityLevelState(null);
  }, []);

  const actions: DialogueWizardActions = {
    goToStep,
    nextStep,
    previousStep,
    setCanProceed,
    setComplexity,
    reset
  };

  return [state, actions];
}

export default useDialogueWizardState;
