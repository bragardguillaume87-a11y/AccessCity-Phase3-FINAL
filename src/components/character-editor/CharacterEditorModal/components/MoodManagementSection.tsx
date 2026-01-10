import React from 'react';
import { AvatarPicker } from '../../../tabs/characters/components/AvatarPicker.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertCircle,
  Plus,
  X,
  Edit2,
  Check,
  Image as ImageIcon,
  Smile,
  Package
} from 'lucide-react';
import type { MoodPreset } from '@/types';

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
  /** Mood currently being renamed (null if not renaming) */
  renamingMood: string | null;
  /** Rename input value */
  renameInput: string;
  /** Callback to update rename input */
  setRenameInput: (value: string) => void;
  /** Callback to start renaming a mood */
  startRename: (moodName: string) => void;
  /** Callback to confirm rename */
  confirmRename: () => void;
  /** Callback to cancel rename */
  cancelRename: () => void;
  /** Mood name for which sprite picker is shown (null if hidden) */
  showSpritePickerFor: string | null;
  /** Callback to show/hide sprite picker */
  setShowSpritePickerFor: (mood: string | null) => void;
  /** Array of preset moods */
  moodPresets: MoodPreset[];
  /** New mood input value */
  newMoodInput: string;
  /** Callback to update new mood input */
  setNewMoodInput: (value: string) => void;
  /** Whether preset popover is shown */
  showPresets: boolean;
  /** Callback to toggle preset popover */
  setShowPresets: (show: boolean) => void;
}

/**
 * MoodManagementSection - Mood and Sprite Management Interface
 *
 * Comprehensive mood management section with:
 * - Add custom mood input and preset selector
 * - Mood list with inline sprite assignment (popover)
 * - Rename functionality with inline editing
 * - Delete mood capability
 * - Visual feedback for sprite assignment status
 *
 * Includes Nintendo-style UX with smooth transitions and hover effects.
 *
 * @example
 * ```tsx
 * <MoodManagementSection
 *   formData={{ moods: ['neutral', 'happy'], sprites: { neutral: 'url1.png' } }}
 *   errors={{}}
 *   onAddMood={(mood) => addMood(mood)}
 *   // ... other props
 * />
 * ```
 */
export default function MoodManagementSection({
  formData,
  errors,
  warnings,
  onAddMood,
  onRemoveMood,
  onRenameMood,
  onUpdateSprite,
  renamingMood,
  renameInput,
  setRenameInput,
  startRename,
  confirmRename,
  cancelRename,
  showSpritePickerFor,
  setShowSpritePickerFor,
  moodPresets,
  newMoodInput,
  setNewMoodInput,
  showPresets,
  setShowPresets
}: MoodManagementSectionProps) {
  const { moods, sprites } = formData;

  const handleAddCustomMood = () => {
    if (newMoodInput.trim()) {
      const success = onAddMood(newMoodInput.trim());
      if (success) {
        setNewMoodInput('');
      }
    }
  };

  const handleAddPresetMood = (presetId: string) => {
    onAddMood(presetId);
    setShowPresets(false);
  };

  const handleSpriteSelect = (mood: string, spritePath: string) => {
    onUpdateSprite(mood, spritePath);
    setShowSpritePickerFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-lg font-semibold">Humeurs & Sprites</h3>
        </div>
        <Badge variant="outline" className="transition-all hover:scale-105 duration-200">
          {moods.length} humeur{moods.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Info card */}
      <Card className="bg-primary/5 border-primary/20 transition-all hover:bg-primary/10 duration-200">
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
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMoodInput}
            onChange={(e) => setNewMoodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMood()}
            placeholder="Nom de l'humeur (ex: joyeux, triste...)"
            className="flex-1 transition-all duration-200 focus-visible:ring-primary"
          />
          <Button
            type="button"
            onClick={handleAddCustomMood}
            disabled={!newMoodInput.trim()}
            size="default"
            className="transition-transform hover:scale-105 active:scale-95 duration-200"
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
                className="transition-transform hover:scale-105 active:scale-95 duration-200"
              >
                <Package className="h-4 w-4 mr-2" />
                Presets
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <h4 className="font-semibold mb-3">Humeurs prédéfinies</h4>
                <div className="grid grid-cols-2 gap-2">
                  {moodPresets.map(preset => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant={moods.includes(preset.id) ? "secondary" : "outline"}
                      onClick={() => handleAddPresetMood(preset.id)}
                      disabled={moods.includes(preset.id)}
                      className="justify-start h-auto py-2 transition-transform hover:scale-105 active:scale-95 duration-200"
                      title={preset.description}
                    >
                      <span className="text-lg mr-2">{preset.emoji}</span>
                      <span className="text-sm">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {errors.moods && (
          <Alert variant="destructive" className="py-2 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.moods[0]}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Moods list */}
      {moods.length === 0 ? (
        <Card className="border-dashed transition-all hover:border-primary/50 duration-200">
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
          {moods.map((mood) => {
            const hasSprite = sprites && sprites[mood];
            const isRenaming = renamingMood === mood;

            return (
              <Card
                key={mood}
                className={`group transition-all duration-200 ${
                  hasSprite
                    ? 'border-green-500/50 bg-green-500/5 hover:bg-green-500/10'
                    : 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
              >
                <CardContent className="p-4">
                  {isRenaming ? (
                    // Rename mode
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={confirmRename}
                        variant="default"
                        className="transition-transform hover:scale-105 active:scale-95 duration-200"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={cancelRename}
                        variant="outline"
                        className="transition-transform hover:scale-105 active:scale-95 duration-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    // Normal display
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          onClick={() => startRename(mood)}
                          className="font-semibold cursor-pointer hover:text-primary transition-all duration-200 flex items-center gap-2"
                          title="Cliquer pour renommer"
                        >
                          {mood}
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
                        </div>
                        <Badge
                          variant={hasSprite ? "default" : "secondary"}
                          className="text-xs transition-all hover:scale-105 duration-200"
                        >
                          {hasSprite ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Sprite
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pas de sprite
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        {/* Sprite Picker Popover */}
                        <Popover
                          open={showSpritePickerFor === mood}
                          onOpenChange={(open) => setShowSpritePickerFor(open ? mood : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="transition-transform hover:scale-105 active:scale-95 duration-200"
                            >
                              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                              {hasSprite ? 'Changer' : 'Assigner'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[600px] p-0" align="end" side="left">
                            <div className="max-h-[400px] overflow-y-auto p-4">
                              <h4 className="font-semibold mb-3">
                                Sélectionner un sprite pour: <span className="text-primary">{mood}</span>
                              </h4>
                              <AvatarPicker
                                currentSprites={sprites || {}}
                                onSelect={(m, path) => handleSpriteSelect(m, path)}
                                mood={mood}
                                labels={{}}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveMood(mood)}
                          disabled={moods.length === 1}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-transform hover:scale-105 active:scale-95 duration-200"
                          title={moods.length === 1 ? "Impossible de supprimer la dernière humeur" : "Supprimer"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Warning for missing sprites */}
      {warnings?.sprites && (
        <Alert variant="default" className="bg-amber-500/10 border-amber-500/50 animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-400">
            {warnings.sprites[0]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
