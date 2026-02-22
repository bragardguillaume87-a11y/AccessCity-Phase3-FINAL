import React from 'react';
import { logger } from '@/utils/logger';

/**
 * Settings form data structure
 */
export interface SettingsFormData {
  project: {
    title: string;
    author: string;
    description: string;
    version: string;
  };
  editor: {
    theme: string;
    autosave: boolean;
    autosaveInterval: number;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
  };
  game: {
    variables: {
      [key: string]: {
        initial: number;
        min: number;
        max: number;
      };
    };
  };
}

/**
 * Return type for useSettingsImportExport hook
 */
export interface UseSettingsImportExportReturn {
  /** Handler to export settings as JSON file */
  handleExport: () => void;
  /** Handler to import settings from JSON file */
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Custom hook for managing settings import/export functionality
 *
 * Handles JSON file export and import with validation.
 * Exports create a downloadable JSON file with current settings.
 * Imports validate JSON structure before applying changes.
 *
 * @param formData - Current form data to export
 * @param setFormData - Function to update form data on import
 * @returns Object containing handleExport and handleImport functions
 *
 * @example
 * ```tsx
 * const { handleExport, handleImport } = useSettingsImportExport(formData, setFormData);
 * ```
 */
export function useSettingsImportExport(
  formData: SettingsFormData,
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
): UseSettingsImportExportReturn {
  /**
   * Export settings as JSON file
   * Creates a downloadable JSON file with current settings
   */
  const handleExport = (): void => {
    try {
      // Convert form data to formatted JSON string
      const dataStr = JSON.stringify(formData, null, 2);

      // Create blob from JSON string
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download URL
      const url = URL.createObjectURL(dataBlob);

      // Create temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'accesscity-parametres.json';

      // Trigger download
      link.click();

      // Clean up URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('[Settings] Failed to export:', error);
      alert('Échec de l\'exportation des paramètres');
    }
  };

  /**
   * Import settings from JSON file
   * Validates JSON structure before importing
   *
   * @param e - File input change event
   */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Veuillez sélectionner un fichier JSON valide');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>): void => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Contenu de fichier invalide');
        }

        // Parse JSON content
        const imported = JSON.parse(result) as SettingsFormData;

        // Validate imported structure
        if (!imported.project || !imported.editor || !imported.game) {
          throw new Error('Structure de fichier invalide');
        }

        // Update form data with imported settings
        setFormData(imported);

        alert('Paramètres importés avec succès !');
      } catch (error) {
        logger.error('[Settings] Import error:', error);
        alert('Échec de l\'importation : fichier JSON invalide');
      }
    };

    reader.onerror = (): void => {
      alert('Erreur lors de la lecture du fichier');
    };

    // Read file as text
    reader.readAsText(file);

    // Reset input value to allow re-importing same file
    e.target.value = '';
  };

  return {
    handleExport,
    handleImport
  };
}
