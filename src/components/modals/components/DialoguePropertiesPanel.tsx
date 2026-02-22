import { useState, useEffect, useCallback } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDialoguesStore } from '@/stores/dialoguesStore';
import { useCharactersStore } from '@/stores';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import { useDialogueTheme } from './dialogue-properties/useDialogueTheme';
import { SpeakerSection } from './dialogue-properties/SpeakerSection';
import { TextEditorSection } from './dialogue-properties/TextEditorSection';
import { ChoicesDisplay } from './dialogue-properties/ChoicesDisplay';

export interface DialoguePropertiesPanelProps {
  sceneId: string;
  dialogueIndex: number;
  onClose: () => void;
}

export function DialoguePropertiesPanel({ sceneId, dialogueIndex, onClose }: DialoguePropertiesPanelProps) {
  const updateDialogue = useDialoguesStore((state) => state.updateDialogue);
  const characters = useCharactersStore((state) => state.characters);
  const { celebrateNodeCreation } = useCosmosEffects();
  const theme = useDialogueTheme();

  const sceneDialogues = useDialoguesStore((s) => s.getDialoguesByScene(sceneId));
  const dialogue = sceneDialogues[dialogueIndex];

  const [formData, setFormData] = useState({
    speaker: dialogue?.speaker || 'Narrator',
    text: dialogue?.text || '',
    stageDirections: dialogue?.stageDirections || '',
  });

  useEffect(() => {
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
        stageDirections: dialogue.stageDirections || '',
      });
    }
  }, [dialogue, dialogueIndex, sceneId]);

  const hasChanges =
    dialogue &&
    (formData.speaker !== dialogue.speaker ||
     formData.text !== dialogue.text ||
     formData.stageDirections !== (dialogue.stageDirections || ''));

  const handleSave = useCallback(() => {
    if (!hasChanges || !dialogue) return;
    updateDialogue(sceneId, dialogueIndex, {
      speaker: formData.speaker,
      text: formData.text,
      stageDirections: formData.stageDirections || undefined,
    });
    if (theme.isCosmosTheme) celebrateNodeCreation();
    onClose();
  }, [hasChanges, dialogue, updateDialogue, sceneId, dialogueIndex, formData, theme.isCosmosTheme, celebrateNodeCreation, onClose]);

  const handleCancel = useCallback(() => {
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
        stageDirections: dialogue.stageDirections || '',
      });
    }
    onClose();
  }, [dialogue, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleCancel]);

  if (!dialogue) {
    return (
      <div className="w-[30%] border-l-2 overflow-y-auto" style={{ background: theme.panelBg, borderColor: theme.borderColor }}>
        <div className="p-6 text-center">
          <span className="text-4xl mb-4 block">🔭</span>
          <p className="text-sm" style={{ color: theme.mutedColor }}>
            {theme.isCosmosTheme ? 'Sélectionne une planète !' : 'Aucun dialogue sélectionné'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[30%] border-l-2 overflow-y-auto"
      style={{ background: theme.panelBg, borderColor: theme.borderColor }}
      role="complementary"
      aria-label="Panneau d'édition"
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: theme.isCosmosTheme
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
              : 'var(--color-bg-base)',
            border: `2px solid ${theme.isCosmosTheme ? '#a855f7' : 'var(--color-border-base)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{theme.isCosmosTheme ? '✏️' : '📝'}</span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>
                {theme.isCosmosTheme ? 'Modifier la bulle' : 'Éditer'}
              </h3>
              <p className="text-xs" style={{ color: theme.mutedColor }}>
                {theme.isCosmosTheme ? `🪐 Planète n°${dialogueIndex + 1}` : `Dialogue #${dialogueIndex + 1}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Fermer"
            className="hover:bg-red-500/20 rounded-full"
            style={{ color: theme.textColor }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <SpeakerSection
          speaker={formData.speaker}
          characters={characters}
          isCosmosTheme={theme.isCosmosTheme}
          textColor={theme.textColor}
          onChange={(speaker) => setFormData({ ...formData, speaker })}
        />

        <TextEditorSection
          text={formData.text}
          stageDirections={formData.stageDirections}
          isCosmosTheme={theme.isCosmosTheme}
          textColor={theme.textColor}
          mutedColor={theme.mutedColor}
          onTextChange={(text) => setFormData({ ...formData, text })}
          onStageDirectionsChange={(stageDirections) => setFormData({ ...formData, stageDirections })}
        />

        <ChoicesDisplay
          choices={dialogue.choices}
          isCosmosTheme={theme.isCosmosTheme}
          textColor={theme.textColor}
          mutedColor={theme.mutedColor}
        />

        {/* Response Badge */}
        {dialogue.isResponse && (
          <div
            className="p-4 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              border: '2px solid #10b981',
            }}
          >
            <span className="text-2xl">💬</span>
            <p className="text-sm font-bold mt-2" style={{ color: '#34d399' }}>
              {theme.isCosmosTheme ? 'Réponse magique !' : 'Dialogue de réponse'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 py-6 text-base font-bold rounded-xl transition-all"
            style={{
              background: hasChanges
                ? (theme.isCosmosTheme ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : undefined)
                : undefined,
              opacity: hasChanges ? 1 : 0.5,
              boxShadow: hasChanges && theme.isCosmosTheme ? '0 0 20px rgba(16, 185, 129, 0.5)' : undefined,
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {theme.isCosmosTheme ? <Sparkles className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {theme.isCosmosTheme ? 'Enregistrer !' : 'Enregistrer'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 py-6 text-base rounded-xl"
            style={{
              borderColor: theme.isCosmosTheme ? '#f43f5e' : undefined,
              color: theme.isCosmosTheme ? '#fda4af' : undefined,
            }}
          >
            {theme.isCosmosTheme ? '❌ Annuler' : 'Annuler'}
          </Button>
        </div>
      </div>
    </div>
  );
}
