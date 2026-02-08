import React, { useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { logger } from '@/utils/logger';
import { DEFAULTS } from '@/config/constants';
import type { Dialogue, Scene } from '@/types';
import { useUIStore } from '@/stores';

// Wizard hooks
import { useDialogueWizardState, DIALOGUE_WIZARD_STEPS, type DialogueWizardStep, type ComplexityLevel } from './hooks/useDialogueWizardState';
import { useDialogueForm } from './hooks/useDialogueForm';
import { useChoiceValidation } from './hooks/useChoiceValidation';

// DialogueWizard components
import { WizardProgressBar } from '@/components/ui/WizardProgressBar';
import { WizardNavigation } from '@/components/ui/WizardNavigation';
import StepComplexity from './components/StepComplexity';
import StepBasics from './components/StepBasics';
import StepChoices from './components/StepChoices';
import StepResponses from './components/StepResponses';
import StepReview from './components/StepReview';

interface DialogueWizardProps {
  sceneId: string;
  dialogueIndex?: number;
  dialogue?: Dialogue;
  scenes: Scene[];
  onSave: (dialogues: Dialogue[]) => void;
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
  // PHASE 1.3: Read initial complexity from store (set by palette buttons)
  const initialComplexity = useUIStore((state) => state.dialogueWizardInitialComplexity);
  const clearDialogueWizardInitialComplexity = useUIStore((state) => state.clearDialogueWizardInitialComplexity);

  // Wizard state management
  const [wizardState, wizardActions] = useDialogueWizardState();

  // Form data management (pass initialComplexity from palette)
  const [formData, formActions] = useDialogueForm(dialogue, initialComplexity);

  // Validation
  const validation = useChoiceValidation(formData);

  // PHASE 1.3: Cleanup on unmount (ensures complexity is cleared no matter how wizard closes)
  useEffect(() => {
    return () => {
      clearDialogueWizardInitialComplexity();
    };
  }, [clearDialogueWizardInitialComplexity]);

  // PHASE 1.3: Handle close with cleanup
  const handleClose = useCallback(() => {
    clearDialogueWizardInitialComplexity();
    onClose();
  }, [clearDialogueWizardInitialComplexity, onClose]);

  // Sync complexity between wizard and form
  const handleComplexityChange = useCallback(
    (level: ComplexityLevel) => {
      wizardActions.setComplexity(level);
      formActions.setComplexity(level);
      // Automatically enable "Continue" button when level is selected
      wizardActions.setCanProceed(true);
    },
    [wizardActions, formActions]
  );

  // Handle step validation changes
  const handleValidChange = useCallback(
    (isValid: boolean) => {
      wizardActions.setCanProceed(isValid);
    },
    [wizardActions]
  );

  // Handle skip responses step
  const handleSkipResponses = useCallback(() => {
    // Clear responses and go directly to review (bypass validation)
    formActions.updateField('responses', []);
    wizardActions.goToStep('review');
  }, [formActions, wizardActions]);

  // Handle save from review step
  const handleWizardSave = useCallback(() => {
    try {
      const hasResponses = formData.responses.some(r => r.text.trim().length > 0);

      // Normalize speaker: empty string means narrator (converted in StepBasics)
      const normalizedSpeaker = formData.speaker || DEFAULTS.DIALOGUE_SPEAKER;

      if (hasResponses) {
        // Create response dialogue IDs upfront for linking
        const responseAId = `dialogue-${Date.now()}-resp-a`;
        const responseBId = `dialogue-${Date.now()}-resp-b`;

        // Main dialogue: link each choice to its response dialogue
        const linkedChoices = formData.choices.map((choice, i) => ({
          ...choice,
          nextDialogueId: i === 0 ? responseAId : responseBId,
        }));

        const mainDialogue = DialogueFactory.create({
          id: dialogue?.id,
          speaker: normalizedSpeaker,
          text: formData.text,
          choices: linkedChoices,
          sfx: formData.sfx
        });

        // Response dialogues (no choices, marked as responses)
        // nextDialogueId will be set by the parent (convergence point)
        const dialogues: Dialogue[] = [mainDialogue];

        formData.responses.forEach((response, i) => {
          if (response.text.trim()) {
            // Use DialogueFactory for consistency and Zod validation
            const responseDialogue = DialogueFactory.create({
              id: i === 0 ? responseAId : responseBId,
              speaker: response.speaker || normalizedSpeaker,
              text: response.text,
              choices: [],
            });
            // Add isResponse flag after factory creation (not in factory options)
            dialogues.push({
              ...responseDialogue,
              isResponse: true,
            });
          }
        });

        onSave(dialogues);
      } else {
        // Single dialogue (no responses)
        const newDialogue = DialogueFactory.create({
          id: dialogue?.id,
          speaker: normalizedSpeaker,
          text: formData.text,
          choices: formData.choices,
          sfx: formData.sfx
        });

        onSave([newDialogue]);
      }

      // Close after short delay for celebration animation
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      logger.error('[DialogueWizard] Save failed:', error);
    }
  }, [formData, dialogue, onSave, handleClose]);

  // Get navigation labels
  const getNextLabel = () => {
    switch (wizardState.currentStep) {
      case 'complexity':
        return 'Continuer';
      case 'basics':
        return 'Créer les choix';
      case 'choices':
        return 'Continuer';
      case 'responses':
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
          />
        );

      case 'basics':
        return (
          <StepBasics
            speaker={formData.speaker || DEFAULTS.DIALOGUE_SPEAKER}
            text={formData.text}
            onSpeakerChange={(speaker) => {
              // Convert 'narrator' to empty string for storage
              formActions.updateField('speaker', speaker === DEFAULTS.DIALOGUE_SPEAKER ? '' : speaker);
            }}
            onTextChange={(text) => formActions.updateField('text', text)}
            onValidChange={handleValidChange}
          />
        );

      case 'choices':
        return (
          <StepChoices
            complexityLevel={formData.complexityLevel || 'binary'}
            choices={formData.choices}
            scenes={scenes}
            currentSceneId={sceneId}
            onUpdateChoice={(index, updates) => {
              formActions.updateChoice(index, updates);
            }}
            onAddChoice={formActions.addChoice}
            onRemoveChoice={formActions.removeChoice}
            onValidChange={handleValidChange}
          />
        );

      case 'responses':
        return (
          <StepResponses
            choices={formData.choices}
            responses={formData.responses}
            defaultSpeaker={formData.speaker || DEFAULTS.DIALOGUE_SPEAKER}
            onUpdateResponse={(index, updates) => {
              formActions.updateResponse(index, updates);
            }}
            onValidChange={handleValidChange}
            onSkip={handleSkipResponses}
          />
        );

      case 'review':
        return (
          <StepReview
            formData={formData}
            onSave={handleWizardSave}
            onEditStep={wizardActions.goToStep}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Progress bar - fixed height */}
      <div className="flex-shrink-0">
        <WizardProgressBar
          steps={DIALOGUE_WIZARD_STEPS}
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
              isLastStep={wizardState.currentStep === 'responses'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DialogueWizard;
