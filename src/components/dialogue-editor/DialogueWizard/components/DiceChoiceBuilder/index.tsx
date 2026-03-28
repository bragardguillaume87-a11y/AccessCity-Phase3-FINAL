import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DialogueChoice } from '@/types';
import { CHOICE_MIN_TEXT_LENGTH } from '@/config/dialogueValidation';
import { DiceChoiceCard } from './DiceChoiceCard';

interface DiceChoiceBuilderProps {
  choices: DialogueChoice[];
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (index: number) => void;
  onValidChange: (isValid: boolean) => void;
  currentSceneId: string;
}

const MAX_DICE_TESTS = 2;

/** "Dés" quand 1 seul test, "Dés A" / "Dés B" quand plusieurs */
function getDiceTitle(index: number, total: number): string {
  if (total === 1) return 'Dé';
  return `Dé ${String.fromCharCode(65 + index)}`;
}

export function DiceChoiceBuilder({
  choices,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange,
  currentSceneId,
}: DiceChoiceBuilderProps) {
  const canAddTest = choices.length < MAX_DICE_TESTS;

  const validation = useMemo(() => {
    if (choices.length === 0) return { isValid: false };
    for (const choice of choices) {
      const hasText = choice.text && choice.text.trim().length >= CHOICE_MIN_TEXT_LENGTH;
      const hasDiceCheck = choice.diceCheck?.stat && choice.diceCheck.difficulty >= 1;
      if (!hasText || !hasDiceCheck) return { isValid: false };
    }
    return { isValid: true };
  }, [choices]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  return (
    <div className="space-y-4 px-2">
      <AnimatePresence mode="popLayout">
        {choices.map((choice, index) => (
          <DiceChoiceCard
            key={choice.id}
            choice={choice}
            title={getDiceTitle(index, choices.length)}
            onUpdate={(updates) => onUpdateChoice(index, updates)}
            onRemove={() => onRemoveChoice?.(index)}
            canRemove={choices.length > 1}
            currentSceneId={currentSceneId}
          />
        ))}
      </AnimatePresence>

      {canAddTest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={() => onAddChoice?.()}
            variant="outline"
            className="h-9 px-4 rounded-lg border border-dashed border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10 transition-all gap-2"
          >
            <Plus className="w-4 h-4 text-purple-500" />
            <span className="text-sm">Ajouter Dé B</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default DiceChoiceBuilder;
