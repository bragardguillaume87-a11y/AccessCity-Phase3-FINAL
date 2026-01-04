import { useState } from 'react';

/**
 * Custom hook for managing settings import/export functionality
 * Handles JSON file export and import with validation
 *
 * @param {Object} formData - Current form data to export
 * @param {Function} setFormData - Function to update form data on import
 * @returns {Object} - { handleExport, handleImport }
 */
export function useSettingsImportExport(formData, setFormData) {
  /**
   * Export settings as JSON file
   * Creates a downloadable JSON file with current settings
   */
  const handleExport = () => {
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
      console.error('Failed to export settings:', error);
      alert('Échec de l\'exportation des paramètres');
    }
  };

  /**
   * Import settings from JSON file
   * Validates JSON structure before importing
   *
   * @param {Event} e - File input change event
   */
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Veuillez sélectionner un fichier JSON valide');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        // Parse JSON content
        const imported = JSON.parse(event.target.result);

        // Validate imported structure
        if (!imported.project || !imported.editor || !imported.game) {
          throw new Error('Structure de fichier invalide');
        }

        // Update form data with imported settings
        setFormData(imported);

        alert('Paramètres importés avec succès !');
      } catch (error) {
        console.error('Import error:', error);
        alert('Échec de l\'importation : fichier JSON invalide');
      }
    };

    reader.onerror = () => {
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
