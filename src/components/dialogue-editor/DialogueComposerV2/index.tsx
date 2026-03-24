import { useState, useCallback, useEffect, useMemo } from 'react';
import { Save, Network } from 'lucide-react';
import { DialogueFactory } from '@/factories/DialogueFactory';
import { logger } from '@/utils/logger';
import { DEFAULTS } from '@/config/constants';
import type { Dialogue } from '@/types';
import type { MinigameType } from '@/types/game';
import { useUIStore, useCharactersStore, useSettingsStore } from '@/stores';
import { useAllScenesWithElements } from '@/stores/selectors';
import { useDialogueForm } from '../DialogueWizard/hooks/useDialogueForm';
import type { ComplexityLevel } from '@/types';
import { ComposerFormPanel } from '../DialogueComposer/components/ComposerFormPanel';
import { DIALOGUE_COMPOSER_THEMES } from '@/config/dialogueComposerThemes';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { uiSounds } from '@/utils/uiSounds';

// ── V2 Design tokens (inline — source : access_city_mockup_final.html) ────────
const T = {
  card: 'rgba(255,255,255,0.13)',
  border: 'rgba(255,255,255,0.22)',
  borderHi: 'rgba(255,255,255,0.38)',
  t1: '#ffffff',
  t2: 'rgba(255,255,255,0.92)',
  t3: 'rgba(255,255,255,0.68)',
  purple: '#c084fc',
  purpleBg: 'rgba(192,132,252,0.20)',
  purpleBd: 'rgba(192,132,252,0.55)',
  teal: '#5eead4',
  tealBg: 'rgba(94,234,212,0.18)',
  tealBd: 'rgba(94,234,212,0.50)',
  amber: '#fde68a',
  amberBg: 'rgba(253,230,138,0.18)',
  amberBd: 'rgba(253,230,138,0.50)',
  rose: '#fda4d0',
  roseBg: 'rgba(253,164,208,0.18)',
  roseBd: 'rgba(253,164,208,0.50)',
  green: '#6ee7b7',
  greenBg: 'rgba(110,231,183,0.18)',
  greenBd: 'rgba(110,231,183,0.50)',
  blue: '#93c5fd',
  blueBg: 'rgba(147,197,253,0.18)',
  blueBd: 'rgba(147,197,253,0.50)',
  orange: '#fdba74',
  orangeBg: 'rgba(253,186,116,0.18)',
  orangeBd: 'rgba(253,186,116,0.50)',
};

