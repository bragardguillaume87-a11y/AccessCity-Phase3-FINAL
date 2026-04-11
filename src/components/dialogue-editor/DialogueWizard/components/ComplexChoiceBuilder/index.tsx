import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DialogueChoice } from '@/types';
import {
  CHOICE_MIN_TEXT_LENGTH,
  CHOICE_MIN_COUNT,
  CHOICE_MAX_COUNT,
} from '@/config/dialogueValidation';
import { ComplexChoiceCard } from './ComplexChoiceCard';

interface ComplexChoiceBuilderProps {
  choices: DialogueChoice[];
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (index: number) => void;
  onValidChange: (isValid: boolean) => void;
}

/** "Choix A", "Choix B", "Choix C", "Choix D" */
function getChoiceTitle(index: number): string {
  return `Choix ${String.fromCharCode(65 + index)}`;
}

export function ComplexChoiceBuilder({
  choices,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange,
}: ComplexChoiceBuilderProps) {
  const canAddChoice = choices.length < CHOICE_MAX_COUNT;
  const canRemoveChoice = choices.length > CHOICE_MIN_COUNT;

  const isValid = useMemo(
    () =>
      choices.length >= CHOICE_MIN_COUNT &&
      choices.every((c) => c.text && c.text.trim().length >= CHOICE_MIN_TEXT_LENGTH),
    [choices]
  );

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  const nextLabel = `Ajouter Choix ${String.fromCharCode(65 + choices.length)}`;

  return (
    <div className="space-y-4 px-2">
      <AnimatePresence mode="popLayout">
        {choices.map((choice, index) => (
          <ComplexChoiceCard
            key={choice.id}
            choice={choice}
            index={index}
            title={getChoiceTitle(index)}
            onUpdate={(updates) => onUpdateChoice(index, updates)}
            onRemove={() => onRemoveChoice?.(index)}
            canRemove={canRemoveChoice}
          />
        ))}
      </AnimatePresence>

      {canAddChoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={onAddChoice}
            variant="outline"
            className="h-9 px-4 rounded-lg border border-dashed border-orange-500/40 hover:border-orange-500 hover:bg-orange-500/10 transition-all gap-2"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span className="text-sm">{nextLabel}</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default ComplexChoiceBuilder;
