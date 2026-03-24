import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, MessageSquare, Play, RotateCcw } from 'lucide-react';
import type { DialogueChoice, MinigameConfig } from '@/types';
import type { ComplexityLevel } from '@/types';
import { MinigameFalc } from '@/components/panels/PreviewPlayer/MinigameFalc';
import { MinigameQte } from '@/components/panels/PreviewPlayer/MinigameQte';
import { MinigameBraille } from '@/components/panels/PreviewPlayer/MinigameBraille';
import { uiSounds } from '@/utils/uiSounds';
import { hexAlpha } from '@/config/dialogueComposerThemes';

// ── Speaker color — HSL déterministe depuis le nom (Quilez §14.1) ────────────
// Algorithme identique à hashStringToColor() dans DialogueBox.tsx.
// Retourne le hue (0-359) pour composer hsla() avec alpha variable.
function getSpeakerHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ── Type badge map ────────────────────────────────────────────────────────────
const TYPE_BADGES: Record<ComplexityLevel, { emoji: string; label: string }> = {
  linear: { emoji: '📖', label: 'Simple' },
  binary: { emoji: '🔀', label: 'À choisir' },
  dice: { emoji: '🎲', label: 'Dés' },
  expert: { emoji: '⚡', label: 'Expert' },
  minigame: { emoji: '🎮', label: 'Mini-jeu' },
};

// ── Console bezel colors — par type de mini-jeu ───────────────────────────────
// Aligné avec MINIGAME_TYPE_COLORS dans MinigameChoiceBuilder (amber / cyan / mauve)
const MINIGAME_BEZEL_COLORS: Record<
  string,
  { border: string; glow: string; bg: string; color: string; icon: string; name: string }
