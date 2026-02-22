import { useState, useEffect } from 'react';
import { Star, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TIMING } from '@/config/timing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useMoodPresets } from '@/hooks/useMoodPresets';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';
import type { WizardStep } from '../hooks/useWizardState';

interface StepReviewProps {
  formData: {
    name: string;
    description: string;
    moods: string[];
    sprites: Record<string, string>;
  };
  completeness: {
    moodCount: number;
    spriteCount: number;
    percentage: number;
  };
  onSave: () => void;
  onEditStep: (step: WizardStep) => void;
}

/**
 * StepReview - Step 4: Review and save with celebration
 *
 * Shows character summary, star rating for completeness,
 * and triggers confetti on successful save.
 */
export function StepReview({
  formData,
  completeness,
  onSave,
  onEditStep
}: StepReviewProps) {
  const allPresets = useMoodPresets();
  const [previewMoodIndex, setPreviewMoodIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentMood = formData.moods[previewMoodIndex] || formData.moods[0];
  const currentSprite = formData.sprites[currentMood];

  // Star rating (1-5 stars based on completeness)
  const starCount = Math.ceil(completeness.percentage / 20);

  const handleSave = () => {
    setIsSaving(true);
    setShowConfetti(true);

    // Delay actual save to show celebration
    setTimeout(() => {
      onSave();
    }, TIMING.ANIMATION_CREATE);
  };

  const nextMood = () => {
    setPreviewMoodIndex(prev =>
      prev < formData.moods.length - 1 ? prev + 1 : 0
    );
  };

  const prevMood = () => {
    setPreviewMoodIndex(prev =>
      prev > 0 ? prev - 1 : formData.moods.length - 1
    );
  };

  // Reset preview index if moods change
  useEffect(() => {
    if (previewMoodIndex >= formData.moods.length) {
      setPreviewMoodIndex(0);
    }
  }, [formData.moods.length, previewMoodIndex]);

  return (
    <div className="space-y-6 animate-step-slide">
      {/* Confetti celebration */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary animate-celebration">
          {isSaving ? '🎉 Bravo !' : '✨ Ton personnage est prêt !'}
        </h3>
        <p className="text-muted-foreground mt-1">
          {isSaving
            ? 'Personnage créé avec succès !'
            : 'Vérifie que tout est bon avant de sauvegarder'}
        </p>
      </div>

      {/* Character preview card */}
      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Mood display bar */}
        <div className="bg-primary/90 px-4 py-2 text-center text-primary-foreground font-medium">
          Humeur : {allPresets.find(p => p.id === currentMood)?.label || currentMood}
        </div>

        {/* Sprite preview */}
        <div className="relative aspect-square max-h-[300px] flex items-center justify-center p-8">
          {currentSprite ? (
            <img
              src={currentSprite}
              alt={formData.name}
              className="max-h-full max-w-full object-contain animate-bounce-in"
            />
          ) : (
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl">
                {allPresets.find(p => p.id === currentMood)?.emoji || '😐'}
              </span>
            </div>
          )}

          {/* Mood navigation */}
          {formData.moods.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevMood}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextMood}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Character name */}
        <div className="bg-gradient-to-t from-black/70 to-transparent p-4 text-center">
          <h4 className="text-xl font-bold text-white">{formData.name}</h4>
          {formData.description && (
            <p className="text-sm text-white/70 mt-1 line-clamp-2">
              {formData.description}
            </p>
          )}
        </div>
      </div>

      {/* Star rating */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              "h-8 w-8 transition-all",
              star <= starCount
                ? "text-yellow-400 fill-yellow-400 animate-star-fill"
                : "text-muted"
            )}
            style={{ animationDelay: `${star * 0.1}s` }}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">{completeness.percentage}%</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Identity */}
        <SummaryCard
          title="Identité"
          icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
          value={formData.name}
          isComplete={!!formData.name}
          onEdit={() => onEditStep('identity')}
        />

        {/* Moods */}
        <SummaryCard
          title="Humeurs"
          icon={
            completeness.moodCount > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-400" />
            )
          }
          value={`${completeness.moodCount} humeur${completeness.moodCount > 1 ? 's' : ''}`}
          isComplete={completeness.moodCount > 0}
          onEdit={() => onEditStep('expressions')}
        />

        {/* Sprites */}
        <SummaryCard
          title="Images"
          icon={
            completeness.spriteCount === completeness.moodCount ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-400" />
            )
          }
          value={`${completeness.spriteCount} / ${completeness.moodCount}`}
          isComplete={completeness.spriteCount === completeness.moodCount}
          onEdit={() => onEditStep('expressions')}
        />
      </div>

      {/* Mood list */}
      <div className="flex flex-wrap gap-2 justify-center">
        {formData.moods.map((mood, index) => {
          const preset = allPresets.find(p => p.id === mood);
          const hasSprite = !!formData.sprites[mood];

          return (
            <Badge
              key={mood}
              variant={hasSprite ? 'default' : 'secondary'}
              className={cn(
                "cursor-pointer text-sm px-3 py-1 transition-all hover:scale-105",
                previewMoodIndex === index && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              onClick={() => setPreviewMoodIndex(index)}
            >
              {preset?.emoji || '😐'} {preset?.label || mood}
              {hasSprite && <CheckCircle2 className="h-3 w-3 ml-1" />}
            </Badge>
          );
        })}
      </div>

      {/* Save button */}
      {!isSaving && (
        <Button
          type="button"
          onClick={handleSave}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Créer mon personnage !
        </Button>
      )}

      {isSaving && (
        <div className="text-center py-4">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-2 text-muted-foreground">Sauvegarde en cours...</p>
        </div>
      )}
    </div>
  );
}

export default StepReview;
