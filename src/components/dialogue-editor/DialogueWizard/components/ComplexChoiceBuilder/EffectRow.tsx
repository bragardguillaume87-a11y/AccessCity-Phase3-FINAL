
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GAME_STATS } from '@/i18n';
import type { Effect } from '@/types';

interface EffectRowProps {
  effect: Effect;
  onUpdate: (updates: Partial<Effect>) => void;
  onRemove: () => void;
}

const OPERATIONS = [
  { value: 'add' as const, label: '+ Ajouter', example: '+10' },
  { value: 'set' as const, label: '= Définir', example: '= 50' },
  { value: 'multiply' as const, label: '× Multiplier', example: '×0.5' },
];

const VARIABLES = [
  { value: GAME_STATS.PHYSIQUE, label: '🏥 Physique' },
  { value: GAME_STATS.MENTALE, label: '🧠 Mentale' },
];

export function EffectRow({ effect, onUpdate, onRemove }: EffectRowProps) {
  return (
    <div className="flex items-center gap-2 bg-background p-2 rounded-lg border">
      {/* Variable */}
      <Select
        value={effect.variable}
        onValueChange={(value) => onUpdate({ variable: value })}
      >
        <SelectTrigger className="flex-1 text-sm h-9">
          <SelectValue placeholder="Variable" />
        </SelectTrigger>
        <SelectContent>
          {VARIABLES.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operation */}
      <Select
        value={effect.operation}
        onValueChange={(value) =>
          onUpdate({ operation: value as 'add' | 'set' | 'multiply' })
        }
      >
        <SelectTrigger className="w-32 text-sm h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATIONS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      <Input
        type="number"
        value={effect.value}
        onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
        placeholder="Valeur"
        className="w-20 text-sm h-9"
      />

      {/* Remove */}
      <Button
        onClick={onRemove}
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
        aria-label="Supprimer cet effet"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default EffectRow;
