import React from 'react';
import { FileText } from 'lucide-react';
import type { DialogueChoice, Scene } from '@/types';
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
}

/**
 * StepChoices - Adaptive choice builder based on complexity level (PHASE 2.4: Updated)
 *
 * Routes to appropriate builder:
 * - Simple: Linear (no choices) or Binary (2 choices) via SimpleChoiceBuilder
 * - Medium: DiceChoiceBuilder (dice mechanics) - Coming Soon
 * - Complex: ComplexChoiceBuilder (2-4 choices + effects) - Coming Soon
 */
export function StepChoices({
  complexityLevel,
  choices,
  scenes,
  currentSceneId,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange
}: StepChoicesProps) {
  // PHASE 2.3: Handle 4 distinct complexity levels
  React.useEffect(() => {
    // If linear dialogue (no choices), mark as valid so user can proceed
    if (complexityLevel === 'linear') {
      onValidChange(true);
    }
  }, [complexityLevel, onValidChange]);

  // Render appropriate builder based on complexity
  switch (complexityLevel) {
    case 'linear':
      // Linear dialogue: no choices (simple story)
      return (
        <div className="text-center py-12 space-y-4 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto opacity-50" />
          <div>
            <p className="text-lg font-semibold">Ce dialogue est simple (sans choix)</p>
            <p className="text-sm mt-2">Le joueur lira simplement le texte et continuera.</p>
          </div>
          <p className="text-sm bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
            💡 <strong>Astuce :</strong> Pour ajouter des choix, revenez à l'étape précédente et sélectionnez "À choisir".
          </p>
        </div>
      );

    case 'binary':
      // Binary dialogue: exactly 2 simple choices
      if (choices.length !== 2) {
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Erreur : Le mode "À choisir" nécessite exactement 2 choix</p>
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
