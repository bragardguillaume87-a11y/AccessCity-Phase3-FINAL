import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DialogueChoice } from '@/types';
import { DiceChoiceCard } from './DiceChoiceCard';

interface DiceChoiceBuilderProps {
  choices: DialogueChoice[];
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (index: number) => void;
  onValidChange: (isValid: boolean) => void;
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
    <div className="space-y-6 px-2">
      {/* Guide character */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-3xl">🎲</span>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-card border-2 border-border relative">
          <div className="absolute left-[-8px] top-5 w-4 h-4 bg-card border-l-2 border-b-2 border-border rotate-45" />
          <p className="text-base font-semibold text-foreground relative z-10">
            Le joueur lance les dés !
          </p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">
            Configure 1 ou 2 tests de caractéristique. Le joueur devra battre la difficulté avec son dé.
          </p>
        </div>
      </div>

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
            className="h-14 px-8 rounded-2xl border-2 border-dashed border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10 transition-all gap-3"
          >
            <Plus className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Ajouter un 2ème test</span>
            <span className="text-xs text-muted-foreground">({choices.length}/{MAX_DICE_TESTS})</span>
          </Button>
        </motion.div>
      )}

      {/* Help */}
      <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2">
        <p className="font-semibold flex items-center gap-2">
          <Dices className="w-4 h-4" />
          Comment ça marche ?
        </p>
        <ul className="space-y-1 text-muted-foreground">
          <li>Le joueur lance 1d20 + bonus de la caractéristique</li>
          <li>Si le résultat est supérieur ou égal à la difficulté : succès !</li>
          <li>Sinon : échec. Chaque résultat mène vers un dialogue différent.</li>
        </ul>
      </div>
    </div>
  );
}

export default DiceChoiceBuilder;
