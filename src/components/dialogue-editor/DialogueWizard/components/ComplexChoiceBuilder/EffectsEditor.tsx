
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GAME_STATS } from '@/i18n';
import type { Effect } from '@/types';
import { EffectRow } from './EffectRow';

interface EffectsEditorProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
}

export function EffectsEditor({ effects, onChange }: EffectsEditorProps) {
  const handleAddEffect = () => {
    const newEffect: Effect = { variable: GAME_STATS.PHYSIQUE, operation: 'add', value: 5 };
    onChange([...effects, newEffect]);
  };

  const handleRemoveEffect = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  const handleUpdateEffect = (index: number, updates: Partial<Effect>) => {
    onChange(effects.map((effect, i) => i === index ? { ...effect, ...updates } : effect));
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
              Modifie une variable du jeu quand le joueur choisit cette option (ex : +10 Corps, −5 Esprit).
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
            {effects.map((effect, index) => (
              <EffectRow
                key={index}
                effect={effect}
                onUpdate={(updates) => handleUpdateEffect(index, updates)}
                onRemove={() => handleRemoveEffect(index)}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default EffectsEditor;
