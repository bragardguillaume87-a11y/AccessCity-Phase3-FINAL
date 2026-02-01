import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import type { DialogueFormData } from '../hooks/useDialogueForm';
import type { DialogueWizardStep } from '../hooks/useDialogueWizardState';

interface StepReviewProps {
  formData: DialogueFormData;
  onSave: () => void;
  onEditStep: (step: DialogueWizardStep) => void;
}

const COMPLEXITY_LABELS: Record<string, { label: string; emoji: string }> = {
  simple: { label: 'Simple', emoji: '🎯' },
  medium: { label: 'Dés Magiques', emoji: '🎲' },
  complex: { label: 'Expert', emoji: '⚙️' },
};

/**
 * StepReview - Final step: visual summary + save with celebration
 *
 * Kid-friendly review showing:
 * - Dialogue preview (speaker + text)
 * - Choices summary
 * - Clickable summary cards to edit each step
 * - Save button with confetti
 */
export function StepReview({
  formData,
  onSave,
  onEditStep
}: StepReviewProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const characters = useCharactersStore(state => state.characters);

  const speakerId = formData.speaker || DEFAULTS.DIALOGUE_SPEAKER;
  const speakerLabel = characters.find(c => c.id === speakerId)?.name || speakerId;
  const complexity = formData.complexityLevel
    ? COMPLEXITY_LABELS[formData.complexityLevel]
    : null;

  const hasText = formData.text.trim().length > 0;
  const hasChoices = formData.choices.length > 0 && formData.choices.every(c => c.text.trim().length > 0);

  const handleSave = () => {
    setIsSaving(true);
    setShowConfetti(true);
    setTimeout(() => {
      onSave();
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-step-slide max-w-2xl mx-auto">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary">
          {isSaving ? '🎉 Dialogue créé !' : '✨ Ton dialogue est prêt !'}
        </h3>
        <p className="text-muted-foreground mt-1">
          {isSaving
            ? 'Sauvegarde réussie !'
            : 'Vérifie que tout est bon avant de sauvegarder'}
        </p>
      </div>

      {/* Dialogue preview card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Speaker bar */}
        <div className="bg-blue-600/90 px-4 py-2 flex items-center gap-2">
          <span className="text-white font-bold text-sm">{speakerLabel}</span>
          {complexity && (
            <span className="ml-auto text-xs text-white/70">
              {complexity.emoji} {complexity.label}
            </span>
          )}
        </div>

        {/* Text preview */}
        <div className="p-4">
          <p className="text-white text-sm leading-relaxed">
            {formData.text || <span className="italic text-muted-foreground">(pas de texte)</span>}
          </p>
        </div>

        {/* Choices preview */}
        {formData.choices.length > 0 && (
          <div className="px-4 pb-4 space-y-1.5">
            {formData.choices.map((choice, idx) => (
              <div
                key={choice.id}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm",
                  choice.text.trim()
                    ? "bg-card/50 border-border text-foreground"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300 italic"
                )}
              >
                {choice.text.trim() || `Choix ${idx + 1} (vide)`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responses preview */}
      {formData.responses.some(r => r.text.trim().length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <span className="text-base">💡</span>
            Réponses après les choix
          </h4>
          <div className="space-y-2">
            {formData.responses.map((response, idx) => {
              if (!response.text.trim()) return null;
              const responseSpeaker = response.speaker || speakerId;
              const responseSpeakerLabel = characters.find(c => c.id === responseSpeaker)?.name || responseSpeaker;
              const choiceText = formData.choices[idx]?.text || `Choix ${idx + 1}`;
              const bgColor = idx === 0 ? 'from-emerald-600/20 to-emerald-500/20' : 'from-rose-600/20 to-rose-500/20';
              const borderColor = idx === 0 ? 'border-emerald-500/30' : 'border-rose-500/30';

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border overflow-hidden",
                    borderColor
                  )}
                >
                  <div className={cn("px-3 py-1.5 text-xs text-muted-foreground bg-gradient-to-r", bgColor)}>
                    Si le joueur choisit : « {choiceText} »
                  </div>
                  <div className="p-3 bg-card/30">
                    <p className="text-xs font-semibold text-primary mb-1">{responseSpeakerLabel}</p>
                    <p className="text-sm text-foreground/90">{response.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          title="Niveau"
          icon={complexity ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
          value={complexity ? `${complexity.emoji} ${complexity.label}` : 'Non choisi'}
          isComplete={!!complexity}
          onEdit={() => onEditStep('complexity')}
        />
        <SummaryCard
          title="Dialogue"
          icon={hasText ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
          value={hasText ? speakerLabel : 'Incomplet'}
          isComplete={hasText}
          onEdit={() => onEditStep('basics')}
        />
        <SummaryCard
          title="Choix"
          icon={hasChoices ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
          value={hasChoices ? `${formData.choices.length} choix` : 'Incomplet'}
          isComplete={hasChoices}
          onEdit={() => onEditStep('choices')}
        />
      </div>

      {/* Save button */}
      {!isSaving && (
        <Button
          type="button"
          onClick={handleSave}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Sauvegarder mon dialogue !
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
