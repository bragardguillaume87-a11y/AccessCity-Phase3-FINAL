import * as React from 'react';
import type { Character, Scene } from '@/types';
import type { SelectedElementType } from '@/types';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator } from '../../../ui/AutoSaveIndicator';
import { AvatarPicker } from '../../../tabs/characters/components/AvatarPicker';
import { useMoodManagement } from '@/hooks/useMoodManagement';
import { Copy, Plus } from 'lucide-react';
import { SYSTEM_CHARACTERS } from '@/config/constants';

export interface CharacterPropertiesFormProps {
  character: Character;
  characters: Character[];
  selectedElement: SelectedElementType;
  scenes: Scene[];
  onUpdate: (character: Character) => void;
  onDuplicate: () => void;
  lastSaved?: number;
  isSaving?: boolean;
}

/**
 * CharacterPropertiesForm - Edit character properties
 *
 * Displays and allows editing of:
 * - Name
 * - Description
 * - Moods (with add/remove)
 * - Sprites (AvatarPicker for each mood)
 * - Usage statistics
 * - Duplicate button
 */
export function CharacterPropertiesForm({
  character,
  characters,
  selectedElement,
  scenes,
  onUpdate,
  onDuplicate,
  lastSaved,
  isSaving
}: CharacterPropertiesFormProps) {
  const isSystemCharacter = (SYSTEM_CHARACTERS as readonly string[]).includes(character.id);

  // Calculate usage statistics
  const appearancesCount = scenes.filter(scene =>
    scene.dialogues?.some(d => d.speaker === character.id)
  ).length;
  const linesCount = scenes.reduce((total, scene) => {
    const sceneLines = scene.dialogues?.filter(d => d.speaker === character.id).length || 0;
    return total + sceneLines;
  }, 0);

  // Mood management
  const {
    newMood,
    setNewMood,
    activeMood,
    setActiveMood,
    moodError,
    setMoodError,
    handleAddMood,
    handleRemoveMood
  } = useMoodManagement({
    character,
    characters,
    selectedElement,
    updateCharacter: onUpdate
  });

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header with duplicate button */}
      <div className="flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Character Properties</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          title="Duplicate this character"
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* System character badge */}
        {isSystemCharacter && (
          <div className="px-3 py-2 bg-amber-900/30 border border-amber-600 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">System Character (Protected)</span>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="char-name" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Name
          </label>
          <input
            id="char-name"
            type="text"
            value={character.name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ ...character, name: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Character name"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="char-description" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Description
          </label>
          <textarea
            id="char-description"
            value={character.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ ...character, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe the character"
          />
        </div>

        {/* Moods (editable) */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Moods
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {(character.moods || ['neutral']).map((mood) => (
                <div
                  key={mood}
                  className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all ${
                    activeMood === mood
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setActiveMood(mood)}
                >
                  <span className="text-xs font-medium">{mood}</span>
                  {mood !== 'neutral' && (
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleRemoveMood(mood);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                      title="Remove mood"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add mood */}
            <div className="space-y-1">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newMood}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setNewMood(e.target.value);
                    setMoodError(''); // Clear error on type
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddMood()}
                  placeholder="Add mood (e.g., happy, angry)"
                  className={`flex-1 px-2 py-1 bg-background border rounded text-xs text-white placeholder-muted-foreground focus:outline-none focus:ring-1 transition-colors ${
                    moodError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:ring-blue-500'
                  }`}
                  aria-invalid={!!moodError}
                  aria-describedby={moodError ? "mood-error" : undefined}
                />
                <Button
                  variant="gaming-success"
                  size="sm"
                  onClick={handleAddMood}
                  disabled={!newMood.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {moodError && (
                <p id="mood-error" className="text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {moodError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sprites (with AvatarPicker) */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Avatar for "{activeMood}"
          </label>
          <AvatarPicker
            currentSprites={character.sprites || {}}
            onSelect={(mood: string, url: string) => {
              onUpdate({
                ...character,
                sprites: { ...(character.sprites || {}), [mood]: url }
              });
            }}
            mood={activeMood}
            labels={{}}
          />
        </div>

        {/* Usage Statistics */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Usage Statistics</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Appears in scenes:</span>
              <span className="text-foreground font-semibold">{appearancesCount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Total lines:</span>
              <span className="text-foreground font-semibold">{linesCount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Moods defined:</span>
              <span className="text-foreground font-semibold">{(character.moods || []).length}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sprites assigned:</span>
              <span className="text-foreground font-semibold">
                {Object.values(character.sprites || {}).filter(Boolean).length} / {(character.moods || []).length}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Info</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Character ID:</span>
              <span className="text-foreground font-mono text-[10px]">{character.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <AutoSaveIndicator lastSaved={lastSaved ? new Date(lastSaved) : null} isSaving={isSaving} />
      </div>
    </div>
  );
}
