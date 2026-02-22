
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  showBack: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  isLastStep?: boolean;
}

/**
 * WizardNavigation - Large touch-friendly navigation buttons
 *
 * 56px height buttons for kid-friendly interaction.
 * Shows encouraging labels and animated icons.
 */
export function WizardNavigation({
  onBack,
  onNext,
  showBack,
  nextDisabled = false,
  nextLabel = 'Suivant',
  isLastStep = false
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      {/* Back button */}
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-14 px-6 text-base font-medium touch-target-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
      ) : (
        <div /> // Spacer
      )}

      {/* Next/Save button */}
      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={cn(
          "h-14 px-8 text-base font-semibold touch-target-xl transition-all",
          !nextDisabled && "hover:scale-[1.02] active:scale-[0.98]",
          isLastStep && "bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
        )}
      >
        {isLastStep ? (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            {nextLabel}
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

export default WizardNavigation;
