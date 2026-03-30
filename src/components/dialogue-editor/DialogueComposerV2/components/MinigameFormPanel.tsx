import { useState } from 'react';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { MinigameType } from '@/types/game';
import { T, FONTS, MINIGAME_CARDS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../constants';
import { SectionLabel, DialogueTextareaCard } from '../helpers';
import { SpeakerCard } from './SpeakerCard';

// ── Constantes locales ──────────────────────────────────────────────────────
const CUSTOM_TIMER_VALUES = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
const DRUM_SLOT_H = 42; // hauteur d'un slot dans les roulettes

const BRAILLE_TABS = [
  {
    mode: 'letter' as const,
    icon: '⣿',
    label: 'Lettre',
    sublabel: '1 symbole',
    color: T.teal,
    bg: T.tealBg,
    bd: T.tealBd,
    tc: '#0f2a26',
  },
  {
    mode: 'word' as const,
    icon: '▤',
    label: 'Mot',
    sublabel: 'mot complet',
    color: T.purple,
    bg: T.purpleBg,
    bd: T.purpleBd,
    tc: '#ffffff',
  },
] as const;

// ── Styles communs ──────────────────────────────────────────────────────────
const rouletteArrowStyle = (enabled: boolean, color: string, bg: string, bd: string) =>
  ({
    background: enabled ? bg : 'transparent',
    border: `1.5px solid ${enabled ? bd : T.border}`,
    borderRadius: 8,
    color: enabled ? color : T.t3,
    fontSize: 14,
    fontWeight: 900,
    cursor: enabled ? 'pointer' : 'default',
    padding: '4px 0',
    transition: 'all 0.15s',
    width: '100%',
  }) as const;

interface MinigameFormPanelProps {
  formData: DialogueFormData;
  onSpeakerChange: (id: string) => void;
  onMoodChange: (mood: string) => void;
  onTextChange: (text: string) => void;
  onMinigameTypeChange: (type: MinigameType) => void;
  onDifficultyChange: (val: number) => void;
  onTimerChip: (seconds: number) => void;
  onBrailleModeChange: (mode: 'letter' | 'word') => void;
  onVoicePresetChange?: (preset: string | undefined) => void;
  onUpdateSubtype?: (subtype: 'normal' | 'phonecall') => void;
}

export function MinigameFormPanel({
  formData,
  onSpeakerChange,
  onMoodChange,
  onTextChange,
  onMinigameTypeChange,
  onDifficultyChange,
  onTimerChip,
  onBrailleModeChange,
  onVoicePresetChange,
  onUpdateSubtype,
}: MinigameFormPanelProps) {
  const mgType = formData.minigame?.type ?? 'braille';
  const mgDifficulty = formData.minigame?.difficulty ?? 3;
  const mgTimeout = formData.minigame?.timeout ?? 0;
  const mgBrailleMode = formData.minigame?.brailleMode ?? 'letter';
  const mgHasTimer = mgTimeout > 0;

  // Mode d'affichage du timer : standard (∞/15s) ou personnalisé (roulette)
  const [timerDisplayMode, setTimerDisplayMode] = useState<'standard' | 'custom'>(() =>
    mgTimeout === 0 || mgTimeout === 15000 ? 'standard' : 'custom'
  );

  // Index de la roulette personnalisée dans CUSTOM_TIMER_VALUES
  const [customTimerIdx, setCustomTimerIdx] = useState(() => {
    const secs = mgTimeout > 0 ? Math.round(mgTimeout / 1000) : 15;
    const idx = CUSTOM_TIMER_VALUES.indexOf(secs);
    return idx >= 0 ? idx : 2; // fallback sur 15s (index 2)
  });

  // ── Difficulté — calculs odometer ───────────────────────────────────────
  const diffColor = DIFFICULTY_COLORS[mgDifficulty];
  const drumDiffY = -(mgDifficulty - 1) * DRUM_SLOT_H;

  // ── Timer personnalisé — calculs roulette ───────────────────────────────
  const drumTimerY = -(customTimerIdx * DRUM_SLOT_H);

  const handleCustomTimerUp = () => {
    const newIdx = Math.min(CUSTOM_TIMER_VALUES.length - 1, customTimerIdx + 1);
    setCustomTimerIdx(newIdx);
    onTimerChip(CUSTOM_TIMER_VALUES[newIdx]);
  };

  const handleCustomTimerDown = () => {
    const newIdx = Math.max(0, customTimerIdx - 1);
    setCustomTimerIdx(newIdx);
    onTimerChip(CUSTOM_TIMER_VALUES[newIdx]);
  };

  const handleSwitchToCustom = () => {
    setTimerDisplayMode('custom');
    // Initialise la valeur timer si aucune n'est définie
    if (!mgHasTimer) onTimerChip(CUSTOM_TIMER_VALUES[customTimerIdx]);
  };

  const handleSwitchToStandard = () => {
    setTimerDisplayMode('standard');
  };

  return (
    <>
      {/* ── PERSONNAGE ──────────────────────────────────────────────────── */}
      <div>
        <SectionLabel label="Personnage" color={T.rose} />
        <SpeakerCard
          speaker={formData.speaker}
          speakerMood={formData.speakerMood}
          voicePreset={formData.voicePreset}
          dialogueSubtype={formData.dialogueSubtype}
          onSpeakerChange={onSpeakerChange}
          onMoodChange={onMoodChange}
          onVoicePresetChange={onVoicePresetChange}
          onUpdateSubtype={onUpdateSubtype}
        />
      </div>

      {/* ── DIALOGUE ────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel label="Dialogue" color={T.blue} />
        <DialogueTextareaCard value={formData.text} onChange={onTextChange} />
      </div>

      {/* ── TYPE DE MINI-JEU ─────────────────────────────────────────────── */}
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
                title={card.desc}
                aria-label={card.label}
                onClick={() => onMinigameTypeChange(card.type)}
                style={{
                  borderRadius: 12,
                  padding: '10px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
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
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: card.bg,
                    border: `1.5px solid ${card.bd}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {card.type === 'falc' ? '📋' : card.type === 'qte' ? '⌨️' : '⣿'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: isActive ? card.tc : T.t1 }}>
                  {card.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PARAMÈTRES ───────────────────────────────────────────────────── */}
      <div>
        <SectionLabel label="Paramètres" color={T.teal} />
        <div
          style={{
            background: 'rgba(94,234,212,0.07)',
            border: `1.5px solid ${T.tealBd}`,
            borderRadius: 14,
            padding: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* ── 1. MODE BRAILLE — en premier, clone TypeTabBar ─────────── */}
          {mgType === 'braille' && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.t3,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Mode
              </div>
              <div
                role="tablist"
                aria-label="Mode braille"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
              >
                {BRAILLE_TABS.map((tab) => {
                  const isActive = mgBrailleMode === tab.mode;
                  return (
                    <button
                      key={tab.mode}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onBrailleModeChange(tab.mode)}
                      style={{
                        borderRadius: 11,
                        padding: '11px 8px 9px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        position: 'relative',
                        background: isActive ? `${tab.color}c0` : T.card,
                        border: `1.5px solid ${isActive ? tab.color : T.border}`,
                        transform: isActive ? 'translateY(-4px)' : 'none',
                        boxShadow: isActive ? `0 8px 24px ${tab.color}55` : 'none',
                        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Badge "actif" — identique TypeTabBar */}
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -9,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(255,255,255,0.92)',
                            color: tab.color,
                            fontSize: 8,
                            fontWeight: 900,
                            padding: '2px 7px',
                            borderRadius: 5,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          actif
                        </div>
                      )}
                      {/* Icône container 26×26 — identique TypeTabBar */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: isActive ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.07)',
                          border: `1px solid ${isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                        }}
                      >
                        {tab.icon}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: isActive ? tab.tc : T.t2,
                          fontFamily: FONTS.display,
                          lineHeight: 1.2,
                        }}
                      >
                        {tab.label}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: isActive
                            ? tab.tc === '#ffffff'
                              ? 'rgba(255,255,255,0.72)'
                              : `${tab.tc}99`
                            : T.t3,
                        }}
                      >
                        {tab.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 2 & 3. DIFFICULTÉ + DURÉE — côte à côte ──────────────────
               Norman §9.1 : fond teinté distinct par colonne → appartenance
               avant le clic, évite la confusion entre les ▲▼ adjacents       */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* ── Colonne Difficulté ──────────────────────────────────── */}
            <div
              style={{
                background: `${diffColor}0d`,
                border: `1px solid ${diffColor}30`,
                borderRadius: 10,
                padding: '8px 7px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: diffColor }}>⚡ Difficulté</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* ▲ */}
                <button
                  type="button"
                  onClick={() => onDifficultyChange(Math.min(5, mgDifficulty + 1))}
                  disabled={mgDifficulty >= 5}
                  aria-label="Augmenter la difficulté"
                  style={rouletteArrowStyle(
                    mgDifficulty < 5,
                    diffColor,
                    `${diffColor}18`,
                    `${diffColor}44`
                  )}
                >
                  ▲
                </button>

                {/* Fenêtre odometer */}
                <div
                  style={{
                    height: DRUM_SLOT_H,
                    overflow: 'hidden',
                    borderRadius: 9,
                    border: `1.5px solid ${diffColor}55`,
                    background: `${diffColor}10`,
                  }}
                >
                  <div
                    style={{
                      transform: `translateY(${drumDiffY}px)`,
                      transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((level) => {
                      const lColor = DIFFICULTY_COLORS[level];
                      return (
                        <div
                          key={level}
                          style={{
                            height: DRUM_SLOT_H,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: 2,
                              flexShrink: 0,
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((barIdx) => (
                              <div
                                key={barIdx}
                                style={{
                                  width: 3,
                                  height: 4 + barIdx * 3,
                                  borderRadius: 2,
                                  background: barIdx <= level ? lColor : 'rgba(255,255,255,0.13)',
                                }}
                              />
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: lColor,
                              fontFamily: FONTS.display,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {DIFFICULTY_LABELS[level]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ▼ */}
                <button
                  type="button"
                  onClick={() => onDifficultyChange(Math.max(1, mgDifficulty - 1))}
                  disabled={mgDifficulty <= 1}
                  aria-label="Diminuer la difficulté"
                  style={rouletteArrowStyle(
                    mgDifficulty > 1,
                    diffColor,
                    `${diffColor}18`,
                    `${diffColor}44`
                  )}
                >
                  ▼
                </button>
              </div>
            </div>

            {/* ── Colonne Durée ───────────────────────────────────────── */}
            <div
              style={{
                background: `${T.teal}0d`,
                border: `1px solid ${T.teal}30`,
                borderRadius: 10,
                padding: '8px 7px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: T.teal }}>⏱ Durée</div>

              {/* Toggle Std / Libre */}
              <div style={{ display: 'flex', gap: 4 }}>
                {(['standard', 'custom'] as const).map((mode) => {
                  const isActiveMode = timerDisplayMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={mode === 'standard' ? handleSwitchToStandard : handleSwitchToCustom}
                      style={{
                        flex: 1,
                        padding: '4px 4px',
                        borderRadius: 6,
                        border: `1.5px solid ${isActiveMode ? T.tealBd : T.border}`,
                        background: isActiveMode ? T.tealBg : 'transparent',
                        color: isActiveMode ? T.teal : T.t3,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                    >
                      {mode === 'standard' ? 'Std' : 'Libre'}
                    </button>
                  );
                })}
              </div>

              {/* ── Standard : ∞ + 15s en colonne ────────────────────── */}
              {timerDisplayMode === 'standard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button
                    type="button"
                    aria-pressed={!mgHasTimer}
                    onClick={() => onTimerChip(0)}
                    style={{
                      padding: '9px 6px',
                      borderRadius: 9,
                      border: `1.5px solid ${!mgHasTimer ? T.tealBd : T.border}`,
                      background: !mgHasTimer ? T.tealBg : T.card,
                      color: !mgHasTimer ? T.teal : T.t3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      transform: !mgHasTimer ? 'translateY(-2px)' : 'none',
                      boxShadow: !mgHasTimer ? `0 5px 14px ${T.teal}38` : 'none',
                      transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>∞</span>
                    <span style={{ fontSize: 9, fontWeight: 700 }}>Sans limite</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={mgTimeout === 15000}
                    onClick={() => onTimerChip(15)}
                    style={{
                      padding: '9px 6px',
                      borderRadius: 9,
                      border: `1.5px solid ${mgTimeout === 15000 ? T.greenBd : T.border}`,
                      background: mgTimeout === 15000 ? T.greenBg : T.card,
                      color: mgTimeout === 15000 ? T.green : T.t3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      transform: mgTimeout === 15000 ? 'translateY(-2px)' : 'none',
                      boxShadow: mgTimeout === 15000 ? `0 5px 14px ${T.green}38` : 'none',
                      transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        lineHeight: 1,
                        fontFamily: FONTS.display,
                      }}
                    >
                      15s
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700 }}>Recommandé</span>
                  </button>
                </div>
              )}

              {/* ── Libre : roulette ↑↓ ───────────────────────────────── */}
              {timerDisplayMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* ▲ */}
                  <button
                    type="button"
                    onClick={handleCustomTimerUp}
                    disabled={customTimerIdx >= CUSTOM_TIMER_VALUES.length - 1}
                    aria-label="Augmenter la durée"
                    style={rouletteArrowStyle(
                      customTimerIdx < CUSTOM_TIMER_VALUES.length - 1,
                      T.teal,
                      T.tealBg,
                      T.tealBd
                    )}
                  >
                    ▲
                  </button>

                  {/* Fenêtre roulette */}
                  <div
                    style={{
                      height: DRUM_SLOT_H,
                      overflow: 'hidden',
                      borderRadius: 9,
                      border: `1.5px solid ${T.tealBd}`,
                      background: T.tealBg,
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(${drumTimerY}px)`,
                        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                      }}
                    >
                      {CUSTOM_TIMER_VALUES.map((v) => (
                        <div
                          key={v}
                          style={{
                            height: DRUM_SLOT_H,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: T.teal,
                              fontFamily: FONTS.display,
                            }}
                          >
                            {v}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: T.t3 }}>s</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ▼ */}
                  <button
                    type="button"
                    onClick={handleCustomTimerDown}
                    disabled={customTimerIdx <= 0}
                    aria-label="Diminuer la durée"
                    style={rouletteArrowStyle(customTimerIdx > 0, T.teal, T.tealBg, T.tealBd)}
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
