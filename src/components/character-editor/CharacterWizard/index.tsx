import React, { useCallback } from 'react';
import { useCharacterForm } from '@/hooks/useCharacterForm';
import { useCharacterCompleteness } from '../CharacterEditorModal/hooks/useCharacterCompleteness';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Character } from '@/types';

// Wizard components
import { useWizardState, WIZARD_STEPS, type WizardStep } from './hooks/useWizardState';
import { WizardProgressBar } from '@/components/ui/WizardProgressBar';
import WizardNavigation from './components/WizardNavigation';
import StepIdentity from './components/StepIdentity';
import StepAppearance from './components/StepAppearance';
import StepExpressions from './components/StepExpressions';
import StepReview from './components/StepReview';

interface CharacterWizardProps {
  character: Partial<Character>;
  characters: Character[];
  onSave: (character: Character) => void;
  onClose: () => void;
}

/**
 * CharacterWizard - Kid-friendly 4-step character creation
 *
 * Step 1: Identity (name + description)
 * Step 2: Appearance (default sprite)
 * Step 3: Expressions (moods + sprites)
 * Step 4: Review & Save (with celebration)
 *
 * Designed for children 8+ with large buttons, encouraging
 * feedback, and visual progress indicators.
 */
export function CharacterWizard({
  character,
  characters,
  onSave,
  onClose
}: CharacterWizardProps) {
  // Form state management (reuse existing hook)
  const {
    formData,
    errors,
    updateField,
    addMood,
    removeMood,
    updateSprite,
    handleSave
  } = useCharacterForm(character as Character, characters, onSave);

  // Wizard state machine
  const [wizardState, wizardActions] = useWizardState();

  // Completeness tracking
  const completeness = useCharacterCompleteness(formData.moods, formData.sprites);

  // Handle step validation changes
  const handleValidChange = useCallback((isValid: boolean) => {
    wizardActions.setCanProceed(isValid);
  }, [wizardActions]);

  // Handle save from review step
  const handleWizardSave = useCallback(() => {
    const success = handleSave();
    if (success) {
      // Delay close to allow celebration animation
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [handleSave, onClose]);

  // Handle edit from review step
  const handleEditStep = useCallback((step: WizardStep) => {
    wizardActions.goToStep(step);
  }, [wizardActions]);

  // Get default sprite (first sprite with a value, or empty)
  const defaultSprite = formData.moods.length > 0
    ? formData.sprites[formData.moods[0]] || ''
    : '';

  // Update default sprite (for step 2)
  const handleDefaultSpriteChange = useCallback((path: string) => {
    // Apply to the first mood (usually 'neutral')
    const firstMood = formData.moods[0] || 'neutral';
    updateSprite(firstMood, path);
  }, [formData.moods, updateSprite]);

  // Render current step content
  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 'identity':
        return (
          <StepIdentity
            name={formData.name}
            description={formData.description}
            onUpdateName={(name) => updateField('name', name)}
            onUpdateDescription={(desc) => updateField('description', desc)}
            onValidChange={handleValidChange}
            nameError={errors.name?.[0]}
          />
        );

      case 'appearance':
        return (
          <StepAppearance
            currentSprite={defaultSprite}
            characterName={formData.name}
            onSelectSprite={handleDefaultSpriteChange}
            onValidChange={handleValidChange}
          />
        );

      case 'expressions':
        return (
          <StepExpressions
            moods={formData.moods}
            sprites={formData.sprites}
            onAddMood={addMood}
            onRemoveMood={removeMood}
            onUpdateSprite={updateSprite}
            onValidChange={handleValidChange}
          />
        );

      case 'review':
        return (
          <StepReview
            formData={formData}
            completeness={completeness}
            onSave={handleWizardSave}
            onEditStep={handleEditStep}
          />
        );

      default:
        return null;
    }
  };

  // Get navigation labels
  const getNextLabel = () => {
    switch (wizardState.currentStep) {
      case 'identity':
        return 'Choisir l\'apparence';
      case 'appearance':
        return 'Ajouter des expressions';
      case 'expressions':
        return 'Terminer';
      default:
        return 'Suivant';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Progress bar - fixed height */}
      <div className="flex-shrink-0">
        <WizardProgressBar
          steps={WIZARD_STEPS}
          currentStep={wizardState.currentStep}
          visitedSteps={wizardState.visitedSteps}
          onStepClick={wizardActions.goToStep}
        />
      </div>

      {/* Step content - scrollable, takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full px-8 py-6">
          <div className="max-w-2xl mx-auto pb-4">
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
              isLastStep={wizardState.currentStep === 'expressions'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterWizard;
