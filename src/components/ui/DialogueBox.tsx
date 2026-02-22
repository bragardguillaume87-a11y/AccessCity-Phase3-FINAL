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

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronsDown } from 'lucide-react';
import { Button } from './button';
import type { DialogueBoxStyle, DialogueChoice } from '@/types/scenes';

// ── Defaults & helpers ────────────────────────────────────────────────────────

/** Valeurs par défaut si le projet n'a pas encore de configuration. */
export const DIALOGUE_BOX_DEFAULTS: Required<DialogueBoxStyle> = {
  typewriterSpeed: 40,
  fontSize: 15,
  boxOpacity: 0.75,
  position: 'bottom',
  showPortrait: true,
  speakerAlign: 'auto',
  borderStyle: 'subtle',
  portraitOffsetX: 50,  // centre horizontal
  portraitOffsetY: 0,   // haut vertical (affiche le visage en priorité)
  portraitScale: 1,
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

/** Classe Tailwind de bordure selon le style de boîte */
export function borderClass(style: DialogueBoxStyle['borderStyle']): string {
  switch (style) {
    case 'none':      return 'border-transparent';
    case 'prominent': return 'border-white/30';
    default:          return 'border-white/10'; // subtle
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DialogueBoxProps {
  // ── Contenu ──
  speaker?: string;
  displayText: string;
  choices?: DialogueChoice[];

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
  choices,
  isTypewriterDone,
  hasChoices,
  isAtLastDialogue = false,
  config,
  scaleFactor = 1,
  speakerPortraitUrl,
  speakerIsOnRight = false,
  speakerColor = '#22d3ee',
  onAdvance,
  onChoose,
  onRestart,
  onClose,
  navigationSlot,
}: DialogueBoxProps) {
  const boxBgStyle = `rgba(3,7,18,${config.boxOpacity})`;

  // Couleur d'accent fixe pour les boutons de choix — violet élégant, indépendant du speaker
  const CHOICE_ACCENT = '#8b5cf6';

  // Portrait masquage : pan + zoom non-destructif
  const portraitObjPos = `${config.portraitOffsetX}% ${config.portraitOffsetY}%`;
  const portraitScale  = config.portraitScale !== 1 ? `scale(${config.portraitScale})` : undefined;

  // Typographie proportionnelle au canvas — clamp [0.5 – 3] pour éviter les extrêmes
  const sf = Math.max(0.5, Math.min(3, scaleFactor));
  const effectiveFontSize  = Math.round(config.fontSize * sf);   // texte dialogue
  const speakerFontSize    = Math.round(14 * sf);                // text-sm = 14px
  const portraitSizePx     = Math.round(48 * sf);               // w-12 h-12 = 48px
  // minHeight uniquement quand il n'y a pas de choix — évite l'espace superflu
  const textMinHeightPx    = hasChoices ? 0 : Math.round(72 * sf);

  // Taille de l'icône indicateur et des badges de numérotation
  const indicatorIconSize  = Math.round(18 * sf);
  const badgeFontSize      = Math.round(11 * sf);
  const badgeSize          = Math.round(22 * sf);

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden ${borderClass(config.borderStyle)}`}
      style={{ background: boxBgStyle }}
    >
      {/* ── En-tête speaker ── */}
      {speaker && (
        <div
          className={`flex items-center gap-2.5 px-4 pt-3 pb-2 ${speakerIsOnRight ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Portrait — taille proportionnelle au canvas */}
          {config.showPortrait && speakerPortraitUrl && (
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
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${speakerIsOnRight ? 'flex-row-reverse' : ''}`}>
            <span
              className="font-bold uppercase tracking-widest drop-shadow flex-shrink-0"
              style={{ color: speakerColor, fontSize: speakerFontSize }}
            >
              {speaker}
            </span>
            <div className="flex-1 h-px opacity-30 min-w-0" style={{ background: speakerColor }} />
          </div>

          {/* Slot de navigation (éditeur uniquement) */}
          {navigationSlot && (
            <div className="flex-shrink-0">
              {navigationSlot}
            </div>
          )}
        </div>
      )}

      {/* ── Texte du dialogue ── */}
      <div
        className={`relative px-4 ${speaker ? 'pt-0' : 'pt-3'} ${hasChoices ? 'pb-1' : 'pb-3'}`}
        onClick={onAdvance}
        role={onAdvance ? 'button' : undefined}
        style={{ cursor: onAdvance ? 'pointer' : undefined }}
      >
        <p
          className="leading-relaxed text-white"
          style={{
            fontSize: effectiveFontSize,
            minHeight: textMinHeightPx || undefined,
          }}
        >
          {displayText || '…'}
        </p>

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
                  background: 'rgba(139,92,246,0.28)',
                  border: '1px solid rgba(139,92,246,0.60)',
                  padding: Math.round(5 * sf),
                  filter: `drop-shadow(0 0 ${Math.round(6 * sf)}px rgba(139,92,246,0.80))`,
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
                  onClick={(e) => { e.stopPropagation(); onRestart(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Recommencer
                </button>
              )}
              {onClose && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
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
              onClick={() => onChoose?.(choice)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.18, ease: 'easeOut' }}
              whileHover={{ x: 6, backgroundColor: 'rgba(30,12,80,0.80)', borderColor: 'rgba(139,92,246,0.50)' }}
              whileTap={{ scale: 0.98 }}
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
              }}
            >
              {/* Barre d'accent gauche — CSS group-hover (pointer-events-none → whileHover ne fonctionne pas) */}
              <div
                className="absolute left-0 top-0 bottom-0 pointer-events-none origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-150"
                style={{ background: CHOICE_ACCENT, width: 3, borderRadius: '9999px 0 0 9999px' }}
              />

              {/* Dégradé de fond au survol — CSS group-hover */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: `linear-gradient(90deg, ${CHOICE_ACCENT}30 0%, transparent 65%)` }}
              />

              {/* Numéro du choix */}
              <span
                className="relative z-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold border transition-colors duration-150 group-hover:border-violet-400/60"
                style={{
                  color: CHOICE_ACCENT,
                  fontSize: badgeFontSize,
                  width: badgeSize,
                  height: badgeSize,
                  border: `1px solid rgba(139,92,246,0.35)`,
                  minWidth: badgeSize,
                }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>

              {/* Texte du choix */}
              <span className="relative z-10 flex-1">
                {choice.text || 'Continuer'}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