> = {
  falc: {
    border: 'rgba(245,158,11,0.55)',
    glow: 'rgba(245,158,11,0.22)',
    bg: 'rgba(245,158,11,0.09)',
    color: '#f59e0b',
    icon: '🃏',
    name: 'FALC',
  },
  qte: {
    border: 'rgba(6,182,212,0.55)',
    glow: 'rgba(6,182,212,0.22)',
    bg: 'rgba(6,182,212,0.09)',
    color: '#06b6d4',
    icon: '⚡',
    name: 'QTE',
  },
  braille: {
    border: 'rgba(167,139,250,0.55)',
    glow: 'rgba(167,139,250,0.22)',
    bg: 'rgba(167,139,250,0.09)',
    color: '#a78bfa',
    icon: '⠿',
    name: 'BRAILLE',
  },
};
// Fallback quand aucun type n'est encore sélectionné
const BEZEL_DEFAULT = {
  border: 'rgba(20,184,166,0.40)',
  glow: 'rgba(20,184,166,0.15)',
  bg: 'rgba(20,184,166,0.08)',
  color: '#14b8a6',
  icon: '🎮',
  name: 'MINI-JEU',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface ComposerPreviewPanelProps {
  /** Resolved character name (not ID) */
  speakerName: string;
  text: string;
  choices: DialogueChoice[];
  complexityLevel: ComplexityLevel | null;
  isSaved?: boolean;
  minigame?: MinigameConfig;
  /** URL du sprite/portrait du speaker pour le mood actif */
  speakerPortraitUrl?: string;
  /** URL du background de la scène active — affiché en watermark à 22% opacity (Will Wright §4.1) */
  sceneBackgroundUrl?: string;
  /** Couleur d'accent principale (form, VN textbox border, choices) — issue du thème actif */
  accentColor?: string;
  /** Couleur de la zone preview (header bar) — peut différer pour le thème Aurora */
  previewAccentColor?: string;
}

/**
 * ComposerPreviewPanel — "Fenêtre de jeu" preview.
 *
 * Occupe tout le right panel (flex 1, overflow hidden).
 * Fond sombre avec scanlines + vignette pour contraste fort vs le form panel gauche.
 * Textbox VN positionnée en bas de la zone, style jeu renforcé.
 */
export function ComposerPreviewPanel({
  speakerName,
  text,
  choices,
  complexityLevel,
  isSaved = false,
  minigame,
  speakerPortraitUrl,
  sceneBackgroundUrl,
  accentColor = '#8b5cf6',
  previewAccentColor = '#8b5cf6',
}: ComposerPreviewPanelProps) {
  const speakerHue = getSpeakerHue(speakerName);
  const speakerColor = `hsl(${speakerHue}, 70%, 65%)`;
  const badge = complexityLevel ? TYPE_BADGES[complexityLevel] : null;
  const hasChoices = choices.length > 0 && complexityLevel !== 'linear';
  const isMinigame = complexityLevel === 'minigame';

  const [mgPreview, setMgPreview] = useState<'idle' | 'playing' | 'success' | 'failure'>('idle');
  // Zoom de la fenêtre de jeu — 0.80 par défaut (auto-fit), ajustable par l'utilisateur
  const [previewZoom, setPreviewZoom] = useState(0.8);
  const zoomIn = useCallback(
    () => setPreviewZoom((z) => Math.min(1.0, Math.round((z + 0.1) * 10) / 10)),
    []
  );
  const zoomOut = useCallback(
    () => setPreviewZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10)),
    []
  );

  const handleStartPreview = useCallback(() => {
    uiSounds.initialize();
    setMgPreview('playing');
  }, []);

  const handleMgResult = useCallback((success: boolean) => {
    setMgPreview(success ? 'success' : 'failure');
    setTimeout(() => setMgPreview('idle'), 1500);
  }, []);

  // ── Console bezel layout — minigame type (header fixe + corps scrollable) ──
  if (isMinigame) {
    const mgType = minigame?.type;
    const bezel = mgType ? (MINIGAME_BEZEL_COLORS[mgType] ?? BEZEL_DEFAULT) : BEZEL_DEFAULT;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header — fixe */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 14px',
            background: 'rgba(8,10,18,0.85)',
            borderBottom: `1px solid ${hexAlpha(previewAccentColor, 0.22)}`,
            flexShrink: 0,
            transition: 'border-color 0.25s ease',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.38)',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
            }}
          >
            🎮 Aperçu en direct
          </span>
          {badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 999,
                background: hexAlpha(previewAccentColor, 0.16),
                border: `1px solid ${hexAlpha(previewAccentColor, 0.4)}`,
                fontSize: 10,
                fontWeight: 700,
                color: previewAccentColor,
                transition: 'background 0.25s ease, border-color 0.25s ease, color 0.25s ease',
              }}
            >
              {badge.emoji} {badge.label}
            </span>
          )}
        </div>

        {/* Corps scrollable — bezel + VN textbox en flux normal */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'rgba(4,5,10,0.98)',
          }}
        >
          {/* Console screen bezel — bordure lumineuse couleur type */}
          <div
            style={{
              borderRadius: 14,
              border: `2px solid ${bezel.border}`,
              boxShadow: `0 0 28px ${bezel.glow}, 0 0 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
              overflow: 'hidden',
              background: 'rgba(8,10,18,0.96)',
              flexShrink: 0,
            }}
          >
            {/* Bezel header — nom, zoom controls, fermer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px 6px 14px',
                background: bezel.bg,
                borderBottom: `1px solid ${bezel.border}`,
              }}
            >
              {/* Nom du type */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: bezel.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13 }}>{bezel.icon}</span>
                {bezel.name} PREVIEW
              </span>

              {/* Contrôles droite : zoom + fermer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Zoom controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={previewZoom <= 0.5}
                    title="Dézoomer"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: 'none',
                      background:
                        previewZoom <= 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                      color:
                        previewZoom <= 0.5 ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.55)',
                      cursor: previewZoom <= 0.5 ? 'default' : 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.45)',
                      minWidth: 32,
                      textAlign: 'center',
                    }}
                  >
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={previewZoom >= 1.0}
                    title="Zoomer"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: 'none',
                      background:
                        previewZoom >= 1.0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                      color:
                        previewZoom >= 1.0 ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.55)',
                      cursor: previewZoom >= 1.0 ? 'default' : 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Fermer — uniquement quand une partie est en cours */}
                {mgPreview !== 'idle' && (
                  <button
                    type="button"
                    onClick={() => setMgPreview('idle')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(255,255,255,0.45)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                    }}
                  >
                    <RotateCcw size={9} /> Fermer
                  </button>
                )}
              </div>
            </div>

            {/* Contenu du jeu — zoom CSS pour auto-fit */}
            <div style={{ padding: '14px 12px', zoom: previewZoom }}>
              {mgPreview === 'idle' && (
                <button
                  type="button"
                  onClick={handleStartPreview}
                  disabled={!minigame}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: minigame
                      ? `linear-gradient(135deg, ${hexAlpha(bezel.color, 0.7)}, ${hexAlpha(bezel.color, 0.4)})`
                      : 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: minigame ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: minigame ? '#ffffff' : 'rgba(255,255,255,0.22)',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <Play size={14} />
                  {minigame ? '▶  Tester le mini-jeu' : 'Configure le mini-jeu pour tester'}
                </button>
              )}
              {mgPreview === 'playing' && minigame && (
                <>
                  {minigame.type === 'falc' && (
                    <MinigameFalc config={minigame} onResult={handleMgResult} />
                  )}
                  {minigame.type === 'qte' && (
                    <MinigameQte config={minigame} onResult={handleMgResult} />
                  )}
                  {minigame.type === 'braille' && (
                    <MinigameBraille config={minigame} onResult={handleMgResult} />
                  )}
                </>
              )}
              {(mgPreview === 'success' || mgPreview === 'failure') && (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 900,
                    color: mgPreview === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {mgPreview === 'success' ? '✓ Réussi !' : '✗ Raté'}
                </div>
              )}
            </div>
          </div>

          {/* VN Textbox — sous le bezel, en flux normal */}
          <div
            style={{
              borderRadius: 10,
              border: `1.5px solid ${hexAlpha(accentColor, 0.3)}`,
              background: 'rgba(6,8,16,0.93)',
              backdropFilter: 'blur(14px)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              flexShrink: 0,
              transition: 'border-color 0.25s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 13px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: speakerColor,
                  boxShadow: `0 0 6px hsla(${speakerHue},70%,65%,0.5)`,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  flex: 1,
                }}
              >
                {speakerName}
              </span>
              <div style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
                <GitBranch size={11} aria-hidden="true" />
              </div>
            </div>
            <div style={{ padding: '11px 13px', minHeight: 52 }}>
              {text ? (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.68,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {text}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,0.22)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  Le dialogue apparaîtra ici…
                </p>
              )}
            </div>
          </div>

          {/* Save confirmation */}
          {isSaved && (
            <div
              style={{
                padding: '14px',
                textAlign: 'center',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.12)',
                border: '1.5px solid rgba(16,185,129,0.35)',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-success)' }}>
                ✓ Dialogue sauvegardé !
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Default layout (non-minigame) ──────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 14px',
          background: 'rgba(8,10,18,0.85)',
          borderBottom: `1px solid ${hexAlpha(previewAccentColor, 0.22)}`,
          flexShrink: 0,
          transition: 'border-color 0.25s ease',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.38)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
          }}
        >
          📋 Aperçu en direct
        </span>

        {/* Badge pill — style capsule colorée (mockup §preview) */}
        {badge && (
          <motion.span
            key={badge.label}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 999,
              background: hexAlpha(previewAccentColor, 0.16),
              border: `1px solid ${hexAlpha(previewAccentColor, 0.4)}`,
              fontSize: 10,
              fontWeight: 700,
              color: previewAccentColor,
              transition: 'background 0.25s ease, border-color 0.25s ease, color 0.25s ease',
            }}
          >
            {badge.emoji} {badge.label}
          </motion.span>
        )}
      </div>

      {/* ── Scene area (flex 1) ───────────────────────────────────────────── */}
      <div
        style={{
          // Quand il y a des choix : hauteur fixe pour la textbox + laisser les choix grandir
          // Sinon (linear ou minigame) : flex: 1 pour occuper tout l'espace
          flex: hasChoices && !isMinigame ? 'none' : 1,
          height: hasChoices && !isMinigame ? 155 : undefined,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${hexAlpha(previewAccentColor, 0.1)} 0%, rgba(8,10,20,0.97) 38%, rgba(5,7,15,1) 75%, rgba(3,5,12,1) 100%)`,
          minHeight: 0,
        }}
      >
        {/* Background scène en watermark — Will Wright §4.1 "simulation visible" */}
        {sceneBackgroundUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url(${sceneBackgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.22,
            }}
          />
        )}

        {/* Grille perspective — viewport de moteur de jeu */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.16,
            backgroundImage: `repeating-linear-gradient(90deg, rgba(139,92,246,0.4) 0px, rgba(139,92,246,0.4) 1px, transparent 1px, transparent 72px),
            repeating-linear-gradient(0deg, rgba(139,92,246,0.4) 0px, rgba(139,92,246,0.4) 1px, transparent 1px, transparent 72px)`,
          }}
        />

        {/* Ambient glows atmosphériques */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            background: `radial-gradient(ellipse 60% 40% at 20% 65%, rgba(59,130,246,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 80% 35%, rgba(139,92,246,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 70% 45% at 50% 90%, rgba(20,184,166,0.06) 0%, transparent 70%)`,
          }}
        />

        {/* Scanlines subtiles */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 3,
            opacity: 0.04,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 3px)',
          }}
        />

        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 4,
            background:
              'radial-gradient(ellipse 85% 75% at 50% 42%, transparent 30%, rgba(0,0,0,0.78) 100%)',
          }}
        />

        {/* Portrait du speaker — ancre narrative (Will Wright §4.4 + Hennig §11.1) */}
        {speakerPortraitUrl ? (
          <div
            style={{
              position: 'absolute',
              bottom: 110,
              left: 18,
              zIndex: 8,
              pointerEvents: 'none',
            }}
          >
            <img
              src={speakerPortraitUrl}
              alt={speakerName}
              style={{
                width: 120,
                height: 160,
                objectFit: 'contain',
                objectPosition: 'bottom',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.8))',
                opacity: 0.92,
              }}
            />
          </div>
        ) : (
          /* Initiales colorées si pas de portrait (style Google Avatar) */
          <div
            style={{
              position: 'absolute',
              bottom: 118,
              left: 22,
              zIndex: 8,
              pointerEvents: 'none',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, hsla(${speakerHue},70%,65%,0.8), hsla(${speakerHue},70%,65%,0.33))`,
              border: `2px solid hsla(${speakerHue},70%,65%,0.53)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
              boxShadow: `0 4px 16px hsla(${speakerHue},70%,65%,0.27)`,
            }}
          >
            {speakerName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Save confirmation overlay */}
        {isSaved && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-success)' }}>
              ✓ Dialogue sauvegardé !
            </span>
          </div>
        )}

        {/* VN Textbox — absolute bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 12,
            right: 12,
            zIndex: 10,
          }}
        >
          <div
            style={{
              borderRadius: 10,
              border: `1.5px solid ${hexAlpha(accentColor, 0.3)}`,
              background: 'rgba(6,8,16,0.93)',
              transition: 'border-color 0.25s ease',
              backdropFilter: 'blur(14px)',
              overflow: 'hidden',
              boxShadow: '0 -4px 28px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Speaker bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 13px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: speakerColor,
                  boxShadow: `0 0 6px hsla(${speakerHue},70%,65%,0.5)`,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  flex: 1,
                }}
              >
                {speakerName}
              </span>
              <div style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>
                {complexityLevel === 'linear' ? (
                  <MessageSquare size={11} aria-hidden="true" />
                ) : (
                  <GitBranch size={11} aria-hidden="true" />
                )}
              </div>
            </div>

            {/* Dialogue text */}
            <div style={{ padding: '11px 13px', minHeight: 66 }}>
              {text ? (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.68,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {text}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,0.22)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  Le dialogue apparaîtra ici…
                </p>
              )}
            </div>

            {/* Scroll caret (linear only) */}
            {!hasChoices && !isMinigame && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '0 13px 7px',
                  color: 'rgba(255,255,255,0.18)',
                  fontSize: 9,
                }}
              >
                ▼
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Choices (binary / expert / dice) ────────────────────────────────── */}
      {hasChoices && (
        <div
          style={{
            flex: 1,
            padding: '10px 12px 12px',
            background: 'rgba(0,0,0,0.6)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            minHeight: 0,
          }}
        >
          {/* Label section */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.30)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Options du joueur
          </div>

          {choices.map((choice, index) => {
            const hasText = !!choice.text?.trim();
            return (
              <div
                key={choice.id}
                style={{
                  padding: '10px 13px',
                  borderRadius: 9,
                  background: hasText ? hexAlpha(accentColor, 0.12) : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${hasText ? hexAlpha(accentColor, 0.32) : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {/* Numéro du choix */}
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 800,
                      color: hasText ? hexAlpha(accentColor, 0.9) : 'rgba(255,255,255,0.20)',
                      background: hasText ? hexAlpha(accentColor, 0.14) : 'rgba(255,255,255,0.05)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      transition: 'color 0.25s ease, background 0.25s ease',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: hasText ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
                      fontStyle: hasText ? 'normal' : 'italic',
                      lineHeight: 1.4,
                    }}
                  >
                    {choice.text?.trim() || `Choix ${index + 1}…`}
                  </span>
                </div>
                {choice.diceCheck && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color: accentColor,
                      background: hexAlpha(accentColor, 0.12),
                      borderRadius: 6,
                      padding: '2px 7px',
                      transition: 'color 0.25s ease, background 0.25s ease',
                    }}
                  >
                    🎲 {choice.diceCheck.stat} ≥{choice.diceCheck.difficulty}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ComposerPreviewPanel;
