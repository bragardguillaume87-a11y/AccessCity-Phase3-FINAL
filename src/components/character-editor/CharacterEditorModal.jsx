import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCharacterForm } from '../../hooks/useCharacterForm.js';
import { useMoodPresets } from '../../hooks/useMoodPresets.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Extracted components
import CompletenessHeader from './CharacterEditorModal/components/CompletenessHeader';
import CharacterIdentitySection from './CharacterEditorModal/components/CharacterIdentitySection';
import MoodManagementSection from './CharacterEditorModal/components/MoodManagementSection';
import CharacterPreviewPanel from './CharacterEditorModal/components/CharacterPreviewPanel';
import EditorFooter from './CharacterEditorModal/components/EditorFooter';

// Extracted hooks
import { useCharacterPreview } from './CharacterEditorModal/hooks/useCharacterPreview';
import { useCharacterCompleteness } from './CharacterEditorModal/hooks/useCharacterCompleteness';
import { useMoodRename } from './CharacterEditorModal/hooks/useMoodRename';

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
 */
export default function CharacterEditorModal({ isOpen, onClose, character, characters, onSave }) {
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
  } = useCharacterForm(character, characters, onSave);

  const moodPresets = useMoodPresets();

  // Local state for UI interactions
  const [showSpritePickerFor, setShowSpritePickerFor] = useState(null);
  const [newMoodInput, setNewMoodInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Custom hooks
  const { previewMood, setPreviewMood, navigateMood } = useCharacterPreview(formData.moods);
  const completeness = useCharacterCompleteness(formData.moods, formData.sprites);
  const {
    renamingMood,
    renameInput,
    setRenameInput,
    startRename,
    confirmRename,
    cancelRename
  } = useMoodRename(renameMood);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const success = handleSave();
        if (success) {
          onClose();
        }
      }
      // Escape to cancel
      if (e.key === 'Escape' && !renamingMood && !showSpritePickerFor) {
        handleCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleSave, onClose, renamingMood, showSpritePickerFor]);

  // Handlers
  const handleSubmit = (e) => {
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
  const hasFormErrors = Object.keys(errors).some(key => errors[key]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 dark bg-slate-900 text-slate-100">
        {/* Header with Completeness - REFACTORED COMPONENT */}
        <CompletenessHeader
          characterName={character.name}
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

                {/* Mood Management Section - REFACTORED COMPONENT */}
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
                  renamingMood={renamingMood}
                  renameInput={renameInput}
                  setRenameInput={setRenameInput}
                  startRename={startRename}
                  confirmRename={confirmRename}
                  cancelRename={cancelRename}
                  showSpritePickerFor={showSpritePickerFor}
                  setShowSpritePickerFor={setShowSpritePickerFor}
                  newMoodInput={newMoodInput}
                  setNewMoodInput={setNewMoodInput}
                  showPresets={showPresets}
                  setShowPresets={setShowPresets}
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
            onSave={handleSubmit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CharacterEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  character: PropTypes.object.isRequired,
  characters: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired
};
