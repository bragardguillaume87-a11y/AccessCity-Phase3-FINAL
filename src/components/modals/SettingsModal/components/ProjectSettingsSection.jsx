import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

/**
 * ProjectSettingsSection - Project metadata configuration
 * Allows editing of project title, author, description, and version
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onFieldChange - Callback when a field changes (section, field, value)
 */
export function ProjectSettingsSection({ formData, onFieldChange }) {
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

ProjectSettingsSection.propTypes = {
  formData: PropTypes.shape({
    project: PropTypes.shape({
      title: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      version: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired
};
