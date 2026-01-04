import React from 'react';
import PropTypes from 'prop-types';
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

/**
 * CompletenessHeader - Character Editor Header with Completeness Indicator
 *
 * Displays the character editor header with:
 * - Character name and edit/create mode indicator
 * - Completeness badge showing sprite assignment progress
 * - Progress bar with visual feedback
 *
 * Inspired by AAA game editors (Unreal, Unity) with professional polish
 *
 * @component
 * @param {Object} props
 * @param {string} props.characterName - Name of the character being edited
 * @param {boolean} props.isNew - Whether this is a new character (true) or editing existing (false)
 * @param {Object} props.completeness - Completeness statistics
 * @param {number} props.completeness.moodCount - Total number of moods defined
 * @param {number} props.completeness.spriteCount - Number of sprites assigned
 * @param {number} props.completeness.percentage - Completion percentage (0-100)
 */
export default function CompletenessHeader({ characterName, isNew, completeness }) {
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

CompletenessHeader.propTypes = {
  characterName: PropTypes.string.isRequired,
  isNew: PropTypes.bool.isRequired,
  completeness: PropTypes.shape({
    moodCount: PropTypes.number.isRequired,
    spriteCount: PropTypes.number.isRequired,
    percentage: PropTypes.number.isRequired
  }).isRequired
};
