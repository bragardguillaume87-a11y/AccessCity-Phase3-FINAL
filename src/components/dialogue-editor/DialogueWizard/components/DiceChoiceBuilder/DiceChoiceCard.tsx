
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
  title: string;
  onUpdate: (updates: Partial<DialogueChoice>) => void;
  onRemove: () => void;
  canRemove: boolean;
  currentSceneId: string;
}

export function DiceChoiceCard({
  choice,
  title,
  onUpdate,
  onRemove,
  canRemove,
  currentSceneId,
}: DiceChoiceCardProps) {
  const diceCheck = choice.diceCheck!;

  const updateDiceCheck = (updates: Partial<DiceCheck>) => {
    onUpdate({ diceCheck: { ...diceCheck, ...updates } });
  };

  return (
    <motion.div
      {...CARD_SLIDE_UP}
      className={cn(
        "rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5",
        "p-4 space-y-4 relative group"
      )}
    >
      <ChoiceCardHeader
        icon={<span className="text-xl">🎲</span>}
        iconGradient="from-purple-500 to-pink-500"
        title={title}
        canRemove={canRemove}
        onRemove={onRemove}
        removeAriaLabel={`Supprimer ${title}`}
      />

      <div className="space-y-2">
        <Label htmlFor={`dice-text-${choice.id}`} className="text-sm font-medium text-muted-foreground">
          Ce que le joueur choisit
        </Label>
        <Input
          id={`dice-text-${choice.id}`}
          value={choice.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Ex : Tenter de convaincre le gardien"
          className="h-9 text-sm"
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
          currentSceneId={currentSceneId}
        />
        <OutcomeEditor
          type="failure"
          branch={diceCheck.failure || {}}
          onChange={(failure) => updateDiceCheck({ failure })}
          currentSceneId={currentSceneId}
        />
      </div>
    </motion.div>
  );
}

export default DiceChoiceCard;
