import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Copy, Trash2 } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStatsV2';

/**
 * Validation error interface (compatible with V1)
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Props for CharacterCardV2 component
 */
export interface CharacterCardV2Props {
  /** Character to display */
  character: Character;
  /** Character statistics */
  stats: CharacterStats;
  /** Validation errors for this character */
  errors?: ValidationError[];
  /** Whether this character is favorited */
  isFavorite: boolean;
  /** Callback when favorite is toggled */
  onToggleFavorite: (id: string) => void;
  /** Callback when card is clicked (opens preview) */
  onClick: (character: Character) => void;
  /** Callback when duplicate is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete is clicked */
  onDelete: (character: Character) => void;
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
 * CharacterCardV2 - Character card for Library tab
 *
 * **Pattern:** Inspired by AssetsLibraryModal SimpleAssetCard
 *
 * Interactive card displaying character preview, stats, and quick actions.
 * Used in Library tab for browsing and selecting characters.
 *
 * ## Features
 * - **Preview image:** Shows first available sprite or Users icon fallback
 * - **Completeness badge:** Top-right, shows percentage
 * - **Favorite star:** Top-left, animated toggle
 * - **Stats footer:** Moods count + sprites count
 * - **Hover actions:** Duplicate and Delete buttons appear on hover
 * - **Click to preview:** Opens preview panel with full details
 *
 * ## Layout
 * - Aspect ratio: Square (aspect-square)
 * - Hover effect: Slight lift (hover:-translate-y-1)
 * - Image scale: Zoom on hover (hover:scale-105)
 * - Badge positioning: Absolute with padding
 *
 * @example
 * ```tsx
 * <CharacterCardV2
 *   character={character}
 *   stats={stats}
 *   isFavorite={isFavorite(character.id)}
 *   onToggleFavorite={toggleFavorite}
 *   onClick={(char) => setPreviewCharacter(char)}
 *   onDuplicate={handleDuplicate}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function CharacterCardV2({
  character,
  stats,
  errors,
  isFavorite,
  onToggleFavorite,
  onClick,
  onDuplicate,
  onDelete,
}: CharacterCardV2Props) {
  const previewImage = getPreviewImage(character);
  const hasErrors = errors && errors.some((e) => e.severity === 'error');
  const hasWarnings = errors && errors.some((e) => e.severity === 'warning');

  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/50 bg-slate-800/50 border border-slate-700/50"
      onClick={() => onClick(character)}
    >
      {/* Preview Image Section - Compact */}
      <div className="relative aspect-[4/3] bg-black/20 overflow-hidden">
        {previewImage ? (
          <img
            src={previewImage}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
            <Users className="h-10 w-10 text-slate-600" />
          </div>
        )}

        {/* Favorite Star (Top-Left) - Smaller */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(character.id);
          }}
          className={`absolute top-1.5 left-1.5 p-1 rounded-full transition-all duration-200 ${
            isFavorite
              ? 'bg-yellow-500 text-white'
              : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
          }`}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star
            className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`}
            strokeWidth={isFavorite ? 0 : 2}
          />
        </button>

        {/* Completeness Badge (Top-Right) - Compact */}
        <div className="absolute top-1.5 right-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] h-5 px-1.5 font-medium border ${
              stats.completeness === 100
                ? 'bg-green-900/80 border-green-700 text-green-300'
                : hasErrors
                ? 'bg-red-900/80 border-red-700 text-red-300'
                : hasWarnings
                ? 'bg-yellow-900/80 border-yellow-700 text-yellow-300'
                : 'bg-slate-900/80 border-slate-600 text-slate-300'
            }`}
          >
            {stats.completeness}%
          </Badge>
        </div>

        {/* Hover Actions Overlay - Compact icons */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(character.id);
            }}
            title="Dupliquer"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-red-500/20 hover:bg-red-500/40 text-red-300"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Footer: Name + Stats - Compact */}
      <div className="p-2 space-y-0.5">
        <h3 className="font-medium text-xs text-slate-200 truncate" title={character.name}>
          {character.name}
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-0.5">
            {stats.moodCount} humeur{stats.moodCount > 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            {stats.spriteCount} sprite{stats.spriteCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CharacterCardV2;
