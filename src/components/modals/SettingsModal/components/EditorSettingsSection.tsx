import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Palette } from 'lucide-react';
import type { SettingsFormData } from '../hooks/useSettingsImportExport';

/**
 * Props for EditorSettingsSection component
 */
export interface EditorSettingsSectionProps {
  /** Current form data */
  formData: SettingsFormData;
  /** Callback when a field changes (section, field, value) */
  onFieldChange: (section: string, field: string, value: string | boolean | number) => void;
}

/**
 * EditorSettingsSection - Editor preferences configuration
 *
 * Allows editing theme, autosave, grid settings, and other editor preferences.
 * Includes theme selection, autosave toggle with interval, and grid configuration.
 *
 * @param props - Component props
 * @param props.formData - Current form data
 * @param props.onFieldChange - Callback when a field changes (section, field, value)
 *
 * @example
 * ```tsx
 * <EditorSettingsSection
 *   formData={formData}
 *   onFieldChange={handleFieldChange}
 * />
 * ```
 */
export function EditorSettingsSection({
  formData,
  onFieldChange
}: EditorSettingsSectionProps): React.ReactElement {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Préférences de l'Éditeur
        </h3>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Theme Selection */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="editor-theme" className="block text-sm font-semibold mb-2">
            Thème
          </label>
          <select
            id="editor-theme"
            value={formData.editor.theme}
            onChange={(e) => onFieldChange('editor', 'theme', e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     transition-all duration-200 hover:border-primary/50 focus:border-primary"
          >
            <option value="dark">Sombre</option>
            <option value="light">Clair</option>
          </select>
        </div>

        <Separator />

        {/* Autosave Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
            <Checkbox
              id="autosave"
              checked={formData.editor.autosave}
              onCheckedChange={(checked) => onFieldChange('editor', 'autosave', checked as boolean)}
              className="transition-transform duration-200 hover:scale-110"
            />
            <label htmlFor="autosave" className="text-sm font-semibold cursor-pointer">
              Activer la sauvegarde automatique
            </label>
          </div>

          <div className="transition-all duration-200 hover:translate-x-1">
            <label htmlFor="autosave-interval" className="block text-sm font-semibold mb-2">
              Intervalle de sauvegarde (secondes)
            </label>
            <Input
              id="autosave-interval"
              type="number"
              value={formData.editor.autosaveInterval / 1000}
              onChange={(e) => onFieldChange('editor', 'autosaveInterval', parseInt(e.target.value) * 1000)}
              min={10}
              max={300}
              className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <Separator />

        {/* Grid Settings */}
        <div className="space-y-3">
          <div className="transition-all duration-200 hover:translate-x-1">
            <label htmlFor="grid-size" className="block text-sm font-semibold mb-2">
              Taille de la grille (pixels)
            </label>
            <select
              id="grid-size"
              value={formData.editor.gridSize}
              onChange={(e) => onFieldChange('editor', 'gridSize', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring
                       transition-all duration-200 hover:border-primary/50 focus:border-primary"
            >
              <option value={10}>10px (Fine)</option>
              <option value={20}>20px (Moyenne)</option>
              <option value={50}>50px (Grossière)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
            <Checkbox
              id="snapToGrid"
              checked={formData.editor.snapToGrid}
              onCheckedChange={(checked) => onFieldChange('editor', 'snapToGrid', checked as boolean)}
              className="transition-transform duration-200 hover:scale-110"
            />
            <label htmlFor="snapToGrid" className="text-sm font-semibold cursor-pointer">
              Aimanter à la grille
            </label>
          </div>

          <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
            <Checkbox
              id="showGrid"
              checked={formData.editor.showGrid}
              onCheckedChange={(checked) => onFieldChange('editor', 'showGrid', checked as boolean)}
              className="transition-transform duration-200 hover:scale-110"
            />
            <label htmlFor="showGrid" className="text-sm font-semibold cursor-pointer">
              Afficher la grille
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
