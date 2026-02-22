
import { cn } from "@/lib/utils"

/**
 * Props for ProgressStepper component
 */
export interface ProgressStepperProps {
  /** Current active step index (0-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
}

/**
 * ProgressStepper - Visual progress indicator for multi-step wizards
 * Shows current step with animated progress dots
 */
export function ProgressStepper({ currentStep, totalSteps }: ProgressStepperProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Étape ${currentStep + 1} sur ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === currentStep
              ? "w-8 bg-game-purple"
              : i < currentStep
              ? "w-2 bg-game-purple/60"
              : "w-2 bg-muted"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
