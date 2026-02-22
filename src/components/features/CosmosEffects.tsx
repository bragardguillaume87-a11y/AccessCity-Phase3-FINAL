/**
 * CosmosEffects - Visual effects hook for Cosmos theme
 *
 * Provides callbacks for:
 * - Star confetti on node creation
 * - Sparkle particles on connection
 * - Flash effect on deletion
 */
import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';

const fx = COSMOS_DIMENSIONS.effects;
const colors = COSMOS_COLORS.effects;

export function useCosmosEffects() {
  const celebrateNodeCreation = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const starShape = confetti.shapeFromText({ text: '⭐', scalar: fx.shapeScalar });

    confetti({
      particleCount: fx.creationParticles,
      spread: fx.creationSpread,
      origin: { y: 0.6, x: 0.5 },
      colors: [...colors.creationColors],
      shapes: [starShape],
      scalar: fx.creationScalar,
      ticks: fx.creationTicks,
      disableForReducedMotion: true,
    });
  }, []);

  const sparkleOnConnection = useCallback((x: number, y: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const normalizedX = x / window.innerWidth;
    const normalizedY = y / window.innerHeight;

    confetti({
      particleCount: fx.connectionParticles,
      spread: fx.connectionSpread,
      origin: { x: normalizedX, y: normalizedY },
      colors: [...colors.connectionColors],
      scalar: fx.connectionScalar,
      ticks: fx.connectionTicks,
      gravity: fx.connectionGravity,
      disableForReducedMotion: true,
    });
  }, []);

  const flashOnDelete = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${colors.deleteGradient};
      pointer-events: none;
      z-index: ${fx.flashZIndex};
      animation: ${COSMOS_ANIMATIONS.deleteFlash};
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), fx.flashDuration);
  }, []);

  return {
    celebrateNodeCreation,
    sparkleOnConnection,
    flashOnDelete,
  };
}

export default useCosmosEffects;
