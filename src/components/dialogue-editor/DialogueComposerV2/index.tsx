import { useState, useCallback, useEffect, useMemo } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { logger } from '@/utils/logger';
import { DEFAULTS } from '@/config/constants';
import type { Dialogue } from '@/types';
import type { MinigameType } from '@/types/game';
import { useUIStore, useCharactersStore, useSettingsStore } from '@/stores';
import { resolveCharacterSprite, isNarratorSpeaker } from '@/utils/characterSprite';
import { MinigameOverlay } from '@/components/panels/PreviewPlayer/MinigameOverlay';
import { useAllScenesWithElements } from '@/stores/selectors';
import { useDialogueForm } from '../DialogueWizard/hooks/useDialogueForm';
import type { ComplexityLevel } from '@/types';
import { ComposerFormPanel } from '../DialogueComposer/components/ComposerFormPanel';
import { DIALOGUE_COMPOSER_THEMES } from '@/config/dialogueComposerThemes';
import { uiSounds } from '@/utils/uiSounds';
import { T, FONTS } from './constants';
import { TypeTabBar } from './components/TypeTabBar';
import { MinigameFormPanel } from './components/MinigameFormPanel';
import { PreviewPanel } from './components/PreviewPanel';

interface DialogueComposerV2Props {
  sceneId: string;
  dialogueIndex?: number;
  dialogue?: Dialogue;
  onSave: (dialogues: Dialogue[]) => void;
  onClose: () => void;
  onOpenGraph?: () => void;
}

