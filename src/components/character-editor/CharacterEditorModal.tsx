import React, { useEffect } from 'react';
import { useCharacterForm } from '../../hooks/useCharacterForm';
import { useMoodPresets } from '../../hooks/useMoodPresets';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Character } from '@/types';

// Extracted components
import CompletenessHeader from './CharacterEditorModal/components/CompletenessHeader';
import CharacterIdentitySection from './CharacterEditorModal/components/CharacterIdentitySection';
import MoodManagementSection from './CharacterEditorModal/components/MoodManagementSection';
import CharacterPreviewPanel from './CharacterEditorModal/components/CharacterPreviewPanel';
import EditorFooter from './CharacterEditorModal/components/EditorFooter';

// Extracted hooks
import { useCharacterPreview } from './CharacterEditorModal/hooks/useCharacterPreview';
import { useCharacterCompleteness } from './CharacterEditorModal/hooks/useCharacterCompleteness';

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
}

/**
 * CharacterEditorModal - REFACTORED (Phase 6D-2)
 * AAA Split-View Character Editor
 *
 * IMPROVEMENTS:
 * - Reduced from 680 to ~200 lines (-71%)
 * - Extracted 6 components + 3 hooks
 * - Dark theme uniformization (bg-amber-50 → bg-amber-500/10)
 * - Nintendo UX enhancements (hover animations, smooth transitions)
 * - Better code organization and maintainability
 *
 * Features:
 * - Split-view layout (Form 45% | Preview 55%)
 * - Live character preview with mood carousel
 * - Inline sprite assignment with popover (no modal-in-modal)
 * - Completeness progress indicator
 * - Smooth animations and transitions
 * - Keyboard shortcuts (Ctrl+S to save, Escape to cancel)
 *
 * Inspired by:
 * - Unreal Engine Character Editor
 * - Unity Animation Preview
 * - Nintendo UX Guide: Preview en temps réel
 *
 * @example
 * ```tsx
 * <CharacterEditorModal
 *   isOpen={showEditor}
 *   onClose={() => setShowEditor(false)}
 *   character={selectedCharacter || {}}
 *   characters={allCharacters}
 *   onSave={handleSaveCharacter}
 * />
 * ```
 */
export default function CharacterEditorModal({
  isOpen,
  onClose,
  character,
  characters,
  onSave
}: CharacterEditorModalProps) {
  // Form management (keep using existing hook)
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

  const moodPresets = [...useMoodPresets()]; // Convert readonly to mutable

  // Custom hooks
  const { previewMood, setPreviewMood } = useCharacterPreview(formData.moods);
  const completeness = useCharacterCompleteness(formData.moods, formData.sprites);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const success = handleSave();
        if (success) {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleSave, onClose]);

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

  // Check if form has errors
  const hasFormErrors = Object.keys(errors).some(key => errors[key as keyof typeof errors]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 dark bg-background text-foreground">
        {/* Header with Completeness - REFACTORED COMPONENT */}
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
                {/* Identity Section - REFACTORED COMPONENT */}
                <CharacterIdentitySection
                  formData={{
                    name: formData.name,
                    description: formData.description,
                    id: character.id
                  }}
                  errors={errors}
                  onUpdateField={updateField}
                />

                {/* Mood Management Section - REFACTORED (Phase 7: 27 props → 8 props) */}
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

          {/* RIGHT PANEL - Preview (55%) - REFACTORED COMPONENT */}
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

        {/* Footer - REFACTORED COMPONENT */}
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
      </DialogContent>
    </Dialog>
  );
}
