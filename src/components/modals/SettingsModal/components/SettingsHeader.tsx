import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw, Download, Upload as UploadIcon } from 'lucide-react';

/**
 * Props for SettingsHeader component
 */
export interface SettingsHeaderProps {
  /** Callback to reset settings to defaults */
  onResetDefaults: () => void;
  /** Callback to export project as ZIP (JSON + assets) */
  onExport: () => Promise<void>;
  /** Callback to handle import file selection (.json or .zip) */
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether export is in progress */
  isExporting?: boolean;
}

/**
 * SettingsHeader - Header section of settings modal
 */
export function SettingsHeader({
  onResetDefaults,
  onExport,
  onImport,
  isExporting = false,
}: SettingsHeaderProps): React.ReactElement {
  return (
    <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center justify-between">
        {/* Title and Description */}
        <div>
          <DialogTitle className="flex items-center gap-3 text-3xl font-bold mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary transition-transform duration-200 hover:scale-110">
              <Settings className="h-7 w-7" />
            </div>
            Paramètres du Projet
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure ton projet AccessCity, tes préférences d'éditeur et tes variables de jeu
          </DialogDescription>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetDefaults}
            className="transition-all duration-200 hover:scale-105 active:scale-95 hover:border-primary/50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            title="Exporter le projet complet (JSON + assets) en ZIP"
            className="transition-all duration-200 hover:scale-105 active:scale-95 hover:border-primary/50 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Export…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-settings')?.click()}
            className="transition-all duration-200 hover:scale-105 active:scale-95 hover:border-primary/50"
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Importer
          </Button>

          {/* Hidden file input for import — accepte .json et .zip */}
          <input
            id="import-settings"
            type="file"
            accept=".json,.zip"
            className="hidden"
            onChange={onImport}
          />
        </div>
      </div>
    </DialogHeader>
  );
}
