
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAME_STATS } from '@/i18n';
import type { Effect } from '@/types';
import { EffectRow } from './EffectRow';

interface EffectsEditorProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
}

export function EffectsEditor({ effects, onChange }: EffectsEditorProps) {
  const handleAddEffect = () => {
    const newEffect: Effect = {
      variable: GAME_STATS.PHYSIQUE,
      operation: 'add',
      value: 5,
    };
    onChange([...effects, newEffect]);
  };

  const handleRemoveEffect = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  const handleUpdateEffect = (index: number, updates: Partial<Effect>) => {
    onChange(
      effects.map((effect, i) =>
        i === index ? { ...effect, ...updates } : effect
      )
    );
  };

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Effets (optionnel)
        </h5>
        <Button onClick={handleAddEffect} variant="ghost" size="sm" className="h-8 text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Ajouter
        </Button>
      </div>

      {effects.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          Aucun effet. Ce choix ne modifie aucune variable du jeu.
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
  );
}

export default EffectsEditor;
