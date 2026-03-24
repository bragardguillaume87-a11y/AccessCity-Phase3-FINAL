import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DialogueChoice, Effect, Condition } from '@/types';

const EMPTY_EFFECTS: Effect[] = [];
import { ChoiceCardHeader } from '../ChoiceCardHeader';
import { CARD_SLIDE_UP } from '@/constants/animations';
import { EffectsEditor } from './EffectsEditor';
import { ConditionRow } from './ConditionRow';

interface ComplexChoiceCardProps {
  choice: DialogueChoice;
  /** Index numérique — uniquement pour la couleur de la carte */
  index: number;
  /** Titre affiché : "Choix A", "Choix B", etc. */
  title: string;
  onUpdate: (updates: Partial<DialogueChoice>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const CARD_COLORS = [
  {
    border: 'border-emerald-500/40',
    bg: 'from-emerald-500/5 to-green-500/5',
    accent: 'from-emerald-500 to-green-500',
  },
  {
    border: 'border-rose-500/40',
    bg: 'from-rose-500/5 to-red-500/5',
    accent: 'from-rose-500 to-red-500',
  },
  {
    border: 'border-amber-500/40',
    bg: 'from-amber-500/5 to-orange-500/5',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    border: 'border-violet-500/40',
    bg: 'from-violet-500/5 to-purple-500/5',
    accent: 'from-violet-500 to-purple-500',
  },
];

const DEFAULT_CONDITION: Condition = { variable: 'MENTALE', operator: '>=', value: 0 };

export function ComplexChoiceCard({
  choice,
  index,
  title,
  onUpdate,
  onRemove,
  canRemove,
}: ComplexChoiceCardProps) {
  const colors = CARD_COLORS[index % CARD_COLORS.length];
  const [conditionsOpen, setConditionsOpen] = useState(false);

  const conditions = choice.conditions ?? [];

  const handleAddCondition = () => {
    onUpdate({ conditions: [...conditions, { ...DEFAULT_CONDITION }] });
    setConditionsOpen(true);
  };

  const handleUpdateCondition = (idx: number, updates: Partial<Condition>) => {
    const next = conditions.map((c, i) => (i === idx ? { ...c, ...updates } : c));
    onUpdate({ conditions: next });
  };

  const handleRemoveCondition = (idx: number) => {
    const next = conditions.filter((_, i) => i !== idx);
    onUpdate({ conditions: next });
  };

  return (
    <motion.div
      {...CARD_SLIDE_UP}
      className={cn(
        'rounded-xl border p-4 space-y-3 relative',
        colors.border,
        `bg-gradient-to-br ${colors.bg}`
      )}
    >
      <ChoiceCardHeader
        icon={<Sparkles className="w-5 h-5 text-white" />}
        iconGradient={colors.accent}
        title={title}
        canRemove={canRemove}
        onRemove={onRemove}
        removeAriaLabel={`Supprimer ${title}`}
      />

      <div className="space-y-2">
        <Label
          htmlFor={`expert-text-${choice.id}`}
          className="text-sm font-medium text-muted-foreground"
        >
          Ce que le joueur choisit
        </Label>
        <Input
          id={`expert-text-${choice.id}`}
          value={choice.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Ex : Accepter la quête dangereuse"
          className="h-9 text-sm"
        />
      </div>

      <EffectsEditor
        effects={choice.effects ?? EMPTY_EFFECTS}
        onChange={(effects: Effect[]) => onUpdate({ effects })}
      />

      {/* ── Conditions de visibilité ─────────────────────────────────── */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setConditionsOpen((o) => !o)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {conditionsOpen ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span className="font-semibold uppercase tracking-wide">Conditions de visibilité</span>
          {conditions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
              {conditions.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {conditionsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden space-y-1.5"
            >
              {conditions.map((cond, idx) => (
                <ConditionRow
                  key={idx}
                  condition={cond}
                  onUpdate={(updates) => handleUpdateCondition(idx, updates)}
                  onRemove={() => handleRemoveCondition(idx)}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 w-full border border-dashed border-border/60"
                onClick={handleAddCondition}
              >
                <Plus className="w-3 h-3" /> Ajouter une condition
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!conditionsOpen && conditions.length === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 border border-dashed border-border/40 text-muted-foreground"
            onClick={handleAddCondition}
          >
            <Plus className="w-3 h-3" /> Condition
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default ComplexChoiceCard;
