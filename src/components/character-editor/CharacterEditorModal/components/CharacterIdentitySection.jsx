import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * CharacterIdentitySection - Character Identity Form Fields
 *
 * Displays the identity section of the character editor with:
 * - Name field (required) with validation
 * - Description field (optional) with character counter
 * - Character ID display (read-only, only for existing characters)
 *
 * Includes professional form validation and error display
 *
 * @component
 * @param {Object} props
 * @param {Object} props.formData - Character form data
 * @param {string} props.formData.name - Character name
 * @param {string} [props.formData.description] - Character description
 * @param {string} [props.formData.id] - Character ID (only for existing characters)
 * @param {Object} props.errors - Validation errors object
 * @param {Array<string>} [props.errors.name] - Name field errors
 * @param {Array<string>} [props.errors.description] - Description field errors
 * @param {Function} props.onUpdateField - Callback to update a field (fieldName, value)
 */
export default function CharacterIdentitySection({ formData, errors, onUpdateField }) {
  const { name, description, id } = formData;
  const descriptionLength = (description || '').length;
  const maxDescriptionLength = 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-lg font-semibold">Identité</h3>
      </div>

      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="character-name" className="text-sm font-medium">
          Nom du personnage <span className="text-destructive">*</span>
        </Label>
        <Input
          id="character-name"
          type="text"
          value={name}
          onChange={(e) => onUpdateField('name', e.target.value)}
          placeholder="Ex: Alice, Bob, Charlie..."
          className={`transition-all duration-200 ${
            errors.name
              ? 'border-destructive focus-visible:ring-destructive'
              : 'focus-visible:ring-primary'
          }`}
          autoFocus
        />
        {errors.name && (
          <Alert variant="destructive" className="py-2 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.name[0]}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="character-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="character-description"
          value={description || ''}
          onChange={(e) => onUpdateField('description', e.target.value)}
          rows={4}
          placeholder="Décrivez votre personnage..."
          className={`transition-all duration-200 resize-none ${
            errors.description
              ? 'border-destructive focus-visible:ring-destructive'
              : 'focus-visible:ring-primary'
          }`}
          maxLength={maxDescriptionLength}
        />
        <div className="flex justify-between items-center">
          {errors.description && (
            <Alert variant="destructive" className="py-2 flex-1 mr-4 animate-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.description[0]}</AlertDescription>
            </Alert>
          )}
          <span className={`text-xs ml-auto transition-colors duration-200 ${
            descriptionLength > maxDescriptionLength * 0.9
              ? 'text-amber-500 font-semibold'
              : 'text-muted-foreground'
          }`}>
            {descriptionLength} / {maxDescriptionLength}
          </span>
        </div>
      </div>

      {/* Character ID (read-only) */}
      {id && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">ID Personnage</Label>
          <div className="px-3 py-2 bg-muted/50 border rounded-lg text-sm font-mono text-muted-foreground transition-colors hover:bg-muted/70 duration-200">
            {id}
          </div>
        </div>
      )}
    </div>
  );
}

CharacterIdentitySection.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    id: PropTypes.string
  }).isRequired,
  errors: PropTypes.object.isRequired,
  onUpdateField: PropTypes.func.isRequired
};
