import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Users, Edit, Copy, Trash2, AlertCircle, AlertTriangle, MapPin, Eye, Image } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStatsV2';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Props for CharacterPreviewPanel component
 */
export interface CharacterPreviewPanelProps {
  /** Character to preview */
  character: Character;
  /** Character statistics */
  stats: CharacterStats;
  /** Validation errors for this character */
  errors?: ValidationError[];
  /** Usage information (scenes where character is used) */
  usageInfo?: CharacterUsageData;
  /** Callback when edit is clicked */
  onEdit: (character: Character) => void;
  /** Callback when duplicate is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete is clicked */
  onDelete: (character: Character) => void;
  /** Callback when close is clicked */
  onClose: () => void;
}

/**
 * Get preview image URL for character
 */
function getPreviewImage(character: Character): string | undefined {
  if (!character.sprites || !character.moods || character.moods.length === 0) {
    return undefined;
  }
  const firstMood = character.moods[0];
  return character.sprites[firstMood];
}

/**
 * CharacterPreviewPanel - Side panel for character details (AMÉLIORATION UI/UX)
 *
 * **Pattern:** AssetsLibraryModal preview panel exact pattern
 *
 * Fixed-width side panel (320px) that displays detailed character information
 * without opening the full editor. Allows quick actions (edit, duplicate, delete).
 *
 * ## ✨ AMÉLIORATIONS APPLIQUÉES :
 * - **Largeur augmentée** : 320px (au lieu de 280px) pour plus de confort
 * - **Gradient background** : from-slate-800/80 to-slate-900/80
 * - **Stats cards visuelles** : Avec icônes et gradients colorés
 * - **Espacements améliorés** : p-5 au lieu de p-4, plus de breathing room
 * - **Borders avec glow** : border-2 pour preview image
 * - **Badges plus vivants** : Couleurs accent améliorées
 * - **Action buttons** : Hover effects avec scale
 *
 * ## Features
 * - **Fixed width:** 320px, doesn't compress
 * - **Scrollable content:** ScrollArea for long content
 * - **Fixed footer:** Action buttons always visible
 * - **Preview image:** Full-width, aspect-square with border glow
 * - **Stats display:** Moods, sprites, completeness with icons and colors
 * - **Validation display:** Errors and warnings with icons
 * - **Usage info:** List of scenes where character is used
 *
 * ## Layout
 * ```
 * ┌────────────────────┐
 * │ Header + Close (X) │ ← flex-shrink-0
 * ├────────────────────┤
 * │                    │
 * │  Scrollable Area   │ ← flex-1, overflow-y-auto
 * │  - Image           │
 * │  - Info            │
 * │  - Stats           │
 * │  - Errors          │
 * │  - Usage           │
 * │                    │
 * ├────────────────────┤
 * │ Action Buttons     │ ← flex-shrink-0
 * └────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * <CharacterPreviewPanel
 *   character={previewCharacter}
 *   stats={getCharacterStats(previewCharacter)}
 *   errors={validation.errors.characters[previewCharacter.id]}
 *   usageInfo={usageMap.get(previewCharacter.id)}
 *   onEdit={handleEdit}
 *   onDuplicate={handleDuplicate}
 *   onDelete={handleDelete}
 *   onClose={() => setPreviewCharacter(null)}
 * />
 * ```
 */
