import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Package } from 'lucide-react';
import type { MoodPreset } from '@/types';

/**
 * Props for MoodAddInput component
 */
export interface MoodAddInputProps {
  /** Callback when a mood is added (returns true if successful) */
  onAddMood: (moodName: string) => boolean;
  /** Available mood presets */
  moodPresets: MoodPreset[];
  /** Currently existing moods (to disable already added presets) */
  existingMoods: string[];
}

/**
 * MoodAddInput - Input for adding new moods with preset selector
 *
 * Manages its own local state for input value and preset popover.
 * Extracted from MoodManagementSection for better maintainability.
 */
export function MoodAddInput({
  onAddMood,
  moodPresets,
  existingMoods
}: MoodAddInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const handleAddCustomMood = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      const success = onAddMood(trimmed);
      if (success) {
        setInputValue('');
      }
    }
  };

  const handleAddPresetMood = (presetId: string) => {
    onAddMood(presetId);
    setShowPresets(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomMood();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nom de l'humeur (ex: joyeux, triste...)"
        className="flex-1 transition-all focus-visible:ring-primary"
      />
      <Button
        type="button"
        onClick={handleAddCustomMood}
        disabled={!inputValue.trim()}
        size="default"
        className="transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter
      </Button>
      <Popover open={showPresets} onOpenChange={setShowPresets}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <Package className="h-4 w-4 mr-2" />
            Presets
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4">
            <h4 className="font-semibold mb-3">Humeurs prédéfinies</h4>
            <div className="grid grid-cols-2 gap-2">
              {moodPresets.map(preset => {
                const isAlreadyAdded = existingMoods.includes(preset.id);
                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isAlreadyAdded ? "secondary" : "outline"}
                    onClick={() => handleAddPresetMood(preset.id)}
                    disabled={isAlreadyAdded}
                    className="justify-start h-auto py-2 transition-transform hover:scale-105 active:scale-95"
                    title={preset.description}
                  >
                    <span className="text-lg mr-2">{preset.emoji}</span>
                    <span className="text-sm">{preset.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MoodAddInput;
