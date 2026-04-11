import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAT_VARIABLES } from '@/i18n';
import type { Condition } from '@/types';

interface ConditionRowProps {
  condition: Condition;
  onUpdate: (updates: Partial<Condition>) => void;
  onRemove: () => void;
}

type ConditionOperator = Condition['operator'];

const OPERATORS: Array<{ value: ConditionOperator; label: string; tooltip: string }> = [
  { value: '>=', label: '≥', tooltip: 'Supérieur ou égal' },
  { value: '<=', label: '≤', tooltip: 'Inférieur ou égal' },
  { value: '>', label: '>', tooltip: 'Strictement supérieur' },
  { value: '<', label: '<', tooltip: 'Strictement inférieur' },
  { value: '==', label: '=', tooltip: 'Égal à' },
  { value: '!=', label: '≠', tooltip: 'Différent de' },
];

const VARIABLES = STAT_VARIABLES;

export function ConditionRow({ condition, onUpdate, onRemove }: ConditionRowProps) {
  return (
    <div
      className="flex items-center gap-1.5 bg-background rounded-lg border p-2"
      style={{ borderColor: 'var(--color-border-base)' }}
    >
      {/* Variable */}
      <Select value={condition.variable} onValueChange={(value) => onUpdate({ variable: value })}>
        <SelectTrigger className="flex-1 min-w-0 text-xs h-8">
          <SelectValue placeholder="Variable…" />
        </SelectTrigger>
        <SelectContent>
          {VARIABLES.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Opérateur */}
      <Select
        value={condition.operator}
        onValueChange={(value) => onUpdate({ operator: value as ConditionOperator })}
      >
        <SelectTrigger className="w-14 text-xs h-8 font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value} title={op.tooltip}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Valeur */}
      <input
        type="number"
        value={condition.value}
        onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
        placeholder="0"
        style={{
          width: '3.25rem',
          flexShrink: 0,
          padding: '0 var(--space-2)',
          height: '2rem',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-base)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-primary)',
          textAlign: 'center',
          fontWeight: 600,
          outline: 'none',
        }}
        aria-label="Valeur de la condition"
      />

      {/* Supprimer */}
      <Button
        onClick={onRemove}
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
        aria-label="Supprimer cette condition"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default ConditionRow;
