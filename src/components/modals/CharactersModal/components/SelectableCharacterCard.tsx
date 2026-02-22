import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';

/**
 * Props for SelectableCharacterCard component
 */
export interface SelectableCharacterCardProps {
  /** Character to display */
  character: Character;
  /** Character statistics */
  stats: CharacterStats;
  /** Whether this character is selected */
  isSelected: boolean;
  /** Callback when selection is toggled */
  onToggle: () => void;
  /** Optional usage badge text (e.g., "Utilisé dans 3 scènes") */
  usageBadge?: string;
}

/**
 * Get preview image URL for character
 * Returns first available sprite or undefined
 */
function getPreviewImage(character: Character): string | undefined {
  if (!character.sprites || !character.moods || character.moods.length === 0) {
    return undefined;
  }

  // Try to find sprite for first mood
  const firstMood = character.moods[0];
  return character.sprites[firstMood];
}

/**
 * SelectableCharacterCard - Selectable character card for Management tab
 *
 * Pattern: Exact copy of AssetsLibraryModal SelectableAssetCard pattern
 *
 * Card with checkbox for bulk selection in Management tab. Uses label wrapper
 * to prevent event propagation issues.
 *
 * Features:
 * - Checkbox selection: Top-left, white bg with shadow
 * - Selection ring: Blue ring when selected
 * - Selection overlay: Subtle blue tint when selected
 * - Completeness badge: Bottom-left corner
 * - Usage badge: Shows if character is used in scenes
 * - Preview image: First sprite or Users icon fallback
 * - Label wrapper: Prevents click event issues with checkbox
 */
export function SelectableCharacterCard({
  character,
  stats,
  isSelected,
  onToggle,
  usageBadge,
}: SelectableCharacterCardProps) {
  const previewImage = getPreviewImage(character);

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-150 bg-slate-800/50 border ${
        isSelected
          ? 'ring-2 ring-primary border-primary/50 bg-primary/5'
          : 'border-slate-700/50 hover:border-slate-600'
      }`}
    >
      {/* Label wrapper prevents event propagation issues */}
      <label htmlFor={`select-character-${character.id}`} className="block cursor-pointer">
        {/* Preview Image Section - Compact */}
        <div className="relative aspect-[4/3] bg-black/20 overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt={character.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
              <Users className="h-8 w-8 text-slate-600" />
            </div>
          )}

          {/* Checkbox (Top-Left) - Dark theme */}
          <div className="absolute top-1.5 left-1.5 bg-slate-900/80 rounded p-0.5 shadow">
            <Checkbox
              id={`select-character-${character.id}`}
              checked={isSelected}
              onCheckedChange={onToggle}
              className="h-4 w-4 border-slate-500"
              aria-label={`Sélectionner ${character.name}`}
            />
          </div>

          {/* Completeness Badge (Top-Right) - Compact */}
          <div className="absolute top-1.5 right-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] h-4 px-1 font-medium border ${
                stats.completeness === 100
                  ? 'bg-green-900/80 border-green-700 text-green-300'
                  : stats.hasErrors
                  ? 'bg-red-900/80 border-red-700 text-red-300'
                  : stats.hasWarnings
                  ? 'bg-yellow-900/80 border-yellow-700 text-yellow-300'
                  : 'bg-slate-900/80 border-slate-600 text-slate-300'
              }`}
            >
              {stats.completeness}%
            </Badge>
          </div>

          {/* Usage Badge (Bottom-Right) */}
          {usageBadge && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-900/80 border-blue-700 text-blue-300">
                {usageBadge}
              </Badge>
            </div>
          )}
        </div>

        {/* Footer: Name + Stats - Compact */}
        <div className="p-2 space-y-0.5">
          <h3 className="font-medium text-xs text-slate-200 truncate" title={character.name}>
            {character.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span>{stats.moodCount}h</span>
            <span>•</span>
            <span>{stats.spriteCount}s</span>
          </div>
        </div>
      </label>
    </div>
  );
}

export default SelectableCharacterCard;
