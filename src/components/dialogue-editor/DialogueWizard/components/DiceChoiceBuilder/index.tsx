import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DialogueChoice } from '@/types';
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

/**
 * DiceChoiceBuilder - Interface for creating 1-2 dice check choices
 *
 * Each test includes:
 * - A stat to test (empathy, autonomy, confidence)
 * - A difficulty (1-20)
 * - A success branch
 * - A failure branch
 */
export function DiceChoiceBuilder({
  choices,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange,
  currentSceneId,
}: DiceChoiceBuilderProps) {
  const canAddTest = choices.length < MAX_DICE_TESTS;

  // Validation
  const validation = useMemo(() => {
    if (choices.length === 0) return { isValid: false, validCount: 0 };

    let validCount = 0;
    for (const choice of choices) {
      const hasText = choice.text && choice.text.trim().length >= 5;
      const hasDiceCheck = choice.diceCheck?.stat && choice.diceCheck.difficulty >= 1;
      if (hasText && hasDiceCheck) validCount++;
    }

    return { isValid: validCount === choices.length, validCount };
  }, [choices]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  const handleAddTest = () => {
    if (!canAddTest || !onAddChoice) return;
    onAddChoice();
  };

  return (
    <div className="space-y-4 px-2">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-500 ${
              validation.validCount === 0 ? 'bg-muted-foreground/30' :
              validation.validCount < choices.length ? 'bg-amber-400' : 'bg-purple-500'
            }`}
            animate={{ width: choices.length > 0 ? `${(validation.validCount / choices.length) * 100}%` : '0%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {validation.validCount}/{choices.length}
        </span>
      </div>

      {/* Dice test cards */}
      <AnimatePresence mode="popLayout">
        {choices.map((choice, index) => (
          <DiceChoiceCard
            key={choice.id}
            choice={choice}
            index={index}
            onUpdate={(updates) => onUpdateChoice(index, updates)}
            onRemove={() => onRemoveChoice?.(index)}
            canRemove={choices.length > 1}
            currentSceneId={currentSceneId}
          />
        ))}
      </AnimatePresence>

      {/* Add test button */}
      {canAddTest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleAddTest}
            variant="outline"
            className="h-9 px-4 rounded-lg border border-dashed border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10 transition-all gap-2"
          >
            <Plus className="w-4 h-4 text-purple-500" />
            <span className="text-sm">Ajouter un 2ème test</span>
            <span className="text-xs text-muted-foreground">({choices.length}/{MAX_DICE_TESTS})</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default DiceChoiceBuilder;