export function DialogueComposerV2({
  sceneId,
  dialogueIndex: _dialogueIndex,
  dialogue,
  onSave,
  onClose,
  onOpenGraph,
}: DialogueComposerV2Props) {
  // ── Stores ────────────────────────────────────────────────────────────────
  const initialComplexity = useUIStore((s) => s.dialogueWizardInitialComplexity);
  const clearInitialCompl = useUIStore((s) => s.clearDialogueWizardInitialComplexity);
  const characters = useCharactersStore((s) => s.characters);
  const scenes = useAllScenesWithElements();
  const dialogueComposerTheme = useSettingsStore((s) => s.dialogueComposerTheme);

  const [formData, formActions] = useDialogueForm(dialogue, initialComplexity);
  const [isSaved, setIsSaved] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => () => clearInitialCompl(), [clearInitialCompl]);

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const currentScene = useMemo(() => scenes.find((s) => s.id === sceneId), [scenes, sceneId]);
  const speakerChar = useMemo(
    () => characters.find((c) => c.id === formData.speaker),
    [characters, formData.speaker]
  );
  const speakerName = speakerChar?.name ?? 'Narrateur';

  // isNarrator — via utilitaire partagé (source canonique : useSpeakerLayout)
  const isNarrator = useMemo(
    () => isNarratorSpeaker(formData.speaker, speakerChar),
    [formData.speaker, speakerChar]
  );

  // Portrait URL — via utilitaire partagé (source canonique : useSpeakerLayout)
  const speakerPortraitUrl = useMemo(
    () => resolveCharacterSprite(speakerChar, formData.speakerMood) ?? '',
    [speakerChar, formData.speakerMood]
  );

  // Couleur accent thème pour ComposerFormPanel
  const themeColors = useMemo(() => {
    const themeDef = DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme];
    return themeDef.getColors(formData.complexityLevel);
  }, [dialogueComposerTheme, formData.complexityLevel]);

  // Validation
  const textValid = formData.text.trim().length >= 10;
  const choicesValid =
    formData.complexityLevel === 'linear' ||
    formData.complexityLevel === 'minigame' ||
    (formData.choices.length > 0 && formData.choices.every((c) => c.text?.trim().length >= 5));
  const canSave = formData.complexityLevel !== null && textValid && choicesValid && !isSaved;

  const isMinigame = formData.complexityLevel === 'minigame';

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleTypeChange = useCallback(
    (level: ComplexityLevel) => {
      formActions.setComplexity(level);
      uiSounds.choiceSelect();
    },
    [formActions]
  );

  const handleSpeakerChange = useCallback(
    (id: string) => {
      formActions.updateField('speaker', id === DEFAULTS.DIALOGUE_SPEAKER ? '' : id);
    },
    [formActions]
  );

  const handleMoodChange = useCallback(
    (mood: string) => {
      formActions.updateField('speakerMood', formData.speakerMood === mood ? undefined : mood);
    },
    [formActions, formData.speakerMood]
  );

  const handleMinigameTypeChange = useCallback(
    (type: MinigameType) => {
      formActions.updateMinigame({ ...(formData.minigame ?? { difficulty: 3 }), type });
    },
    [formActions, formData.minigame]
  );

  const handleDifficultyChange = useCallback(
    (val: number) => {
      formActions.updateMinigame({
        ...(formData.minigame ?? { type: 'braille' }),
        difficulty: val,
      });
    },
    [formActions, formData.minigame]
  );

  const handleTimerChip = useCallback(
    (seconds: number) => {
      formActions.updateMinigame({
        ...(formData.minigame ?? { type: 'braille', difficulty: 3 }),
        timeout: seconds * 1000,
      });
    },
    [formActions, formData.minigame]
  );

  const handleBrailleModeChange = useCallback(
    (mode: 'letter' | 'word') => {
      formActions.updateMinigame({
        ...(formData.minigame ?? { type: 'braille', difficulty: 3 }),
        brailleMode: mode,
      });
    },
    [formActions, formData.minigame]
  );

  const handleTestMinigame = useCallback(() => {
    uiSounds.diceRollStart();
    setOverlayOpen(true);
  }, []);

  const handleOverlayResult = useCallback(() => {
    setOverlayOpen(false);
  }, []);

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
            const rd = DialogueFactory.create({
              id: i === 0 ? responseAId : responseBId,
              speaker: response.speaker || normalizedSpeaker,
              text: response.text,
              choices: [],
            });
            dialogues.push({ ...rd, isResponse: true });
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
    } catch (err) {
      logger.error('[DialogueComposerV2] Save failed:', err);
    }
  }, [canSave, formData, dialogue, onSave, onClose, clearInitialCompl]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="ac-modal-bg"
      style={{ display: 'flex', flexDirection: 'column', height: '90vh', overflow: 'hidden' }}
    >
      <div
        className="ac-modal-content"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {/* ── TOPBAR — pleine largeur ──────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1.5px solid ${T.border}`,
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.purpleBg,
              border: `1.5px solid ${T.purpleBd}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18}>
              <rect
                x="3"
                y="5"
                width="14"
                height="11"
                rx="2"
                fill="rgba(192,132,252,0.25)"
                stroke="rgba(216,180,255,0.85)"
                strokeWidth="1.5"
              />
              <path
                d="M6 9h8M6 12h5"
                stroke="rgba(216,180,255,0.85)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 800, color: T.t1 }}>
              Éditeur de dialogue
            </div>
            <div style={{ fontSize: 12, color: T.t3, fontWeight: 600 }}>
              {currentScene?.title ?? `Scène ${sceneId.slice(-4)}`}
              {dialogue?.id ? ` — édition` : ' — nouveau'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: T.roseBg,
              border: `1.5px solid ${T.roseBd}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.rose,
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── SPLIT — TypeTabBar gauche + preview pleine hauteur droite ────── */}
        <PanelGroup orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>
          {/* Panneau gauche — TypeTabBar + formulaire */}
          <Panel defaultSize={40} minSize={25} style={{ overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* ── TYPE TAB BAR ──────────────────────────────────────────── */}
              <TypeTabBar activeType={formData.complexityLevel} onTypeChange={handleTypeChange} />

              {/* ── FORMULAIRE — scrollable ────────────────────────────────── */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                }}
              >
                {isMinigame ? (
                  <MinigameFormPanel
                    formData={formData}
                    onSpeakerChange={handleSpeakerChange}
                    onMoodChange={handleMoodChange}
                    onTextChange={(t) => formActions.updateField('text', t)}
                    onMinigameTypeChange={handleMinigameTypeChange}
                    onDifficultyChange={handleDifficultyChange}
                    onTimerChip={handleTimerChip}
                    onBrailleModeChange={handleBrailleModeChange}
                    onVoicePresetChange={(p) => formActions.updateField('voicePreset', p)}
                    onUpdateSubtype={(sub) => formActions.updateField('dialogueSubtype', sub)}
                  />
                ) : (
                  <ComposerFormPanel
                    speaker={formData.speaker}
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
                    accentColor={themeColors?.accent}
                    onSpeakerChange={handleSpeakerChange}
                    onTextChange={(t) => formActions.updateField('text', t)}
                    onVoicePresetChange={(p) => formActions.updateField('voicePreset', p)}
                    onSpeakerMoodChange={handleMoodChange}
                    onUpdateChoice={formActions.updateChoice}
                    onUpdateResponse={formActions.updateResponse}
                    onAddChoice={formActions.addChoice}
                    onRemoveChoice={formActions.removeChoice}
                    onUpdateMinigame={formActions.updateMinigame}
                    onUpdateSubtype={(sub) => formActions.updateField('dialogueSubtype', sub)}
                  />
                )}
              </div>
            </div>
          </Panel>

          {/* Handle redimensionnable */}
          <PanelResizeHandle
            style={{
              width: 8,
              background: 'rgba(255,255,255,0.04)',
              borderLeft: '1px solid rgba(255,255,255,0.22)',
              borderRight: '1px solid rgba(255,255,255,0.22)',
              cursor: 'col-resize',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 3,
                height: 48,
                borderRadius: 3,
                background: 'rgba(192,132,252,0.55)',
              }}
            />
          </PanelResizeHandle>

          {/* Panneau droit — preview pleine hauteur */}
          <Panel defaultSize={60} minSize={30} style={{ overflow: 'hidden' }}>
            <PreviewPanel
              formData={formData}
              currentScene={currentScene}
              speakerName={speakerName}
              speakerPortraitUrl={speakerPortraitUrl}
              isNarrator={isNarrator}
              testMode={overlayOpen}
              isSaved={isSaved}
              canSave={canSave}
              onTestMinigame={handleTestMinigame}
              onSave={handleSave}
              onOpenGraph={onOpenGraph}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Mini-jeu overlay — déclenché par "Tester le mini-jeu" */}
      <MinigameOverlay
        isOpen={overlayOpen}
        config={formData.minigame ?? null}
        onResult={handleOverlayResult}
      />
    </div>
  );
}
