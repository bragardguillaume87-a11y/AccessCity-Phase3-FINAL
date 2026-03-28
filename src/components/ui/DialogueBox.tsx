/**
 * DialogueBox — Composant partagé de rendu visuel de boîte de dialogue
 *
 * USAGE :
 *   - PreviewPlayer     : mode lecture complète (avec fin de scène, stats HUD, audio)
 *   - DialoguePreviewOverlay : preview inline dans l'éditeur (avec navigation prev/next)
 *
 * Ce composant est purement présentationnel — aucune logique de jeu.
 * Il lit `dialogueBoxConfig` depuis les props (déjà mergé avec les defaults projet).
 *
 * Les couleurs / portrait / positionnement speaker sont calculés par le parent
 * et passés ici via props.
 */

import React, { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronsDown } from 'lucide-react';
import { Button } from './button';
import type { DialogueBoxStyle, DialogueChoice } from '@/types/scenes';
import {
  NAME_FONTS,
  NAME_SHADOW_CSS,
  DEFAULT_NAME_FONT_ID,
  DEFAULT_NAME_SHADOW,
} from '@/config/nameFonts';

// ── Defaults & helpers ────────────────────────────────────────────────────────

/** Valeurs par défaut si le projet n'a pas encore de configuration. */
export const DIALOGUE_BOX_DEFAULTS: Required<DialogueBoxStyle> = {
  typewriterSpeed: 40,
  fontSize: 15,
  boxOpacity: 0.75,
  position: 'bottom',
  positionX: 50,
  positionY: 75,
  showPortrait: true,
  speakerAlign: 'auto',
  borderStyle: 'subtle',
  portraitOffsetX: 50, // centre horizontal
  portraitOffsetY: 0, // haut vertical (affiche le visage en priorité)
  portraitScale: 1,
  bgColor: '#030712',
  textColor: '#ffffff',
  borderColor: '#ffffff',
  borderRadius: 'xl',
  layout: 'classique',
  dialogueTransition: 'fondu',
  nameFont: DEFAULT_NAME_FONT_ID,
  nameColor: '',
  nameShadow: DEFAULT_NAME_SHADOW,
  nameLetterSpacing: 1.5,
  // Narrateur — style Octopath Traveler par défaut
  narratorBgColor: '#070a1a',
  narratorTextColor: '#ede8d5',
  narratorBorderColor: '#c9a84c',
  narratorBgOpacity: 0.93,
};

/**
 * Génère une couleur HSL stable à partir d'une chaîne (hash).
 * Utilisé pour la couleur signature du speaker.
 */
export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

/** Convertit un hex + alpha en rgba CSS. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Calcule la couleur CSS de bordure selon le style et la couleur configurée. */
export function borderColorStyle(style: DialogueBoxStyle['borderStyle'], color: string): string {
  switch (style) {
    case 'none':
      return 'transparent';
    case 'prominent':
      return hexToRgba(color, 0.45);
    default:
      return hexToRgba(color, 0.18); // subtle
  }
}

/** Rayon CSS selon le preset borderRadius. */
export function borderRadiusCss(r: DialogueBoxStyle['borderRadius']): string {
  switch (r) {
    case 'none':
      return '0px';
    case 'sm':
      return '6px';
    case 'md':
      return '12px';
    case 'lg':
      return '16px';
    default:
      return '20px'; // xl
  }
}

