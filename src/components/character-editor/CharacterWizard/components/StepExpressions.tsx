import { useEffect, useState } from 'react';
import { Smile, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMoodPresets } from '@/hooks/useMoodPresets';
import { AvatarPicker } from '@/components/tabs/characters/components/AvatarPicker';
import { cn } from '@/lib/utils';
import MoodSuggestionCard from './MoodSuggestionCard';
import EncouragingMessage from './EncouragingMessage';

interface StepExpressionsProps {
  moods: string[];
  sprites: Record<string, string>;
  onAddMood: (mood: string) => boolean;
  onRemoveMood: (mood: string) => void;
  onUpdateSprite: (mood: string, path: string) => void;
  onValidChange: (isValid: boolean) => void;
}

// Recommended moods for kids (subset of all presets)
const RECOMMENDED_MOOD_IDS = ['happy', 'sad', 'angry', 'surprised', 'excited', 'scared'];

/**
 * StepExpressions - Step 3: Add moods/expressions
 *
 * Kid-friendly mood selector with recommended presets
 * and optional custom mood input.
 */
export function StepExpressions({
  moods,
  sprites,
  onAddMood,
  onRemoveMood,
  onUpdateSprite,
  onValidChange
}: StepExpressionsProps) {
  const allPresets = useMoodPresets();
  const recommendedPresets = allPresets.filter(p => RECOMMENDED_MOOD_IDS.includes(p.id));

  const [customMood, setCustomMood] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [openSpritePicker, setOpenSpritePicker] = useState<string | null>(null);

  // Validation - at least 1 mood
  const isValid = moods.length >= 1;

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  const handleAddCustomMood = () => {
    if (customMood.trim()) {
      const success = onAddMood(customMood.trim().toLowerCase());
      if (success) {
        setCustomMood('');
        setShowCustomInput(false);
      }
    }
  };

  const handleSpriteSelect = (mood: string, path: string) => {
    onUpdateSprite(mood, path);
    setOpenSpritePicker(null);
  };

  // Count assigned sprites
  const assignedCount = moods.filter(m => sprites[m]).length;

  return (
    <div className="space-y-4 animate-step-slide">
      {/* Header + Stats in one row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smile className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">
            Ajoute des expressions
          </h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {moods.length} humeur{moods.length > 1 ? 's' : ''}
          </Badge>
          <Badge
            variant={assignedCount === moods.length ? 'default' : 'outline'}
            className="text-xs px-2 py-0.5"
          >
            {assignedCount} / {moods.length} sprites
          </Badge>
        </div>
      </div>

      {/* Recommended moods grid - 3 columns, more compact */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Clique sur les humeurs que tu veux ajouter :
        </p>
        <div className="grid grid-cols-3 gap-2">
          {recommendedPresets.map(preset => (
            <MoodSuggestionCard
              key={preset.id}
              preset={preset}
              isAdded={moods.includes(preset.id)}
              onAdd={() => onAddMood(preset.id)}
              onRemove={() => onRemoveMood(preset.id)}
            />
          ))}
        </div>
      </div>

      {/* Custom mood input - smaller */}
      <div>
        {!showCustomInput ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            className="w-full h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Humeur personnalisée
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              type="text"
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              placeholder="Ex: curieux, timide..."
              className="h-10 flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMood()}
            />
            <Button
              type="button"
              onClick={handleAddCustomMood}
              disabled={!customMood.trim()}
              className="h-10 px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCustomInput(false);
                setCustomMood('');
              }}
              className="h-10 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Added moods with sprite assignment - compact */}
      {moods.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Tes humeurs :
          </p>
          <div className="space-y-1.5">
            {moods.map(mood => {
              const preset = allPresets.find(p => p.id === mood);
              const hasSprite = !!sprites[mood];

              return (
                <div
                  key={mood}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-all",
                    hasSprite
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-amber-500/10 border-amber-500/30"
                  )}
                >
                  {/* Emoji */}
                  <span className="text-xl">
                    {preset?.emoji || mood.charAt(0).toUpperCase()}
                  </span>

                  {/* Mood name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium capitalize truncate">{preset?.label || mood}</span>
                    {hasSprite && (
                      <span className="ml-1 text-xs text-green-400">✓</span>
                    )}
                  </div>

                  {/* Sprite preview */}
                  {hasSprite && (
                    <img
                      src={sprites[mood]}
                      alt={mood}
                      className="w-8 h-8 object-contain rounded bg-card flex-shrink-0"
                    />
                  )}

                  {/* Sprite picker */}
                  <Popover
                    open={openSpritePicker === mood}
                    onOpenChange={(open) => setOpenSpritePicker(open ? mood : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant={hasSprite ? 'outline' : 'secondary'}
                        className="h-8 px-2 text-xs"
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {hasSprite ? 'Changer' : 'Image'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="end" side="left">
                      <div className="p-3 max-h-[350px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">
                            Image : <span className="text-primary capitalize">{preset?.label || mood}</span>
                          </h4>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setOpenSpritePicker(null)}
                            className="h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <AvatarPicker
                          currentSprites={sprites}
                          onSelect={handleSpriteSelect}
                          mood={mood}
                          labels={{}}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Remove button */}
                  {moods.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveMood(mood)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper messages - only show one at a time */}
      {moods.length === 0 ? (
        <EncouragingMessage
          type="info"
          message="Ajoute au moins une humeur pour continuer !"
        />
      ) : assignedCount === moods.length ? (
        <EncouragingMessage
          type="success"
          message="Parfait ! Prêt pour la suite !"
        />
      ) : null}
    </div>
  );
}

export default StepExpressions;
