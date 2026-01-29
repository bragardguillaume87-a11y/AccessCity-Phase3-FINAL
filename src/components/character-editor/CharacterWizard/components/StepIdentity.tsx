import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, FileText } from 'lucide-react';
import EncouragingMessage from './EncouragingMessage';

interface StepIdentityProps {
  name: string;
  description: string;
  onUpdateName: (name: string) => void;
  onUpdateDescription: (desc: string) => void;
  onValidChange: (isValid: boolean) => void;
  nameError?: string;
}

const NAME_EXAMPLES = ['Luna', 'Max', 'Sophie', 'Léo', 'Emma', 'Hugo'];

/**
 * StepIdentity - Step 1: Character name and description
 *
 * Kid-friendly input with large text, placeholders,
 * and encouraging feedback messages.
 */
export function StepIdentity({
  name,
  description,
  onUpdateName,
  onUpdateDescription,
  onValidChange,
  nameError
}: StepIdentityProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const randomExample = NAME_EXAMPLES[Math.floor(Math.random() * NAME_EXAMPLES.length)];

  // Validation
  const isNameValid = name.trim().length >= 2;

  useEffect(() => {
    onValidChange(isNameValid);

    // Show success message when name becomes valid
    if (isNameValid && !showSuccess) {
      setShowSuccess(true);
    }
  }, [isNameValid, onValidChange, showSuccess]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-capitalize first letter
    const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
    onUpdateName(capitalized);
  };

  return (
    <div className="space-y-8 animate-step-slide">
      {/* Name input */}
      <div className="space-y-3">
        <Label htmlFor="character-name" className="flex items-center gap-2 text-base font-medium">
          <User className="h-5 w-5 text-primary" />
          Comment s'appelle ton personnage ?
        </Label>
        <Input
          id="character-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder={`Par exemple : ${randomExample}`}
          maxLength={50}
          autoFocus
          className="h-14 text-lg px-4 touch-target-xl"
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}

        {/* Success feedback */}
        {isNameValid && showSuccess && (
          <EncouragingMessage
            type="success"
            message={`Super nom ! "${name}" est prêt pour l'aventure !`}
          />
        )}
      </div>

      {/* Description input (optional) */}
      <div className="space-y-3">
        <Label htmlFor="character-desc" className="flex items-center gap-2 text-base font-medium">
          <FileText className="h-5 w-5 text-primary" />
          Une petite description ? <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Textarea
          id="character-desc"
          value={description}
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder="Décris ton personnage en quelques mots..."
          maxLength={500}
          rows={3}
          className="text-base px-4 py-3 resize-none"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Optionnel - tu peux laisser vide</span>
          <span>{description.length} / 500</span>
        </div>
      </div>

      {/* Helper tip */}
      {!isNameValid && (
        <EncouragingMessage
          type="info"
          message="Écris au moins 2 lettres pour le nom de ton personnage"
        />
      )}
    </div>
  );
}

export default StepIdentity;
