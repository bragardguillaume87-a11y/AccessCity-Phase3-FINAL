import React, { useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Dialogue, Scene } from '@/types';

// Wizard hooks
import { useDialogueWizardState, type DialogueWizardStep } from './hooks/useDialogueWizardState';
import { useDialogueForm } from './hooks/useDialogueForm';
import { useChoiceValidation } from './hooks/useChoiceValidation';

// DialogueWizard components
import DialogueWizardProgressBar from './components/WizardProgressBar';
import WizardNavigation from '@/components/character-editor/CharacterWizard/components/WizardNavigation';
import StepComplexity from './components/StepComplexity';
import StepBasics from './components/StepBasics';
// import StepChoices from './components/StepChoices';
// import StepReview from './components/StepReview';

interface DialogueWizardProps {
  sceneId: string;
  dialogueIndex?: number;
  dialogue?: Dialogue;
  scenes: Scene[];
  onSave: (dialogue: Dialogue) => void;
  onClose: () => void;
}

/**
 * DialogueWizard - Step-by-step dialogue creation wizard
 *
 * 4-step wizard for creating dialogues with 3 complexity levels:
 * - Simple (8+): 2 binary choices
 * - Medium (10+): Dice rolls like Baldur's Gate 3
 * - Complex (12+): Multiple choices with effects
 *
 * Steps:
 * 1. Complexity - Choose level
 * 2. Basics - Speaker + text + SFX
 * 3. Choices - Create choices (adaptive)
 * 4. Review - Preview + save
 */
export function DialogueWizard({
  sceneId,
  dialogueIndex,
  dialogue,
  scenes,
  onSave,
  onClose
}: DialogueWizardProps) {
  console.log('[DialogueWizard] Component mounted, sceneId:', sceneId, 'dialogueIndex:', dialogueIndex);

  // Wizard state management
  const [wizardState, wizardActions] = useDialogueWizardState(
    dialogue ? undefined : undefined // Will be set when complexity is chosen
  );

  // Form data management
  const [formData, formActions] = useDialogueForm(dialogue);

  // Validation
  const validation = useChoiceValidation(formData, scenes);

  // Sync complexity between wizard and form
  const handleComplexityChange = useCallback(
    (level: 'simple' | 'medium' | 'complex') => {
      wizardActions.setComplexity(level);
      formActions.setComplexity(level);
      // Automatically enable "Continue" button when level is selected
      wizardActions.setCanProceed(true);
    },
    [wizardActions, formActions]
  );

  // Handle continue from complexity step
  const handleComplexityContinue = useCallback(() => {
    wizardActions.nextStep();
  }, [wizardActions]);

  // Handle step validation changes
  const handleValidChange = useCallback(
    (isValid: boolean) => {
      wizardActions.setCanProceed(isValid);
    },
    [wizardActions]
  );

  // Handle save from review step
  const handleWizardSave = useCallback(() => {
    const newDialogue: Dialogue = {
      id: dialogue?.id || `dialogue-${Date.now()}`,
      speaker: formData.speaker,
      text: formData.text,
      choices: formData.choices,
      sfx: formData.sfx
    };

    onSave(newDialogue);

    // Close after short delay for celebration animation
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [formData, dialogue, onSave, onClose]);

  // Get navigation labels
  const getNextLabel = () => {
    switch (wizardState.currentStep) {
      case 'complexity':
        return 'Continuer';
      case 'basics':
        return 'Créer les choix';
      case 'choices':
        return 'Terminer';
      default:
        return 'Suivant';
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'complexity':
        return (
          <StepComplexity
            selectedLevel={formData.complexityLevel}
            onSelect={handleComplexityChange}
            onContinue={handleComplexityContinue}
          />
        );

      case 'basics':
        return (
          <StepBasics
            speaker={formData.speaker || 'narrator'}
            text={formData.text}
            onSpeakerChange={(speaker) => {
              // Convert 'narrator' to empty string for storage
              formActions.updateField('speaker', speaker === 'narrator' ? '' : speaker);
            }}
            onTextChange={(text) => formActions.updateField('text', text)}
            onValidChange={handleValidChange}
          />
        );

      case 'choices':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Étape Choices - Composant à créer</p>
              <p className="text-sm mt-2">
                Complexité: {formData.complexityLevel}
              </p>
              <p className="text-sm">
                Choix: {formData.choices.length}
              </p>
              <button
                onClick={() => handleValidChange(true)}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
              >
                Temporary: Validate Choices
              </button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Étape Review - Composant à créer</p>
              <button
                onClick={handleWizardSave}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded"
              >
                Temporary: Save Dialogue
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Progress bar - fixed height */}
      <div className="flex-shrink-0">
        <DialogueWizardProgressBar
          currentStep={wizardState.currentStep}
          visitedSteps={wizardState.visitedSteps}
          onStepClick={wizardActions.goToStep}
        />
      </div>

      {/* Step content - scrollable, takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full px-8 py-6">
          <div className={wizardState.currentStep === 'complexity' ? 'pb-4' : 'max-w-2xl mx-auto pb-4'}>
            {renderStepContent()}
          </div>
        </ScrollArea>
      </div>

      {/* Navigation - fixed at bottom, always visible */}
      {wizardState.currentStep !== 'review' && (
        <div className="flex-shrink-0 px-8 py-4 border-t bg-background">
          <div className="max-w-2xl mx-auto">
            <WizardNavigation
              showBack={wizardState.canGoBack}
              onBack={wizardActions.previousStep}
              onNext={wizardActions.nextStep}
              nextDisabled={!wizardState.canProceed}
              nextLabel={getNextLabel()}
              isLastStep={wizardState.currentStep === 'choices'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DialogueWizard;
