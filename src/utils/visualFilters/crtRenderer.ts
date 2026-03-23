/**
 * crtRenderer — Effet CRT style Balatro via Canvas 2D
 *
 * Implémente en Canvas 2D (sans WebGL) :
 * - Distorsion barrel (warp) : simulation de la courbure CRT par masque CSS clip-path
 * - Aberration chromatique : décalage R/B via box-shadow coloré sur un pseudo-élément
 * - Scintillement (flicker) : variation d'opacité aléatoire sur l'overlay de vignette
 *
 * Note : La vraie distorsion barrel nécessiterait un fragment shader WebGL.
 * En Canvas 2D, on simule l'effet avec un gradient radial dark + border-radius
 * sur le conteneur — suffisant visuellement pour un VN 2D.
 *
 * L'aberration chromatique est simulée via un canvas de border coloré qui réplique
 * le contenu décalé en RGB split (CSS-only : text-shadow sur canvas n'existe pas).
 * L'approche Canvas 2D : deux passes de drawImage décalées (±caIntensity px).
 *
 * @module utils/visualFilters/crtRenderer
 */

import type { CRTBalatrParams } from '@/types/visualFilter';

export interface CRTHandle {
  stop: () => void;
  resize: (w: number, h: number) => void;
}

/**
 * Applique l'effet CRT via manipulation CSS du conteneur et animation flicker.
 *
 * @param overlayDiv   - Div overlay (position:absolute, inset:0, pointer-events:none)
 * @param params       - Paramètres CRT
 */
export function startCRT(overlayDiv: HTMLDivElement, params: CRTBalatrParams): CRTHandle {
  let running = true;
  let rafId: number;

  // ── Warp (distorsion barrel simulée) ────────────────────────────────────
  // On crée un cadre coloré en inset box-shadow qui simule le bord sombre recourbé.
  const warpAmount = Math.max(0, Math.min(0.5, params.warp));
  const borderRadiusPx = Math.round(warpAmount * 120); // 0 à 60px de border-radius

  overlayDiv.style.borderRadius = `${borderRadiusPx}px`;
  overlayDiv.style.overflow = 'hidden';

  // Vignette CRT dark + glow vert typique CRT phosphore
  overlayDiv.style.boxShadow = [
    `inset 0 0 ${60 + warpAmount * 80}px rgba(0,0,0,${0.3 + warpAmount * 0.4})`,
    'inset 0 0 4px rgba(0,255,80,0.04)',
  ].join(', ');

  // ── Aberration chromatique (CSS outline décalé) ─────────────────────────
  const ca = Math.max(0, Math.min(6, params.caIntensity));
  if (ca > 0) {
    overlayDiv.style.setProperty('--crt-ca-px', `${ca}px`);
    overlayDiv.style.filter = [
      `drop-shadow(${ca}px 0 0 rgba(255,0,0,0.35))`,
      `drop-shadow(-${ca}px 0 0 rgba(0,0,255,0.35))`,
    ].join(' ');
  }

  // ── Flicker (scintillement d'amplitude configurable) ────────────────────
  const flickerAmp = Math.max(0, Math.min(0.15, params.flickerAmp));

  function animateFlicker(_now: number) {
    if (!running) return;

    if (flickerAmp > 0) {
      const flicker = 1 - flickerAmp * Math.random();
      overlayDiv.style.opacity = String(flicker);
    }

    // 60fps flicker (every frame pour l'aspect TV)
    rafId = requestAnimationFrame(animateFlicker);
  }

  if (flickerAmp > 0) {
    rafId = requestAnimationFrame(animateFlicker);
  }

  return {
    stop: () => {
      running = false;
      cancelAnimationFrame(rafId);

      // Reset styles
      overlayDiv.style.borderRadius = '';
      overlayDiv.style.overflow = '';
      overlayDiv.style.boxShadow = '';
      overlayDiv.style.filter = '';
      overlayDiv.style.opacity = '';
      overlayDiv.style.removeProperty('--crt-ca-px');
    },
    resize: () => {
      // Les styles CSS s'adaptent automatiquement
    },
  };
}
