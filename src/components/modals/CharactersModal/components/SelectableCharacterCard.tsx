import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Users, Sparkles, Film, Eye } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';

/**
 * Props for SelectableCharacterCard component
 */
export interface SelectableCharacterCardProps {
  /** Character data to display */
  character: Character;
  /** Character statistics (completeness, mood count, sprite count) */
  stats: CharacterStats;
  /** Whether this character is selected */
  isSelected: boolean;
  /** Callback when selection is toggled */
  onToggle: () => void;
  /** Optional: usage badge text (e.g., "Utilisé dans 3 scènes") */
  usageBadge?: string;
}

/**
 * SelectableCharacterCard - Character card with selection checkbox for bulk operations
 *
 * Simplified version of CharacterCard designed for the Management tab where
 * users can select multiple characters for bulk operations (duplicate, delete).
 *
 * ## Features
 * - Checkbox overlay in top-left corner
 * - Visual selection ring (blue border) when selected
 * - Completeness badge showing sprite coverage
 * - Optional usage badge for used characters
 * - Stats display (moods and sprites)
 * - Hover effects and transitions
 *
 * ## Design Pattern
 * Follows Material Design 3 guidelines for multi-select cards:
 * - Prominent checkbox for clear selection affordance
 * - Visual feedback with border color change
 * - Entire card clickable to toggle selection
 * - Reduced complexity compared to full CharacterCard (no action buttons)
 *
 * @example
 * ```tsx
 * <SelectableCharacterCard
 *   character={character}
 *   stats={stats}
 *   isSelected={selection.isSelected(character.id)}
 *   onToggle={() => selection.toggleSelection(character.id)}
 *   usageBadge="Utilisé dans 2 scènes"
 * />
 * ```
 */
export function SelectableCharacterCard({
  character,
  stats,
  isSelected,
  onToggle,
  usageBadge,
}: SelectableCharacterCardProps) {
  return (
    <Card
      className={`
        group
        relative
        hover:shadow-lg
        transition-all
        duration-200
        cursor-pointer
        overflow-hidden
        ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2 shadow-md'
            : 'hover:-translate-y-0.5'
        }
      `}
      onClick={onToggle}
    >
      {/* Selection Checkbox Overlay */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className={`
            rounded-md
            bg-background/95
            backdrop-blur-sm
            shadow-lg
            p-1.5
            transition-all
            ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
          `}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={`Sélectionner ${character.name}`}
            className="h-5 w-5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="relative h-40 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden">
        {/* Avatar Preview */}
        {character.sprites?.neutral ? (
          <img
            src={character.sprites.neutral}
            alt={character.name}
            className="h-32 w-32 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Users className="h-12 w-12" />
          </div>
        )}

        {/* Completeness Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={stats.completeness === 100 ? 'default' : 'secondary'}
            className="shadow-lg text-xs"
          >
            {stats.completeness === 100 ? (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Complet
              </>
            ) : (
              `${stats.completeness}%`
            )}
          </Badge>
        </div>

        {/* Usage Badge (if provided) */}
        {usageBadge && (
          <div className="absolute bottom-3 left-3 right-3">
            <Badge
              variant="outline"
              className="shadow-md bg-background/90 backdrop-blur-sm text-xs w-full justify-center"
            >
              {usageBadge}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base truncate" title={character.name}>
          {character.name}
        </CardTitle>
        {character.description && (
          <CardDescription className="line-clamp-1 text-xs">
            {character.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{stats.moodCount}</span>
            <span className="text-muted-foreground">
              mood{stats.moodCount > 1 ? 's' : ''}
            </span>
          </div>
          <Separator orientation="vertical" className="h-3" />
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{stats.spriteCount}</span>
            <span className="text-muted-foreground">
              sprite{stats.spriteCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SelectableCharacterCard;
