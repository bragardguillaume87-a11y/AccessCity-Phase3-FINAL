import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STAT_VARIABLES } from '@/i18n';
import type { StatEffect } from '@/types';

interface EffectRowProps {
  effect: StatEffect;
  onUpdate: (updates: Partial<StatEffect>) => void;
  onRemove: () => void;
}

const OPERATIONS: Array<{
  value: 'add' | 'set' | 'multiply';
  symbol: string;
  tooltip: string;
}> = [
  { value: 'add', symbol: '+', tooltip: 'Ajouter (ex : Physique + 10)' },
  { value: 'set', symbol: '=', tooltip: 'Fixer (ex : Physique = 50)' },
  { value: 'multiply', symbol: '×', tooltip: 'Multiplier (ex : Physique × 0.5)' },
];

function getValueColor(op: string, value: number): string {
  if (op === 'set') return 'var(--accent-blue)';
  if (op === 'multiply') return value >= 1 ? 'var(--color-success)' : 'var(--color-danger)';
  return value >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
}

function getPreviewLabel(effect: StatEffect): string {
  const varLabel =
    STAT_VARIABLES.find((v) => v.value === effect.variable)?.label ?? effect.variable;
  const sym = OPERATIONS.find((o) => o.value === effect.operation)?.symbol ?? effect.operation;
  return `${varLabel} ${sym} ${effect.value}`;
}

export function EffectRow({ effect, onUpdate, onRemove }: EffectRowProps) {
  const valueColor = getValueColor(effect.operation, effect.value);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex flex-col gap-1 bg-background rounded-lg border p-2"
        style={{ borderColor: 'var(--color-border-base)' }}
      >
        {/* Ligne principale */}
        <div className="flex items-center gap-1.5">
          {/* Variable */}
          <Select value={effect.variable} onValueChange={(value) => onUpdate({ variable: value })}>
            <SelectTrigger className="flex-1 min-w-0 text-xs h-8">
              <SelectValue placeholder="Stat…" />
            </SelectTrigger>
            <SelectContent>
              {STAT_VARIABLES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Opération — 3 boutons toggle compacts */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {OPERATIONS.map((op) => (
              <Tooltip key={op.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onUpdate({ operation: op.value })}
                    style={{
                      width: '1.75rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${effect.operation === op.value ? 'var(--accent-purple)' : 'var(--color-border-base)'}`,
                      background:
                        effect.operation === op.value ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color:
                        effect.operation === op.value
                          ? 'var(--accent-purple)'
                          : 'var(--color-text-muted)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      fontFamily: 'var(--font-family-mono)',
                    }}
                    aria-pressed={effect.operation === op.value}
                    aria-label={op.tooltip}
                  >
                    {op.symbol}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {op.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Valeur — couleur verte/rouge selon signe */}
          <Tooltip>
            <TooltipTrigger asChild>
              <input
                type="number"
                value={effect.value}
                onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                style={{
                  width: '3.25rem',
                  flexShrink: 0,
                  padding: '0 var(--space-2)',
                  height: '2rem',
                  background: 'var(--color-bg-base)',
                  border: `1px solid ${valueColor}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-xs)',
                  color: valueColor,
                  textAlign: 'center',
                  fontWeight: 600,
                  transition: 'var(--transition-fast)',
                  outline: 'none',
                }}
                aria-label="Valeur de l'effet"
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Positif = gain · Négatif = perte
            </TooltipContent>
          </Tooltip>

          {/* Supprimer */}
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
            aria-label="Supprimer cet effet"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Aperçu live — style Nintendo : résultat immédiat, lisible en un coup d'œil */}
        <div
          style={{
            fontSize: '0.6875rem',
            color: valueColor,
            fontWeight: 600,
            paddingLeft: 'var(--space-1)',
            opacity: 0.85,
            letterSpacing: '0.02em',
          }}
          aria-live="polite"
          aria-label={`Effet : ${getPreviewLabel(effect)}`}
        >
          → {getPreviewLabel(effect)}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default EffectRow;
