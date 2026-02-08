import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface DifficultySliderProps {
  value: number;
  onChange: (value: number) => void;
}

function getDifficultyConfig(value: number) {
  if (value <= 5) return { label: 'Très facile', color: 'text-green-500', bg: 'bg-green-500' };
  if (value <= 8) return { label: 'Facile', color: 'text-emerald-500', bg: 'bg-emerald-500' };
  if (value <= 12) return { label: 'Moyen', color: 'text-amber-500', bg: 'bg-amber-500' };
  if (value <= 16) return { label: 'Difficile', color: 'text-orange-500', bg: 'bg-orange-500' };
  return { label: 'Très difficile', color: 'text-red-500', bg: 'bg-red-500' };
}

export function DifficultySlider({ value, onChange }: DifficultySliderProps) {
  const config = getDifficultyConfig(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Difficulté du test</Label>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold tabular-nums", config.color)}>
            {value}
          </span>
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full text-white",
            config.bg
          )}>
            {config.label}
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={1}
        max={20}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1 (auto-réussite)</span>
        <span>20 (quasi-impossible)</span>
      </div>
    </div>
  );
}

export default DifficultySlider;
