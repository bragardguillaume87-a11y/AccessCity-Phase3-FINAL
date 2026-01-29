import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DIALOGUE_WIZARD_STEPS, type DialogueWizardStep } from '../hooks/useDialogueWizardState';

interface DialogueWizardProgressBarProps {
  currentStep: DialogueWizardStep;
  visitedSteps: Set<DialogueWizardStep>;
  onStepClick?: (step: DialogueWizardStep) => void;
}

/**
 * DialogueWizardProgressBar - Progress indicator for dialogue creation wizard
 *
 * Based on CharacterWizard's progress bar but adapted for dialogue steps.
 * Shows 4 steps: Niveau → Dialogue → Choix → Terminé
 */
export function DialogueWizardProgressBar({
  currentStep,
  visitedSteps,
  onStepClick
}: DialogueWizardProgressBarProps) {
  const currentIndex = DIALOGUE_WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const progress = (currentIndex / (DIALOGUE_WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="w-full bg-card border-b-2 border-border py-6 px-8">
      {/* Progress bar */}
      <div className="relative max-w-4xl mx-auto">
        {/* Background line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-slate-800" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {DIALOGUE_WIZARD_STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = visitedSteps.has(step.id) && !isCurrent;
            const isClickable = visitedSteps.has(step.id) && onStepClick;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 transition-opacity",
                  isClickable ? "cursor-pointer hover:opacity-100" : "cursor-default",
                  !isCurrent && !isCompleted && "opacity-50"
                )}
                aria-label={`Étape ${index + 1}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <motion.div
                  animate={isCurrent ? { y: [0, -8, 0] } : { y: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 touch-target-large",
                    isCompleted && "bg-gradient-to-br from-primary to-pink-500 text-white animate-bounce-in",
                    isCurrent && "bg-gradient-to-br from-primary to-pink-500 text-white ring-4 ring-primary/30 scale-110",
                    !isCompleted && !isCurrent && !isClickable && "bg-slate-800 text-slate-600",
                    !isCompleted && !isCurrent && isClickable && "bg-slate-700 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </motion.div>

                <div className="text-center">
                  <div className={cn(
                    "text-sm font-semibold",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}>
                    {step.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current step description */}
      <p className="text-center mt-4 text-muted-foreground animate-step-slide">
        {DIALOGUE_WIZARD_STEPS[currentIndex]?.description}
      </p>
    </div>
  );
}

export default DialogueWizardProgressBar;
