import { Save, Network } from 'lucide-react';
import type { Character } from '@/types';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { Scene } from '@/types';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { T, MINIGAME_CARDS, TYPE_TABS } from '../constants';

interface PreviewPanelProps {
  formData: DialogueFormData;
  currentScene: Scene | undefined;
  speakerChar: Character | undefined;
  speakerName: string;
  speakerPortraitUrl: string;
  wordCount: number;
  testMode: boolean;
  isSaved: boolean;
  canSave: boolean;
  onTestMinigame: () => void;
  onSave: () => void;
  onOpenGraph?: () => void;
}

export function PreviewPanel({
  formData,
  currentScene,
  speakerChar,
  speakerName,
  speakerPortraitUrl,
  wordCount,
  testMode,
  isSaved,
  canSave,
  onTestMinigame,
  onSave,
  onOpenGraph,
}: PreviewPanelProps) {
  const isMinigame = formData.complexityLevel === 'minigame';
  const mgType = formData.minigame?.type ?? 'braille';
  const activeTab = TYPE_TABS.find((t) => t.id === formData.complexityLevel);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1.5px solid ${T.border}`,
          background: 'rgba(255,255,255,0.07)',
          flexShrink: 0,
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
            <circle cx="7.5" cy="7.5" r="6.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" />
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
              fontSize: 12,
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

      {/* Preview card — flex:1 pour occuper tout l'espace */}
      <div
        style={{
          flex: 1,
          padding: '0 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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
          {/* Background scène */}
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
              flexShrink: 0,
            }}
          >
            {!currentScene?.backgroundUrl && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.42)' }}>
                Aperçu de scène
              </span>
            )}
            {/* Avatar speaker */}
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
              flexShrink: 0,
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

          {/* Stats row */}
          <div
            style={{
              padding: '8px 12px 4px',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
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
                fontSize: 12,
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

          {/* Choices preview */}
          {!isMinigame && formData.complexityLevel !== 'linear' && formData.choices.length > 0 && (
            <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: T.t3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                CHOIX
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {formData.choices.slice(0, 4).map((choice, i) => (
                  <div
                    key={i}
                    style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.t2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: T.teal,
                        width: 14,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: choice.text?.trim() ? T.t1 : T.t3,
                        fontStyle: choice.text?.trim() ? 'normal' : 'italic',
                      }}
                    >
                      {choice.text?.trim() || 'Texte du choix…'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scène info */}
          <div
            style={{
              margin: '0 12px 12px',
              padding: '7px 10px',
              background: 'rgba(0,0,0,0.22)',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, flexShrink: 0 }}>📍</span>
            <span
              style={{
                fontSize: 12,
                color: T.t3,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentScene?.title ?? 'Scène…'}
            </span>
          </div>

          {/* Badge + bouton mini-jeu */}
          {isMinigame && (
            <div style={{ padding: '6px 12px 12px', flexShrink: 0 }}>
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
                MINI-JEU · {MINIGAME_CARDS.find((m) => m.type === mgType)?.label?.toUpperCase()}
              </div>
              <button
                onClick={onTestMinigame}
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
          onClick={onSave}
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
  );
}
