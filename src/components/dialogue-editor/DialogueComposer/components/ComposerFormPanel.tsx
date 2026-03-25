import { useState, useCallback, useMemo, useRef } from 'react';
import { Plus, User, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import type { DialogueChoice, Scene, MinigameConfig } from '@/types';
import type { DialogueAudio } from '@/types/audio';
import type { ComplexityLevel } from '@/types';
import { useAssets } from '@/hooks/useAssets';
import type { ResponseData } from '../../DialogueWizard/hooks/useDialogueForm';
import { BinaryChoiceField } from './BinaryChoiceField';
import { DiceChoiceCard } from '../../DialogueWizard/components/DiceChoiceBuilder/DiceChoiceCard';
import { ComplexChoiceCard } from '../../DialogueWizard/components/ComplexChoiceBuilder/ComplexChoiceCard';
import { MinigameChoiceBuilder } from '../../DialogueWizard/components/MinigameChoiceBuilder';
import { VoicePresetPicker } from './VoicePresetPicker';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';

// ── Couleurs par mood — design brief §mood-pips ──────────────────────────────
const MOOD_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  neutral: {
    border: 'rgba(192,132,252,0.85)',
    bg: 'rgba(139,92,246,0.22)',
    text: '#c4b5fd',
    glow: '0 0 0 3px rgba(139,92,246,0.30), 0 0 16px rgba(139,92,246,0.35)',
  },
  happy: {
    border: 'rgba(74,222,128,0.85)',
    bg: 'rgba(74,222,128,0.22)',
    text: '#86efac',
    glow: '0 0 0 3px rgba(74,222,128,0.30), 0 0 16px rgba(74,222,128,0.35)',
  },
  sad: {
    border: 'rgba(96,165,250,0.85)',
    bg: 'rgba(96,165,250,0.22)',
    text: '#93c5fd',
    glow: '0 0 0 3px rgba(96,165,250,0.30), 0 0 16px rgba(96,165,250,0.35)',
  },
  angry: {
    border: 'rgba(248,113,113,0.85)',
    bg: 'rgba(248,113,113,0.22)',
    text: '#fca5a5',
    glow: '0 0 0 3px rgba(239,68,68,0.30), 0 0 16px rgba(239,68,68,0.35)',
  },
  surprised: {
    border: 'rgba(251,191,36,0.85)',
    bg: 'rgba(251,191,36,0.22)',
    text: '#fde68a',
    glow: '0 0 0 3px rgba(251,191,36,0.30), 0 0 16px rgba(251,191,36,0.35)',
  },
  confused: {
    border: 'rgba(253,164,208,0.85)',
    bg: 'rgba(236,72,153,0.18)',
    text: '#fda4d0',
    glow: '0 0 0 3px rgba(236,72,153,0.30), 0 0 16px rgba(236,72,153,0.35)',
  },
  scared: {
    border: 'rgba(249,115,22,0.85)',
    bg: 'rgba(249,115,22,0.18)',
    text: '#fdba74',
    glow: '0 0 0 3px rgba(249,115,22,0.30), 0 0 16px rgba(249,115,22,0.35)',
  },
  excited: {
    border: 'rgba(250,204,21,0.85)',
    bg: 'rgba(250,204,21,0.18)',
    text: '#fef08a',
    glow: '0 0 0 3px rgba(250,204,21,0.30), 0 0 16px rgba(250,204,21,0.35)',
  },
  professional: {
    border: 'rgba(96,165,250,0.85)',
    bg: 'rgba(59,130,246,0.18)',
    text: '#bfdbfe',
    glow: '0 0 0 3px rgba(59,130,246,0.30), 0 0 16px rgba(59,130,246,0.35)',
  },
  helpful: {
    border: 'rgba(45,212,191,0.85)',
    bg: 'rgba(45,212,191,0.18)',
    text: '#99f6e4',
    glow: '0 0 0 3px rgba(45,212,191,0.30), 0 0 16px rgba(45,212,191,0.35)',
  },
  tired: {
    border: 'rgba(148,163,184,0.85)',
    bg: 'rgba(148,163,184,0.18)',
    text: '#cbd5e1',
    glow: '0 0 0 3px rgba(148,163,184,0.30), 0 0 16px rgba(148,163,184,0.35)',
  },
  thoughtful: {
    border: 'rgba(167,139,250,0.85)',
    bg: 'rgba(167,139,250,0.18)',
    text: '#ddd6fe',
    glow: '0 0 0 3px rgba(167,139,250,0.30), 0 0 16px rgba(167,139,250,0.35)',
  },
};
// Quilez §14.1 — fallback déterministe pour les moods custom
function getMoodActiveColor(id: string): {
  border: string;
  bg: string;
  text: string;
  glow: string;
} {
  if (MOOD_COLORS[id]) return MOOD_COLORS[id];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return {
    border: `hsla(${hue},70%,70%,0.85)`,
    bg: `hsla(${hue},70%,70%,0.20)`,
    text: `hsl(${hue},90%,85%)`,
    glow: `0 0 0 3px hsla(${hue},70%,55%,0.30), 0 0 16px hsla(${hue},70%,55%,0.35)`,
  };
}