const TYPE_TABS: {
  id: ComplexityLevel;
  label: string;
  desc: string;
  c: string;
  bg: string;
  bd: string;
  svgPath: string;
}[] = [
  {
    id: 'linear',
    label: 'Simple',
    desc: 'Un texte',
    c: T.blue,
    bg: T.blueBg,
    bd: T.blueBd,
    svgPath:
      '<rect x="3" y="5" width="14" height="10" rx="2" fill="rgba(147,197,253,0.28)" stroke="rgba(191,219,254,0.90)" stroke-width="1.5"/><path d="M6 9h8M6 12h5" stroke="rgba(191,219,254,0.90)" stroke-width="1.5" stroke-linecap="round"/>',
  },
  {
    id: 'binary',
    label: 'À choisir',
    desc: 'A/B',
    c: T.teal,
    bg: T.tealBg,
    bd: T.tealBd,
    svgPath:
      '<path d="M3 6h6M3 10h6M11 6h6M11 10h6" stroke="rgba(153,246,228,0.90)" stroke-width="1.5" stroke-linecap="round"/><path d="M6 14l2-2-2-2M14 14l2-2-2-2" stroke="rgba(153,246,228,0.90)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    id: 'dice',
    label: 'Dés',
    desc: 'Aléatoire',
    c: T.rose,
    bg: T.roseBg,
    bd: T.roseBd,
    svgPath:
      '<rect x="3" y="3" width="6" height="6" rx="1.5" fill="rgba(253,164,208,0.28)" stroke="rgba(251,207,232,0.90)" stroke-width="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5" fill="rgba(253,164,208,0.28)" stroke="rgba(251,207,232,0.90)" stroke-width="1.5"/><circle cx="6" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/><circle cx="10" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/><circle cx="14" cy="15" r="1.4" fill="rgba(251,207,232,0.92)"/>',
  },
  {
    id: 'expert',
    label: 'Expert',
    desc: 'Effets',
    c: T.amber,
    bg: T.amberBg,
    bd: T.amberBd,
    svgPath:
      '<path d="M10 3l1.5 4h4l-3 2.5 1 4L10 11l-3.5 2.5 1-4L4 7h4z" fill="rgba(253,230,138,0.32)" stroke="rgba(254,240,138,0.92)" stroke-width="1.5" stroke-linejoin="round"/>',
  },
  {
    id: 'minigame',
    label: 'Mini-jeu',
    desc: 'Braille…',
    c: T.purple,
    bg: T.purpleBg,
    bd: T.purpleBd,
    svgPath:
      '<rect x="2" y="6" width="16" height="10" rx="2" fill="rgba(192,132,252,0.28)" stroke="rgba(216,180,255,0.90)" stroke-width="1.5"/><path d="M10 6V4M7 4h6" stroke="rgba(216,180,255,0.90)" stroke-width="1.5" stroke-linecap="round"/><path d="M8 11h4M10 9v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  },
];

const MINIGAME_CARDS: {
  type: MinigameType;
  label: string;
  desc: string;
  c: string;
  bg: string;
  bd: string;
}[] = [
  {
    type: 'falc',
    label: 'FALC',
    desc: 'Réordonner les cartes',
    c: T.amber,
    bg: T.amberBg,
    bd: T.amberBd,
  },
  {
    type: 'qte',
    label: 'QTE',
    desc: 'Touche dans le temps',
    c: T.blue,
    bg: T.blueBg,
    bd: T.blueBd,
  },
  {
    type: 'braille',
    label: 'Braille',
    desc: 'Identifier en Braille',
    c: T.purple,
    bg: T.purpleBg,
    bd: T.purpleBd,
  },
];

const TIMER_CHIPS: { value: number; color: string; bg: string }[] = [
  { value: 3, color: '#ff7070', bg: 'rgba(255,112,112,0.18)' },
  { value: 5, color: T.orange, bg: T.orangeBg },
  { value: 10, color: T.amber, bg: T.amberBg },
  { value: 15, color: T.green, bg: T.greenBg },
  { value: 20, color: T.teal, bg: T.tealBg },
  { value: 30, color: T.blue, bg: T.blueBg },
];

const DIFFICULTY_LABELS = ['', 'Facile', 'Modéré', 'Risqué', 'Difficile', 'Extrême'];
const DIFFICULTY_COLORS = ['', T.green, T.teal, T.orange, T.amber, T.rose];

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1.5px solid ${T.border}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DialogueComposerV2Props {
  sceneId: string;
  dialogueIndex?: number;
  dialogue?: Dialogue;
  onSave: (dialogues: Dialogue[]) => void;
  onClose: () => void;
  onOpenGraph?: () => void;
}

// ── Composant principal ───────────────────────────────────────────────────────
export function DialogueComposerV2({
  sceneId,
  dialogueIndex: _dialogueIndex,
  dialogue,
  onSave,
  onClose,
  onOpenGraph,
}: DialogueComposerV2Props) {
  // ── Store integration ─────────────────────────────────────────────────────
  const initialComplexity = useUIStore((s) => s.dialogueWizardInitialComplexity);
  const clearInitialCompl = useUIStore((s) => s.clearDialogueWizardInitialComplexity);
  const characters = useCharactersStore((s) => s.characters);
  const scenes = useAllScenesWithElements();
  const dialogueComposerTheme = useSettingsStore((s) => s.dialogueComposerTheme);

  const [formData, formActions] = useDialogueForm(dialogue, initialComplexity);
  const [isSaved, setIsSaved] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => () => clearInitialCompl(), [clearInitialCompl]);

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const currentScene = useMemo(() => scenes.find((s) => s.id === sceneId), [scenes, sceneId]);
  const speakerChar = useMemo(
    () => characters.find((c) => c.id === formData.speaker),
    [characters, formData.speaker]
  );
  const speakerName = speakerChar?.name ?? 'Narrateur';
  const speakerMoods = useMemo(
    () => (speakerChar ? Object.keys(speakerChar.sprites) : []),
    [speakerChar]
  );

  // Portrait URL — même pattern que DialogueComposer V1 (sprites[mood] || default || first)
  const speakerPortraitUrl = useMemo(() => {
    if (!speakerChar) return '';
    const mood = formData.speakerMood;
    return (
      (mood && speakerChar.sprites[mood]) ||
      speakerChar.sprites['default'] ||
      Object.values(speakerChar.sprites)[0] ||
      ''
    );
  }, [speakerChar, formData.speakerMood]);

  // Couleur accent du thème pour ComposerFormPanel
  const themeColors = useMemo(() => {
    const themeDef = DIALOGUE_COMPOSER_THEMES[dialogueComposerTheme];
    return themeDef.getColors(formData.complexityLevel);
  }, [dialogueComposerTheme, formData.complexityLevel]);

  // Tab courant
  const activeTab = TYPE_TABS.find((t) => t.id === formData.complexityLevel);

  // Validation
  const textValid = formData.text.trim().length >= 10;
  const choicesValid =
    formData.complexityLevel === 'linear' ||
    formData.complexityLevel === 'minigame' ||
    (formData.choices.length > 0 && formData.choices.every((c) => c.text?.trim().length >= 5));
  const canSave = formData.complexityLevel !== null && textValid && choicesValid && !isSaved;

  const wordCount = formData.text.trim() ? formData.text.trim().split(/\s+/).length : 0;
  const charCount = formData.text.length;

  // Minigame state dérivé
  const mgType = formData.minigame?.type ?? 'braille';
  const mgDifficulty = formData.minigame?.difficulty ?? 3;
  const mgTimeout = formData.minigame?.timeout ?? 0;
  const mgHasTimer = mgTimeout > 0;
  const mgBrailleMode = formData.minigame?.brailleMode ?? 'letter';

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

  const handleTimerToggle = useCallback(
    (enabled: boolean) => {
      formActions.updateMinigame({
        ...(formData.minigame ?? { type: 'braille', difficulty: 3 }),
        timeout: enabled ? 10000 : 0,
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
    setTestMode(true);
    setTimeout(() => setTestMode(false), 2500);
  }, []);

  // ── Save (identique à V1) ─────────────────────────────────────────────────
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

  const isMinigame = formData.complexityLevel === 'minigame';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="ac-modal-bg"
      style={{ display: 'flex', flexDirection: 'column', height: '90vh', overflow: 'hidden' }}
    >
      <div className="ac-modal-content">
        {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
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
          {/* Icon */}
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
            <svg viewBox="0 0 18 18" fill="none" width={18} height={18}>
              <rect
                x="1"
                y="4"
                width="16"
                height="10"
                rx="3"
                fill="rgba(192,132,252,0.35)"
                stroke="rgba(216,180,255,0.90)"
                strokeWidth="1.5"
              />
              <path
                d="M6 4V3a3 3 0 016 0v1"
                stroke="rgba(216,180,255,0.90)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: T.t1 }}
            >
              Éditeur de dialogue
            </div>
            <div style={{ fontSize: 12, color: T.t3, fontWeight: 600, marginTop: 1 }}>
              {currentScene?.title ?? `Scène ${sceneId.slice(-4)}`}
            </div>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fermer l'éditeur"
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

        {/* ── TYPE TAB BAR ────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 16px 16px',
            display: 'flex',
            gap: 7,
            borderBottom: `1.5px solid ${T.border}`,
            background: 'rgba(0,0,0,0.10)',
            flexShrink: 0,
          }}
          role="tablist"
          aria-label="Type de dialogue"
        >
          {TYPE_TABS.map((tab) => {
            const isActive = formData.complexityLevel === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTypeChange(tab.id)}
                style={{
                  flex: 1,
                  borderRadius: 13,
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  position: 'relative',
                  background: isActive ? tab.bg : T.card,
                  border: `1.5px solid ${isActive ? tab.bd : T.border}`,
                  transform: isActive ? 'translateY(-4px)' : 'none',
                  boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.28)' : 'none',
                  transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
              >
                {/* Pip "actif" */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -9,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: tab.c,
                      color: '#16103a',
                      fontSize: 8,
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: 5,
                      border: `1.5px solid rgba(255,255,255,0.22)`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    actif
                  </div>
                )}
                {/* Icône */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: isActive ? tab.bg : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isActive ? tab.bd : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    width={13}
                    height={13}
                    dangerouslySetInnerHTML={{ __html: tab.svgPath }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isActive ? tab.c : T.t2,
                    textAlign: 'center',
                  }}
                >
                  {tab.label}
                </div>
                {/* Ligne bas */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isActive ? '58%' : 0,
                    height: 3,
                    borderRadius: 2,
                    background: tab.c,
                    transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* ── PANNEAU GAUCHE ─────────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              borderRight: `1.5px solid ${T.border}`,
              overflowY: 'auto',
            }}
          >
            {isMinigame ? (
              <>
                {/* PERSONNAGE */}
                <div>
                  <SectionLabel label="Personnage" color={T.rose} />
                  <GlassCard>
                    <div
                      style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background: T.purpleBg,
                          border: `2px solid ${T.purpleBd}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 28,
                          fontWeight: 800,
                          color: T.t1,
                          flexShrink: 0,
                        }}
                      >
                        {speakerChar ? speakerChar.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {/* Name + dropdown */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 18,
                              fontWeight: 800,
                              color: T.t1,
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {speakerName}
                          </span>
                          <select
                            value={formData.speaker || DEFAULTS.DIALOGUE_SPEAKER}
                            onChange={(e) => handleSpeakerChange(e.target.value)}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: T.t2,
                              background: 'rgba(255,255,255,0.11)',
                              padding: '9px 12px',
                              borderRadius: 8,
                              border: `1px solid ${T.border}`,
                              cursor: 'pointer',
                            }}
                            aria-label="Choisir un personnage"
                          >
                            <option value={DEFAULTS.DIALOGUE_SPEAKER}>Narrateur</option>
                            {characters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Mood buttons */}
                        {speakerMoods.length > 0 && (
                          <div
                            role="radiogroup"
                            aria-label="Humeur du personnage"
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: 8,
                              flexWrap: 'wrap',
                              minWidth: 0,
                            }}
                          >
                            {speakerMoods.map((mood) => {
                              const isActive = formData.speakerMood === mood;
                              return (
                                <button
                                  key={mood}
                                  role="radio"
                                  aria-checked={isActive}
                                  aria-label={getMoodLabel(mood)}
                                  onClick={() => handleMoodChange(mood)}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 50,
                                      height: 50,
                                      borderRadius: 13,
                                      border: `2px solid ${isActive ? T.purpleBd : T.border}`,
                                      background: isActive ? T.purpleBg : T.card,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transform: isActive ? 'scale(1.10)' : 'none',
                                      transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                                      fontSize: 22,
                                      position: 'relative',
                                    }}
                                  >
                                    {getMoodEmoji(mood) || mood.charAt(0).toUpperCase()}
                                    {isActive && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: -7,
                                          right: -7,
                                          width: 17,
                                          height: 17,
                                          borderRadius: '50%',
                                          background: T.purple,
                                          color: '#16103a',
                                          fontSize: 10,
                                          fontWeight: 900,
                                          lineHeight: '17px',
                                          textAlign: 'center',
                                          border: '2px solid #16103a',
                                        }}
                                      >
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: isActive ? T.purple : T.t3,
                                    }}
                                  >
                                    {getMoodLabel(mood)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* DIALOGUE */}
                <div>
                  <SectionLabel label="Dialogue" color={T.blue} />
                  <GlassCard>
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.07)',
                        borderBottom: `1px solid ${T.border}`,
                        borderRadius: '16px 16px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.t1 }}>Que dit-il ?</div>
                      <span style={{ fontSize: 12, color: T.t3, fontWeight: 600 }}>
                        {wordCount} mot{wordCount !== 1 ? 's' : ''} · ~
                        {Math.max(1, Math.ceil(wordCount / 3))}s
                      </span>
                    </div>
                    <textarea
                      value={formData.text}
                      onChange={(e) => formActions.updateField('text', e.target.value)}
                      placeholder="Écris le texte du dialogue…"
                      aria-label="Texte du dialogue"
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '13px 14px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.t1,
                        resize: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.65,
                        outline: 'none',
                      }}
                    />
                    <div
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(255,255,255,0.05)',
                        borderTop: `1px solid ${T.border}`,
                        borderRadius: '0 0 16px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.t3 }}>500 max</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: T.green,
                          background: T.greenBg,
                          padding: '3px 10px',
                          borderRadius: 6,
                          border: `1.5px solid ${T.greenBd}`,
                        }}
                      >
                        {charCount} / 500
                      </span>
                    </div>
                  </GlassCard>
                </div>

                {/* TYPE DE MINI-JEU */}
                <div>
                  <SectionLabel label="Type de mini-jeu" color={T.amber} />
                  <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}
                    role="radiogroup"
                    aria-label="Type de mini-jeu"
                  >
                    {MINIGAME_CARDS.map((card) => {
                      const isActive = mgType === card.type;
                      return (
                        <button
                          key={card.type}
                          role="radio"
                          aria-checked={isActive}
                          aria-label={card.label}
                          onClick={() => handleMinigameTypeChange(card.type)}
                          style={{
                            borderRadius: 14,
                            padding: '14px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 7,
                            background: isActive ? card.bg : T.card,
                            border: `1.5px solid ${isActive ? card.bd : T.border}`,
                            transform: isActive ? 'translateY(-3px)' : 'none',
                            boxShadow: isActive ? '0 6px 18px rgba(0,0,0,0.28)' : 'none',
                            transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 12,
                              background: card.bg,
                              border: `1.5px solid ${card.bd}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24,
                            }}
                          >
                            {card.type === 'falc' ? '📋' : card.type === 'qte' ? '⌨️' : '⣿'}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: isActive ? card.c : T.t1,
                            }}
                          >
                            {card.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: T.t3,
                              textAlign: 'center',
                              lineHeight: 1.35,
                            }}
                          >
                            {card.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PARAMÈTRES */}
                <div>
                  <SectionLabel label="Paramètres" color={T.teal} />
                  <div
                    style={{
                      background: 'rgba(94,234,212,0.07)',
                      border: `1.5px solid ${T.tealBd}`,
                      borderRadius: 16,
                      padding: 15,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Difficulté */}
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: T.t1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <span>Difficulté</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: T.teal }}>
                            {mgDifficulty} / 5
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontWeight: 800,
                              background: `${DIFFICULTY_COLORS[mgDifficulty]}22`,
                              color: DIFFICULTY_COLORS[mgDifficulty],
                              border: `1.5px solid ${DIFFICULTY_COLORS[mgDifficulty]}66`,
                            }}
                          >
                            {DIFFICULTY_LABELS[mgDifficulty]}
                          </span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={mgDifficulty}
                        onChange={(e) => handleDifficultyChange(Number(e.target.value))}
                        aria-label="Niveau de difficulté"
                        style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }}
                      />
                    </div>
                    {/* Timer */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.t1, marginBottom: 7 }}>
                        Minuterie
                      </div>
                      <div role="group" style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
                        {(['Sans limite', 'Limitée'] as const).map((label, i) => {
                          const isPressed = i === 0 ? !mgHasTimer : mgHasTimer;
                          return (
                            <button
                              key={label}
                              aria-pressed={isPressed}
                              onClick={() => handleTimerToggle(i === 1)}
                              style={{
                                flex: 1,
                                padding: 10,
                                borderRadius: 9,
                                border: `1.5px solid ${isPressed ? T.tealBd : T.border}`,
                                background: isPressed ? T.tealBg : T.card,
                                color: isPressed ? T.teal : T.t2,
                                fontSize: 13,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {mgHasTimer && (
                        <div
                          role="group"
                          aria-label="Durée du timer"
                          style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}
                        >
                          {TIMER_CHIPS.map((chip) => {
                            const isActive = Math.round(mgTimeout / 1000) === chip.value;
                            return (
                              <button
                                key={chip.value}
                                aria-pressed={isActive}
                                aria-label={`${chip.value} secondes`}
                                onClick={() => handleTimerChip(chip.value)}
                                style={{
                                  flex: 1,
                                  minWidth: 40,
                                  background: isActive ? chip.bg : T.card,
                                  border: `1.5px solid ${isActive ? chip.color : T.border}`,
                                  borderRadius: 9,
                                  padding: '6px 10px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: isActive ? chip.color : T.t2,
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <div
                                  style={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    background: chip.color,
                                  }}
                                />
                                {chip.value}s
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* Mode Braille uniquement */}
                    {mgType === 'braille' && (
                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 800, color: T.t1, marginBottom: 7 }}
                        >
                          Mode
                        </div>
                        <div
                          role="group"
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}
                        >
                          {(
                            [
                              ['letter', 'A', 'Lettre'],
                              ['word', '▤', 'Mot'],
                            ] as const
                          ).map(([mode, icon, label]) => {
                            const isActive = mgBrailleMode === mode;
                            return (
                              <button
                                key={mode}
                                aria-pressed={isActive}
                                onClick={() => handleBrailleModeChange(mode)}
                                style={{
                                  background: isActive ? T.purpleBg : T.card,
                                  border: `1.5px solid ${isActive ? T.purpleBd : T.border}`,
                                  borderRadius: 10,
                                  padding: 11,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 7,
                                  color: isActive ? T.purple : T.t2,
                                  transition: 'all 0.2s',
                                  cursor: 'pointer',
                                }}
                              >
                                <span>{icon}</span>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Pour les types non-minigame : ComposerFormPanel existant */
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

          {/* ── PANNEAU DROIT ───────────────────────────────────────────────── */}
          <div
            style={{
              width: 340,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: `1.5px solid ${T.border}`,
            }}
          >
            {/* Header preview */}
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1.5px solid ${T.border}`,
                background: 'rgba(255,255,255,0.07)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.t1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <svg viewBox="0 0 15 15" fill="none" width={15} height={15}>
                  <circle
                    cx="7.5"
                    cy="7.5"
                    r="6.5"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 7.5l2 2 3-3"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Aperçu en direct
              </div>
              {activeTab && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '3px 12px',
                    borderRadius: 7,
                    fontWeight: 800,
                    background: activeTab.bg,
                    color: activeTab.c,
                    border: `1.5px solid ${activeTab.bd}`,
                  }}
                >
                  {isMinigame
                    ? (MINIGAME_CARDS.find((m) => m.type === mgType)?.label ?? 'Mini-jeu')
                    : activeTab.label}
                </span>
              )}
            </div>

            {/* Scene preview card */}
            <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  borderRadius: 15,
                  overflow: 'hidden',
                  border: `1.5px solid ${T.border}`,
                  background: T.card,
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                {/* Gradient bg — fond réel si disponible */}
                <div
                  style={{
                    height: 140,
                    background: currentScene?.backgroundUrl
                      ? `url(${currentScene.backgroundUrl}) center / cover, rgba(22,16,58,0.92)`
                      : 'linear-gradient(160deg, rgba(88,28,135,0.92) 0%, rgba(30,58,138,0.90) 50%, rgba(6,78,59,0.75) 100%)',
                    position: 'relative',
                    borderBottom: `1.5px solid ${T.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!currentScene?.backgroundUrl && (
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.42)' }}
                    >
                      Aperçu de scène
                    </span>
                  )}
                  {/* Avatar en bas-gauche — sprite réel si disponible */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -22,
                      left: 14,
                      width: 50,
                      height: 50,
                      borderRadius: 13,
                      background: T.purpleBg,
                      border: '3px solid rgba(255,255,255,0.30)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: T.t1,
                      overflow: 'hidden',
                    }}
                  >
                    {speakerPortraitUrl ? (
                      <img
                        src={speakerPortraitUrl}
                        alt={speakerName}
                        style={{ width: 50, height: 50, objectFit: 'contain' }}
                      />
                    ) : speakerChar ? (
                      speakerChar.name.charAt(0).toUpperCase()
                    ) : (
                      '✦'
                    )}
                  </div>
                </div>
                {/* Bulle dialogue */}
                <div
                  style={{
                    margin: '14px 12px 0',
                    background: 'rgba(255,255,255,0.15)',
                    border: `1.5px solid ${T.borderHi}`,
                    borderRadius: '0 14px 14px 14px',
                    padding: '12px 14px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: T.purple,
                      marginBottom: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: T.green,
                        flexShrink: 0,
                      }}
                    />
                    {speakerName}
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: T.t1,
                      lineHeight: 1.55,
                      fontStyle: 'italic',
                      margin: 0,
                      minHeight: 24,
                    }}
                  >
                    {formData.text || 'Aucun texte…'}
                  </p>
                </div>
                {/* Stats row — remplit l'espace vide avec des infos utiles (Will Wright §4.2) */}
                <div
                  style={{
                    padding: '8px 12px 4px',
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 5,
                      fontWeight: 700,
                      background: T.blueBg,
                      color: T.blue,
                      border: `1px solid ${T.blueBd}`,
                    }}
                  >
                    {wordCount} mot{wordCount !== 1 ? 's' : ''}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 5,
                      fontWeight: 700,
                      background: T.tealBg,
                      color: T.teal,
                      border: `1px solid ${T.tealBd}`,
                    }}
                  >
                    ~{Math.max(1, Math.ceil(wordCount / 3))}s
                  </span>
                  {formData.speakerMood && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 5,
                        fontWeight: 700,
                        background: T.purpleBg,
                        color: T.purple,
                        border: `1px solid ${T.purpleBd}`,
                      }}
                    >
                      {getMoodEmoji(formData.speakerMood)} {getMoodLabel(formData.speakerMood)}
                    </span>
                  )}
                  {formData.complexityLevel !== 'linear' &&
                    formData.complexityLevel !== 'minigame' &&
                    formData.choices.length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 5,
                          fontWeight: 700,
                          background: T.amberBg,
                          color: T.amber,
                          border: `1px solid ${T.amberBd}`,
                        }}
                      >
                        {formData.choices.length} choix
                      </span>
                    )}
                  {wordCount > 80 && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 5,
                        fontWeight: 700,
                        background: T.roseBg,
                        color: T.rose,
                        border: `1px solid ${T.roseBd}`,
                      }}
                    >
                      ⚠ Long
                    </span>
                  )}
                </div>
                {/* Badge minijeu */}
                {isMinigame && (
                  <div style={{ padding: '6px 12px 12px' }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: T.t3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                    >
                      MINI-JEU ·{' '}
                      {MINIGAME_CARDS.find((m) => m.type === mgType)?.label?.toUpperCase()}
                    </div>
                    <button
                      onClick={handleTestMinigame}
                      style={{
                        width: '100%',
                        background: testMode ? T.amberBg : T.greenBg,
                        border: `1.5px solid ${testMode ? T.amberBd : T.greenBd}`,
                        borderRadius: 11,
                        padding: 11,
                        fontSize: 13,
                        fontWeight: 900,
                        color: testMode ? T.amber : T.green,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {testMode ? '⏳ Disponible en lecture' : '▶ Tester le mini-jeu'}
                    </button>
                    {testMode && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: T.t3,
                          textAlign: 'center',
                          lineHeight: 1.4,
                        }}
                      >
                        Le test s'exécute dans le lecteur de scénario.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save zone */}
            <div
              style={{
                padding: 14,
                borderTop: `1.5px solid ${T.border}`,
                background: 'rgba(14,10,36,0.95)',
                backdropFilter: 'blur(12px)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleSave}
                disabled={!canSave}
                aria-label="Sauvegarder le dialogue"
                className="ac-save-shimmer"
                style={{
                  width: '100%',
                  padding: 15,
                  borderRadius: 13,
                  border: `2px solid ${T.purpleBd}`,
                  background: isSaved
                    ? T.greenBg
                    : canSave
                      ? 'rgba(139,92,246,0.80)'
                      : 'rgba(139,92,246,0.35)',
                  color: isSaved ? T.green : '#fff',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
              >
                <Save size={18} />
                {isSaved ? '✓ Sauvegardé !' : 'Sauvegarder'}
              </button>
              {onOpenGraph && (
                <button
                  onClick={onOpenGraph}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.t3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    marginTop: 10,
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.t1)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.t3)}
                >
                  <Network size={13} />
                  Vue Graphe (éditeur nodal)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
