
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Smile } from 'lucide-react';
import type { MoodPreset } from '@/types';

// Extracted components
import { MoodListItem } from './MoodListItem';
import { MoodAddInput } from './MoodAddInput';

/**
 * Mood management form data
 */
export interface MoodManagementFormData {
  /** List of mood names */
  moods: string[];
  /** Sprite assignments by mood */
  sprites?: Record<string, string>;
}

/**
 * Validation errors for mood management
 */
export interface MoodManagementErrors {
  /** Moods field errors */
  moods?: string[];
  /** Other field errors */
  [key: string]: string[] | undefined;
}

/**
 * Validation warnings for mood management
 */
export interface MoodManagementWarnings {
  /** Sprites warning (e.g., missing sprites) */
  sprites?: string[];
  /** Other warnings */
  [key: string]: string[] | undefined;
}

/**
 * Props for MoodManagementSection component
 *
 * REFACTORED: Reduced from 27 props to 8 props by extracting
 * MoodListItem and MoodAddInput components with local state.
 */
export interface MoodManagementSectionProps {
  /** Form data containing moods and sprites */
  formData: MoodManagementFormData;
  /** Validation errors */
  errors: MoodManagementErrors;
  /** Validation warnings */
  warnings?: MoodManagementWarnings;
  /** Callback to add a mood */
  onAddMood: (moodName: string) => boolean;
  /** Callback to remove a mood */
  onRemoveMood: (moodName: string) => void;
  /** Callback to rename a mood */
  onRenameMood: (oldMood: string, newMood: string) => void;
  /** Callback to update sprite for a mood */
  onUpdateSprite: (mood: string, spritePath: string) => void;
  /** Array of preset moods */
  moodPresets: MoodPreset[];
}

/**
 * MoodManagementSection - Mood and Sprite Management Interface
 *
 * REFACTORED (Phase 7): Reduced from 405 to ~130 lines (-68%)
 * - Extracted MoodListItem (handles rename + sprite picker locally)
 * - Extracted MoodAddInput (handles input + presets locally)
 * - Reduced props from 27 to 8
 *
 * Features:
 * - Add custom mood input and preset selector
 * - Mood list with inline sprite assignment
 * - Rename functionality with inline editing
 * - Delete mood capability
 * - Visual feedback for sprite assignment status
 */
export default function MoodManagementSection({
  formData,
  errors,
  warnings,
  onAddMood,
  onRemoveMood,
  onRenameMood,
  onUpdateSprite,
  moodPresets
}: MoodManagementSectionProps) {
  const { moods, sprites = {} } = formData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-lg font-semibold">Humeurs & Sprites</h3>
        </div>
        <Badge variant="outline" className="transition-all hover:scale-105">
          {moods.length} humeur{moods.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Info card */}
      <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Smile className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Astuce:</strong> Définissez les expressions émotionnelles
            de votre personnage, puis assignez un sprite à chaque humeur.
          </div>
        </CardContent>
      </Card>

      {/* Add mood section */}
      <div className="space-y-3">
        <MoodAddInput
          onAddMood={onAddMood}
          moodPresets={moodPresets}
          existingMoods={moods}
        />

        {errors.moods && (
          <Alert variant="destructive" className="py-2 animate-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.moods[0]}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Moods list */}
      {moods.length === 0 ? (
        <Card className="border-dashed transition-all hover:border-primary/50">
          <CardContent className="p-8 text-center">
            <Smile className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Aucune humeur définie</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez votre première humeur ci-dessus
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {moods.map((mood) => (
            <MoodListItem
              key={mood}
              mood={mood}
              hasSprite={!!sprites[mood]}
              sprites={sprites}
              isOnlyMood={moods.length === 1}
              onRemove={() => onRemoveMood(mood)}
              onRename={(newName) => onRenameMood(mood, newName)}
              onUpdateSprite={(path) => onUpdateSprite(mood, path)}
            />
          ))}
        </div>
      )}

      {/* Warning for missing sprites */}
      {warnings?.sprites && (
        <Alert variant="default" className="bg-amber-500/10 border-amber-500/50 animate-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-400">
            {warnings.sprites[0]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
