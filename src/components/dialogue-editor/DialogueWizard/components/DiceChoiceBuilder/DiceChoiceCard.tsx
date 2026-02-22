
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DialogueChoice, DiceCheck } from '@/types';
import { StatSelector } from './StatSelector';
import { DifficultySlider } from './DifficultySlider';
import { OutcomeEditor } from './OutcomeEditor';
import { ChoiceCardHeader } from '../ChoiceCardHeader';
import { CARD_SLIDE_UP } from '@/constants/animations';

interface DiceChoiceCardProps {
  choice: DialogueChoice;
  index: number;
  onUpdate: (updates: Partial<DialogueChoice>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function DiceChoiceCard({
  choice,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: DiceChoiceCardProps) {
  const diceCheck = choice.diceCheck!;

  const updateDiceCheck = (updates: Partial<DiceCheck>) => {
    onUpdate({ diceCheck: { ...diceCheck, ...updates } });
  };

  return (
    <motion.div
      {...CARD_SLIDE_UP}
      className={cn(
        "rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5",
        "p-6 space-y-5 relative group"
      )}
    >
      <ChoiceCardHeader
        icon={<span className="text-2xl">🎲</span>}
        iconGradient="from-purple-500 to-pink-500"
        title={`Test #${index + 1}`}
        canRemove={canRemove}
        onRemove={onRemove}
        removeAriaLabel={`Supprimer le test #${index + 1}`}
      />

      <div className="space-y-2">
        <Label htmlFor={`dice-text-${choice.id}`} className="text-sm font-semibold">
          Texte du choix (ce que voit le joueur)
        </Label>
        <Input
          id={`dice-text-${choice.id}`}
          value={choice.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Ex: Tenter de convaincre le gardien"
          className="h-12 text-base"
        />
      </div>

      <StatSelector
        value={diceCheck.stat}
        onChange={(stat) => updateDiceCheck({ stat })}
      />

      <DifficultySlider
        value={diceCheck.difficulty}
        onChange={(difficulty) => updateDiceCheck({ difficulty })}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <OutcomeEditor
          type="success"
          branch={diceCheck.success || {}}
          onChange={(success) => updateDiceCheck({ success })}
        />
        <OutcomeEditor
          type="failure"
          branch={diceCheck.failure || {}}
          onChange={(failure) => updateDiceCheck({ failure })}
        />
      </div>
    </motion.div>
  );
}

export default DiceChoiceCard;
