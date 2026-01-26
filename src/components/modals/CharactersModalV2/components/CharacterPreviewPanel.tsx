import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Users, Edit, Copy, Trash2, AlertCircle, AlertTriangle, MapPin } from 'lucide-react';
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
 * CharacterPreviewPanel - Side panel for character details
 *
 * **Pattern:** AssetsLibraryModal preview panel exact pattern
 *
 * Fixed-width side panel (320px) that displays detailed character information
 * without opening the full editor. Allows quick actions (edit, duplicate, delete).
 *
 * ## Features
 * - **Fixed width:** 320px, doesn't compress
 * - **Scrollable content:** ScrollArea for long content
 * - **Fixed footer:** Action buttons always visible
 * - **Preview image:** Full-width, aspect-square
 * - **Stats display:** Moods, sprites, completeness percentage
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
    <div className="w-[280px] shrink-0 border-l border-slate-700/50 bg-slate-800/50 flex flex-col h-full overflow-hidden">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="font-medium text-xs text-slate-300">Aperçu</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-slate-200"
          onClick={onClose}
          aria-label="Fermer l'aperçu"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Preview Image - Compact */}
          <div className="relative rounded-lg overflow-hidden bg-black/30 border border-slate-600/30">
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
              <div className="w-full aspect-square flex items-center justify-center">
                <Users className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>

          {/* Character Info - Compact */}
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-600/30 space-y-1">
            <h4 className="font-semibold text-sm text-white truncate" title={character.name}>
              {character.name}
            </h4>
            {character.description && (
              <p className="text-xs text-slate-400 line-clamp-2">
                {character.description}
              </p>
            )}
            {/* Completeness inline */}
            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 ${
                  stats.completeness === 100
                    ? 'border-green-700 text-green-400'
                    : hasErrors
                    ? 'border-red-700 text-red-400'
                    : hasWarnings
                    ? 'border-yellow-700 text-yellow-400'
                    : 'border-slate-600 text-slate-400'
                }`}
              >
                {stats.completeness}% complet
              </Badge>
            </div>
          </div>

          {/* Stats - Compact grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-800/60 rounded-md border border-slate-700/30 text-center">
              <div className="text-lg font-bold text-primary">{stats.moodCount}</div>
              <div className="text-[10px] text-slate-500">
                Humeur{stats.moodCount > 1 ? 's' : ''}
              </div>
            </div>
            <div className="p-2 bg-slate-800/60 rounded-md border border-slate-700/30 text-center">
              <div className="text-lg font-bold text-primary">{stats.spriteCount}</div>
              <div className="text-[10px] text-slate-500">
                Sprite{stats.spriteCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Moods List - Compact */}
          {character.moods && character.moods.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-medium text-slate-400">Humeurs</h5>
              <div className="flex flex-wrap gap-1">
                {character.moods.map((mood) => (
                  <Badge key={mood} variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-slate-600 text-slate-300">
                    {mood}
                    {character.sprites?.[mood] && (
                      <span className="ml-0.5 text-green-500">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Errors - Compact */}
          {errorsList.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[11px] font-medium text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Erreurs ({errorsList.length})
              </h5>
              <div className="space-y-1">
                {errorsList.map((error, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-1.5 bg-red-900/30 border border-red-800/30 rounded text-red-300"
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
              <h5 className="text-[11px] font-medium text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Avertissements ({warningsList.length})
              </h5>
              <div className="space-y-1">
                {warningsList.map((warning, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-1.5 bg-yellow-900/30 border border-yellow-800/30 rounded text-yellow-300"
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
              <h5 className="text-[11px] font-medium text-blue-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {usageInfo.sceneCount} scène{usageInfo.sceneCount > 1 ? 's' : ''}
              </h5>
              <div className="space-y-1">
                {usageInfo.scenes.slice(0, 3).map((scene, index) => (
                  <div
                    key={index}
                    className="text-[10px] p-1.5 bg-blue-900/30 border border-blue-800/30 rounded text-blue-300 truncate"
                  >
                    {scene}
                  </div>
                ))}
                {usageInfo.scenes.length > 3 && (
                  <div className="text-[10px] text-slate-500">
                    +{usageInfo.scenes.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons - Compact */}
      <div className="p-3 border-t border-slate-700/50 space-y-2 flex-shrink-0">
        <Button
          size="sm"
          className="w-full gap-1.5 h-8 text-xs"
          onClick={() => onEdit(character)}
        >
          <Edit className="h-3.5 w-3.5" />
          Éditer
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 h-7 text-xs border-slate-600 hover:bg-slate-700"
            onClick={() => onDuplicate(character.id)}
          >
            <Copy className="h-3 w-3" />
            Dupliquer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 gap-1 h-7 text-xs"
            onClick={() => onDelete(character)}
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CharacterPreviewPanel;
