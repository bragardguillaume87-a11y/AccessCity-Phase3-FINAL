import React, { useState } from 'react';
import { AvatarPicker } from '../../../tabs/characters/components/AvatarPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertCircle,
  X,
  Edit2,
  Check,
  Image as ImageIcon
} from 'lucide-react';

/**
 * Props for MoodListItem component
 */
export interface MoodListItemProps {
  /** Mood name */
  mood: string;
  /** Whether this mood has an assigned sprite */
  hasSprite: boolean;
  /** All current sprites (for AvatarPicker) */
  sprites: Record<string, string>;
  /** Whether this is the only mood (can't delete) */
  isOnlyMood: boolean;
  /** Callback to remove this mood */
  onRemove: () => void;
  /** Callback to rename this mood */
  onRename: (newName: string) => void;
  /** Callback to update sprite */
  onUpdateSprite: (spritePath: string) => void;
}

/**
 * MoodListItem - Individual mood card with rename and sprite assignment
 *
 * Extracted from MoodManagementSection for better maintainability.
 * Manages its own rename and sprite picker state locally.
 */
export function MoodListItem({
  mood,
  hasSprite,
  sprites,
  isOnlyMood,
  onRemove,
  onRename,
  onUpdateSprite
}: MoodListItemProps) {
  // Local state for rename mode
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState(mood);

  // Local state for sprite picker
  const [showSpritePicker, setShowSpritePicker] = useState(false);

  const handleStartRename = () => {
    setRenameInput(mood);
    setIsRenaming(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameInput.trim();
    if (trimmed && trimmed !== mood) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setRenameInput(mood);
    setIsRenaming(false);
  };

  const handleSpriteSelect = (_mood: string, spritePath: string) => {
    onUpdateSprite(spritePath);
    setShowSpritePicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    if (e.key === 'Escape') handleCancelRename();
  };

  return (
    <Card
      className={`group transition-all duration-200 ${
        hasSprite
          ? 'border-accent/50 bg-accent/5 hover:bg-accent/10'
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
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRename}
              variant="default"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCancelRename}
              variant="outline"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Normal display
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={handleStartRename}
                className="font-semibold cursor-pointer hover:text-primary transition-colors flex items-center gap-2 text-left"
                title="Cliquer pour renommer"
              >
                {mood}
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
              <Badge
                variant={hasSprite ? "default" : "secondary"}
                className="text-xs"
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
              <Popover open={showSpritePicker} onOpenChange={setShowSpritePicker}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="transition-transform hover:scale-105 active:scale-95"
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                    {hasSprite ? 'Changer' : 'Assigner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="end" side="left">
                  <div className="max-h-[400px] overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        Sélectionner un sprite pour: <span className="text-primary">{mood}</span>
                      </h4>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowSpritePicker(false)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Fermer"
                      >
                        <X className="h-4 w-4" />
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

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onRemove}
                disabled={isOnlyMood}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-transform hover:scale-105 active:scale-95"
                title={isOnlyMood ? "Impossible de supprimer la dernière humeur" : "Supprimer"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MoodListItem;
