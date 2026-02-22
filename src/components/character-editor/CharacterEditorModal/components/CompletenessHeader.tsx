
import {
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { CompletenessResult } from '../hooks/useCharacterCompleteness';

/**
 * Props for CompletenessHeader component
 */
export interface CompletenessHeaderProps {
  /** Name of the character being edited */
  characterName: string;
  /** Whether this is a new character (true) or editing existing (false) */
  isNew: boolean;
  /** Completeness statistics */
  completeness: CompletenessResult;
}

/**
 * CompletenessHeader - Character Editor Header with Completeness Indicator
 *
 * Displays the character editor header with:
 * - Character name and edit/create mode indicator
 * - Completeness badge showing sprite assignment progress
 * - Progress bar with visual feedback
 *
 * Inspired by AAA game editors (Unreal, Unity) with professional polish.
 *
 * @example
 * ```tsx
 * <CompletenessHeader
 *   characterName="Alice"
 *   isNew={false}
 *   completeness={{ moodCount: 3, spriteCount: 2, percentage: 66 }}
 * />
 * ```
 */
export default function CompletenessHeader({
  characterName,
  isNew,
  completeness
}: CompletenessHeaderProps) {
  const { moodCount, spriteCount, percentage } = completeness;
  const isComplete = percentage === 100;

  return (
    <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="flex items-center gap-3 text-3xl font-bold mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-transform hover:scale-110 duration-200">
              <User className="h-7 w-7" />
            </div>
            {isNew ? 'Nouveau personnage' : `Éditer: ${characterName}`}
          </DialogTitle>
          <DialogDescription className="text-base">
            Configurez votre personnage avec une interface professionnelle
          </DialogDescription>
        </div>

        {/* Completeness Badge */}
        <Badge
          variant={isComplete ? "default" : "secondary"}
          className="px-4 py-2 text-sm transition-all hover:scale-105 active:scale-95 duration-200"
        >
          {isComplete ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              Complet
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              {percentage}% Complet
            </>
          )}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progression</span>
          <span>{spriteCount} / {moodCount} sprites assignés</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </DialogHeader>
  );
}