/** Coins décoratifs style VN japonais (mode visual). */
function CornerDecorations({ color, sf }: { color: string; sf: number }) {
  const size = Math.round(13 * sf);
  const inset = Math.round(6 * sf);
  const thickness = Math.max(1, Math.round(2 * sf));
  const base: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    pointerEvents: 'none',
  };
  const border = `${thickness}px solid ${color}`;
  return (
    <>
      <span
        aria-hidden="true"
        style={{ ...base, top: inset, left: inset, borderTop: border, borderLeft: border }}
      />
      <span
        aria-hidden="true"
        style={{ ...base, top: inset, right: inset, borderTop: border, borderRight: border }}
      />
      <span
        aria-hidden="true"
        style={{ ...base, bottom: inset, left: inset, borderBottom: border, borderLeft: border }}
      />
      <span
        aria-hidden="true"
        style={{ ...base, bottom: inset, right: inset, borderBottom: border, borderRight: border }}
      />
    </>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DialogueBoxProps {
  // ── Contenu ──
  speaker?: string;
  displayText: string;
  /** HTML enrichi (gras, couleurs) — affiché à la place de displayText quand le typewriter est terminé. */
  richText?: string;
  choices?: DialogueChoice[];

  /** Vrai si le speaker est un narrateur — rendu cinématique sans boîte (style Octopath Traveler). */
  isNarrator?: boolean;

  // ── État ──
  isTypewriterDone: boolean;
  hasChoices: boolean;
  /** Vrai quand c'est le dernier dialogue de la scène (PreviewPlayer). */
  isAtLastDialogue?: boolean;

  // ── Configuration visuelle ──
  config: Required<DialogueBoxStyle>;

  /**
   * Facteur d'échelle du canvas : canvasWidth / REFERENCE_CANVAS_WIDTH (960px).
   *
   * Permet à la typographie (texte, speaker, portrait) de s'adapter à la
   * taille réelle du canvas — petit dans l'éditeur, grand en plein écran.
   *
   * Valeur par défaut : 1 (rendu à la résolution de référence 960px).
   */
  scaleFactor?: number;

  // ── Speaker visuel ──
  speakerPortraitUrl?: string | null;
  speakerIsOnRight?: boolean;
  speakerColor?: string;

  // ── État dés ──
  /** Vrai pendant le lancer de dé — désactive les boutons de choix. */
  isRolling?: boolean;

  // ── Interactions ──
  /** Clic sur le texte — skip typewriter ou avance (selon le contexte). */
  onAdvance?: () => void;
  /** Clic sur un choix (mode jeu). */
  onChoose?: (choice: DialogueChoice) => void;
  /** Recommencer la scène depuis le début (PreviewPlayer uniquement). */
  onRestart?: () => void;
  /** Fermer le PreviewPlayer (PreviewPlayer uniquement). */
  onClose?: () => void;

  // ── Slot éditeur ──
  /** Élément optionnel rendu dans le coin supérieur droit de l'en-tête speaker.
   *  Utilisé par DialoguePreviewOverlay pour les boutons de navigation prev/next. */
  navigationSlot?: ReactNode;
}

// ── Composant ─────────────────────────────────────────────────────────────────

/**
 * DialogueBox — Boîte de dialogue glassmorphism.
 *
 * Rendu partagé entre le PreviewPlayer et la DialoguePreviewOverlay de l'éditeur.
 * Toute modification du style ici s'applique aux deux contextes.
 */
export function DialogueBox({
  speaker,
  displayText,
  richText,
  choices,
  isNarrator = false,
  isTypewriterDone,
  hasChoices,
  isAtLastDialogue = false,
  config,
  scaleFactor = 1,
  speakerPortraitUrl,
  speakerIsOnRight = false,
  speakerColor = '#22d3ee',
  isRolling = false,
  onAdvance,
  onChoose,
  onRestart,
  onClose,
  navigationSlot,
}: DialogueBoxProps) {
  const boxBgStyle = hexToRgba(config.bgColor, config.boxOpacity);

  // Couleur d'accent fixe pour les boutons de choix — violet élégant, indépendant du speaker
  const CHOICE_ACCENT = '#8b5cf6';

  // Portrait masquage : pan + zoom non-destructif
  const portraitObjPos = `${config.portraitOffsetX}% ${config.portraitOffsetY}%`;
  const portraitScale = config.portraitScale !== 1 ? `scale(${config.portraitScale})` : undefined;

  // Typographie proportionnelle au canvas — clamp [0.5 – 3] pour éviter les extrêmes
  const sf = Math.max(0.5, Math.min(3, scaleFactor));
  const effectiveFontSize = Math.round(config.fontSize * sf); // texte dialogue
  const speakerFontSize = Math.round(14 * sf); // text-sm = 14px
  const portraitSizePx = Math.round(48 * sf); // w-12 h-12 = 48px
  // minHeight uniquement quand il n'y a pas de choix — évite l'espace superflu
  const textMinHeightPx = hasChoices ? 0 : Math.round(72 * sf);

  // Taille de l'icône indicateur et des badges de numérotation
  const indicatorIconSize = Math.round(18 * sf);
  const badgeFontSize = Math.round(11 * sf);
  const badgeSize = Math.round(22 * sf);

  // ── Typo partagée pour le nom du speaker (config-driven) ─────────────────
  const nameFontDef =
    NAME_FONTS.find((f) => f.id === (config.nameFont ?? DEFAULT_NAME_FONT_ID)) ?? NAME_FONTS[0];
  const nameShadowCss = NAME_SHADOW_CSS[config.nameShadow ?? DEFAULT_NAME_SHADOW];
  // Couleur du nom : override hex si défini, sinon fallback sur speakerColor
  const nameColorOverride = config.nameColor && config.nameColor !== '' ? config.nameColor : null;
  const speakerNameBaseStyle: React.CSSProperties = {
    fontFamily: nameFontDef.fontFamily,
    fontWeight: 800,
    letterSpacing: `${config.nameLetterSpacing ?? 1.5}px`,
    textTransform: 'uppercase',
    flexShrink: 0,
  };

  // ── Layout VISUAL (mode visual novel séparé) ────────────────────────────────
  // ⚠️ isNarrator prend toujours la priorité — le bloc narrateur est plus bas dans le code
  if (config.layout === 'visual' && !isNarrator) {
    const nameplatePadTop = Math.round(36 * sf);
    const nameplateRadius = `${Math.round(8 * sf)}px ${Math.round(8 * sf)}px 0 0`;
    const nameplateX: React.CSSProperties = speakerIsOnRight
      ? { right: Math.round(20 * sf) }
      : { left: Math.round(20 * sf) };

    // Padding interne augmenté pour respirer par rapport aux coins décoratifs
    const vPadX = Math.round(22 * sf);
    const vPadTop = Math.round(18 * sf);
    const vPadBot = hasChoices ? Math.round(6 * sf) : Math.round(18 * sf);
    const vPadRight = navigationSlot ? Math.round(52 * sf) : vPadX;

    // Sections partagées avec le mode classique
    const textSection = (
      <div
        className="relative"
        onClick={onAdvance}
        role={onAdvance ? 'button' : undefined}
        style={{
          cursor: onAdvance ? 'pointer' : undefined,
          paddingLeft: vPadX,
          paddingRight: vPadRight,
          paddingTop: vPadTop,
          paddingBottom: vPadBot,
        }}
      >
        {isTypewriterDone && richText ? (
          <p
            className="leading-relaxed"
            style={{
              fontSize: effectiveFontSize,
              minHeight: textMinHeightPx || undefined,
              color: config.textColor,
            }}
            dangerouslySetInnerHTML={{ __html: richText }}
          />
        ) : (
          <p
            className="leading-relaxed"
            style={{
              fontSize: effectiveFontSize,
              minHeight: textMinHeightPx || undefined,
              color: config.textColor,
            }}
          >
            {displayText || '…'}
          </p>
        )}
        <AnimatePresence>
          {isTypewriterDone && !hasChoices && !isAtLastDialogue && (
            <motion.div
              key="continue-indicator"
              className="flex justify-end mt-1.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              aria-hidden="true"
            >
              <motion.div
                className="flex items-center justify-center rounded-full"
                style={{
                  background: hexToRgba(speakerColor, 0.22),
                  border: `1px solid ${hexToRgba(speakerColor, 0.6)}`,
                  padding: Math.round(5 * sf),
                  filter: `drop-shadow(0 0 ${Math.round(6 * sf)}px ${hexToRgba(speakerColor, 0.7)})`,
                }}
                animate={{ opacity: [0.78, 1, 0.78], y: [0, Math.round(7 * sf), 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronsDown
                  style={{
                    color: speakerColor,
                    width: indicatorIconSize,
                    height: indicatorIconSize,
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {isTypewriterDone && !hasChoices && isAtLastDialogue && (onRestart || onClose) && (
          <div className="mt-3 flex flex-col items-center gap-2 pb-1">
            <p className="text-white/40 text-xs tracking-widest uppercase">— Fin de la scène —</p>
            <div className="flex gap-2">
              {onRestart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestart();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Recommencer
                </button>
              )}
              {onClose && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  variant="gaming-primary"
                  size="sm"
                  className="min-w-[120px] text-xs"
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );

    const choicesSection =
      isTypewriterDone && hasChoices && choices ? (
        <div className="px-4 pb-4 space-y-1.5">
          {choices.map((choice, idx) => (
            <motion.button
              key={choice.id || idx}
              onClick={() => !isRolling && onChoose?.(choice)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isRolling ? 0.45 : 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.18, ease: 'easeOut' }}
              whileHover={
                isRolling
                  ? undefined
                  : {
                      x: 6,
                      backgroundColor: 'rgba(30,12,80,0.80)',
                      borderColor: 'var(--color-primary-glow)',
                    }
              }
              whileTap={isRolling ? undefined : { scale: 0.98 }}
              className="w-full text-left rounded-xl text-white relative overflow-hidden group"
              style={{
                backgroundColor: 'rgba(3,7,18,0.55)',
                backdropFilter: 'blur(8px)',
                fontSize: effectiveFontSize,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.12)',
                padding: `${Math.round(10 * sf)}px ${Math.round(14 * sf)}px`,
                display: 'flex',
                alignItems: 'center',
                gap: Math.round(10 * sf),
                pointerEvents: isRolling ? 'none' : 'auto',
                cursor: isRolling ? 'not-allowed' : 'pointer',
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 pointer-events-none origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-150"
                style={{ background: CHOICE_ACCENT, width: 3, borderRadius: '9999px 0 0 9999px' }}
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  background: `linear-gradient(90deg, ${CHOICE_ACCENT}30 0%, transparent 65%)`,
                }}
              />
              <span
                className="relative z-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold border transition-colors duration-150 group-hover:border-violet-400/60"
                style={{
                  color: CHOICE_ACCENT,
                  fontSize: badgeFontSize,
                  width: badgeSize,
                  height: badgeSize,
                  border: `1px solid var(--color-primary-35)`,
                  minWidth: badgeSize,
                }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <span className="relative z-10 flex-1 min-w-0">
                <span className="block">{choice.text || 'Continuer'}</span>
                {choice.diceCheck && (
                  <span
                    className="block mt-0.5 text-purple-400/80"
                    style={{ fontSize: Math.round(9 * sf) }}
                  >
                    🎲 {choice.diceCheck.stat} · DC {choice.diceCheck.difficulty}
                  </span>
                )}
                {choice.effects && choice.effects.length > 0 && (
                  <span className="flex flex-wrap gap-1 mt-0.5">
                    {choice.effects
                      .filter(
                        (e): e is import('@/types').StatEffect =>
                          'variable' in e && e.operation === 'add'
                      )
                      .map((eff) => (
                        <span
                          key={`${eff.variable}-${eff.operation}`}
                          className={`inline-block px-1.5 py-0.5 rounded-full font-semibold ${eff.value >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                          style={{ fontSize: Math.round(9 * sf) }}
                        >
                          {eff.value >= 0 ? '+' : ''}
                          {eff.value} {eff.variable}
                        </span>
                      ))}
                  </span>
                )}
              </span>
            </motion.button>
          ))}
        </div>
      ) : null;

    return (
      <div style={{ position: 'relative', paddingTop: speaker ? nameplatePadTop : 0 }}>
        {/* ── Nameplate tab ── */}
        {speaker && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: Math.round(7 * sf),
              paddingLeft: Math.round(12 * sf),
              paddingRight: Math.round(14 * sf),
              paddingTop: Math.round(5 * sf),
              paddingBottom: Math.round(8 * sf),
              background: speakerColor,
              borderRadius: nameplateRadius,
              boxShadow: `0 -2px 14px ${speakerColor}50`,
              ...nameplateX,
            }}
          >
            {/* Mini portrait dans la tab */}
            {config.showPortrait && speakerPortraitUrl && (
              <div
                style={{
                  width: Math.round(26 * sf),
                  height: Math.round(26 * sf),
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `${Math.max(1, Math.round(2 * sf))}px solid rgba(255,255,255,0.55)`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={speakerPortraitUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    imageRendering: 'pixelated',
                    objectPosition: portraitObjPos,
                  }}
                />
              </div>
            )}
            <span
              style={{
                ...speakerNameBaseStyle,
                fontSize: speakerFontSize,
                color: nameColorOverride ?? '#fff',
                textShadow: nameShadowCss,
                lineHeight: 1,
              }}
            >
              {speaker}
            </span>
          </div>
        )}

        {/* ── Boîte de dialogue ── */}
        <div
          className="border backdrop-blur-md shadow-2xl overflow-hidden relative"
          style={{
            background: boxBgStyle,
            borderColor: borderColorStyle(config.borderStyle, config.borderColor),
            borderRadius: borderRadiusCss(config.borderRadius),
          }}
        >
          <CornerDecorations color={speakerColor} sf={sf} />

          {/* Navigation slot en position absolue */}
          {navigationSlot && (
            <div
              style={{
                position: 'absolute',
                top: Math.round(8 * sf),
                right: Math.round(12 * sf),
                zIndex: 10,
              }}
            >
              {navigationSlot}
            </div>
          )}

          {textSection}
          {choicesSection}
        </div>
      </div>
    );
  }

  // ── Layout NARRATEUR — style Octopath Traveler ─────────────────────────────
  // Boîte navy semi-transparente, bordure dorée, coins ornementaux, texte Crimson Pro italique crème.
  // Pas de nameplate — l'absence du nom signale la narration (convention VN universelle).
  if (isNarrator) {
    const GOLD = config.narratorBorderColor;
    const CREAM = config.narratorTextColor;
    const BOX_BG = hexToRgba(config.narratorBgColor, config.narratorBgOpacity);

    const padX = Math.round(30 * sf);
    const padY = Math.round(18 * sf);
    const sepMt = Math.round(11 * sf);
    const ornSize = Math.round(9 * sf);

    const narratorTextStyle: React.CSSProperties = {
      fontSize: effectiveFontSize,
      fontFamily: "'Crimson Pro', Georgia, 'Palatino Linotype', serif",
      fontStyle: 'italic',
      fontWeight: 400,
      color: CREAM,
      lineHeight: 1.88,
      letterSpacing: '0.022em',
      textAlign: 'center',
      minHeight: textMinHeightPx || undefined,
    };

    const words = displayText.split(' ').filter(Boolean);

    return (
      <div style={{ position: 'relative', paddingTop: navigationSlot ? Math.round(36 * sf) : 0 }}>
        {/* Slot de navigation éditeur */}
        {navigationSlot && (
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>{navigationSlot}</div>
        )}

        {/* ── Boîte principale ── */}
        <div
          className="backdrop-blur-md"
          style={{
            position: 'relative',
            background: BOX_BG,
            border: `1.5px solid ${GOLD}`,
            borderRadius: Math.round(4 * sf),
            boxShadow: [
              `0 0 0 1px rgba(201,168,76,0.09)`,
              `inset 0 0 50px rgba(0,0,0,0.38)`,
              `0 12px 40px rgba(0,0,0,0.7)`,
            ].join(', '),
            padding: `${padY}px ${padX}px`,
            overflow: 'hidden',
          }}
        >
          {/* Coins décoratifs dorés */}
          <CornerDecorations color={GOLD} sf={sf} />

          {/* Lueur de coin — ambiance parchemin */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: [
                'radial-gradient(ellipse 60% 40% at top left, rgba(201,168,76,0.06) 0%, transparent 70%)',
                'radial-gradient(ellipse 60% 40% at bottom right, rgba(201,168,76,0.06) 0%, transparent 70%)',
              ].join(', '),
              pointerEvents: 'none',
            }}
          />

          {/* ── Ornement supérieur ── */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{
              transformOrigin: 'center',
              marginBottom: sepMt,
              display: 'flex',
              alignItems: 'center',
              gap: Math.round(7 * sf),
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to right, transparent, ${GOLD}55)`,
              }}
            />
            <span
              aria-hidden="true"
              style={{ color: GOLD, fontSize: ornSize, opacity: 0.9, lineHeight: 1, flexShrink: 0 }}
            >
              ✦
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to left, transparent, ${GOLD}55)`,
              }}
            />
          </motion.div>

          {/* ── Texte ── */}
          <div
            onClick={onAdvance}
            role={onAdvance ? 'button' : undefined}
            style={{ cursor: onAdvance ? 'pointer' : undefined }}
          >
            {isTypewriterDone && richText ? (
              <p style={narratorTextStyle} dangerouslySetInnerHTML={{ __html: richText }} />
            ) : (
              <p style={narratorTextStyle}>
                {words.map((word, i) => (
                  <motion.span
                    key={`word-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.038, duration: 0.3, ease: 'easeOut' }}
                  >
                    {word}{' '}
                  </motion.span>
                ))}
              </p>
            )}
          </div>

          {/* ── Ornement inférieur ── */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
            style={{
              transformOrigin: 'center',
              marginTop: sepMt,
              display: 'flex',
              alignItems: 'center',
              gap: Math.round(7 * sf),
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to right, transparent, ${GOLD}55)`,
              }}
            />
            <span
              aria-hidden="true"
              style={{ color: GOLD, fontSize: ornSize, opacity: 0.9, lineHeight: 1, flexShrink: 0 }}
            >
              ✦
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(to left, transparent, ${GOLD}55)`,
              }}
            />
          </motion.div>

          {/* ── Indicateur continuer — chevron doré ── */}
          <AnimatePresence>
            {isTypewriterDone && !hasChoices && !isAtLastDialogue && (
              <motion.div
                key="narrator-continue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', justifyContent: 'center', marginTop: Math.round(6 * sf) }}
              >
                <motion.span
                  animate={{ opacity: [0.38, 0.85, 0.38], y: [0, Math.round(4 * sf), 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ color: GOLD, fontSize: Math.round(12 * sf), lineHeight: 1 }}
                  aria-hidden="true"
                >
                  ▼
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Fin de scène ── */}
          {isTypewriterDone && !hasChoices && isAtLastDialogue && (onRestart || onClose) && (
            <div
              style={{
                marginTop: Math.round(16 * sf),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <p
                style={{
                  color: `${GOLD}70`,
                  fontSize: Math.round(9 * sf),
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                — Fin de la scène —
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {onRestart && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestart();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{ border: `1px solid ${GOLD}40`, color: `${GOLD}90` }}
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" /> Recommencer
                  </button>
                )}
                {onClose && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    variant="gaming-primary"
                    size="sm"
                    className="min-w-[120px] text-xs"
                  >
                    Fermer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Layout CLASSIQUE (défaut) ───────────────────────────────────────────────
  return (
    <div
      className="border backdrop-blur-md shadow-2xl overflow-hidden"
      style={{
        background: boxBgStyle,
        borderColor: borderColorStyle(config.borderStyle, config.borderColor),
        borderRadius: borderRadiusCss(config.borderRadius),
      }}
    >
      {/* ── En-tête speaker ── */}
      {/* navigationSlot doit s'afficher même sans speaker (dialogues sans personnage) */}
      {(speaker || navigationSlot) && (
        <div
          className={`flex items-center gap-2.5 px-4 pt-3 pb-2 ${speaker && speakerIsOnRight ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Portrait — taille proportionnelle au canvas */}
          {speaker && config.showPortrait && speakerPortraitUrl && (
            <div
              className="rounded-lg overflow-hidden flex-shrink-0 border border-white/20 shadow-lg"
              style={{ width: portraitSizePx, height: portraitSizePx }}
            >
              <img
                src={speakerPortraitUrl}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                style={{
                  imageRendering: 'pixelated',
                  objectPosition: portraitObjPos,
                  transform: portraitScale,
                  transformOrigin: portraitObjPos,
                }}
              />
            </div>
          )}

          {/* Nom + ligne décorative */}
          {speaker && (
            <div
              className={`flex items-center gap-2 flex-1 min-w-0 ${speakerIsOnRight ? 'flex-row-reverse' : ''}`}
            >
              <span
                style={{
                  ...speakerNameBaseStyle,
                  color: nameColorOverride ?? speakerColor,
                  fontSize: speakerFontSize,
                  textShadow: nameShadowCss,
                }}
              >
                {speaker}
              </span>
              <div
                className="flex-1 h-px opacity-30 min-w-0"
                style={{ background: speakerColor }}
              />
            </div>
          )}

          {/* Slot de navigation (éditeur uniquement) — toujours à droite */}
          {navigationSlot && (
            <div className={`flex-shrink-0${!speaker ? ' ml-auto' : ''}`}>{navigationSlot}</div>
          )}
        </div>
      )}

      {/* ── Texte du dialogue ── */}
      <div
        className={`relative px-4 ${speaker || navigationSlot ? 'pt-0' : 'pt-3'} ${hasChoices ? 'pb-1' : 'pb-3'}`}
        onClick={onAdvance}
        role={onAdvance ? 'button' : undefined}
        style={{ cursor: onAdvance ? 'pointer' : undefined }}
      >
        {isTypewriterDone && richText ? (
          <p
            className="leading-relaxed"
            style={{
              fontSize: effectiveFontSize,
              minHeight: textMinHeightPx || undefined,
              color: config.textColor,
            }}
            dangerouslySetInnerHTML={{ __html: richText }}
          />
        ) : (
          <p
            className="leading-relaxed"
            style={{
              fontSize: effectiveFontSize,
              minHeight: textMinHeightPx || undefined,
              color: config.textColor,
            }}
          >
            {displayText || '…'}
          </p>
        )}

        {/* ── Indicateur "continuer" — pill animée, visible ── */}
        <AnimatePresence>
          {isTypewriterDone && !hasChoices && !isAtLastDialogue && (
            <motion.div
              key="continue-indicator"
              className="flex justify-end mt-1.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              aria-hidden="true"
            >
              <motion.div
                className="flex items-center justify-center rounded-full"
                style={{
                  background: 'var(--color-primary-28)',
                  border: '1px solid var(--color-primary-60)',
                  padding: Math.round(5 * sf),
                  filter: `drop-shadow(0 0 ${Math.round(6 * sf)}px var(--color-primary-80))`,
                }}
                animate={{
                  opacity: [0.78, 1, 0.78],
                  y: [0, Math.round(7 * sf), 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <ChevronsDown
                  style={{ color: '#8b5cf6', width: indicatorIconSize, height: indicatorIconSize }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fin de scène (PreviewPlayer uniquement) ── */}
        {isTypewriterDone && !hasChoices && isAtLastDialogue && (onRestart || onClose) && (
          <div className="mt-3 flex flex-col items-center gap-2 pb-1">
            <p className="text-white/40 text-xs tracking-widest uppercase">— Fin de la scène —</p>
            <div className="flex gap-2">
              {onRestart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestart();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Recommencer
                </button>
              )}
              {onClose && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  variant="gaming-primary"
                  size="sm"
                  className="min-w-[120px] text-xs"
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Choix ── */}
      {isTypewriterDone && hasChoices && choices && (
        <div className="px-4 pb-4 space-y-1.5">
          {choices.map((choice, idx) => (
            <motion.button
              key={choice.id || idx}
              onClick={() => !isRolling && onChoose?.(choice)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isRolling ? 0.45 : 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.18, ease: 'easeOut' }}
              whileHover={
                isRolling
                  ? undefined
                  : {
                      x: 6,
                      backgroundColor: 'rgba(30,12,80,0.80)',
                      borderColor: 'var(--color-primary-glow)',
                    }
              }
              whileTap={isRolling ? undefined : { scale: 0.98 }}
              className="w-full text-left rounded-xl text-white relative overflow-hidden group"
              style={{
                backgroundColor: 'rgba(3,7,18,0.55)',
                backdropFilter: 'blur(8px)',
                fontSize: effectiveFontSize,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.12)',
                padding: `${Math.round(10 * sf)}px ${Math.round(14 * sf)}px`,
                display: 'flex',
                alignItems: 'center',
                gap: Math.round(10 * sf),
                pointerEvents: isRolling ? 'none' : 'auto',
                cursor: isRolling ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Barre d'accent gauche — CSS group-hover */}
              <div
                className="absolute left-0 top-0 bottom-0 pointer-events-none origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-150"
                style={{ background: CHOICE_ACCENT, width: 3, borderRadius: '9999px 0 0 9999px' }}
              />

              {/* Dégradé de fond au survol — CSS group-hover */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  background: `linear-gradient(90deg, ${CHOICE_ACCENT}30 0%, transparent 65%)`,
                }}
              />

              {/* Numéro du choix */}
              <span
                className="relative z-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold border transition-colors duration-150 group-hover:border-violet-400/60"
                style={{
                  color: CHOICE_ACCENT,
                  fontSize: badgeFontSize,
                  width: badgeSize,
                  height: badgeSize,
                  border: `1px solid var(--color-primary-35)`,
                  minWidth: badgeSize,
                }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>

              {/* Texte + badges */}
              <span className="relative z-10 flex-1 min-w-0">
                <span className="block">{choice.text || 'Continuer'}</span>

                {/* Badge dés : stat + difficulté */}
                {choice.diceCheck && (
                  <span
                    className="block mt-0.5 text-purple-400/80"
                    style={{ fontSize: Math.round(9 * sf) }}
                  >
                    🎲 {choice.diceCheck.stat} · DC {choice.diceCheck.difficulty}
                  </span>
                )}

                {/* Badges effets (opération add uniquement — clair pour le joueur) */}
                {choice.effects && choice.effects.length > 0 && (
                  <span className="flex flex-wrap gap-1 mt-0.5">
                    {choice.effects
                      .filter(
                        (e): e is import('@/types').StatEffect =>
                          'variable' in e && e.operation === 'add'
                      )
                      .map((eff) => (
                        <span
                          key={`${eff.variable}-${eff.operation}`}
                          className={`inline-block px-1.5 py-0.5 rounded-full font-semibold ${
                            eff.value >= 0
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          style={{ fontSize: Math.round(9 * sf) }}
                        >
                          {eff.value >= 0 ? '+' : ''}
                          {eff.value} {eff.variable}
                        </span>
                      ))}
                  </span>
                )}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
