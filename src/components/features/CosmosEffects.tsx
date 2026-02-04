/**
 * CosmosEffects - Visual effects hook for Cosmos theme
 *
 * Provides callbacks for:
 * - Star confetti on node creation
 * - Sparkle particles on connection
 * - Flash effect on deletion
 *
 * Uses canvas-confetti library (already installed in the project)
 */
import { useCallback } from 'react';
import confetti from 'canvas-confetti';

/**
 * Hook providing cosmos-themed visual effects
 */
export function useCosmosEffects() {
  /**
   * Star confetti effect when creating a new node
   */
  const celebrateNodeCreation = useCallback(() => {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Star shape using text
    const starShape = confetti.shapeFromText({ text: '⭐', scalar: 2 });

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6, x: 0.5 },
      colors: ['#fef08a', '#93c5fd', '#f9a8d4', '#a855f7'],
      shapes: [starShape],
      scalar: 1.5,
      ticks: 100,
      disableForReducedMotion: true,
    });
  }, []);

  /**
   * Sparkle effect at a specific position (e.g., on connection)
   */
  const sparkleOnConnection = useCallback((x: number, y: number) => {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Normalize coordinates for confetti (0-1 range)
    const normalizedX = x / window.innerWidth;
    const normalizedY = y / window.innerHeight;

    confetti({
      particleCount: 15,
      spread: 40,
      origin: { x: normalizedX, y: normalizedY },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
      scalar: 0.8,
      ticks: 60,
      gravity: 0.5,
      disableForReducedMotion: true,
    });
  }, []);

  /**
   * Red flash effect when deleting a node
   */
  const flashOnDelete = useCallback(() => {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: 9999;
      animation: cosmos-delete-flash 0.3s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }, []);

  return {
    celebrateNodeCreation,
    sparkleOnConnection,
    flashOnDelete,
  };
}

export default useCosmosEffects;
