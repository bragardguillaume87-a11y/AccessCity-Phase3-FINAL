import React from 'react';
import { FileText } from 'lucide-react';
import type { DialogueChoice, Scene } from '@/types';
import type { ResponseData } from '../hooks/useDialogueForm';
import { SimpleChoiceBuilder } from './SimpleChoiceBuilder';
import { DiceChoiceBuilder } from './DiceChoiceBuilder';
import { ComplexChoiceBuilder } from './ComplexChoiceBuilder';
import type { ComplexityLevel } from '../hooks/useDialogueWizardState';

interface StepChoicesProps {
  complexityLevel: ComplexityLevel;
  choices: DialogueChoice[];
  scenes: Scene[];
  currentSceneId: string;
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (index: number) => void;
  onValidChange: (isValid: boolean) => void;
  // Binary-only: inline responses (replaces StepResponses)
  responses?: ResponseData[];
  defaultSpeaker?: string;
  onUpdateResponse?: (index: number, updates: Partial<ResponseData>) => void;
}

/**
 * StepChoices - Adaptive choice builder based on complexity level.
 *
 * Routes to appropriate builder:
 * - Linear:  no choices (skipped by routing — this case should never render)
 * - Binary:  SimpleChoiceBuilder with inline response fields
 * - Dice:    DiceChoiceBuilder (dice mechanics)
 * - Expert:  ComplexChoiceBuilder (2-4 choices + effects)
 */
export function StepChoices({
  complexityLevel,
  choices,
  scenes,
  currentSceneId,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange,
  responses,
  defaultSpeaker,
  onUpdateResponse,
}: StepChoicesProps) {
  React.useEffect(() => {
    // Linear is now skipped by routing — guard for edge cases
    if (complexityLevel === 'linear') {
      onValidChange(true);
    }
  }, [complexityLevel, onValidChange]);

  switch (complexityLevel) {
    case 'linear':
      // Should never render (routing skips this step for linear)
      return (
        <div className="text-center py-12 space-y-3 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto opacity-40" />
          <p className="text-sm">Dialogue simple — pas de choix</p>
        </div>
      );

    case 'binary':
      if (choices.length !== 2) {
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive text-sm">Erreur : 2 choix requis pour le mode "À choisir"</p>
          </div>
        );
      }

      return (
        <SimpleChoiceBuilder
          choices={[choices[0], choices[1]]}
          scenes={scenes}
          currentSceneId={currentSceneId}
          onUpdateChoice={onUpdateChoice}
          onValidChange={onValidChange}
          responses={responses}
          defaultSpeaker={defaultSpeaker}
          onUpdateResponse={onUpdateResponse}
        />
      );

    case 'dice':
      return (
        <DiceChoiceBuilder
          choices={choices}
          onUpdateChoice={onUpdateChoice}
          onAddChoice={onAddChoice}
          onRemoveChoice={onRemoveChoice}
          onValidChange={onValidChange}
        />
      );

    case 'expert':
      return (
        <ComplexChoiceBuilder
          choices={choices}
          onUpdateChoice={onUpdateChoice}
          onAddChoice={onAddChoice}
          onRemoveChoice={onRemoveChoice}
          onValidChange={onValidChange}
        />
      );

    default:
      return null;
  }
}

export default StepChoices;
