import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Users,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Film,
  Eye,
  MapPin,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';
import type { ValidationError } from './CharacterCard';

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
  /** Callback when edit button is clicked */
  onEdit: (character: Character) => void;
  /** Callback when duplicate button is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete button is clicked */
  onDelete: (character: Character) => void;
  /** Callback when close button is clicked */
  onClose: () => void;
}

/**
 * CharacterPreviewPanel - Side preview panel for quick character details
 *
 * Displays detailed character information in a fixed-width side panel (320px).
 * Provides quick access to character details without opening the full editor.
 *
 * ## Features
 * - Fixed 320px width panel
 * - Preview image with fallback
 * - Character metadata (name, description)
 * - Stats display (moods, sprites, completeness)
 * - Errors and warnings indicators
 * - Usage information (scenes where used)
 * - Quick action buttons (Edit, Duplicate, Delete)
 * - Close button (X in top-right)
 *
 * ## Design Pattern
 * Inspired by Material Design 3 detail panels and AssetsLibraryModal preview.
 * Provides context without requiring full modal navigation.
 *
 * @example
 * ```tsx
 * {previewCharacter && (
 *   <CharacterPreviewPanel
 *     character={previewCharacter}
 *     stats={getCharacterStats(previewCharacter)}
 *     errors={validationErrors}
 *     usageInfo={usageMap.get(previewCharacter.id)}
 *     onEdit={handleEdit}
 *     onDuplicate={handleDuplicate}
 *     onDelete={handleDelete}
 *     onClose={() => setPreviewCharacter(null)}
 *   />
 * )}
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
  const hasErrors = errors && errors.some((e) => e.severity === 'error');
  const hasWarnings = errors && errors.some((e) => e.severity === 'warning');
  const isUsed = usageInfo && usageInfo.sceneCount > 0;

  return (
    <div className="w-[320px] border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Aperçu du personnage</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 transition-transform hover:scale-110"
          aria-label="Fermer l'aperçu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Preview Image */}
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center overflow-hidden">
                {character.sprites?.neutral ? (
                  <img
                    src={character.sprites.neutral}
                    alt={character.name}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                ) : (
                  <div className="p-6 rounded-full bg-primary/10 text-primary">
                    <Users className="h-16 w-16" />
                  </div>
                )}

                {/* Completeness Badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={stats.completeness === 100 ? 'default' : 'secondary'}
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
              </div>
            </CardContent>
          </Card>

          {/* Character Information */}
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-lg">{character.name}</h4>
              {character.description && (
                <p className="text-sm text-muted-foreground mt-1">{character.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <span>Humeurs</span>
                </div>
                <span className="font-semibold">{stats.moodCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>Sprites</span>
                </div>
                <span className="font-semibold">{stats.spriteCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>Complétude</span>
                </div>
                <span className="font-semibold">{stats.completeness}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Errors/Warnings */}
          {(hasErrors || hasWarnings) && (
            <Card className={hasErrors ? 'border-destructive' : 'border-yellow-500'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {hasErrors ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Erreurs
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Avertissements
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errors?.map((error, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-destructive mt-0.5">•</span>
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Information */}
          {isUsed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Utilisation
                </CardTitle>
                <CardDescription className="text-xs">
                  Ce personnage est utilisé dans {usageInfo.sceneCount} scène
                  {usageInfo.sceneCount > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {usageInfo.scenes.slice(0, 5).map((sceneName, index) => (
                    <div
                      key={index}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <span className="text-primary">•</span>
                      <span className="truncate">{sceneName}</span>
                    </div>
                  ))}
                  {usageInfo.scenes.length > 5 && (
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      +{usageInfo.scenes.length - 5} autre
                      {usageInfo.scenes.length - 5 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-4 border-t space-y-2">
        <Button
          onClick={() => onEdit(character)}
          className="w-full transition-transform hover:scale-105 active:scale-95"
          size="sm"
        >
          <Edit className="h-4 w-4 mr-2" />
          Éditer
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => onDuplicate(character.id)}
            variant="outline"
            className="flex-1 transition-transform hover:scale-105 active:scale-95"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          <Button
            onClick={() => onDelete(character)}
            variant="outline"
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-transform hover:scale-105 active:scale-95"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CharacterPreviewPanel;