export function CharacterPreviewPanel({
  character,
  stats,
  errors,
  usageInfo,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
}: CharacterPreviewPanelProps) {
  const previewImage = getPreviewImage(character);
  const hasErrors = errors?.some((e) => e.severity === 'error');
  const hasWarnings = errors?.some((e) => e.severity === 'warning');
  const errorsList = errors?.filter((e) => e.severity === 'error') || [];
  const warningsList = errors?.filter((e) => e.severity === 'warning') || [];

  return (
    // ✨ AMÉLIORÉ : 320px au lieu de 280px + gradient background
    <div className="w-[320px] shrink-0 border-l border-slate-700/50 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm flex flex-col h-full overflow-hidden">
      {/* ✨ AMÉLIORÉ : Header avec padding augmenté */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-slate-800/60 flex-shrink-0">
        <h3 className="font-semibold text-sm text-slate-200">Aperçu détaillé</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-all"
          onClick={onClose}
          aria-label="Fermer l'aperçu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        {/* ✨ AMÉLIORÉ : Padding augmenté (p-5 au lieu de p-4) */}
        <div className="p-5 space-y-4">
          {/* ✨ AMÉLIORÉ : Preview Image avec border-2 et glow effect */}
          <div className="relative rounded-xl overflow-hidden bg-black/40 border-2 border-slate-600/40 shadow-lg">
            {previewImage ? (
              <img
                src={previewImage}
                alt={character.name}
                className="w-full aspect-square object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-slate-800/60 to-slate-900/60">
                <Users className="h-16 w-16 text-slate-500" />
              </div>
            )}
          </div>

          {/* ✨ AMÉLIORÉ : Character Info avec gradient background */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 rounded-xl p-4 border border-slate-600/40 shadow-lg space-y-2">
            <h4 className="font-bold text-base text-white truncate" title={character.name}>
              {character.name}
            </h4>
            {character.description && (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {character.description}
              </p>
            )}
            {/* Completeness badge inline */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-medium border-2 ${
                  stats.completeness === 100
                    ? 'bg-green-500/20 border-green-400/50 text-green-200'
                    : hasErrors
                    ? 'bg-red-500/20 border-red-400/50 text-red-200'
                    : hasWarnings
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    : 'bg-slate-500/20 border-slate-400/50 text-slate-200'
                }`}
              >
                {stats.completeness}% complet
              </Badge>
            </div>
          </div>

          {/* ✨ NOUVEAU : Stats cards avec icônes et gradients */}
          <div className="grid grid-cols-2 gap-3">
            {/* Humeurs stat */}
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.moodCount}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Humeur{stats.moodCount > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Sprites stat */}
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Image className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{stats.spriteCount}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Sprite{stats.spriteCount > 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ✨ AMÉLIORÉ : Moods List avec badges plus vivants */}
          {character.moods && character.moods.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-300">Humeurs disponibles</h5>
              <div className="flex flex-wrap gap-2">
                {character.moods.map((mood) => (
                  <Badge
                    key={mood}
                    variant="outline"
                    className={`text-xs px-2.5 py-1 font-medium border ${
                      character.sprites?.[mood]
                        ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
                        : 'bg-slate-500/20 border-slate-400/50 text-slate-300'
                    }`}
                  >
                    {mood}
                    {character.sprites?.[mood] && (
                      <span className="ml-1 text-green-400 font-bold">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Errors - Compact */}
          {errorsList.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Erreurs ({errorsList.length})
              </h5>
              <div className="space-y-1">
                {errorsList.map((error, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-2 bg-red-900/30 border border-red-800/40 rounded-lg text-red-300"
                  >
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings - Compact */}
          {warningsList.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Avertissements ({warningsList.length})
              </h5>
              <div className="space-y-1">
                {warningsList.map((warning, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-2 bg-yellow-900/30 border border-yellow-800/40 rounded-lg text-yellow-300"
                  >
                    {warning.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Info - Compact */}
          {usageInfo && usageInfo.sceneCount > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Utilisé dans {usageInfo.sceneCount} scène{usageInfo.sceneCount > 1 ? 's' : ''}
              </h5>
              <div className="space-y-1">
                {usageInfo.scenes.slice(0, 3).map((scene, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-2 bg-blue-900/30 border border-blue-800/40 rounded-lg text-blue-300 truncate"
                  >
                    {scene}
                  </div>
                ))}
                {usageInfo.scenes.length > 3 && (
                  <div className="text-[10px] text-slate-500 pl-2">
                    +{usageInfo.scenes.length - 3} autres scènes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ✨ AMÉLIORÉ : Action Buttons avec hover effects */}
      <div className="p-4 border-t border-slate-700/50 space-y-2 flex-shrink-0 bg-slate-800/60">
        <Button
          size="sm"
          className="w-full gap-2 h-9 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          onClick={() => onEdit(character)}
        >
          <Edit className="h-4 w-4" />
          Éditer le personnage
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs border-slate-600 hover:bg-slate-700 hover:scale-[1.02] transition-all duration-200"
            onClick={() => onDuplicate(character.id)}
          >
            <Copy className="h-3.5 w-3.5" />
            Dupliquer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs hover:scale-[1.02] transition-all duration-200"
            onClick={() => onDelete(character)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CharacterPreviewPanel;
