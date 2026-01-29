import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { t } from '@/lib/translations';
import { Button } from '@/components/ui/button';

interface ConfirmDeletePanelProps {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDeletePanel - Kid-friendly delete confirmation
 *
 * Clear visual warning with large buttons.
 * Reassuring text to prevent accidental deletion.
 */
export function ConfirmDeletePanel({
  characterName,
  onConfirm,
  onCancel
}: ConfirmDeletePanelProps) {
  return (
    <div className="animate-step-slide">
      {/* Warning icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-center mb-2">
        {t('confirmDelete.title', { name: characterName })}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground text-center mb-6">
        {t('confirmDelete.message')}
      </p>

      {/* Reassurance */}
      <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <p className="text-xs text-blue-400 text-center">
          Ne t'inquiète pas ! Le personnage reste dans ta bibliothèque.
          Tu pourras le remettre dans la scène plus tard.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12"
        >
          <X className="w-4 h-4 mr-2" />
          {t('confirmDelete.cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          className="flex-1 h-12"
        >
          <Check className="w-4 h-4 mr-2" />
          {t('confirmDelete.confirm')}
        </Button>
      </div>
    </div>
  );
}

export default ConfirmDeletePanel;
