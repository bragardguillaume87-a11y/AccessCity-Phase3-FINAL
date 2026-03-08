import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Save, Network } from 'lucide-react';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { logger } from '@/utils/logger';
import { DEFAULTS } from '@/config/constants';
import type { Dialogue } from '@/types';
import { useUIStore, useCharactersStore } from '@/stores';
import { useAllScenesWithElements } from '@/stores/selectors';
import { useDialogueForm } from '../DialogueWizard/hooks/useDialogueForm';
import type { ComplexityLevel } from '@/types';
import { TypePillSelector } from './components/TypePillSelector';
import { ComposerFormPanel } from './components/ComposerFormPanel';
import { ComposerPreviewPanel } from './components/ComposerPreviewPanel';

interface DialogueComposerProps {
  sceneId: string;
  dialogueIndex?: number;
  dialogue?: Dialogue;
  onSave: (dialogues: Dialogue[]) => void;
  onClose: () => void;
  onOpenGraph?: () => void;
}

/**
 * DialogueComposer — Single-screen dialogue creator.
 *
 * Replaces the multi-step DialogueWizard with a split layout:
 *   Left (55%)  — TypePillSelector + form (speaker, text, choices with tabs)
 *   Right (45%) — Live VN preview that updates as you type + Save button
 *
 * No wizard steps, no navigation, no scroll.
 * Dice / Expert choices use Unity Inspector-style tabs to avoid overflow.
 */
