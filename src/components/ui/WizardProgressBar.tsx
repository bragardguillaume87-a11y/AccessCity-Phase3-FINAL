
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStepConfig<TStep extends string> {
  id: TStep;
  label: string;
  icon: ReactNode;
  description: string;
}

interface WizardProgressBarProps<TStep extends string> {
  steps: WizardStepConfig<TStep>[];
  currentStep: TStep;
  visitedSteps: Set<TStep>;
  onStepClick?: (step: TStep) => void;
}

/**
 * WizardProgressBar - Compact step indicator for any wizard
 *
 * Shows steps with Lucide icons, labels, animated progress line.
 * Completed steps show checkmarks, current step has a subtle pulse.
 * Compact layout optimized for 1080p viewports.
 */
export function WizardProgressBar<TStep extends string>({
  steps,
  currentStep,
  visitedSteps,
  onStepClick
}: WizardProgressBarProps<TStep>) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="w-full bg-card border-b-2 border-border py-3 px-6">
      <div className="relative max-w-3xl mx-auto">
        {/* Background line */}
        <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-border" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-[18px] left-0 h-0.5 bg-gradient-to-r from-primary to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = visitedSteps.has(step.id) && !isCurrent;
            const isClickable = visitedSteps.has(step.id) && !!onStepClick;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && onStepClick!(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1 transition-opacity",
                  isClickable ? "cursor-pointer hover:opacity-100" : "cursor-default",
                  !isCurrent && !isCompleted && "opacity-60"
                )}
                aria-label={`Étape ${index + 1}: ${step.label}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-gradient-to-br from-primary to-pink-500 text-white ring-2 ring-primary/30"
                  >
                    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 [&>svg]:w-full [&>svg]:h-full">{step.icon}</span>
                  </motion.div>
                ) : (
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full inline-flex items-center justify-center",
                      isCompleted
                        ? "bg-gradient-to-br from-primary to-pink-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 [&>svg]:w-full [&>svg]:h-full">{step.icon}</span>
                    )}
                  </div>
                )}

                <div className={cn(
                  "text-xs font-medium",
                  isCurrent && "text-primary",
                  isCompleted && "text-foreground",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}>
                  {step.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current step description */}
      <p className="text-center mt-2 text-sm text-muted-foreground">
        {steps[currentIndex]?.description}
      </p>
    </div>
  );
}
