import React from 'react';
import { Dices, Settings } from 'lucide-react';
import type { DialogueChoice, Scene } from '@/types';
import { SimpleChoiceBuilder } from './SimpleChoiceBuilder';
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
 * StepChoices - Adaptive choice builder based on complexity level
 *
 * Routes to appropriate builder:
 * - Simple: SimpleChoiceBuilder (2 binary choices)
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
  // Render appropriate builder based on complexity
  switch (complexityLevel) {
    case 'simple':
      // Simple mode requires exactly 2 choices
      if (choices.length !== 2) {
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">Erreur : Le mode Simple nécessite exactement 2 choix</p>
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

    case 'medium':
      return <PlaceholderBuilder type="medium" />;

    case 'complex':
      return <PlaceholderBuilder type="complex" />;

    default:
      return null;
  }
}

/**
 * PlaceholderBuilder - Coming Soon placeholder for Medium and Complex modes
 */
function PlaceholderBuilder({ type }: { type: 'medium' | 'complex' }) {
  const config = {
    medium: {
      icon: Dices,
      title: 'Dés Magiques',
      description: 'Lancers de dés comme Baldur\'s Gate 3',
      features: ['Dés à 20 faces', 'Tests de compétence', 'Succès ou échec'],
      color: 'from-purple-500 to-purple-600',
      emoji: '🎲'
    },
    complex: {
      icon: Settings,
      title: 'Mode Expert',
      description: 'Variables multiples et effets avancés',
      features: ['Jusqu\'à 4 choix', 'Effets multiples', 'Logique complexe'],
      color: 'from-orange-500 to-orange-600',
      emoji: '⚙️'
    }
  }[type];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 p-8">
      {/* Icon */}
      <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-xl bg-gradient-to-br ${config.color}`}>
        <span className="text-6xl">{config.emoji}</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-foreground">{config.title}</h3>
        <p className="text-lg text-muted-foreground">{config.description}</p>
      </div>

      {/* Features */}
      <div className="space-y-2">
        {config.features.map((feature, idx) => (
          <div key={idx} className="flex items-center justify-center gap-2 text-foreground">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br ${config.color}`}>
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Coming Soon Badge */}
      <div className="mt-6 px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/50">
        <p className="text-primary font-bold">🚧 Bientôt disponible ! 🚧</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ce mode sera ajouté prochainement
        </p>
      </div>

      {/* Temporary validation - always false for placeholders */}
      {React.useEffect(() => {
        onValidChange(false);
      }, [])}
    </div>
  );
}

export default StepChoices;
