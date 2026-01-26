import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Sparkles,
  AlertCircle,
  Star,
  Film,
  Eye,
  Edit,
  Copy,
  Trash2
} from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';
import type { ViewMode } from './CharacterGallery';

/**
 * Validation error structure from useValidation hook
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Character validation errors with separated arrays
 */
export interface CharacterValidationErrors {
  /** All validation problems */
  errors?: ValidationError[];
  /** Only warning-level problems */
  warnings?: ValidationError[];
}

/**
 * Props for CharacterCard component
 */
export interface CharacterCardProps {
  /** Character data to display */
  character: Character;
  /** Character statistics (completeness, mood count, sprite count) */
  stats: CharacterStats;
  /** Validation errors for this character */
  errors?: ValidationError[];
  /** Whether this character is marked as favorite */
  isFavorite: boolean;
  /** Callback when favorite star is toggled */
  onToggleFavorite: (characterId: string) => void;
  /** Callback when edit button is clicked */
  onEdit: (character: Character) => void;
  /** Callback when duplicate button is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete button is clicked */
  onDelete: (character: Character) => void;
  /** View mode (grid or list) */
  viewMode?: ViewMode;
}

/**
 * CharacterCard - Individual character card display (grid or list mode)
 *
 * Displays a character with preview, stats, and action buttons. Supports both
 * grid and list view modes with appropriate layouts and interactions.
 *
 * Inspired by Nintendo UX Guide: Pokémon Card style with visual hierarchy
 *
 * ## Features
 * - Large avatar preview with fallback icon
 * - Completeness badge showing sprite coverage
 * - Error/warning indicator badge
 * - Favorite star toggle with localStorage persistence
 * - Stats display (moods and sprites)
 * - Quick action buttons (Edit, Duplicate, Delete)
 *
 * ## UX Enhancements
 * - Hover lift effect (translateY -4px + scale 1.05)
 * - Smooth transitions on all interactive elements
 * - Visual avatar preview with scale animation on hover
 * - Accessible buttons with ARIA labels
 * - Error and warning visual indicators
 *
 * @example
 * ```tsx
 * <CharacterCard
 *   character={character}
 *   stats={{ completeness: 100, moodCount: 5, spriteCount: 5, hasSpriteForAllMoods: true }}
 *   errors={validationErrors}
 *   isFavorite={false}
 *   onToggleFavorite={handleToggleFavorite}
 *   onEdit={handleEdit}
 *   onDuplicate={handleDuplicate}
 *   onDelete={handleDelete}
 *   viewMode="grid"
 * />
 * ```
 */
export function CharacterCard({
  character,
  stats,
  errors,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
  viewMode = 'grid'
}: CharacterCardProps) {
  const hasErrors = errors && errors.some(e => e.severity === 'error');
  const hasWarnings = errors && errors.some(e => e.severity === 'warning');

  return (
    <Card
      className={`
        group
        hover:shadow-xl
        transition-all
        duration-300
        ${viewMode === 'grid' ? 'hover:-translate-y-1 hover:scale-[1.02]' : ''}
        cursor-pointer
        overflow-hidden
      `}
      onClick={() => onEdit(character)}
    >
      {/* Preview Section */}
      <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden">
        {/* Avatar Preview */}
        {character.sprites?.neutral ? (
          <img
            src={character.sprites.neutral}
            alt={character.name}
            className="h-40 w-40 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="p-6 rounded-full bg-primary/10 text-primary">
            <Users className="h-16 w-16" />
          </div>
        )}

        {/* Completeness Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant={stats.completeness === 100 ? "default" : "secondary"}
            className="shadow-lg"
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

        {/* Error Badge + Favorite Star */}
        <div className="absolute top-3 left-3 flex gap-2">
          {(hasErrors || hasWarnings) && (
            <Badge
              variant={hasErrors ? "destructive" : "outline"}
              className="shadow-lg"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {hasErrors ? 'Erreur' : 'Attention'}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 hover:bg-background transition-transform hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(character.id);
            }}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                isFavorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl truncate" title={character.name}>
          {character.name}
        </CardTitle>
        {character.description && (
          <CardDescription className="line-clamp-2 min-h-[2.5rem]">
            {character.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Film className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.moodCount}</span>
            <span className="text-muted-foreground">
              mood{stats.moodCount > 1 ? 's' : ''}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.spriteCount}</span>
            <span className="text-muted-foreground">
              sprite{stats.spriteCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Separator />

        {/* Actions - Nintendo UX: Hover feedback on all buttons */}
        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
            variant="default"
            size="sm"
            className="flex-1 transition-transform hover:scale-105 active:scale-95"
            aria-label="Éditer le personnage"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Éditer
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(character.id);
            }}
            variant="outline"
            size="sm"
            className="transition-transform hover:scale-105 active:scale-95"
            aria-label="Dupliquer le personnage"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-transform hover:scale-105 active:scale-95"
            aria-label="Supprimer le personnage"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CharacterCard;
