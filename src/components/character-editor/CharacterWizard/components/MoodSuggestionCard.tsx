
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MoodPreset } from '@/types';

interface MoodSuggestionCardProps {
  preset: MoodPreset;
  isAdded: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

/**
 * MoodSuggestionCard - Large, touchable mood preset card
 *
 * Kid-friendly card (44px+ height) with emoji, label, and
 * tap-to-add/remove interaction.
 */
export function MoodSuggestionCard({
  preset,
  isAdded,
  onAdd,
  onRemove
}: MoodSuggestionCardProps) {
  const handleClick = () => {
    if (isAdded) {
      onRemove();
    } else {
      onAdd();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 touch-target-large",
        "hover:scale-[1.02] active:scale-[0.98]",
        isAdded
          ? "bg-primary/10 border-primary text-foreground"
          : "bg-card border-border hover:border-primary/50 text-foreground"
      )}
    >
      {/* Emoji */}
      <span className="text-2xl">{preset.emoji}</span>

      {/* Label only (compact) */}
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{preset.label}</div>
      </div>

      {/* Status icon */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0",
          isAdded
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isAdded ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </div>
    </button>
  );
}

export default MoodSuggestionCard;
