import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';

/**
 * SettingsFooter - Footer section of settings modal
 * Contains Cancel and Save buttons with Nintendo-style animations
 *
 * @param {Object} props
 * @param {Function} props.onCancel - Callback when Cancel button is clicked
 * @param {Function} props.onSave - Callback when Save button is clicked
 */
export function SettingsFooter({ onCancel, onSave }) {
  return (
    <div className="border-t px-8 py-4 flex justify-end gap-3 bg-gradient-to-t from-muted/20 to-background">
      <Button
        variant="outline"
        onClick={onCancel}
        className="transition-all duration-200 hover:scale-105 active:scale-95 hover:border-destructive/50"
      >
        Annuler
      </Button>
      <Button
        onClick={onSave}
        className="transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
      >
        Enregistrer les paramètres
      </Button>
    </div>
  );
}

SettingsFooter.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};
