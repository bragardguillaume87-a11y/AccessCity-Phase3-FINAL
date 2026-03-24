import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GAME_STATS } from '@/i18n';
import type { Effect, StatEffect } from '@/types';
import { EffectRow } from './EffectRow';

interface EffectsEditorProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
}

function isStatEffect(e: Effect): e is StatEffect {
  return 'variable' in e;
}

export function EffectsEditor({ effects, onChange }: EffectsEditorProps) {
  const handleAddEffect = () => {
    const newEffect: StatEffect = { variable: GAME_STATS.PHYSIQUE, operation: 'add', value: 5 };
    onChange([...effects, newEffect]);
  };

  const handleRemoveEffect = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  const handleUpdateEffect = (index: number, updates: Partial<StatEffect>) => {
    onChange(
      effects.map((effect, i) => (i === index ? ({ ...effect, ...updates } as StatEffect) : effect))
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-2 border-dashed border-border rounded-xl p-3 bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h5 className="text-sm font-semibold flex items-center gap-2 cursor-help">
                <Zap className="w-4 h-4 text-amber-500" />
                Effets
              </h5>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs max-w-[200px]">
              Modifie une variable du jeu quand le joueur choisit cette option (ex : +10 Physique,
              −5 Mentale).
            </TooltipContent>
          </Tooltip>
          <Button onClick={handleAddEffect} variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Ajouter
          </Button>
        </div>

        {effects.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Aucun effet — ce choix n'impacte pas le jeu.
          </p>
        ) : (
          <div className="space-y-2">
            {effects.reduce<React.ReactNode[]>((acc, effect, originalIndex) => {
              if (!isStatEffect(effect)) return acc;
              acc.push(
                <EffectRow
                  key={originalIndex}
                  effect={effect}
                  onUpdate={(updates) => handleUpdateEffect(originalIndex, updates)}
                  onRemove={() => handleRemoveEffect(originalIndex)}
                />
              );
              return acc;
            }, [])}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default EffectsEditor;
