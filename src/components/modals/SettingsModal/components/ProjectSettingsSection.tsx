import React from 'react';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';
import type { SettingsFormData } from '../hooks/useSettingsImportExport';

/**
 * Props for ProjectSettingsSection component
 */
export interface ProjectSettingsSectionProps {
  /** Current form data */
  formData: SettingsFormData;
  /** Callback when a field changes (section, field, value) */
  onFieldChange: (section: string, field: string, value: string) => void;
}

/**
 * ProjectSettingsSection - Project metadata configuration
 *
 * Allows editing of project title, author, description, and version.
 * Provides text inputs for all project metadata fields with hover animations.
 *
 * @param props - Component props
 * @param props.formData - Current form data
 * @param props.onFieldChange - Callback when a field changes (section, field, value)
 *
 * @example
 * ```tsx
 * <ProjectSettingsSection
 *   formData={formData}
 *   onFieldChange={handleFieldChange}
 * />
 * ```
 */
export function ProjectSettingsSection({
  formData,
  onFieldChange
}: ProjectSettingsSectionProps): React.ReactElement {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Infos du Projet
        </h3>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Project Title */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="project-title" className="block text-sm font-semibold mb-2">
            Titre du projet
          </label>
          <Input
            id="project-title"
            type="text"
            value={formData.project.title}
            onChange={(e) => onFieldChange('project', 'title', e.target.value)}
            placeholder="Mon histoire AccessCity"
            className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
          />
        </div>

        {/* Author */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="project-author" className="block text-sm font-semibold mb-2">
            Auteur
          </label>
          <Input
            id="project-author"
            type="text"
            value={formData.project.author}
            onChange={(e) => onFieldChange('project', 'author', e.target.value)}
            placeholder="Nom de l'auteur"
            className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
          />
        </div>

        {/* Description */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="project-description" className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            id="project-description"
            value={formData.project.description}
            onChange={(e) => onFieldChange('project', 'description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     transition-all duration-200 hover:border-primary/50 focus:border-primary"
            placeholder="Décris ton histoire interactive..."
          />
        </div>

        {/* Version */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="project-version" className="block text-sm font-semibold mb-2">
            Version
          </label>
          <Input
            id="project-version"
            type="text"
            value={formData.project.version}
            onChange={(e) => onFieldChange('project', 'version', e.target.value)}
            placeholder="1.0.0"
            className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
