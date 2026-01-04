import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';

/**
 * CharacterPreviewPanel - Live Character Preview with Mood Carousel
 *
 * Displays a live preview of the character with:
 * - Large sprite preview area with current mood
 * - Mood carousel navigation (previous/next buttons)
 * - Mood selector buttons showing which moods have sprites assigned
 * - Statistics cards showing mood count, sprite count, and missing sprites
 *
 * Inspired by Unity Animation Preview and Unreal Engine Character Preview
 * Includes smooth transitions and Nintendo-style hover effects
 *
 * @component
 * @param {Object} props
 * @param {Object} props.formData - Character form data
 * @param {string} props.formData.name - Character name
 * @param {Object} props.formData.sprites - Sprite assignments by mood
 * @param {Array<string>} props.formData.moods - List of mood names
 * @param {string} props.previewMood - Currently previewed mood
 * @param {Function} props.onPreviewMoodChange - Callback to change preview mood
 * @param {Object} props.completeness - Completeness statistics
 * @param {number} props.completeness.moodCount - Total mood count
 * @param {number} props.completeness.spriteCount - Total sprite count
 */
export default function CharacterPreviewPanel({
  formData,
  previewMood,
  onPreviewMoodChange,
  completeness
}) {
  const { name, sprites, moods } = formData;
  const currentPreviewSprite = sprites?.[previewMood];
  const { moodCount, spriteCount } = completeness;
  const missingCount = moodCount - spriteCount;

  const navigateMood = (direction) => {
    const currentIndex = moods.indexOf(previewMood);
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : moods.length - 1;
      onPreviewMoodChange(moods[prevIndex]);
    } else {
      const nextIndex = currentIndex < moods.length - 1 ? currentIndex + 1 : 0;
      onPreviewMoodChange(moods[nextIndex]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Aperçu en direct
            </CardTitle>
            <CardDescription>
              Visualisez votre personnage avec chaque humeur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Character Preview */}
            <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-lg">
              {currentPreviewSprite ? (
                <img
                  src={currentPreviewSprite}
                  alt={`${name} - ${previewMood}`}
                  className="max-w-full max-h-full object-contain p-8 transition-all duration-300 hover:scale-105"
                />
              ) : (
                <div className="text-center p-8">
                  <User className="h-24 w-24 mx-auto mb-4 text-muted-foreground transition-transform duration-300 hover:scale-110" />
                  <p className="text-muted-foreground font-medium">Pas de sprite</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assignez un sprite à cette humeur
                  </p>
                </div>
              )}

              {/* Current mood indicator */}
              <div className="absolute top-4 left-4 right-4">
                <Badge variant="secondary" className="w-full justify-center py-2 text-sm backdrop-blur-sm transition-all hover:scale-105 duration-200">
                  Humeur: <strong className="ml-1">{previewMood}</strong>
                </Badge>
              </div>
            </div>

            {/* Mood Carousel Navigation */}
            {moods.length > 1 && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMood('prev')}
                  className="transition-transform hover:scale-110 active:scale-95 duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {moods.map((mood) => (
                    <Button
                      key={mood}
                      type="button"
                      variant={previewMood === mood ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPreviewMoodChange(mood)}
                      className="whitespace-nowrap flex-shrink-0 transition-transform hover:scale-105 active:scale-95 duration-200"
                    >
                      {mood}
                      {sprites?.[mood] && (
                        <Check className="h-3 w-3 ml-1.5" />
                      )}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMood('next')}
                  className="transition-transform hover:scale-110 active:scale-95 duration-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="transition-all hover:shadow-md hover:scale-105 duration-200">
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-primary">{moodCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Humeurs</div>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-md hover:scale-105 duration-200">
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-green-500">{spriteCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sprites</div>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-md hover:scale-105 duration-200">
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {missingCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Manquants</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

CharacterPreviewPanel.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    sprites: PropTypes.object,
    moods: PropTypes.array.isRequired
  }).isRequired,
  previewMood: PropTypes.string.isRequired,
  onPreviewMoodChange: PropTypes.func.isRequired,
  completeness: PropTypes.shape({
    moodCount: PropTypes.number.isRequired,
    spriteCount: PropTypes.number.isRequired
  }).isRequired
};
