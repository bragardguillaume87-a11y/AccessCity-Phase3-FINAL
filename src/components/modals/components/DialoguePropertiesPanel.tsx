import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScenesStore } from '@/stores';
import { useCharactersStore } from '@/stores';
import type { Dialogue } from '@/types';

/**
 * DialoguePropertiesPanel - Panneau latéral d'édition rapide des propriétés d'un dialogue
 *
 * PHASE 3: Permet l'édition directe sans ouvrir le wizard complet
 *
 * Features:
 * - Speaker selector (dropdown avec personnages disponibles)
 * - Text editor (textarea multi-lignes)
 * - Choix affichés (lecture seule pour PHASE 3, édition via wizard)
 * - Boutons Save / Cancel
 * - Auto-save optionnel
 *
 * Accessibilité:
 * - Labels clairs sur tous les champs
 * - Focus management
 * - ARIA attributes
 */

export interface DialoguePropertiesPanelProps {
  /** ID de la scène contenant le dialogue */
  sceneId: string;
  /** Index du dialogue dans la scène */
  dialogueIndex: number;
  /** Callback pour fermer le panneau */
  onClose: () => void;
}

export function DialoguePropertiesPanel({
  sceneId,
  dialogueIndex,
  onClose,
}: DialoguePropertiesPanelProps) {
  // Stores
  const scenes = useScenesStore((state) => state.scenes);
  const updateDialogue = useScenesStore((state) => state.updateDialogue);
  const characters = useCharactersStore((state) => state.characters);

  // Find dialogue
  const scene = scenes.find((s) => s.id === sceneId);
  const dialogue = scene?.dialogues[dialogueIndex];

  // Local state for form
  const [formData, setFormData] = useState<{
    speaker: string;
    text: string;
  }>({
    speaker: dialogue?.speaker || 'Narrator',
    text: dialogue?.text || '',
  });

  // Update form when dialogue changes
  useEffect(() => {
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
      });
    }
  }, [dialogue]);

  // Has changes?
  const hasChanges =
    dialogue &&
    (formData.speaker !== dialogue.speaker || formData.text !== dialogue.text);

  // Handle save
  const handleSave = () => {
    if (!hasChanges || !dialogue) return;

    updateDialogue(sceneId, dialogueIndex, {
      speaker: formData.speaker,
      text: formData.text,
    });

    // Close panel after save
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    // Reset form to original values
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
      });
    }
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, hasChanges]);

  if (!dialogue) {
    return (
      <div className="w-[30%] border-l-2 border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-y-auto">
        <div className="p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            Aucun dialogue sélectionné
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[30%] border-l-2 border-[var(--color-border-base)] bg-[var(--color-bg-elevated)] overflow-y-auto"
      role="complementary"
      aria-label="Panneau de propriétés du dialogue"
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Propriétés
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Dialogue #{dialogueIndex + 1}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Fermer le panneau de propriétés"
            title="Fermer (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Speaker Selector */}
        <div className="space-y-2">
          <label
            htmlFor="speaker-select"
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            Personnage
          </label>
          <Select
            value={formData.speaker}
            onValueChange={(value) =>
              setFormData({ ...formData, speaker: value })
            }
          >
            <SelectTrigger id="speaker-select" className="w-full">
              <SelectValue placeholder="Sélectionner un personnage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Narrator">Narrateur</SelectItem>
              <SelectItem value="player">Joueur</SelectItem>
              {characters.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  {character.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Editor */}
        <div className="space-y-2">
          <label
            htmlFor="dialogue-text"
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            Texte du dialogue
          </label>
          <Textarea
            id="dialogue-text"
            value={formData.text}
            onChange={(e) =>
              setFormData({ ...formData, text: e.target.value })
            }
            rows={8}
            className="w-full resize-none font-sans"
            placeholder="Entrez le texte du dialogue..."
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            {formData.text.length} caractères
          </p>
        </div>

        {/* Choices (Read-only for PHASE 3) */}
        {dialogue.choices.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Choix ({dialogue.choices.length})
            </label>
            <div className="space-y-2">
              {dialogue.choices.map((choice, index) => (
                <div
                  key={choice.id}
                  className="p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded-lg"
                >
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {index + 1}. {choice.text}
                  </p>
                  {choice.nextDialogueId && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      → Dialogue: {choice.nextDialogueId}
                    </p>
                  )}
                  {choice.nextSceneId && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      → Scène: {choice.nextSceneId}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] italic">
              Pour éditer les choix, double-cliquez sur le node pour ouvrir le wizard
            </p>
          </div>
        )}

        {/* Response Badge */}
        {dialogue.isResponse && (
          <div className="p-3 bg-emerald-900/20 border border-emerald-600/50 rounded-lg">
            <p className="text-sm text-emerald-300 font-medium">
              💬 Dialogue de réponse (branche)
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-[var(--color-border-base)]">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 flex items-center justify-center gap-2"
            title="Enregistrer (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Annuler
          </Button>
        </div>

        {/* Keyboard hints */}
        <div className="pt-4 border-t border-[var(--color-border-base)] space-y-1">
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            Raccourcis clavier :
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded">
                Ctrl+S
              </kbd>{' '}
              Enregistrer
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-base)] border border-[var(--color-border-base)] rounded">
                Esc
              </kbd>{' '}
              Annuler
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
