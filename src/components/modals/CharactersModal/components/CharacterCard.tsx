import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Copy, Trash2, Eye, Image } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';
import { getPreviewImage } from '../utils/characterUtils';

/**
 * Validation error interface (compatible with V1)
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Props for CharacterCard component
 */
export interface CharacterCardProps {
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
 * CharacterCard - Character card for Library tab (AMÉLIORATION UI/UX)
 *
 * **Pattern:** Inspired by AssetsLibraryModal SimpleAssetCard
 *
 * Interactive card displaying character preview, stats, and quick actions.
 * Used in Library tab for browsing and selecting characters.
 *
 * ## ✨ AMÉLIORATIONS APPLIQUÉES :
 * - **Gradient overlay** sur images (from-black/70 via-black/20 to-transparent)
 * - **Hover dramatique** : scale-[1.02] + shadow-xl + border-primary glow
 * - **Badges vivants** : Couleurs semi-transparentes avec backdrop-blur
 * - **Transitions smooth** : duration-300 partout
 * - **Image zoom** : scale-105 sur hover
 * - **Icônes dans footer** : Meilleure hiérarchie visuelle
 *
 * ## Features
 * - **Preview image:** Shows first available sprite or Users icon fallback
 * - **Completeness badge:** Top-right, shows percentage with color coding
 * - **Favorite star:** Top-left, animated toggle with backdrop blur
 * - **Stats footer:** Moods count + sprites count with icons
 * - **Hover actions:** Duplicate and Delete buttons appear on hover with blur
 * - **Click to preview:** Opens preview panel with full details
 *
 * ## Layout
 * - Aspect ratio: Square (aspect-square)
 * - Hover effect: Lift + shadow + border glow (hover:-translate-y-1)
 * - Image scale: Zoom on hover (hover:scale-105)
 * - Badge positioning: Absolute with padding + backdrop-blur
 *
 * @example
 * ```tsx
 * <CharacterCard
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
export function CharacterCard({
  character,
  stats,
  errors,
  isFavorite,
  onToggleFavorite,
  onClick,
  onDuplicate,
  onDelete,
}: CharacterCardProps) {
  const previewImage = getPreviewImage(character);
  const hasErrors = errors && errors.some((e) => e.severity === 'error');
  const hasWarnings = errors && errors.some((e) => e.severity === 'warning');

  return (
    <div
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 bg-slate-800/50 border border-slate-700/50 hover:border-primary/30"
      onClick={() => onClick(character)}
    >
      {/* Preview Image Section */}
      <div className="relative aspect-[3/4] bg-black/20 overflow-hidden">
        {/* Gradient overlay pour meilleure lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

        {previewImage ? (
          <img
            src={previewImage}
            alt={character.name}
            className="w-full h-full object-cover object-[center_20%] transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-900/80">
            <Users className="h-12 w-12 text-slate-500" />
          </div>
        )}

        {/* ✨ AMÉLIORÉ : Favorite Star avec backdrop-blur et scale sur hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(character.id);
          }}
          className={`absolute top-2 left-2 p-1.5 rounded-full transition-all duration-200 z-20 ${
            isFavorite
              ? 'bg-yellow-500 text-white shadow-lg hover:bg-yellow-400 hover:scale-110'
              : 'bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white hover:scale-110'
          }`}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star
            className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`}
            strokeWidth={isFavorite ? 0 : 2}
          />
        </button>

        {/* ✨ AMÉLIORÉ : Completeness Badge avec couleurs vives et backdrop-blur */}
        <div className="absolute top-2 right-2 z-20">
          <Badge
            variant="outline"
            className={`text-[10px] h-6 px-2 font-semibold border-2 backdrop-blur-sm shadow-lg ${
              stats.completeness === 100
                ? 'bg-green-500/20 border-green-400/60 text-green-200'
                : hasErrors
                ? 'bg-red-500/20 border-red-400/60 text-red-200'
                : hasWarnings
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-500/20 border-slate-400/60 text-slate-200'
            }`}
          >
            {stats.completeness}%
            {stats.completeness === 100 && ' ✓'}
          </Badge>
        </div>

        {/* ✨ AMÉLIORÉ : Hover Actions avec gradient overlay et backdrop-blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 z-20">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-110 text-white transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(character.id);
            }}
            title="Dupliquer"
            aria-label="Dupliquer le personnage"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 bg-red-500/30 backdrop-blur-sm hover:bg-red-500/50 hover:scale-110 text-red-200 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            title="Supprimer"
            aria-label="Supprimer le personnage"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ✨ AMÉLIORÉ : Footer avec gradient background et icônes */}
      <div className="p-3 space-y-1 bg-gradient-to-b from-slate-800/80 to-slate-800/60">
        <h3 className="font-semibold text-sm text-slate-100 truncate group-hover:text-white transition-colors duration-200" title={character.name}>
          {character.name}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {stats.moodCount} humeur{stats.moodCount > 1 ? 's' : ''}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            {stats.spriteCount} sprite{stats.spriteCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CharacterCard;