export function DialogueComposer({
  sceneId,
  dialogueIndex: _dialogueIndex,
  dialogue,
  onSave,
  onClose,
  onOpenGraph,
}: DialogueComposerProps) {
  // ── Store integration ────────────────────────────────────────────────────
  const initialComplexity  = useUIStore((state) => state.dialogueWizardInitialComplexity);
  const clearInitialCompl  = useUIStore((state) => state.clearDialogueWizardInitialComplexity);
  const characters         = useCharactersStore((state) => state.characters);
  // Subscription ici (et non dans LeftPanel) → active seulement quand la modale est ouverte
  const scenes             = useAllScenesWithElements();

  // ── Form state (reuses exact same hook as DialogueWizard) ────────────────
  const [formData, formActions] = useDialogueForm(dialogue, initialComplexity);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved] = useState(false);

  // Cleanup initial complexity on unmount
  useEffect(() => {
    return () => clearInitialCompl();
  }, [clearInitialCompl]);

  // ── Animated height via ResizeObserver ────────────────────────────────────
  // On mesure la hauteur réelle du contenu et on anime vers la valeur en pixels.
  // Pas de transform scale → zéro distorsion du contenu pendant la transition.
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setContentHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Speaker name resolution (ID → display name) ──────────────────────────
  const speakerName = useMemo(() => {
    if (!formData.speaker) return 'Narrateur';
    const char = characters.find(c => c.id === formData.speaker);
    return char?.name || formData.speaker;
  }, [formData.speaker, characters]);

  // ── Validation ───────────────────────────────────────────────────────────
  const textValid    = formData.text.trim().length >= 10;
  const choicesValid = formData.complexityLevel === 'linear' || (
    formData.choices.length > 0 &&
    formData.choices.every(c => c.text?.trim().length >= 5)
  );
  const canSave = formData.complexityLevel !== null && textValid && choicesValid && !isSaved;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleComplexityChange = useCallback((level: ComplexityLevel) => {
    formActions.setComplexity(level);
  }, [formActions]);

  const handleSpeakerChange = useCallback((speaker: string) => {
    formActions.updateField('speaker', speaker === DEFAULTS.DIALOGUE_SPEAKER ? '' : speaker);
  }, [formActions]);

  const handleTextChange = useCallback((text: string) => {
    formActions.updateField('text', text);
  }, [formActions]);

  const handleVoicePresetChange = useCallback((presetId: string | undefined) => {
    formActions.updateField('voicePreset', presetId);
  }, [formActions]);

  const handleSpeakerMoodChange = useCallback((mood: string | undefined) => {
    formActions.updateField('speakerMood', mood);
  }, [formActions]);

  // ── Save logic (identical to DialogueWizard.handleWizardSave) ────────────
  const handleSave = useCallback(() => {
    if (!canSave) return;
    try {
      const normalizedSpeaker = formData.speaker || DEFAULTS.DIALOGUE_SPEAKER;
      const hasResponses = formData.responses.some(r => r.text.trim().length > 0);

      if (hasResponses) {
        const responseAId = `dialogue-${Date.now()}-resp-a`;
        const responseBId = `dialogue-${Date.now()}-resp-b`;

        const linkedChoices = formData.choices.map((choice, i) => ({
          ...choice,
          nextDialogueId: i === 0 ? responseAId : responseBId,
        }));

        const mainDialogue = DialogueFactory.create({
          id: dialogue?.id,
          speaker: normalizedSpeaker,
          text: formData.text,
          choices: linkedChoices,
          sfx: formData.sfx,
          voicePreset: formData.voicePreset,
          speakerMood: formData.speakerMood,
        });

        const dialogues: Dialogue[] = [mainDialogue];
        formData.responses.forEach((response, i) => {
          if (response.text.trim()) {
            const responseDialogue = DialogueFactory.create({
              id: i === 0 ? responseAId : responseBId,
              speaker: response.speaker || normalizedSpeaker,
              text: response.text,
              choices: [],
            });
            dialogues.push({ ...responseDialogue, isResponse: true });
          }
        });

        onSave(dialogues);
      } else {
        const newDialogue = DialogueFactory.create({
          id: dialogue?.id,
          speaker: normalizedSpeaker,
          text: formData.text,
          choices: formData.choices,
          sfx: formData.sfx,
          voicePreset: formData.voicePreset,
          speakerMood: formData.speakerMood,
        });
        onSave([newDialogue]);
      }

      setIsSaved(true);
      setTimeout(() => {
        clearInitialCompl();
        onClose();
      }, 800);
    } catch (error) {
      logger.error('[DialogueComposer] Save failed:', error);
    }
  }, [canSave, formData, dialogue, onSave, onClose, clearInitialCompl]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    // animate height vers la valeur mesurée → redimensionnement fluide sans distorsion.
    // overflow-hidden clip le contenu pendant la transition (comportement attendu).
    <motion.div
      animate={{ height: contentHeight }}
      transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      {/* contentRef : div mesuré par ResizeObserver — pas de h-full ni overflow ici */}
      <div ref={contentRef} className="flex flex-col">

      {/* Type pills — full width, always visible */}
      <TypePillSelector
        value={formData.complexityLevel}
        onChange={handleComplexityChange}
      />

      {/* Body — split left/right, hauteur pilotée par le contenu */}
      <div className="flex">

        {/* Left pane — form (55%), scroll uniquement si dépassement viewport.
            max-h évite de dépasser max-h-[90vh] du Dialog parent (5rem ≈ pill row). */}
        <div className="flex-[55] border-r overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={formData.complexityLevel ?? '__empty__'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: 'easeInOut' }}
              >
                {formData.complexityLevel ? (
                  <ComposerFormPanel
                    speaker={formData.speaker || ''}
                    text={formData.text}
                    voicePreset={formData.voicePreset}
                    speakerMood={formData.speakerMood}
                    complexityLevel={formData.complexityLevel}
                    choices={formData.choices}
                    responses={formData.responses}
                    scenes={scenes}
                    currentSceneId={sceneId}
                    onSpeakerChange={handleSpeakerChange}
                    onTextChange={handleTextChange}
                    onVoicePresetChange={handleVoicePresetChange}
                    onSpeakerMoodChange={handleSpeakerMoodChange}
                    onUpdateChoice={formActions.updateChoice}
                    onUpdateResponse={formActions.updateResponse}
                    onAddChoice={formActions.addChoice}
                    onRemoveChoice={formActions.removeChoice}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-36 text-center">
                    <p className="text-sm text-muted-foreground">
                      ← Choisis un type de dialogue pour commencer
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right pane — live preview (haut) + save button (bas) (45%) */}
        <div className="flex-[45] flex flex-col justify-between p-6 gap-5">
          <ComposerPreviewPanel
            speakerName={speakerName}
            text={formData.text}
            choices={formData.choices}
            complexityLevel={formData.complexityLevel}
            isSaved={isSaved}
          />
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="h-10 gap-2 flex-shrink-0"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Sauvegarder
          </Button>
          {onOpenGraph && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenGraph}
              className="w-full gap-2 text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Network className="w-3.5 h-3.5" aria-hidden="true" />
              Vue Graphe (éditeur nodal)
            </Button>
          )}
        </div>

      </div>

      </div>{/* /contentRef */}
    </motion.div>
  );
}

export default DialogueComposer;