// ── Section header helper — barre colorée + label Syne (design brief §6) ────
const SectionBar = ({ label, color }: { label: string; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
    <div style={{ width: 3, height: 13, borderRadius: 2, background: color, flexShrink: 0 }} />
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color,
        fontFamily: "'Syne', var(--font-family-display, sans-serif)",
      }}
    >
      {label}
    </span>
  </div>
);

// ── Props ─────────────────────────────────────────────────────────────────────
interface ComposerFormPanelProps {
  speaker: string;
  text: string;
  voicePreset?: string;
  speakerMood?: string;
  complexityLevel: ComplexityLevel | null;
  choices: DialogueChoice[];
  responses: ResponseData[];
  scenes: Scene[];
  currentSceneId: string;
  minigame?: MinigameConfig;
  dialogueSubtype?: 'normal' | 'phonecall';
  /** Couleur d'accent du thème actif — pour l'onglet actif des choix */
  accentColor?: string;
  onSpeakerChange: (speaker: string) => void;
  onTextChange: (text: string) => void;
  onVoicePresetChange: (presetId: string | undefined) => void;
  onSpeakerMoodChange: (mood: string | undefined) => void;
  onUpdateChoice: (index: number, updates: Partial<DialogueChoice>) => void;
  onUpdateResponse: (index: number, updates: Partial<ResponseData>) => void;
  onAddChoice: () => void;
  onRemoveChoice: (index: number) => void;
  sfx?: DialogueAudio;
  onUpdateSfx: (sfx: DialogueAudio | undefined) => void;
  onUpdateMinigame: (config: MinigameConfig) => void;
  onUpdateSubtype: (subtype: 'normal' | 'phonecall') => void;
}

/**
 * ComposerFormPanel — Left pane of DialogueComposer.
 *
 * Speaker + text always shown.
 * Choices section appears for non-linear types.
 * Tab strip (Unity Inspector style) prevents scrolling:
 *   binary  → [👍 A] [👎 B]
 *   dice    → [🎲 Test 1] [🎲 Test 2] [+]
 *   expert  → [Choix 1] [Choix 2] … [+]
 */
