import { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DialogueTextareaCard } from '../../DialogueComposerV2/helpers';
import type { DialogueChoice, Scene, MinigameConfig } from '@/types';
import type { ComplexityLevel } from '@/types';
import type { ResponseData } from '../../DialogueWizard/hooks/useDialogueForm';
import { BinaryChoiceField } from './BinaryChoiceField';
import { DiceChoiceCard } from '../../DialogueWizard/components/DiceChoiceBuilder/DiceChoiceCard';
import { ComplexChoiceCard } from '../../DialogueWizard/components/ComplexChoiceBuilder/ComplexChoiceCard';
import { MinigameChoiceBuilder } from '../../DialogueWizard/components/MinigameChoiceBuilder';
import { SectionLabel } from '../../DialogueComposerV2/helpers';
import { SpeakerCard } from '../../DialogueComposerV2/components/SpeakerCard';

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
  onUpdateMinigame,
  onUpdateSubtype,
}: ComposerFormPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  const currentScene = useMemo(
    () => scenes.find((s) => s.id === currentSceneId),
    [scenes, currentSceneId]
  );
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

  return (
    <div className="space-y-2">
      {/* ── Speaker ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionLabel label="Personnage" color="#fda4d0" />
        <SpeakerCard
          speaker={speaker}
          speakerMood={speakerMood}
          voicePreset={voicePreset}
          dialogueSubtype={dialogueSubtype}
          onSpeakerChange={onSpeakerChange}
          onMoodChange={onSpeakerMoodChange}
          onVoicePresetChange={onVoicePresetChange}
          onUpdateSubtype={onUpdateSubtype}
        />
      </div>

      {/* ── Dialogue text ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionLabel label="Dialogue" color="#93c5fd" />
        <DialogueTextareaCard value={text} onChange={onTextChange} />
      </div>

      {/* ── Minigame section ─────────────────────────────────────────────── */}
      {complexityLevel === 'minigame' && (
        <div className="space-y-3">
          <div className="h-px bg-border" />
          <SectionLabel label="Type de mini-jeu" color="#fde68a" />
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
