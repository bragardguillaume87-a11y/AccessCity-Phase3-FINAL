import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DialogueChoice } from '@/types';
import { ComplexChoiceCard } from './ComplexChoiceCard';

interface ComplexChoiceBuilderProps {
  choices: DialogueChoice[];
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onAddChoice?: () => void;
  onRemoveChoice?: (index: number) => void;
  onValidChange: (isValid: boolean) => void;
}

const MIN_CHOICES = 2;
const MAX_CHOICES = 4;

/**
 * ComplexChoiceBuilder - Interface for creating 2-4 expert choices with effects
 *
 * Each choice includes:
 * - A text (what the player sees)
 * - Optional effects on game variables (add, set, multiply)
 */
export function ComplexChoiceBuilder({
  choices,
  onUpdateChoice,
  onAddChoice,
  onRemoveChoice,
  onValidChange,
}: ComplexChoiceBuilderProps) {
  const canAddChoice = choices.length < MAX_CHOICES;
  const canRemoveChoice = choices.length > MIN_CHOICES;

  // Validation
  const validation = useMemo(() => {
    if (choices.length < MIN_CHOICES) return { isValid: false, validCount: 0 };

    let validCount = 0;
    for (const choice of choices) {
      if (choice.text && choice.text.trim().length >= 5) validCount++;
    }

    return { isValid: validCount === choices.length, validCount };
  }, [choices]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  return (
    <div className="space-y-6 px-2">
      {/* Guide character */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-3xl">⚡</span>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-card border-2 border-border relative">
          <div className="absolute left-[-8px] top-5 w-4 h-4 bg-card border-l-2 border-b-2 border-border rotate-45" />
          <p className="text-base font-semibold text-foreground relative z-10">
            Mode Expert : choix multiples !
          </p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">
            Crée 2 à 4 choix avec des effets sur les variables du jeu. Chaque choix peut modifier l'empathie, l'autonomie ou la confiance du joueur.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-500 ${
              validation.validCount === 0 ? 'bg-muted-foreground/30' :
              validation.validCount < choices.length ? 'bg-amber-400' : 'bg-orange-500'
            }`}
            animate={{ width: choices.length > 0 ? `${(validation.validCount / choices.length) * 100}%` : '0%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {validation.validCount}/{choices.length}
        </span>
      </div>

      {/* Choice cards */}
      <AnimatePresence mode="popLayout">
        {choices.map((choice, index) => (
          <ComplexChoiceCard
            key={choice.id}
            choice={choice}
            index={index}
            onUpdate={(updates) => onUpdateChoice(index, updates)}
            onRemove={() => onRemoveChoice?.(index)}
            canRemove={canRemoveChoice}
          />
        ))}
      </AnimatePresence>

      {/* Add choice button */}
      {canAddChoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={onAddChoice}
            variant="outline"
            className="h-14 px-8 rounded-2xl border-2 border-dashed border-orange-500/40 hover:border-orange-500 hover:bg-orange-500/10 transition-all gap-3"
          >
            <Plus className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Ajouter un choix</span>
            <span className="text-xs text-muted-foreground">({choices.length}/{MAX_CHOICES})</span>
          </Button>
        </motion.div>
      )}

      {/* Help */}
      <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2">
        <p className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          À propos des effets
        </p>
        <ul className="space-y-1 text-muted-foreground">
          <li><strong>+ Ajouter</strong> : Ajoute une valeur (ex: Empathie +10)</li>
          <li><strong>= Définir</strong> : Fixe une valeur absolue (ex: Confiance = 50)</li>
          <li><strong>× Multiplier</strong> : Multiplie par un facteur (ex: Autonomie ×0.5)</li>
        </ul>
      </div>
    </div>
  );
}

export default ComplexChoiceBuilder;
