
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DialogueChoice, Effect } from '@/types';
import { ChoiceCardHeader } from '../ChoiceCardHeader';
import { CARD_SLIDE_UP } from '@/constants/animations';
import { EffectsEditor } from './EffectsEditor';

interface ComplexChoiceCardProps {
  choice: DialogueChoice;
  index: number;
  onUpdate: (updates: Partial<DialogueChoice>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const CARD_COLORS = [
  { border: 'border-emerald-500/40', bg: 'from-emerald-500/5 to-green-500/5', accent: 'from-emerald-500 to-green-500' },
  { border: 'border-rose-500/40', bg: 'from-rose-500/5 to-red-500/5', accent: 'from-rose-500 to-red-500' },
  { border: 'border-amber-500/40', bg: 'from-amber-500/5 to-orange-500/5', accent: 'from-amber-500 to-orange-500' },
  { border: 'border-violet-500/40', bg: 'from-violet-500/5 to-purple-500/5', accent: 'from-violet-500 to-purple-500' },
];

export function ComplexChoiceCard({
  choice,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: ComplexChoiceCardProps) {
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <motion.div
      {...CARD_SLIDE_UP}
      className={cn(
        "rounded-2xl border-2 p-6 space-y-4 relative",
        colors.border,
        `bg-gradient-to-br ${colors.bg}`
      )}
    >
      <ChoiceCardHeader
        icon={<Sparkles className="w-5 h-5 text-white" />}
        iconGradient={colors.accent}
        title={`Choix #${index + 1}`}
        canRemove={canRemove}
        onRemove={onRemove}
        removeAriaLabel={`Supprimer le choix #${index + 1}`}
      />

      {/* Choice text */}
      <div className="space-y-2">
        <Label htmlFor={`expert-text-${choice.id}`} className="text-sm font-semibold">
          Texte du choix
        </Label>
        <Input
          id={`expert-text-${choice.id}`}
          value={choice.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Ex: Accepter la quête dangereuse"
          className="h-12 text-base"
        />
      </div>

      {/* Effects editor */}
      <EffectsEditor
        effects={choice.effects || []}
        onChange={(effects: Effect[]) => onUpdate({ effects })}
      />
    </motion.div>
  );
}

export default ComplexChoiceCard;
