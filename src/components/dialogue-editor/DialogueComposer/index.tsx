import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Save, Network } from 'lucide-react';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { logger } from '@/utils/logger';
import { DEFAULTS } from '@/config/constants';
import type { Dialogue } from '@/types';
import { useUIStore, useCharactersStore, useSettingsStore } from '@/stores';
import { useAllScenesWithElements } from '@/stores/selectors';
import { useDialogueForm } from '../DialogueWizard/hooks/useDialogueForm';
import type { ComplexityLevel } from '@/types';
import { TypePillSelector } from './components/TypePillSelector';
import { ComposerFormPanel } from './components/ComposerFormPanel';
import { ComposerPreviewPanel } from './components/ComposerPreviewPanel';
import { DIALOGUE_COMPOSER_THEMES } from '@/config/dialogueComposerThemes';

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
 * Phase 1 (value === null) : grille de 5 grandes cartes de type → progressive disclosure
 * Phase 2 (value !== null) : split 40/60 (form | game-window preview)
 *
 * Layout 720p : modal max-w-6xl (1152px) × 90vh (648px)
 *   Left 40%  = 461px — formulaire compact
 *   Right 60% = 691px — fenêtre de jeu sombre
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
  const initialComplexity = useUIStore((state) => state.dialogueWizardInitialComplexity);
  const clearInitialCompl = useUIStore((state) => state.clearDialogueWizardInitialComplexity);
  const characters = useCharactersStore((state) => state.characters);
  const scenes = useAllScenesWithElements();
  // Granular selector — Carmack §12.1 : évite re-render global si autre setting change
  const dialogueComposerTheme = useSettingsStore((s) => s.dialogueComposerTheme);

  // ── Form state ───────────────────────────────────────────────────────────
  const [formData, formActions] = useDialogueForm(dialogue, initialComplexity);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isSaved, setIsSaved] = useState(false);
  // typeChosen : true dès qu'un type a été confirmé (soit via grande carte, soit déjà défini)
  // Pour un nouveau dialogue → démarre false (grandes cartes visibles)
  // Pour un dialogue édité → démarre true (type déjà connu, on va direct au split)
  const [typeChosen, setTypeChosen] = useState(() => formData.complexityLevel !== null);

  // Cleanup initial complexity on unmount
  useEffect(() => {
    return () => clearInitialCompl();
  }, [clearInitialCompl]);

  // ── Scene background URL (pour le watermark preview) ────────────────────
  const sceneBackgroundUrl = useMemo(() => {
    const scene = scenes.find((s) => s.id === sceneId);
    return scene?.backgroundUrl ?? '';
  }, [scenes, sceneId]);

  // ── Speaker name resolution (ID → display name) ──────────────────────────
  const speakerName = useMemo(() => {
    if (!formData.speaker) return 'Narrateur';
    const char = characters.find((c) => c.id === formData.speaker);
    return char?.name || formData.speaker;
  }, [formData.speaker, characters]);

  // ── Speaker portrait URL (sprite du mood actif ou premier sprite dispo) ──
  const speakerPortraitUrl = useMemo(() => {
    if (!formData.speaker) return '';
    const char = characters.find((c) => c.id === formData.speaker);
    if (!char) return '';
    const mood = formData.speakerMood;
    return (
      (mood && char.sprites[mood]) ||
      char.sprites['default'] ||
      Object.values(char.sprites)[0] ||
      ''
    );
  }, [formData.speaker, formData.speakerMood, characters]);

  // ── Theme colors — Pokémon type-color system (Quilez §14.1, Muratori §13.3) ─
  // Granular memo : ne recalcule que si theme ou type de dialogue change.
  const themeColors = useMemo(() => {
    const themeDef = DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme];
    return themeDef.getColors(formData.complexityLevel);
  }, [dialogueComposerTheme, formData.complexityLevel]);

  // ── Validation ───────────────────────────────────────────────────────────
  const textValid = formData.text.trim().length >= 10;
  const choicesValid =
    formData.complexityLevel === 'linear' ||
    formData.complexityLevel === 'minigame' ||
    (formData.choices.length > 0 && formData.choices.every((c) => c.text?.trim().length >= 5));
  const canSave = formData.complexityLevel !== null && textValid && choicesValid && !isSaved;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleComplexityChange = useCallback(
    (level: ComplexityLevel) => {
      formActions.setComplexity(level);
      setTypeChosen(true);
    },
    [formActions]
  );

  const handleSpeakerChange = useCallback(
    (speaker: string) => {
      formActions.updateField('speaker', speaker === DEFAULTS.DIALOGUE_SPEAKER ? '' : speaker);
    },
    [formActions]
  );

  const handleTextChange = useCallback(
    (text: string) => {
      formActions.updateField('text', text);
    },
    [formActions]
  );

  const handleVoicePresetChange = useCallback(
    (presetId: string | undefined) => {
      formActions.updateField('voicePreset', presetId);
    },
    [formActions]
  );

  const handleSpeakerMoodChange = useCallback(
    (mood: string | undefined) => {
      formActions.updateField('speakerMood', mood);
    },
    [formActions]
  );

  const handleUpdateSubtype = useCallback(
    (subtype: 'normal' | 'phonecall') => {
      formActions.updateField('dialogueSubtype', subtype);
    },
    [formActions]
  );

  // ── Save logic ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!canSave) return;
    try {
      const normalizedSpeaker = formData.speaker || DEFAULTS.DIALOGUE_SPEAKER;
      const hasResponses = formData.responses.some((r) => r.text.trim().length > 0);

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
          minigame: formData.minigame,
          dialogueSubtype: formData.dialogueSubtype,
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
          minigame: formData.minigame,
          dialogueSubtype: formData.dialogueSubtype,
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
  const isTypePicked = typeChosen && formData.complexityLevel !== null;
  const isMinigame = formData.complexityLevel === 'minigame';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '90vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Background blobs — profondeur glassmorphism (design brief §2) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '55%',
            height: '70%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '5%',
            width: '50%',
            height: '65%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '-5%',
            width: '40%',
            height: '55%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at center, rgba(236,72,153,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* ── Content — au-dessus des blobs ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ── Pills (visible uniquement après sélection du type) ─────────────── */}
        {isTypePicked && (
          <TypePillSelector value={formData.complexityLevel} onChange={handleComplexityChange} />
        )}

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          {/* Phase 1 — Sélection de type (plein écran, fond sombre) */}
          {!isTypePicked && (
            <motion.div
              key="type-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.92)',
              }}
            >
              <div style={{ textAlign: 'center', paddingTop: 28 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.42)',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}
                >
                  Quel type de dialogue veux-tu créer ?
                </p>
              </div>
              <TypePillSelector value={null} onChange={handleComplexityChange} />
            </motion.div>
          )}

          {/* Phase 2 — Split 40/60 (form | game window) */}
          {isTypePicked && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}
            >
              {/* Left pane — form (48%, ou 55% pour mini-jeu) */}
              <div
                style={{
                  flex: isMinigame ? '0 0 55%' : '0 0 48%',
                  borderRight: '1px solid var(--color-border-base)',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '20px' }}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={formData.complexityLevel ?? '__empty__'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
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
                        minigame={formData.minigame}
                        dialogueSubtype={formData.dialogueSubtype}
                        accentColor={themeColors.accent}
                        onSpeakerChange={handleSpeakerChange}
                        onTextChange={handleTextChange}
                        onVoicePresetChange={handleVoicePresetChange}
                        onSpeakerMoodChange={handleSpeakerMoodChange}
                        onUpdateChoice={formActions.updateChoice}
                        onUpdateResponse={formActions.updateResponse}
                        onAddChoice={formActions.addChoice}
                        onRemoveChoice={formActions.removeChoice}
                        sfx={formData.sfx}
                        onUpdateSfx={(s) => formActions.updateField('sfx', s)}
                        onUpdateMinigame={formActions.updateMinigame}
                        onUpdateSubtype={handleUpdateSubtype}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right pane — game window (52%, ou 45% pour mini-jeu) */}
              <div
                style={{
                  flex: isMinigame ? '0 0 45%' : '0 0 52%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(0,0,0,0.95)',
                  overflow: 'hidden',
                }}
              >
                {/* Preview fills available height */}
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <ComposerPreviewPanel
                    speakerName={speakerName}
                    text={formData.text}
                    choices={formData.choices}
                    complexityLevel={formData.complexityLevel}
                    isSaved={isSaved}
                    minigame={formData.minigame}
                    speakerPortraitUrl={speakerPortraitUrl}
                    sceneBackgroundUrl={sceneBackgroundUrl}
                    accentColor={themeColors.accent}
                    previewAccentColor={themeColors.previewAccent}
                  />
                </div>

                {/* Footer — Theme switcher + Save + Graph */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <Button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="h-9 gap-2 w-full composer-save-btn"
                    style={{
                      background: themeColors.accent,
                      borderColor: themeColors.accent,
                      transition: 'background 0.25s ease, border-color 0.25s ease',
                    }}
                  >
                    <Save className="w-4 h-4" aria-hidden="true" />
                    Sauvegarder
                  </Button>
                  {onOpenGraph && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenGraph}
                      className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}
                    >
                      <Network className="w-3.5 h-3.5" aria-hidden="true" />
                      Vue Graphe (éditeur nodal)
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* end content wrapper */}
    </div>
  );
}

export default DialogueComposer;
