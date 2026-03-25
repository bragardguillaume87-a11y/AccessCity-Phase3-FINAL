import { Save, Network } from 'lucide-react';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { Scene } from '@/types';
import { getMoodEmoji, getMoodLabel } from '@/hooks/useMoodPresets';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { DialogueBox, hashStringToColor } from '@/components/ui/DialogueBox';
import { T, FONTS, MINIGAME_CARDS, TYPE_TABS } from '../constants';

interface PreviewPanelProps {
  formData: DialogueFormData;
  currentScene: Scene | undefined;
  speakerName: string;
  speakerPortraitUrl: string;
  isNarrator: boolean;
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
  speakerName,
  speakerPortraitUrl,
  isNarrator,
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
  const dialogueBoxConfig = useDialogueBoxConfig(undefined);
  // isNarrator vient du parent (même logique que useSpeakerLayout : role + ID système)
  const position = isNarrator ? 'center' : dialogueBoxConfig.position;
  const previewChoices =
    !isMinigame && formData.complexityLevel !== 'linear' && formData.choices.length > 0
      ? formData.choices
      : undefined;
  const speakerColor = hashStringToColor(speakerName);

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
            fontFamily: FONTS.display,
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
          {/* Zone scène — flex:1, fond + DialogueBox réelle en overlay */}
          <div style={{ flex: 1, position: 'relative', minHeight: 200, overflow: 'hidden' }}>
            {/* Fond de scène */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: currentScene?.backgroundUrl
                  ? `url(${currentScene.backgroundUrl}) center / cover`
                  : 'linear-gradient(160deg, rgba(88,28,135,0.92) 0%, rgba(30,58,138,0.90) 50%, rgba(6,78,59,0.75) 100%)',
              }}
            >
              {!currentScene?.backgroundUrl && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  Aperçu de scène
                </div>
              )}
            </div>

            {/* Sprite personnage — masqué pour le narrateur (pas de présence visuelle) */}
            {speakerPortraitUrl && !isNarrator && (
              <img
                key={speakerPortraitUrl}
                src={speakerPortraitUrl}
                alt={speakerName}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: '82%',
                  maxWidth: '40%',
                  objectFit: 'contain',
                  objectPosition: 'bottom',
                  zIndex: 1,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.55))',
                }}
              />
            )}

            {/* DialogueBox réelle — même composant que PreviewPlayer */}
            <div
              style={{
                position: 'absolute',
                zIndex: 2,
                ...(position === 'top'
                  ? { top: 0, left: 0, right: 0 }
                  : position === 'center'
                    ? { inset: 0, display: 'flex', alignItems: 'center' }
                    : { bottom: 0, left: 0, right: 0 }),
              }}
            >
              {/* Gradient directionnel */}
              {position !== 'center' && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    pointerEvents: 'none',
                    ...(position === 'top'
                      ? {
                          top: 0,
                          height: '55%',
                          background:
                            'linear-gradient(to bottom, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)',
                        }
                      : {
                          bottom: 0,
                          height: '55%',
                          background:
                            'linear-gradient(to top, rgba(3,7,18,0.80) 0%, rgba(3,7,18,0.35) 50%, transparent 100%)',
                        }),
                  }}
                />
              )}
              <div
                style={{
                  position: 'relative',
                  padding:
                    position === 'top'
                      ? '12px 12px 0'
                      : position === 'center'
                        ? '8px 12px'
                        : '0 12px 10px',
                  maxWidth: '92%',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                <DialogueBox
                  speaker={isNarrator ? undefined : speakerName}
                  displayText={formData.text || 'Aucun texte…'}
                  isNarrator={isNarrator}
                  isTypewriterDone={true}
                  hasChoices={!!previewChoices?.length}
                  choices={previewChoices}
                  config={dialogueBoxConfig}
                  scaleFactor={0.48}
                  speakerPortraitUrl={speakerPortraitUrl || null}
                  speakerColor={speakerColor}
                />
              </div>
            </div>
          </div>

          {/* Zone métadonnées — stats + choix + scène + mini-jeu */}
          <div
            style={{
              flexShrink: 0,
              overflowY: 'auto',
              maxHeight: 220,
              borderTop: `1.5px solid ${T.border}`,
            }}
          >
            {/* Stats row */}
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

            {/* Scène info */}
            <div
              style={{
                margin: '0 12px 12px',
                padding: '6px 10px',
                background: 'rgba(0,0,0,0.22)',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
                  {testMode ? '⏳ En cours…' : '▶ Tester le mini-jeu'}
                </button>
              </div>
            )}
          </div>
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
            fontFamily: FONTS.display,
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
