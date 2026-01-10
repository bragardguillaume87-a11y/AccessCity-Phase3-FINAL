// src/components/ImportPanel.tsx
import React from 'react';
import { useSettingsStore } from '../stores/index';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

/**
 * ImportPanel component props
 */
export interface ImportPanelProps {}

/**
 * Imported JSON data structure
 */
interface ImportedData {
  title?: string;
  location?: string;
  tone?: string;
  description?: string;
}

/**
 * ImportPanel - Import core system configuration from JSON
 *
 * Features:
 * - File upload for core_system.json
 * - Validates and imports project configuration
 * - Toast notifications for success/error
 */
export default function ImportPanel(): React.JSX.Element {
  const setContextField = useSettingsStore(state => state.setContextField);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (): void => {
      try {
        const txt = String(reader.result || '');
        const json: unknown = JSON.parse(txt);

        if (json && typeof json === 'object') {
          const data = json as ImportedData;
          let imported = false;

          if ('title' in data) {
            setContextField('title', data.title || '');
            imported = true;
          }
          if ('location' in data) {
            setContextField('location', data.location || '');
            imported = true;
          }
          if ('tone' in data) {
            setContextField('tone', data.tone || '');
            imported = true;
          }
          if ('description' in data) {
            setContextField('description', data.description || '');
            imported = true;
          }

          if (imported) {
            toast.success(`Configuration importee avec succes depuis ${file.name}`);
          } else {
            toast.warning('Aucune donnee reconnue dans le fichier');
          }
        } else {
          toast.error('Fichier JSON invalide');
        }
      } catch (err) {
        toast.error('Erreur de lecture du fichier JSON');
        logger.error('Import error:', err);
      }
    };

    reader.onerror = (): void => {
      toast.error('Impossible de lire le fichier');
    };

    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Import</h2>
      <p className="text-sm text-slate-600">Importez un fichier core_system.json.</p>

      <div>
        <label
          htmlFor="import-file"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Choisir un fichier JSON
        </label>
        <input
          id="import-file"
          type="file"
          accept="application/json,.json"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
          aria-describedby="import-help"
        />
        <p id="import-help" className="text-xs text-slate-500 mt-2">
          Selectionnez un fichier JSON contenant la configuration du contexte.
        </p>
      </div>
    </div>
  );
}
