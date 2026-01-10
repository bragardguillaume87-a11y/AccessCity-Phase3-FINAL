import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProgressStepper } from './onboarding/ProgressStepper';

/**
 * Onboarding step data structure
 */
interface OnboardingStep {
  /** Step title */
  title: string;
  /** Step description text */
  text: string;
  /** Emoji icon for the step */
  icon: string;
}

/**
 * Props for OnboardingModal component
 */
export interface OnboardingModalProps {
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * OnboardingModal - Welcome and tutorial modal for new users
 *
 * Features:
 * - Multi-step wizard with progress indicator
 * - Light theme matching game aesthetic
 * - Smooth animations and transitions
 * - Keyboard navigation
 * - Saves completion state to localStorage
 *
 * @example
 * ```tsx
 * <OnboardingModal
 *   onClose={() => setShowOnboarding(false)}
 * />
 * ```
 */
export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const steps: OnboardingStep[] = [
    {
      title: 'Bienvenue dans ton editeur d\'histoires !',
      text: 'Ici, tu peux creer des aventures incroyables pour sensibiliser a l\'accessibilite. C\'est toi le createur !',
      icon: '🎉'
    },
    {
      title: 'Decouvre comment creer ta premiere aventure',
      text: 'Tu vas pouvoir ajouter des scenes, des dialogues et des personnages. C\'est super facile, suis le guide !',
      icon: '💡'
    },
    {
      title: 'C\'est parti ! Cree ta premiere histoire',
      text: 'Clique sur "Scenes" pour commencer. Tu pourras previsualiser ton histoire quand tu veux. Amuse-toi bien !',
      icon: '🚀'
    }
  ];

  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      window.localStorage.setItem('ac_onboarding_completed', 'true');
      setIsOpen(false);
      onClose();
    } else {
      setStep(step + 1);
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  function handleSkip() {
    window.localStorage.setItem('ac_onboarding_completed', 'true');
    setIsOpen(false);
    onClose();
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      handleSkip();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg bg-gradient-to-br from-white via-game-purple/5 to-white text-slate-900 border-2 border-game-purple/20"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleSkip();
        }}
      >
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-b from-white via-game-purple/5 to-white px-8 pt-8 pb-6">
          {/* Icon */}
          <div className="text-6xl text-center mb-4 drop-shadow-lg animate-bounce-subtle" aria-hidden="true">
            {steps[step].icon}
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-slate-900 text-center">
            {steps[step].title}
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="text-slate-700 text-center text-lg leading-relaxed mt-3">
            {steps[step].text}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6">
          {/* Progress Stepper */}
          <ProgressStepper currentStep={step} totalSteps={steps.length} />
        </div>

        <DialogFooter className="border-t border-slate-200 px-8 py-6">
          <div className="flex justify-between items-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-semibold"
              aria-label="Passer l'introduction"
            >
              Passer
            </Button>

            <div className="flex gap-2 items-center">
              {step > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePrev}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                  aria-label="Étape précédente"
                >
                  Précédent
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-game-purple to-game-pink text-white hover:from-game-purple-hover hover:to-game-pink-hover font-bold shadow-game-card hover:shadow-game-card-hover"
                aria-label={isLast ? 'Commencer à créer' : 'Continuer'}
              >
                {isLast ? 'Commencer' : 'Suivant'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
