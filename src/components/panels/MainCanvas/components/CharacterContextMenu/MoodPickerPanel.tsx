import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { useMoodPresets } from '@/hooks/useMoodPresets';

interface MoodPickerPanelProps {
  characterName: string;
  currentMood: string;
  characterSprites: Record<string, string>;
  availableMoods: string[];
  onSelect: (mood: string) => void;
  onBack: () => void;
}

/**
 * MoodPickerPanel - Visual mood selector
 *
 * Shows all available moods with emojis and optional sprite previews.
 * Large touch targets for kids (56px).
 */
export function MoodPickerPanel({
  characterName,
  currentMood,
  characterSprites,
  availableMoods,
  onSelect,
  onBack
}: MoodPickerPanelProps) {
  const moodPresets = useMoodPresets();

  // Combine preset moods with custom moods from character
  const moods = availableMoods.map(moodId => {
    const preset = moodPresets.find(p => p.id === moodId);
    return {
      id: moodId,
      emoji: preset?.emoji || moodId.charAt(0).toUpperCase(),
      label: preset?.label || moodId,
      hasSprite: !!characterSprites[moodId]
    };
  });

  return (
    <div className="animate-step-slide">
      {/* Header with back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('moodPicker.title', { name: characterName })}</span>
      </button>

      {/* Current mood indicator */}
      <div className="mb-3 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
        <span className="text-xs text-muted-foreground">{t('moodPicker.current')} :</span>
        <span className="ml-2 font-medium capitalize">
          {moodPresets.find(p => p.id === currentMood)?.label || currentMood}
        </span>
      </div>

      {/* Mood grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
        {moods.map(mood => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(mood.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "border-2",
              currentMood === mood.id
                ? "bg-primary/20 border-primary text-foreground"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            {/* Sprite or emoji */}
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {mood.hasSprite && characterSprites[mood.id] ? (
                <img
                  src={characterSprites[mood.id]}
                  alt={mood.label}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl">{mood.emoji}</span>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-sm capitalize truncate">{mood.label}</div>
              {!mood.hasSprite && (
                <div className="text-xs text-amber-500">Pas d'image</div>
              )}
            </div>

            {/* Check if selected */}
            {currentMood === mood.id && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MoodPickerPanel;
