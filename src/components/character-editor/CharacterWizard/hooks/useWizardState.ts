import { useState, useCallback, useMemo } from 'react';

/**
 * Wizard step identifiers
 */
export type WizardStep = 'identity' | 'appearance' | 'expressions' | 'review';

/**
 * Step configuration
 */
export interface StepConfig {
  id: WizardStep;
  label: string;
  icon: string; // Emoji for kid-friendly display
  description: string;
}

/**
 * Wizard state
 */
export interface WizardState {
  currentStep: WizardStep;
  stepIndex: number;
  canProceed: boolean;
  canGoBack: boolean;
  isComplete: boolean;
  visitedSteps: Set<WizardStep>;
}

/**
 * Wizard actions
 */
export interface WizardActions {
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setCanProceed: (canProceed: boolean) => void;
  reset: () => void;
}

/**
 * Step order configuration
 */
export const WIZARD_STEPS: StepConfig[] = [
  {
    id: 'identity',
    label: 'Identité',
    icon: '✏️',
    description: 'Donne un nom à ton personnage'
  },
  {
    id: 'appearance',
    label: 'Apparence',
    icon: '🎨',
    description: 'Choisis son apparence'
  },
  {
    id: 'expressions',
    label: 'Expressions',
    icon: '😊',
    description: 'Ajoute des humeurs'
  },
  {
    id: 'review',
    label: 'Terminé !',
    icon: '🎉',
    description: 'Vérifie et sauvegarde'
  }
];

const STEP_ORDER: WizardStep[] = WIZARD_STEPS.map(s => s.id);

/**
 * useWizardState - State machine for character wizard
 *
 * Manages the 4-step wizard flow with validation gates
 * between steps. Kid-friendly with encouraging feedback.
 */
export function useWizardState(): [WizardState, WizardActions] {
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity');
  const [visitedSteps, setVisitedSteps] = useState<Set<WizardStep>>(new Set(['identity']));
  const [canProceed, setCanProceed] = useState(false);

  const stepIndex = useMemo(() =>
    STEP_ORDER.indexOf(currentStep),
    [currentStep]
  );

  const canGoBack = stepIndex > 0;
  const isComplete = currentStep === 'review';

  const state: WizardState = {
    currentStep,
    stepIndex,
    canProceed,
    canGoBack,
    isComplete,
    visitedSteps
  };

  const goToStep = useCallback((step: WizardStep) => {
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

  const reset = useCallback(() => {
    setCurrentStep('identity');
    setVisitedSteps(new Set(['identity']));
    setCanProceed(false);
  }, []);

  const actions: WizardActions = {
    goToStep,
    nextStep,
    previousStep,
    setCanProceed,
    reset
  };

  return [state, actions];
}

export default useWizardState;
