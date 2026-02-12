import { useState, useEffect, useCallback } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScenesStore } from '@/stores';
import { useCharactersStore } from '@/stores';
import { useIsCosmosTheme } from '@/hooks/useGraphTheme';
import { useCosmosEffects } from '@/components/features/CosmosEffects';
import type { Dialogue } from '@/types';

// Emoji avatars for speakers
const SPEAKER_EMOJIS: Record<string, string> = {
  'Narrator': '📖',
  'player': '🎮',
  'default': '👤',
};

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

  // Theme
  const isCosmosTheme = useIsCosmosTheme();
  const { celebrateNodeCreation } = useCosmosEffects();

  // Get speaker emoji
  const getSpeakerEmoji = (speaker: string): string => {
    return SPEAKER_EMOJIS[speaker] || SPEAKER_EMOJIS['default'];
  };

  // Find dialogue
  const scene = scenes.find((s) => s.id === sceneId);
  const dialogue = scene?.dialogues[dialogueIndex];

  // Local state for form
  const [formData, setFormData] = useState<{
    speaker: string;
    text: string;
    stageDirections: string;
  }>({
    speaker: dialogue?.speaker || 'Narrator',
    text: dialogue?.text || '',
    stageDirections: dialogue?.stageDirections || '',
  });

  // Update form when dialogue changes (include dialogueIndex to handle node selection changes)
  useEffect(() => {
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
        stageDirections: dialogue.stageDirections || '',
      });
    }
  }, [dialogue, dialogueIndex, sceneId]);

  // Has changes?
  const hasChanges =
    dialogue &&
    (formData.speaker !== dialogue.speaker ||
     formData.text !== dialogue.text ||
     formData.stageDirections !== (dialogue.stageDirections || ''));

  // Handle save (wrapped in useCallback for stable reference in useEffect)
  const handleSave = useCallback(() => {
    if (!hasChanges || !dialogue) return;

    updateDialogue(sceneId, dialogueIndex, {
      speaker: formData.speaker,
      text: formData.text,
      stageDirections: formData.stageDirections || undefined,
    });

    // PHASE 4: Cosmos celebration effect on save
    if (isCosmosTheme) {
      celebrateNodeCreation();
    }

    // Close panel after save
    onClose();
  }, [hasChanges, dialogue, updateDialogue, sceneId, dialogueIndex, formData, isCosmosTheme, celebrateNodeCreation, onClose]);

  // Handle cancel (wrapped in useCallback for stable reference in useEffect)
  const handleCancel = useCallback(() => {
    // Reset form to original values
    if (dialogue) {
      setFormData({
        speaker: dialogue.speaker,
        text: dialogue.text,
        stageDirections: dialogue.stageDirections || '',
      });
    }
    onClose();
  }, [dialogue, onClose]);

  // Handle keyboard shortcuts (include handleSave and handleCancel to avoid stale closures)
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
  }, [handleSave, handleCancel]);

  // Cosmos theme styles
  const panelBg = isCosmosTheme
    ? 'linear-gradient(180deg, #1a0a2e 0%, #0a1a3e 100%)'
    : 'var(--color-bg-elevated)';
  const borderColor = isCosmosTheme ? '#a855f7' : 'var(--color-border-base)';
  const textColor = isCosmosTheme ? '#e9d5ff' : 'var(--color-text-primary)';
  const mutedColor = isCosmosTheme ? '#c4b5fd' : 'var(--color-text-muted)';

  if (!dialogue) {
    return (
      <div
        className="w-[30%] border-l-2 overflow-y-auto"
        style={{ background: panelBg, borderColor }}
      >
        <div className="p-6 text-center">
          <span className="text-4xl mb-4 block">🔭</span>
          <p className="text-sm" style={{ color: mutedColor }}>
            {isCosmosTheme ? 'Sélectionne une planète !' : 'Aucun dialogue sélectionné'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[30%] border-l-2 overflow-y-auto"
      style={{ background: panelBg, borderColor }}
      role="complementary"
      aria-label="Panneau d'édition"
    >
      <div className="p-5 space-y-5">
        {/* Header - Playful for cosmos */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: isCosmosTheme
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
              : 'var(--color-bg-base)',
            border: `2px solid ${isCosmosTheme ? '#a855f7' : 'var(--color-border-base)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {isCosmosTheme ? '✏️' : '📝'}
            </span>
            <div>
              <h3
                className="text-lg font-bold"
                style={{ color: textColor }}
              >
                {isCosmosTheme ? 'Modifier la bulle' : 'Éditer'}
              </h3>
              <p className="text-xs" style={{ color: mutedColor }}>
                {isCosmosTheme ? `🪐 Planète n°${dialogueIndex + 1}` : `Dialogue #${dialogueIndex + 1}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Fermer"
            className="hover:bg-red-500/20 rounded-full"
            style={{ color: textColor }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Speaker Selector - With Avatar */}
        <div className="space-y-3">
          <label
            htmlFor="speaker-select"
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: textColor }}
          >
            <span className="text-xl">{isCosmosTheme ? '👨‍🚀' : '🎭'}</span>
            {isCosmosTheme ? 'Qui parle ?' : 'Personnage'}
          </label>
          <div
            className="p-3 rounded-xl"
            style={{
              background: isCosmosTheme ? 'rgba(59, 130, 246, 0.2)' : 'var(--color-bg-base)',
              border: `2px solid ${isCosmosTheme ? '#3b82f6' : 'var(--color-border-base)'}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">
                {getSpeakerEmoji(formData.speaker)}
              </span>
              <span className="font-bold" style={{ color: textColor }}>
                {formData.speaker === 'player'
                  ? 'Joueur'
                  : formData.speaker === 'Narrator'
                    ? 'Narrateur'
                    : characters.find(c => c.id === formData.speaker)?.name || formData.speaker}
              </span>
            </div>
            <Select
              value={formData.speaker}
              onValueChange={(value) =>
                setFormData({ ...formData, speaker: value })
              }
            >
              <SelectTrigger
                id="speaker-select"
                className="w-full"
                style={{
                  background: isCosmosTheme ? 'rgba(0,0,0,0.3)' : undefined,
                  borderColor: isCosmosTheme ? '#3b82f6' : undefined,
                  color: textColor,
                }}
              >
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Narrator">
                  <span className="flex items-center gap-2">
                    <span>📖</span> Narrateur
                  </span>
                </SelectItem>
                <SelectItem value="player">
                  <span className="flex items-center gap-2">
                    <span>🎮</span> Joueur
                  </span>
                </SelectItem>
                {/* Filter out built-in speaker IDs to avoid duplicates (case-insensitive) */}
                {characters
                  .filter((character) => {
                    const idLower = character.id.toLowerCase();
                    const nameLower = character.name.toLowerCase();
                    // Exclude built-in speakers by ID or name
                    return (
                      idLower !== 'narrator' &&
                      idLower !== 'player' &&
                      nameLower !== 'narrateur' &&
                      nameLower !== 'joueur' &&
                      nameLower !== 'narrator' &&
                      nameLower !== 'player'
                    );
                  })
                  .map((character) => (
                    <SelectItem key={character.id} value={character.id}>
                      <span className="flex items-center gap-2">
                        <span>👤</span> {character.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stage Directions - Didascalies (Articy-inspired) */}
        <div className="space-y-3">
          <label
            htmlFor="stage-directions"
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: textColor }}
          >
            <span className="text-xl">{isCosmosTheme ? '🎬' : '🎭'}</span>
            {isCosmosTheme ? 'Que fait-il ?' : 'Didascalies'}
            <span className="text-xs font-normal opacity-70">(optionnel)</span>
          </label>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: `2px solid ${isCosmosTheme ? '#f59e0b' : 'var(--color-border-base)'}`,
              boxShadow: isCosmosTheme ? '0 0 15px rgba(245, 158, 11, 0.2)' : undefined,
            }}
          >
            <Textarea
              id="stage-directions"
              value={formData.stageDirections}
              onChange={(e) =>
                setFormData({ ...formData, stageDirections: e.target.value })
              }
              rows={2}
              className="w-full resize-none font-sans border-0 focus:ring-0 italic"
              style={{
                background: isCosmosTheme ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-bg-base)',
                color: textColor,
                fontSize: '13px',
                lineHeight: '1.5',
              }}
              placeholder={isCosmosTheme ? 'Ex: Il hésite, regarde par la fenêtre...' : 'Actions, émotions, contexte...'}
            />
          </div>
          <p className="text-xs" style={{ color: mutedColor }}>
            {isCosmosTheme
              ? '💡 Décris ce que fait le personnage (sans parler)'
              : 'Instructions de mise en scène (comme au théâtre)'}
          </p>
        </div>

        {/* Text Editor - Fun Design */}
        <div className="space-y-3">
          <label
            htmlFor="dialogue-text"
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: textColor }}
          >
            <span className="text-xl">{isCosmosTheme ? '💬' : '✍️'}</span>
            {isCosmosTheme ? 'Que dit-il ?' : 'Texte du dialogue'}
          </label>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: `3px solid ${isCosmosTheme ? '#10b981' : 'var(--color-border-base)'}`,
              boxShadow: isCosmosTheme ? '0 0 20px rgba(16, 185, 129, 0.3)' : undefined,
            }}
          >
            <Textarea
              id="dialogue-text"
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              rows={6}
              className="w-full resize-none font-sans border-0 focus:ring-0"
              style={{
                background: isCosmosTheme ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-base)',
                color: textColor,
                fontSize: '15px',
                lineHeight: '1.6',
              }}
              placeholder={isCosmosTheme ? 'Écris ton message ici... 🚀' : 'Entrez le texte...'}
            />
            {/* Character counter - Visual */}
            <div
              className="px-3 py-2 flex items-center justify-between"
              style={{
                background: isCosmosTheme ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-elevated)',
              }}
            >
              <span className="text-xs" style={{ color: mutedColor }}>
                {formData.text.length} caractères
              </span>
              <div className="flex gap-1">
                {[...Array(Math.min(5, Math.ceil(formData.text.length / 50)))].map((_, i) => (
                  <span key={i} className="text-sm">⭐</span>
                ))}
                {formData.text.length === 0 && (
                  <span className="text-xs" style={{ color: mutedColor }}>
                    {isCosmosTheme ? 'Écris pour gagner des étoiles !' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Choices - Colorful badges */}
        {dialogue.choices.length > 0 && (
          <div className="space-y-3">
            <label
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: textColor }}
            >
              <span className="text-xl">🚀</span>
              {isCosmosTheme ? 'Les chemins possibles' : 'Choix'} ({dialogue.choices.length})
            </label>
            <div className="space-y-2">
              {dialogue.choices.map((choice, index) => {
                const choiceColors = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
                const color = choiceColors[index % choiceColors.length];
                return (
                  <div
                    key={choice.id}
                    className="p-3 rounded-xl"
                    style={{
                      background: `${color}20`,
                      border: `2px solid ${color}`,
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color }}>
                      {isCosmosTheme ? '✨' : `${index + 1}.`} {choice.text}
                    </p>
                    {(choice.nextDialogueId || choice.nextSceneId) && (
                      <p className="text-xs mt-1" style={{ color: mutedColor }}>
                        {choice.nextSceneId ? '🌟 Nouvelle scène' : '➡️ Suite...'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p
              className="text-xs text-center p-2 rounded-lg"
              style={{
                background: isCosmosTheme ? 'rgba(168, 85, 247, 0.2)' : 'var(--color-bg-base)',
                color: mutedColor,
              }}
            >
              {isCosmosTheme ? '💡 Double-clique sur la planète pour modifier les chemins !' : 'Double-cliquez pour éditer les choix'}
            </p>
          </div>
        )}

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
              {isCosmosTheme ? 'Réponse magique !' : 'Dialogue de réponse'}
            </p>
          </div>
        )}

        {/* Actions - Big colorful buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 py-6 text-base font-bold rounded-xl transition-all"
            style={{
              background: hasChanges
                ? (isCosmosTheme ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : undefined)
                : undefined,
              opacity: hasChanges ? 1 : 0.5,
              boxShadow: hasChanges && isCosmosTheme ? '0 0 20px rgba(16, 185, 129, 0.5)' : undefined,
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {isCosmosTheme ? <Sparkles className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isCosmosTheme ? 'Enregistrer !' : 'Enregistrer'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 py-6 text-base rounded-xl"
            style={{
              borderColor: isCosmosTheme ? '#f43f5e' : undefined,
              color: isCosmosTheme ? '#fda4af' : undefined,
            }}
          >
            {isCosmosTheme ? '❌ Annuler' : 'Annuler'}
          </Button>
        </div>
      </div>
    </div>
  );
}
