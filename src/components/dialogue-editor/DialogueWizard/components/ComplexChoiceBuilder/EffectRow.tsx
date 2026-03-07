
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GAME_STATS } from '@/i18n';
import type { Effect } from '@/types';

interface EffectRowProps {
  effect: Effect;
  onUpdate: (updates: Partial<Effect>) => void;
  onRemove: () => void;
}

const OPERATIONS = [
  { value: 'add'      as const, label: '+ Ajouter',   tooltip: 'Ajoute (ou soustrait) une valeur. Ex : Corps + 10' },
  { value: 'set'      as const, label: '= Fixer',     tooltip: 'Définit la valeur exactement. Ex : Corps = 50' },
  { value: 'multiply' as const, label: '× Multiplier', tooltip: 'Multiplie la valeur actuelle. Ex : Corps × 0.5' },
];

const VARIABLES = [
  { value: GAME_STATS.PHYSIQUE, label: '💪 Le Corps' },
  { value: GAME_STATS.MENTALE,  label: '🧠 L\'Esprit' },
];

export function EffectRow({ effect, onUpdate, onRemove }: EffectRowProps) {
  const currentOp = OPERATIONS.find(op => op.value === effect.operation);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-2 bg-background p-2 rounded-lg border">
        {/* Variable */}
        <Select
          value={effect.variable}
          onValueChange={(value) => onUpdate({ variable: value })}
        >
          <SelectTrigger className="flex-1 text-sm h-9">
            <SelectValue placeholder="Stat..." />
          </SelectTrigger>
          <SelectContent>
            {VARIABLES.map((v) => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operation — avec tooltip explicatif */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-32">
              <Select
                value={effect.operation}
                onValueChange={(value) =>
                  onUpdate({ operation: value as 'add' | 'set' | 'multiply' })
                }
              >
                <SelectTrigger className="w-full text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[180px]">
            {currentOp?.tooltip ?? ''}
          </TooltipContent>
        </Tooltip>

        {/* Value */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              type="number"
              value={effect.value}
              onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-20 text-sm h-9"
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Positif = gain · Négatif = perte
          </TooltipContent>
        </Tooltip>

        {/* Remove */}
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 flex-shrink-0"
          aria-label="Supprimer cet effet"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </TooltipProvider>
  );
}

export default EffectRow;
