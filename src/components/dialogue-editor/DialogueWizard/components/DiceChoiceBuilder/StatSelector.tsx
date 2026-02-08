import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GAME_STATS } from '@/i18n';

interface StatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const STATS = [
  { value: GAME_STATS.EMPATHY, label: 'Empathie', emoji: '💗', description: 'Comprendre les autres' },
  { value: GAME_STATS.AUTONOMY, label: 'Autonomie', emoji: '🦅', description: 'Se débrouiller seul' },
  { value: GAME_STATS.CONFIDENCE, label: 'Confiance', emoji: '💪', description: 'Croire en soi' },
];

export function StatSelector({ value, onChange }: StatSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">Caractéristique testée</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder="Choisir une stat" />
        </SelectTrigger>
        <SelectContent>
          {STATS.map((stat) => (
            <SelectItem key={stat.value} value={stat.value} className="py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{stat.emoji}</span>
                <div>
                  <span className="font-medium">{stat.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{stat.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default StatSelector;
