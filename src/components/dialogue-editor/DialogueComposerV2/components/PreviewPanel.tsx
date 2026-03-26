import { Save, Network } from 'lucide-react';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { Scene } from '@/types';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { DialogueBox, hashStringToColor } from '@/components/ui/DialogueBox';
import { VisualFilterLayer } from '@/components/ui/VisualFilterLayer';
import { T, FONTS, MINIGAME_CARDS, TYPE_TABS } from '../constants';

interface PreviewPanelProps {
  formData: DialogueFormData;
  currentScene: Scene | undefined;
  speakerName: string;
  speakerPortraitUrl: string;
  isNarrator: boolean;
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
      {/* Preview card — flex:1 pour occuper tout l'espace, sans header séparé */}
      <div
        style={{
          flex: 1,
          padding: '16px',
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
            position: 'relative',
          }}
        >
          {/* Zone scène — flex:1, fond + DialogueBox réelle en overlay */}
          {/* VisualFilterLayer : applique les filtres graphiques du projet (grain, scanlines, CRT…) */}
          <VisualFilterLayer style={{ flex: 1, minHeight: 200, overflow: 'hidden' }}>
            {/* Pill "Aperçu en direct" + badge type — overlay haut-gauche */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(14,10,36,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${T.border}`,
                  borderRadius: 7,
                  padding: '4px 8px',
                  fontFamily: FONTS.display,
                  fontSize: 11,
                  fontWeight: 800,
                  color: T.t2,
                }}
              >
                <svg viewBox="0 0 15 15" fill="none" width={11} height={11}>
                  <circle
                    cx="7.5"
                    cy="7.5"
                    r="6.5"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 7.5l2 2 3-3"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Aperçu en direct
              </div>
              {isMinigame && activeTab && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontWeight: 800,
                    background: activeTab.bg,
                    color: activeTab.c,
                    border: `1.5px solid ${activeTab.bd}`,
                  }}
                >
                  {MINIGAME_CARDS.find((m) => m.type === mgType)?.label ?? 'Mini-jeu'}
                </span>
              )}
            </div>
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
          </VisualFilterLayer>

          {/* Bouton mini-jeu — affiché uniquement pour le type minigame */}
          {isMinigame && (
            <div
              style={{
                flexShrink: 0,
                borderTop: `1.5px solid ${T.border}`,
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={onTestMinigame}
                style={{
                  background: testMode ? T.amberBg : T.greenBg,
                  border: `1.5px solid ${testMode ? T.amberBd : T.greenBd}`,
                  borderRadius: 11,
                  padding: '9px 28px',
                  fontSize: 13,
                  fontWeight: 900,
                  color: testMode ? T.amber : T.green,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {testMode ? '⏳ En cours…' : '▶ Tester le jeu'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save zone */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: `1.5px solid ${T.border}`,
          background: 'rgba(14,10,36,0.95)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={onSave}
          disabled={!canSave}
          aria-label="Sauvegarder le dialogue"
          className="ac-save-shimmer"
          style={{
            padding: '12px 48px',
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
              background: 'transparent',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: T.t3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
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
