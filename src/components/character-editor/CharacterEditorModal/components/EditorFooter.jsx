import React from 'react';
import PropTypes from 'prop-types';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Save
} from 'lucide-react';

/**
 * EditorFooter - Character Editor Footer with Action Buttons
 *
 * Displays the footer section with:
 * - Unsaved changes indicator badge
 * - Cancel button
 * - Save/Create button (disabled if form has errors)
 *
 * Includes Nintendo-style UX with hover and active animations
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.hasChanges - Whether there are unsaved changes
 * @param {boolean} props.hasFormErrors - Whether the form has validation errors
 * @param {boolean} props.isNew - Whether this is a new character (create) or editing existing (save)
 * @param {Function} props.onCancel - Callback when cancel button is clicked
 * @param {Function} props.onSave - Callback when save button is clicked
 */
export default function EditorFooter({ hasChanges, hasFormErrors, isNew, onCancel, onSave }) {
  return (
    <DialogFooter className="px-8 py-4 border-t">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-400 border-amber-500/30 transition-all hover:scale-105 duration-200"
            >
              <AlertCircle className="h-3 w-3 mr-1.5" />
              Modifications non sauvegardées
            </Badge>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="transition-transform hover:scale-105 active:scale-95 duration-200"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={onSave}
            disabled={hasFormErrors}
            className="transition-transform hover:scale-105 active:scale-95 duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? 'Créer personnage' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
}

EditorFooter.propTypes = {
  hasChanges: PropTypes.bool.isRequired,
  hasFormErrors: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};
