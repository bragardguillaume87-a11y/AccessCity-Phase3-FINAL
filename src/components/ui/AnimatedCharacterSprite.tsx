/**
 * AnimatedCharacterSprite — Sprite personnage avec animations CSS
 *
 * Couches d'animation (de l'extérieur vers l'intérieur) :
 *   1. Flip horizontal  — transform: scaleX(-1) sur le wrapper
 *   2. Respiration      — CSS @keyframes char-breathe, transform-origin 50% 80%
 *   3. Speaking pop     — CSS @keyframes char-speak-pop, déclenchée par ref.classList
 *   4. Crossfade imgs   — double-img overlappées, opacity transition CSS
 *
 * ⚠️ Plus de motion.div interne : le speaking pop est en pur CSS (ref + forceReflow).
 *    Raison : un motion.div avec animate={AnimationControls} bloque la propagation
 *    des variants Framer Motion du parent (CharacterSprite), cassant les animations
 *    d'entrée (fadeIn, slideInLeft, pop, etc.).
 *
 * Paramètres contrôlés via `fxConfig` (lu depuis settingsStore dans les composants parents).
 * Si `fxConfig` est absent, les défauts hardcodés s'appliquent (rétrocompatibilité).
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { CharacterFxSettings } from '@/stores/settingsStore';
import { DEFAULT_CHARACTER_FX } from '@/stores/settingsStore';

// ── Valeurs de base par style ─────────────────────────────────────────────────
// Ces valeurs définissent l'échelle "intensité=1.0".
// fxConfig.breatheIntensity et speakingIntensity sont des multiplicateurs.

const BASE = {
  breatheScale:      1.02,   // scale à intensité 1.0
  breatheTranslateY: -2,     // px à intensité 1.0
  speakingScale:     1.03,   // scale pop à intensité 1.0
  speakingY:         3,      // px déplacement à intensité 1.0
} as const;

// ── Utilitaire : hash stable depuis une chaîne ────────────────────────────────

function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ── Hook crossfade ────────────────────────────────────────────────────────────

interface CrossfadeState {
  current: string | undefined;
  prev: string | undefined;
  prevVisible: boolean;
}

/**
 * Gère le crossfade CSS entre deux URLs de sprite.
 *
 * Pattern double-rAF : garantit que la transition CSS se déclenche APRÈS le paint
 * (sans ce délai, le navigateur optimise et ignore le changement d'opacité).
 *
 * Si crossfadeMs === 0 : switch instantané (pas de transition).
 */
