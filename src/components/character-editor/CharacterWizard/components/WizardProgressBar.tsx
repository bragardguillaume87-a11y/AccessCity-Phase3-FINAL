import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, type WizardStep } from '../hooks/useWizardState';

interface WizardProgressBarProps {
  currentStep: WizardStep;
  visitedSteps: Set<WizardStep>;
  onStepClick?: (step: WizardStep) => void;
}

/**
 * WizardProgressBar - Kid-friendly step indicator
 *
 * Shows 4 steps with icons, labels, and connecting lines.
 * Completed steps show checkmarks, current step is highlighted.
 */
export function WizardProgressBar({
  currentStep,
  visitedSteps,
  onStepClick
}: WizardProgressBarProps) {
  const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 mx-12" />

        {/* Progress connector line */}
        <div
          className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-primary to-pink-500 -translate-y-1/2 mx-12 transition-all duration-500"
          style={{ width: `${(currentIndex / (WIZARD_STEPS.length - 1)) * 100}%` }}
        />

        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isVisited = visitedSteps.has(step.id);
          const isClickable = isVisited || index <= currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                "relative z-10 flex flex-col items-center gap-2 transition-all duration-300",
                isClickable ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              {/* Step circle with floating animation for current step */}
              <motion.div
                animate={isCurrent ? {
                  y: [0, -8, 0],
                } : {}}
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

              {/* Step label */}
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCurrent && "text-primary font-semibold",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && !isClickable && "text-slate-600",
                  !isCompleted && !isCurrent && isClickable && "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current step description */}
      <p className="text-center mt-4 text-muted-foreground animate-step-slide">
        {WIZARD_STEPS[currentIndex]?.description}
      </p>
    </div>
  );
}

export default WizardProgressBar;
