import type { Character } from '@/types';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { MinigameType } from '@/types/game';
import { DEFAULTS } from '@/config/constants';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { T, MINIGAME_CARDS, TIMER_CHIPS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../constants';
import { SectionLabel, GlassCard } from '../helpers';

interface MinigameFormPanelProps {
  formData: DialogueFormData;
  characters: Character[];
  speakerChar: Character | undefined;
  speakerName: string;
  speakerMoods: string[];
  wordCount: number;
  charCount: number;
  onSpeakerChange: (id: string) => void;
  onMoodChange: (mood: string) => void;
  onTextChange: (text: string) => void;
  onMinigameTypeChange: (type: MinigameType) => void;
  onDifficultyChange: (val: number) => void;
  onTimerToggle: (enabled: boolean) => void;
  onTimerChip: (seconds: number) => void;
  onBrailleModeChange: (mode: 'letter' | 'word') => void;
}

export function MinigameFormPanel({
  formData,
  characters,
  speakerChar,
  speakerName,
  speakerMoods,
  wordCount,
  charCount,
  onSpeakerChange,
  onMoodChange,
  onTextChange,
  onMinigameTypeChange,
  onDifficultyChange,
  onTimerToggle,
  onTimerChip,
  onBrailleModeChange,
}: MinigameFormPanelProps) {
  const mgType = formData.minigame?.type ?? 'braille';
  const mgDifficulty = formData.minigame?.difficulty ?? 3;
  const mgTimeout = formData.minigame?.timeout ?? 0;
  const mgHasTimer = mgTimeout > 0;
  const mgBrailleMode = formData.minigame?.brailleMode ?? 'letter';

  return (
    <>
      {/* PERSONNAGE */}
      <div>
        <SectionLabel label="Personnage" color={T.rose} />
        <GlassCard>
          <div style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
                  onChange={(e) => onSpeakerChange(e.target.value)}
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
                        onClick={() => onMoodChange(mood)}
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
              {wordCount} mot{wordCount !== 1 ? 's' : ''} · ~{Math.max(1, Math.ceil(wordCount / 3))}
              s
            </span>
          </div>
          <textarea
            value={formData.text}
            onChange={(e) => onTextChange(e.target.value)}
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
                onClick={() => onMinigameTypeChange(card.type)}
                style={{
                  borderRadius: 14,
                  padding: '14px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 7,
                  background: isActive ? `${card.c}c0` : T.card,
                  border: `1.5px solid ${isActive ? card.c : T.border}`,
                  transform: isActive ? 'translateY(-3px)' : 'none',
                  boxShadow: isActive ? `0 6px 18px ${card.c}55` : 'none',
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
                <div style={{ fontSize: 13, fontWeight: 900, color: isActive ? card.tc : T.t1 }}>
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
                    fontSize: 12,
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
              onChange={(e) => onDifficultyChange(Number(e.target.value))}
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
                    onClick={() => onTimerToggle(i === 1)}
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
                      onClick={() => onTimerChip(chip.value)}
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
                        style={{ width: 9, height: 9, borderRadius: '50%', background: chip.color }}
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
              <div style={{ fontSize: 13, fontWeight: 800, color: T.t1, marginBottom: 7 }}>
                Mode
              </div>
              <div role="group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
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
                      onClick={() => onBrailleModeChange(mode)}
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
  );
}