export function ComposerFormPanel({
  speaker,
  text,
  voicePreset,
  speakerMood,
  complexityLevel,
  choices,
  responses,
  scenes,
  currentSceneId,
  minigame,
  dialogueSubtype,
  accentColor = '#8b5cf6',
  onSpeakerChange,
  onTextChange,
  onVoicePresetChange,
  onSpeakerMoodChange,
  onUpdateChoice,
  onUpdateResponse,
  onAddChoice,
  onRemoveChoice,
  sfx,
  onUpdateSfx,
  onUpdateMinigame,
  onUpdateSubtype,
}: ComposerFormPanelProps) {
  const characters = useCharactersStore((state) => state.characters);
  const { assets: audioAssets } = useAssets({ category: 'music' });
  const [activeTab, setActiveTab] = useState(0);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);

  const currentScene = useMemo(
    () => scenes.find((s) => s.id === currentSceneId),
    [scenes, currentSceneId]
  );
  const textLen = text.trim().length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTimeSec = Math.round(wordCount / 2.5); // ~150 mots/min à voix haute
  const isWordWarning = wordCount > 64; // >80% du seuil de 80 mots
  const isWordOver = wordCount > 80;
  const safeTab = Math.min(activeTab, Math.max(choices.length - 1, 0));

  const handleAddChoice = useCallback(() => {
    onAddChoice();
    setActiveTab(choices.length); // jump to new tab
  }, [onAddChoice, choices.length]);

  const handleRemoveChoice = useCallback(
    (idx: number) => {
      onRemoveChoice(idx);
      setActiveTab((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
    },
    [onRemoveChoice]
  );

  // Per-choice validity (used for tab dot indicator)
  const isChoiceValid = useCallback(
    (i: number): boolean => {
      const c = choices[i];
      if (!c) return false;
      const hasText = c.text?.trim().length >= 5;
      if (complexityLevel === 'dice') {
        return hasText && !!c.diceCheck?.stat && (c.diceCheck?.difficulty ?? 0) >= 1;
      }
      return hasText;
    },
    [choices, complexityLevel]
  );

  // Tab labels — expert shows dynamic text preview (updates as user types)
  const tabLabels = useMemo(
    () =>
      choices.map((c, i) => {
        if (complexityLevel === 'binary') return i === 0 ? '👍 A' : '👎 B';
        if (complexityLevel === 'dice')
          return choices.length === 1 ? '🎲 Dé' : `🎲 Dé ${String.fromCharCode(65 + i)}`;
        // Expert: show first 10 chars of choice text, else "Choix N"
        const preview = c.text?.trim();
        if (preview && preview.length > 0) {
          return preview.length > 10 ? `${preview.substring(0, 10)}…` : preview;
        }
        return `⚡ Choix ${String.fromCharCode(65 + i)}`;
      }),
    [choices, complexityLevel]
  );

  const canAddChoice =
    (complexityLevel === 'dice' && choices.length < 2) ||
    (complexityLevel === 'expert' && choices.length < 4);

  // Personnage sélectionné — hissé au niveau composant pour avatar card + mood picker
  const speakerChar = useMemo(
    () => characters.find((c) => c.id === speaker),
    [characters, speaker]
  );
  // Teinte HSL déterministe depuis le nom (Quilez §14.1)
  const speakerHue = useMemo(() => {
    if (!speakerChar) return 200;
    let h = 0;
    for (let i = 0; i < speakerChar.name.length; i++)
      h = speakerChar.name.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h) % 360;
  }, [speakerChar]);
  // URL du sprite par défaut pour l'avatar card
  const speakerSpriteUrl = useMemo(
    () => speakerChar?.sprites?.neutral || speakerChar?.sprites?.default,
    [speakerChar]
  );

  return (
    <div className="space-y-4">
      {/* ── Speaker ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionBar label="Personnage" color="#fda4d0" />

        {/* Carte speaker — layout .char-block (mockup) */}
        <AnimatePresence mode="wait">
          {speakerChar ? (
            <motion.div
              key={speakerChar.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                borderRadius: 16,
                border: '1.5px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: 14,
                display: 'flex',
                gap: 13,
                alignItems: 'flex-start',
              }}
            >
              {/* Portrait — 60×72px (mockup .char-portrait) */}
              <div
                style={{
                  flexShrink: 0,
                  width: 60,
                  height: 72,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: speakerSpriteUrl
                    ? 'rgba(255,255,255,0.04)'
                    : `hsl(${speakerHue}, 55%, 32%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {speakerSpriteUrl ? (
                  <img
                    src={speakerSpriteUrl}
                    alt={speakerChar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>
                    {speakerChar.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Colonne droite */}
              <div
                style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}
              >
                {/* Rangée nom + changer + téléphone (mockup .char-name-row) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 900,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      lineHeight: 1.15,
                    }}
                  >
                    {speakerChar.name}
                  </p>
                  {/* Phone toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSubtype(dialogueSubtype === 'phonecall' ? 'normal' : 'phonecall')
                    }
                    title={
                      dialogueSubtype === 'phonecall'
                        ? 'Mode appel (désactiver)'
                        : 'Activer mode appel'
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      flexShrink: 0,
                      border: `1.5px solid ${dialogueSubtype === 'phonecall' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.18)'}`,
                      background:
                        dialogueSubtype === 'phonecall'
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(255,255,255,0.08)',
                      color:
                        dialogueSubtype === 'phonecall'
                          ? 'var(--color-success)'
                          : 'rgba(255,255,255,0.40)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Phone size={11} aria-hidden="true" />
                  </button>
                  {/* Bouton changer — Select stylé (mockup .char-chevron) */}
                  <Select
                    value={speaker || DEFAULTS.DIALOGUE_SPEAKER}
                    onValueChange={onSpeakerChange}
                  >
                    <SelectTrigger
                      className="h-auto text-xs"
                      style={{
                        padding: '5px 10px',
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.10)',
                        border: '1.5px solid rgba(255,255,255,0.20)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.85)',
                        height: 'auto',
                        width: 'auto',
                        minWidth: 0,
                      }}
                    >
                      <span>changer</span>
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id} className="text-sm py-2">
                          <div className="flex items-center gap-2">
                            {char.sprites?.neutral ? (
                              <img
                                src={char.sprites.neutral}
                                alt={char.name}
                                className="w-5 h-5 rounded object-contain bg-muted flex-shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px]">👤</span>
                              </div>
                            )}
                            <span className="font-medium truncate">{char.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {characters.length === 0 && (
                        <div className="px-4 py-4 text-center text-muted-foreground text-xs">
                          Aucun personnage disponible
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Humeurs — pips emoji + label (mockup .mood-pip) */}
                {(() => {
                  const moods =
                    speakerChar.moods && speakerChar.moods.length > 0
                      ? speakerChar.moods
                      : ['neutral'];
                  const activeMood = speakerMood || moods[0];
                  return (
                    <div
                      role="radiogroup"
                      aria-label="Humeur du personnage"
                      style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                    >
                      {moods.map((mood) => {
                        const label = getMoodLabel(mood);
                        const shortLabel = label.length > 7 ? label.substring(0, 6) + '.' : label;
                        const isActive = activeMood === mood;
                        const mc = getMoodActiveColor(mood);
                        return (
                          <button
                            key={mood}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            title={label}
                            onClick={() => onSpeakerMoodChange(isActive ? undefined : mood)}
                            style={{
                              position: 'relative',
                              width: 52,
                              borderRadius: 13,
                              border: `2px solid ${isActive ? mc.border : 'rgba(255,255,255,0.16)'}`,
                              background: isActive ? mc.bg : 'rgba(255,255,255,0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 3,
                              padding: '8px 4px',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(.34,1.56,.64,1)',
                              transform: isActive ? 'scale(1.10)' : 'scale(1)',
                              boxShadow: isActive ? mc.glow : 'none',
                            }}
                          >
                            <span style={{ fontSize: 22, lineHeight: 1 }}>
                              {getMoodEmoji(mood)}
                            </span>
                            <span
                              style={{
                                fontSize: 8.5,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: isActive ? mc.text : 'rgba(255,255,255,0.50)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {shortLabel}
                            </span>
                            {isActive && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: -6,
                                  right: -6,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: 'var(--color-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 9,
                                  color: 'white',
                                  fontWeight: 900,
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Boutons audio — 🔊 Voix + 👤 Profil vocal (mockup .char-audio) */}
                <div style={{ display: 'flex', gap: 7 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <button
                      ref={voiceBtnRef}
                      type="button"
                      onClick={() => setVoicePickerOpen((v) => !v)}
                      title={voicePreset ? 'Changer la voix' : 'Ajouter une voix'}
                      aria-expanded={voicePickerOpen}
                      aria-haspopup="true"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        padding: '7px 13px',
                        borderRadius: 9,
                        border: '1.5px solid rgba(100,170,255,0.35)',
                        background: 'rgba(60,120,240,0.18)',
                        color: 'rgba(150,200,255,0.9)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🔊 Voix
                    </button>
                    <AnimatePresence>
                      {voicePickerOpen && (
                        <VoicePresetPicker
                          anchorRef={voiceBtnRef}
                          value={voicePreset}
                          onChange={onVoicePresetChange}
                          onClose={() => setVoicePickerOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    type="button"
                    title={voicePreset ? `Voix : ${voicePreset}` : 'Aucun profil vocal'}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '7px 13px',
                      borderRadius: 9,
                      border: '1.5px solid rgba(100,170,255,0.35)',
                      background: 'rgba(60,120,240,0.18)',
                      color: voicePreset ? 'rgba(150,200,255,0.9)' : 'rgba(150,200,255,0.40)',
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'default',
                    }}
                  >
                    👤 {voicePreset ? voicePreset.split('_')[0] : 'Profil vocal'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                borderRadius: 16,
                border: '1.5px solid var(--color-border-base)',
                background: 'rgba(255,255,255,0.015)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  color: 'var(--color-text-muted)',
                }}
              >
                <User size={15} strokeWidth={1.5} />
                <span style={{ fontSize: 11 }}>Aucun personnage sélectionné</span>
              </div>
              <Select value={speaker || DEFAULTS.DIALOGUE_SPEAKER} onValueChange={onSpeakerChange}>
                <SelectTrigger className="h-[32px] text-[11px]">
                  <SelectValue placeholder="Choisir un personnage…" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id} className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        {char.sprites?.neutral ? (
                          <img
                            src={char.sprites.neutral}
                            alt={char.name}
                            className="w-5 h-5 rounded object-contain bg-muted flex-shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px]">👤</span>
                          </div>
                        )}
                        <span className="font-medium truncate">{char.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {characters.length === 0 && (
                    <div className="px-4 py-4 text-center text-muted-foreground text-xs">
                      Aucun personnage disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dialogue text ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionBar label="Dialogue" color="#93c5fd" />

        {/* Carte dialogue — header + textarea (mockup §dialogue-card) */}
        <div
          style={{
            borderRadius: 10,
            border: '1.5px solid rgba(255,255,255,0.14)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Header — label + compteur de mots (Hennig §11.3) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderBottom: '1px solid var(--color-border-base)',
              background: 'rgba(255,255,255,0.025)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <MessageSquare size={12} aria-hidden="true" /> Que dit-il ?
            </span>
            {wordCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isWordOver
                    ? 'var(--color-danger)'
                    : isWordWarning
                      ? 'var(--color-warning)'
                      : 'var(--color-text-muted)',
                  transition: 'color 150ms ease',
                }}
              >
                {wordCount} mot{wordCount > 1 ? 's' : ''} · ~{readTimeSec}s
                {isWordOver && <span style={{ marginLeft: 5, fontSize: 9 }}>⚠ trop long</span>}
              </span>
            )}
          </div>

          {/* Textarea — fond transparent (mockup) */}
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Écris le dialogue ici…"
            className={cn(
              'min-h-[100px] resize-none focus:ring-1 focus:ring-primary/20',
              'border-0 rounded-none bg-transparent shadow-none'
            )}
            style={{ padding: '13px 14px', fontSize: 15, fontWeight: 600 }}
            maxLength={550}
          />
          {/* Footer — "500 max" + compteur pill (mockup .dialogue-foot) */}
          <div
            style={{
              padding: '8px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.025)',
              borderTop: '1px solid var(--color-border-base)',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>500 max</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color:
                  textLen > 450
                    ? 'var(--color-danger)'
                    : textLen > 300
                      ? 'var(--color-warning)'
                      : 'var(--color-success)',
                background:
                  textLen > 450
                    ? 'rgba(239,68,68,0.14)'
                    : textLen > 300
                      ? 'rgba(245,158,11,0.14)'
                      : 'rgba(34,197,94,0.14)',
                border: `1.5px solid ${textLen > 450 ? 'rgba(239,68,68,0.35)' : textLen > 300 ? 'rgba(245,158,11,0.35)' : 'rgba(34,197,94,0.35)'}`,
                padding: '3px 10px',
                borderRadius: 7,
              }}
            >
              {textLen} / 500
            </span>
          </div>
        </div>
      </div>

      {/* ── SFX section ──────────────────────────────────────────────────── */}
      {audioAssets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionBar label="Effet sonore" color="#fdba74" />
          <div
            style={{
              borderRadius: 10,
              border: `1.5px solid ${sfx ? 'rgba(253,186,116,0.40)' : 'rgba(255,255,255,0.14)'}`,
              background: sfx ? 'rgba(253,186,116,0.08)' : 'rgba(255,255,255,0.06)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔊</span>
              <select
                value={sfx?.url ?? ''}
                onChange={(e) => {
                  const url = e.target.value;
                  if (!url) {
                    onUpdateSfx(undefined);
                    return;
                  }
                  onUpdateSfx({ url, volume: sfx?.volume ?? 0.7 });
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  borderRadius: 7,
                  padding: '5px 8px',
                  fontSize: 12,
                  color: sfx ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                }}
              >
                <option value="">— Aucun son —</option>
                {audioAssets.map((a) => (
                  <option key={a.path} value={a.url ?? a.path}>
                    {a.name}
                  </option>
                ))}
              </select>
              {sfx && (
                <button
                  type="button"
                  onClick={() => onUpdateSfx(undefined)}
                  title="Supprimer le son"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'rgba(239,68,68,0.18)',
                    border: '1.5px solid rgba(239,68,68,0.40)',
                    color: '#fca5a5',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {sfx && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                  Vol.
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={sfx.volume ?? 0.7}
                  onChange={(e) => onUpdateSfx({ ...sfx, volume: parseFloat(e.target.value) })}
                  style={{ flex: 1, accentColor: '#fdba74', cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: 'rgba(253,186,116,0.9)',
                    fontWeight: 700,
                    minWidth: 28,
                    textAlign: 'right',
                  }}
                >
                  {Math.round((sfx.volume ?? 0.7) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Minigame section ─────────────────────────────────────────────── */}
      {complexityLevel === 'minigame' && (
        <div className="space-y-3">
          <div className="h-px bg-border" />
          <SectionBar label="Type de mini-jeu" color="#fde68a" />
          <MinigameChoiceBuilder
            config={minigame}
            onUpdate={onUpdateMinigame}
            currentSceneId={currentSceneId}
          />
        </div>
      )}

      {/* ── Choices section ──────────────────────────────────────────────── */}
      {complexityLevel &&
        complexityLevel !== 'linear' &&
        complexityLevel !== 'minigame' &&
        choices.length > 0 && (
          <div className="space-y-3">
            <div className="h-px bg-border" />

            {/* Tab strip */}
            <div className="flex items-center gap-1 flex-wrap">
              {tabLabels.map((label, i) => {
                const valid = isChoiceValid(i);
                const active = safeTab === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                      'transition-all focus:outline-none focus-visible:ring-2',
                      'max-w-[120px] truncate',
                      active
                        ? 'shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    style={
                      active
                        ? {
                            background: accentColor,
                            color: '#fff',
                            transition: 'background 0.25s ease',
                          }
                        : undefined
                    }
                    title={label}
                  >
                    {/* Validity dot */}
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
                        valid
                          ? active
                            ? 'bg-green-300'
                            : 'bg-green-500'
                          : active
                            ? 'bg-white/40'
                            : 'bg-muted-foreground/30'
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
              {canAddChoice && (
                <button
                  type="button"
                  onClick={handleAddChoice}
                  title="Ajouter un choix"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Active tab content — AnimatePresence for smooth swap */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={safeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
              >
                {/* ── Binary ── */}
                {complexityLevel === 'binary' && choices[safeTab] && (
                  <BinaryChoiceField
                    choiceIndex={safeTab as 0 | 1}
                    choice={choices[safeTab]}
                    response={responses[safeTab]}
                    defaultSpeaker={speaker}
                    scenes={scenes}
                    currentScene={currentScene}
                    currentSceneId={currentSceneId}
                    onUpdateChoice={(updates) => onUpdateChoice(safeTab, updates)}
                    onUpdateResponse={(updates) => onUpdateResponse(safeTab, updates)}
                  />
                )}

                {/* ── Dice ── */}
                {complexityLevel === 'dice' && choices[safeTab] && (
                  <DiceChoiceCard
                    choice={choices[safeTab]}
                    title={choices.length === 1 ? 'Dé' : `Dé ${String.fromCharCode(65 + safeTab)}`}
                    onUpdate={(updates) => onUpdateChoice(safeTab, updates)}
                    onRemove={() => handleRemoveChoice(safeTab)}
                    canRemove={choices.length > 1}
                    currentSceneId={currentSceneId}
                  />
                )}

                {/* ── Expert ── */}
                {complexityLevel === 'expert' && choices[safeTab] && (
                  <ComplexChoiceCard
                    choice={choices[safeTab]}
                    index={safeTab}
                    title={`Choix ${String.fromCharCode(65 + safeTab)}`}
                    onUpdate={(updates) => onUpdateChoice(safeTab, updates)}
                    onRemove={() => handleRemoveChoice(safeTab)}
                    canRemove={choices.length > 2}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
    </div>
  );
}

export default ComposerFormPanel;
