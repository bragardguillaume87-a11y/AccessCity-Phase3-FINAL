import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Character form data for identity section
 */
export interface CharacterIdentityFormData {
  /** Character name (required) */
  name: string;
  /** Character description (optional) */
  description?: string;
  /** Character ID (read-only, only for existing characters) */
  id?: string;
  /** Narrator role — hides portrait in DialogueBox */
  role?: string;
}

/**
 * Validation errors for character identity fields
 */
export interface CharacterIdentityErrors {
  /** Name field errors */
  name?: string[];
  /** Description field errors */
  description?: string[];
}

/**
 * Props for CharacterIdentitySection component
 */
export interface CharacterIdentitySectionProps {
  /** Character form data */
  formData: CharacterIdentityFormData;
  /** Validation errors object */
  errors: CharacterIdentityErrors;
  /** Callback to update a field */
  onUpdateField: (fieldName: string, value: string) => void;
}

/**
 * CharacterIdentitySection - Character Identity Form Fields
 *
 * Displays the identity section of the character editor with:
 * - Name field (required) with validation
 * - Description field (optional) with character counter
 * - Character ID display (read-only, only for existing characters)
 *
 * Includes professional form validation and error display.
 *
 * @example
 * ```tsx
 * <CharacterIdentitySection
 *   formData={{ name: 'Alice', description: 'Brave adventurer' }}
 *   errors={{}}
 *   onUpdateField={(field, value) => setFormData({ ...formData, [field]: value })}
 * />
 * ```
 */
export default function CharacterIdentitySection({
  formData,
  errors,
  onUpdateField,
}: CharacterIdentitySectionProps) {
  const { name, description, id, role } = formData;
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
            <Alert
              variant="destructive"
              className="py-2 flex-1 mr-4 animate-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.description[0]}</AlertDescription>
            </Alert>
          )}
          <span
            className={`text-xs ml-auto transition-colors duration-200 ${
              descriptionLength > maxDescriptionLength * 0.9
                ? 'text-amber-500 font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            {descriptionLength} / {maxDescriptionLength}
          </span>
        </div>
      </div>

      {/* Role — Personnage / Narrateur */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rôle</Label>
        <div className="flex gap-3">
          {(
            [
              { value: 'speaker', emoji: '🗣️', label: 'Personnage' },
              { value: 'narrator', emoji: '📖', label: 'Narrateur' },
            ] as const
          ).map((opt) => {
            const active = (role ?? 'speaker') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateField('role', opt.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border-base)'}`,
                  background: active ? 'var(--color-primary-subtle)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
        {role === 'narrator' && (
          <p className="text-xs text-muted-foreground">
            Les dialogues de ce personnage s'afficheront sans portrait, en pleine largeur.
          </p>
        )}
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
