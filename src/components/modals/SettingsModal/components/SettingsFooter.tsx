import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Props for SettingsFooter component
 */
export interface SettingsFooterProps {
  /** Callback when Cancel button is clicked */
  onCancel: () => void;
  /** Callback when Save button is clicked */
  onSave: () => void;
}

/**
 * SettingsFooter - Footer section of settings modal
 *
 * Contains Cancel and Save buttons with Nintendo-style animations.
 * Provides actions to discard or save settings changes.
 *
 * @param props - Component props
 * @param props.onCancel - Callback when Cancel button is clicked
 * @param props.onSave - Callback when Save button is clicked
 *
 * @example
 * ```tsx
 * <SettingsFooter
 *   onCancel={() => handleCancel()}
 *   onSave={() => handleSave()}
 * />
 * ```
 */
export function SettingsFooter({ onCancel, onSave }: SettingsFooterProps): React.ReactElement {
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
