import React, { useEffect, useState } from 'react';
import { useCharacterForm } from '../../hooks/useCharacterForm';
import { useMoodPresets } from '../../hooks/useMoodPresets';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Wand2, Settings2 } from 'lucide-react';
import type { Character } from '@/types';

// Expert mode components
import CompletenessHeader from './CharacterEditorModal/components/CompletenessHeader';
import CharacterIdentitySection from './CharacterEditorModal/components/CharacterIdentitySection';
import MoodManagementSection from './CharacterEditorModal/components/MoodManagementSection';
import CharacterPreviewPanel from './CharacterEditorModal/components/CharacterPreviewPanel';
import EditorFooter from './CharacterEditorModal/components/EditorFooter';

// Expert mode hooks
import { useCharacterPreview } from './CharacterEditorModal/hooks/useCharacterPreview';
import { useCharacterCompleteness } from './CharacterEditorModal/hooks/useCharacterCompleteness';

// Wizard mode
import CharacterWizard from './CharacterWizard';

/**
 * Editor mode type
 */
type EditorMode = 'wizard' | 'expert';

/**
 * Props for CharacterEditorModal component
 */
export interface CharacterEditorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Character to edit (partial for new characters) */
  character: Partial<Character>;
  /** All characters (for duplicate name validation) */
  characters: Character[];
  /** Callback when character is saved */
  onSave: (character: Character) => void;
  /** Default editor mode (wizard for kids, expert for advanced users) */
  defaultMode?: EditorMode;
}

/**
 * CharacterEditorModal - Dual-mode Character Editor
 *
 * Features two modes:
 * - WIZARD MODE (default): Kid-friendly 4-step guided flow
 * - EXPERT MODE: Advanced split-view editor for power users
 *
 * Mode can be switched via toggle button in top-right corner.
 */
export default function CharacterEditorModal({
  isOpen,
  onClose,
  character,
  characters,
  onSave,
  defaultMode = 'wizard'
}: CharacterEditorModalProps) {
  const [mode, setMode] = useState<EditorMode>(defaultMode);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  const handleModeToggle = () => {
    setMode(prev => prev === 'wizard' ? 'expert' : 'wizard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent
        className="max-w-7xl h-[90vh] p-0 gap-0 dark bg-background text-foreground"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Mode toggle button */}
        <div className="absolute top-6 right-16 z-10">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleModeToggle}
            className="bg-card/90 backdrop-blur-sm border-2 border-primary/30 text-foreground hover:bg-card hover:border-primary hover:text-primary gap-2 font-medium shadow-lg transition-all duration-200 hover:scale-105"
          >
            {mode === 'wizard' ? (
              <>
                <Settings2 className="h-4 w-4" />
                Mode expert
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Mode simple
              </>
            )}
          </Button>
        </div>

        {mode === 'wizard' ? (
          <CharacterWizard
            character={character}
            characters={characters}
            onSave={onSave}
            onClose={onClose}
          />
        ) : (
          <ExpertModeContent
            character={character}
            characters={characters}
            onSave={onSave}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * ExpertModeContent - Advanced split-view editor
 *
 * Original editor layout with all features intact.
 */
function ExpertModeContent({
  character,
  characters,
  onSave,
  onClose
}: {
  character: Partial<Character>;
  characters: Character[];
  onSave: (character: Character) => void;
  onClose: () => void;
}) {
  // Form management
  const {
    formData,
    errors,
    warnings,
    hasChanges,
    updateField,
    addMood,
    removeMood,
    updateSprite,
    renameMood,
    handleSave,
    resetForm
  } = useCharacterForm(character as Character, characters, onSave);

  const moodPresets = [...useMoodPresets()];

  // Custom hooks
  const { previewMood, setPreviewMood } = useCharacterPreview(formData.moods);
  const completeness = useCharacterCompleteness(formData.moods, formData.sprites);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const success = handleSave();
        if (success) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = handleSave();
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?'
      );
      if (!confirmClose) return;
    }
    resetForm();
    onClose();
  };

  const hasFormErrors = Object.keys(errors).some(key => errors[key as keyof typeof errors]);

  return (
    <>
      {/* Header with Completeness */}
      <CompletenessHeader
        characterName={character.name || 'Nouveau personnage'}
        isNew={!character.id}
        completeness={completeness}
      />

      {/* Split View Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Form (45%) */}
        <div className="w-[45%] border-r flex flex-col">
          <ScrollArea className="flex-1 px-8 py-6">
            <div className="space-y-8">
              <CharacterIdentitySection
                formData={{
                  name: formData.name,
                  description: formData.description,
                  id: character.id
                }}
                errors={errors}
                onUpdateField={updateField}
              />

              <MoodManagementSection
                formData={{
                  moods: formData.moods,
                  sprites: formData.sprites
                }}
                errors={errors}
                warnings={warnings}
                onAddMood={addMood}
                onRemoveMood={removeMood}
                onRenameMood={renameMood}
                onUpdateSprite={updateSprite}
                moodPresets={moodPresets}
              />
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL - Preview (55%) */}
        <CharacterPreviewPanel
          formData={{
            name: formData.name,
            sprites: formData.sprites,
            moods: formData.moods
          }}
          previewMood={previewMood}
          onPreviewMoodChange={setPreviewMood}
          completeness={completeness}
        />
      </form>

      {/* Footer */}
      <DialogFooter className="px-8 py-4 border-t">
        <EditorFooter
          hasChanges={hasChanges}
          hasFormErrors={hasFormErrors}
          isNew={!character.id}
          onCancel={handleCancel}
          onSave={() => {
            const success = handleSave();
            if (success) onClose();
          }}
        />
      </DialogFooter>
    </>
  );
}