function useSpriteCrossfade(spriteUrl: string | undefined, crossfadeMs: number) {
  const [state, setState] = useState<CrossfadeState>({
    current: spriteUrl,
    prev: undefined,
    prevVisible: false,
  });
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef     = useRef<number | null>(null);
  const lastUrlRef = useRef(spriteUrl);

  useEffect(() => {
    if (spriteUrl === lastUrlRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);

    const prev = lastUrlRef.current;
    lastUrlRef.current = spriteUrl;

    if (crossfadeMs === 0) {
      // Switch instantané
      setState({ current: spriteUrl, prev: undefined, prevVisible: false });
      return;
    }

    // Étape 1 : rendre les deux images (prev visible, current en dessous)
    setState({ current: spriteUrl, prev, prevVisible: true });

    // Étape 2 : après deux rAFs, déclencher le fondu
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setState(s => ({ ...s, prevVisible: false }));
        // Étape 3 : après la fin de la transition, retirer prev du DOM
        timerRef.current = setTimeout(
          () => setState(s => ({ ...s, prev: undefined })),
          crossfadeMs + 50,
        );
      });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    };
  }, [spriteUrl, crossfadeMs]);

  return state;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AnimatedCharacterSpriteProps {
  /** URL du sprite à afficher */
  spriteUrl: string | undefined;
  /** Nom du personnage (alt text + stagger de la respiration) */
  alt: string;
  /** Le personnage est en train de parler — déclenche un micro-pop */
  isSpeaking?: boolean;
  /** Retournement horizontal */
  flipped?: boolean;
  /**
   * Configuration des effets visuels (depuis settingsStore.characterFx).
   * Si absent, les défauts DEFAULT_CHARACTER_FX s'appliquent.
   */
  fxConfig?: CharacterFxSettings;
  className?: string;
  style?: React.CSSProperties;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export const AnimatedCharacterSprite = React.memo(function AnimatedCharacterSprite({
  spriteUrl,
  alt,
  isSpeaking = false,
  flipped    = false,
  fxConfig,
  className  = '',
  style,
}: AnimatedCharacterSpriteProps) {
  const fx = fxConfig ?? DEFAULT_CHARACTER_FX;

  const effectiveCrossfadeMs = fx.crossfadeEnabled ? fx.crossfadeMs : 0;
  const { current, prev, prevVisible } = useSpriteCrossfade(spriteUrl, effectiveCrossfadeMs);

  // ── Speaking pop (CSS imperative via ref) ─────────────────────────────────
  // Pattern : remove class → forceReflow → add class → animation CSS redémarre.
  // Avantage vs motion.div : aucune interférence avec la propagation de variants
  // Framer Motion du parent (CharacterSprite gère les animations d'entrée).
  const speakDivRef    = useRef<HTMLDivElement>(null);
  const prevSpeakingRef = useRef(false);

  useEffect(() => {
    if (fx.speakingEnabled && isSpeaking && !prevSpeakingRef.current) {
      const el = speakDivRef.current;
      if (el) {
        el.classList.remove('char-speak-pop');
        void el.offsetWidth; // forceReflow : force le navigateur à recalculer avant d'ajouter
        el.classList.add('char-speak-pop');
      }
    }
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, fx.speakingEnabled]);

  // ── Respiration asynchrone (stagger stable par nom de personnage) ────────
  const { breatheDelay, breatheDuration } = useMemo(() => {
    const h = stableHash(alt);
    const delay     = (h % 50) / 10;                             // 0.0 – 4.9 s
    const variation = ((h >> 4) % 30) / 10;                     // 0.0 – 2.9 s
    const duration  = fx.breatheSpeed + variation;
    return { breatheDelay: delay, breatheDuration: `${duration}s` };
  }, [alt, fx.breatheSpeed]);

  // ── CSS vars ─────────────────────────────────────────────────────────────
  const hasBreathe = fx.breatheEnabled;
  const breatheVars = hasBreathe
    ? ({
        '--char-breathe-scale': String(1 + (BASE.breatheScale - 1) * fx.breatheIntensity),
        '--char-breathe-y':     `${BASE.breatheTranslateY * fx.breatheIntensity}px`,
        '--char-breathe-duration': breatheDuration,
      } as React.CSSProperties)
    : undefined;

  const speakVars = {
    '--char-speak-scale': String(1 + (BASE.speakingScale - 1) * fx.speakingIntensity),
    '--char-speak-y':     `${BASE.speakingY * fx.speakingIntensity}px`,
  } as React.CSSProperties;

  const pixelArt = fx.pixelArt ?? false;
  const imgClass = `absolute inset-0 w-full h-full object-contain pointer-events-none select-none${pixelArt ? ' char-pixel' : ''}`;

  // ── Fallback : aucun sprite disponible ───────────────────────────────────
  if (!current && !prev) {
    return (
      <div
        className={`w-full h-full bg-muted rounded-full flex items-center justify-center border-2 border-border ${className}`}
        style={style}
        aria-label={alt}
      >
        <span className="text-2xl" aria-hidden="true">👤</span>
      </div>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  //
  // Architecture des couches (de bas en haut) :
  //   1. Flip horizontal (wrapper racine)
  //   2. Sprite courant  : respiration + speaking pop actifs (pur CSS)
  //   3. Sprite précédent: ISOLÉ de toutes les animations, sur le dessus
  //      → fondu sortant depuis opacity:1→0, révèle le sprite courant en dessous
  //
  // ⚠️ Le sprite précédent DOIT être un sibling du conteneur d'animations,
  //    pas un enfant — sinon la respiration crée un "fantôme mobile" au fondu.
  //
  // ⚠️ La respiration est suspendue pendant le crossfade (animationPlayState: paused)
  //    pour éviter le décalage de position entre prev statique et current animé.
  return (
    // Couche 1 : flip horizontal
    <div
      className={`relative w-full h-full ${className}`}
      style={{ transform: flipped ? 'scaleX(-1)' : undefined, ...style }}
    >
      {/* Couche 2 : sprite courant — respiration + speaking pop (pur CSS, sans motion.div) */}
      <div
        className={hasBreathe ? 'char-breathe' : undefined}
        style={{
          ...breatheVars,
          animationDelay: hasBreathe ? `${breatheDelay}s` : undefined,
          // Pause pendant le crossfade : évite le décalage de position avec le prev statique
          animationPlayState: prev ? 'paused' : 'running',
          position: 'absolute',
          inset: 0,
        }}
      >
        {/* Couche 2b : speaking pop via CSS class toggle (pas de motion.div → pas d'interférence variants) */}
        <div ref={speakDivRef} style={{ ...speakVars, position: 'absolute', inset: 0 }}>
          {current && (
            <img
              src={current}
              alt={alt}
              draggable={false}
              className={imgClass}
            />
          )}
        </div>
      </div>

      {/* Couche 3 : sprite précédent — sur le dessus, sans aucune animation */}
      {prev && (
        <img
          src={prev}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={imgClass}
          style={{
            // Sur le dessus pour que la disparition soit visible
            zIndex: 10,
            opacity: prevVisible ? 1 : 0,
            transition: effectiveCrossfadeMs > 0
              ? `opacity ${effectiveCrossfadeMs}ms cubic-bezier(0.45, 0, 0.55, 1)`
              : undefined,
            // GPU compositing : évite les artefacts de recomposition
            willChange: 'opacity',
            transform: 'translateZ(0)',
          }}
        />
      )}
    </div>
  );
});

export default AnimatedCharacterSprite;
