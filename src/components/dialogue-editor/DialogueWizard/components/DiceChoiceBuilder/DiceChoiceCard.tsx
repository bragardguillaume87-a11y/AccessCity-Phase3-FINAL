import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DialogueChoice, DiceCheck } from '@/types';
import { StatSelector } from './StatSelector';
import { DifficultySlider } from './DifficultySlider';
import { OutcomeEditor } from './OutcomeEditor';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5",
        "p-6 space-y-5 relative group"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎲</span>
          </div>
          <h4 className="text-lg font-bold">Test #{index + 1}</h4>
        </div>
        {canRemove && (
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            aria-label={`Supprimer le test #${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Choice text (what the player sees) */}
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

      {/* Stat selector */}
      <StatSelector
        value={diceCheck.stat}
        onChange={(stat) => updateDiceCheck({ stat })}
      />

      {/* Difficulty slider */}
      <DifficultySlider
        value={diceCheck.difficulty}
        onChange={(difficulty) => updateDiceCheck({ difficulty })}
      />

      {/* Outcomes */}
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
