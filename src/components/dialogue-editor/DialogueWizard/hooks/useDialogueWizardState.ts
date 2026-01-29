import { useState, useCallback, useMemo } from 'react';

/**
 * Dialogue wizard step identifiers
 */
export type DialogueWizardStep = 'complexity' | 'basics' | 'choices' | 'review';

/**
 * Complexity level for dialogue creation
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

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
 * 1. complexity - Choose Simple/Medium/Complex
 * 2. basics - Speaker + dialogue text + SFX
 * 3. choices - Create choices (adaptive based on complexity)
 * 4. review - Preview + save
 */
export function useDialogueWizardState(
  initialComplexity?: ComplexityLevel
): [DialogueWizardState, DialogueWizardActions] {
  const [currentStep, setCurrentStep] = useState<DialogueWizardStep>('complexity');
  const [visitedSteps, setVisitedSteps] = useState<Set<DialogueWizardStep>>(
    new Set(['complexity'])
  );
  const [canProceed, setCanProceed] = useState(initialComplexity ? true : false);
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
      const nextStepId = STEP_ORDER[nextIndex];
      setCurrentStep(nextStepId);
      setVisitedSteps(prev => new Set([...prev, nextStepId]));
      setCanProceed(false); // Reset for next step validation
    }
  }, [stepIndex, canProceed]);

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
