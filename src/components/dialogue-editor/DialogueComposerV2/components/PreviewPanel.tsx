import { Save, Network, Move } from 'lucide-react';
import { useRef, useCallback, useEffect } from 'react';
import type { DialogueFormData } from '../../DialogueWizard/hooks/useDialogueForm';
import type { Scene } from '@/types';
import { useDialogueBoxConfig } from '@/hooks/useDialogueBoxConfig';
import { useSettingsStore } from '@/stores/settingsStore';
import { DialogueBox, hashStringToColor } from '@/components/ui/DialogueBox';
import { VisualFilterLayer } from '@/components/ui/VisualFilterLayer';
import { DialogueBoxPositioned } from '@/components/ui/DialogueBoxPositioned';
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
  const updateDialogueBoxDefaults = useSettingsStore((s) => s.updateDialogueBoxDefaults);

  // Drag ref pour le mode custom
  const previewRef = useRef<HTMLDivElement>(null);
  // Refs des listeners actifs — cleanup si le composant se démonte mid-drag
  const dragMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const dragUpRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (dragMoveRef.current) window.removeEventListener('mousemove', dragMoveRef.current);
      if (dragUpRef.current) window.removeEventListener('mouseup', dragUpRef.current);
    };
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (dialogueBoxConfig.position !== 'custom') return;
      e.preventDefault();
      const container = previewRef.current;
      if (!container) return;

      const onMove = (me: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.round(
          Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100))
        );
        const y = Math.round(
          Math.min(100, Math.max(0, ((me.clientY - rect.top) / rect.height) * 100))
        );
        updateDialogueBoxDefaults({ positionX: x, positionY: y });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        dragMoveRef.current = null;
        dragUpRef.current = null;
      };
      dragMoveRef.current = onMove;
      dragUpRef.current = onUp;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [dialogueBoxConfig.position, updateDialogueBoxDefaults]
  );

  const position = dialogueBoxConfig.position;
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
          {/* wrapper ref pour drag custom — VisualFilterLayer n'est pas forwardRef */}
          <div
            ref={previewRef}
            style={{ flex: 1, minHeight: 200, overflow: 'hidden', position: 'relative' }}
          >
            <VisualFilterLayer style={{ width: '100%', height: '100%', minHeight: 200 }}>
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

              {/* DialogueBox — positionnée via composant partagé */}
              <DialogueBoxPositioned
                position={position}
                positionX={dialogueBoxConfig.positionX}
                positionY={dialogueBoxConfig.positionY}
                boxWidth={dialogueBoxConfig.boxWidth}
                onMouseDown={position === 'custom' ? handleDragStart : undefined}
                outerSlot={
                  position === 'custom' ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: -20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#8b5cf6bf',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: 'move',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                      }}
                      aria-hidden="true"
                    >
                      <Move size={9} /> Glisser pour repositionner
                    </div>
                  ) : undefined
                }
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
              </DialogueBoxPositioned>
            </VisualFilterLayer>
          </div>

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
            background: isSaved ? T.greenBg : canSave ? '#8b5cf6cc' : '#8b5cf659',
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
