/**
 * CosmosBackground - Animated starfield background for Cosmos theme
 *
 * **PHASE 8: Enhanced cosmic starfield for children**
 *
 * Features:
 * - 150 twinkling stars with 3 size tiers (small/medium/large)
 * - Perplexity cosmic color palette (purple, blue, pink, cyan, yellow)
 * - Dynamic glow intensity based on star size
 * - Animated nebula gradients with 4 colored zones
 * - Floating particles
 * - Uses Framer Motion for smooth star animations
 * - Respects prefers-reduced-motion
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import './CosmosBackground.css';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

// PHASE 8: Perplexity cosmic color palette for children
const STAR_COLORS = [
  '#ffffff',   // white - base stars
  '#FFD60A',   // perplexity yellow - warm stars
  '#06FFF0',   // perplexity cyan - cool stars
  '#FF006E',   // perplexity pink - accent stars
  '#9D4EDD',   // perplexity purple - nebula stars
];
const STAR_COUNT = 150; // Increased from 100 for denser starfield

export function CosmosBackground(): React.JSX.Element {
  // PHASE 8: Generate stars with 3 size tiers and cosmic colors (memoized for performance)
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => {
      // Weighted distribution: 60% small, 30% medium, 10% large
      const sizeRand = Math.random();
      let size: number;
      if (sizeRand < 0.6) {
        size = Math.random() * 2 + 1; // Small: 1-3px
      } else if (sizeRand < 0.9) {
        size = Math.random() * 3 + 3; // Medium: 3-6px
      } else {
        size = Math.random() * 4 + 6; // Large: 6-10px (rare, bright stars)
      }

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        delay: Math.random() * 4, // Longer delays for more variety (0-4s)
        duration: Math.random() * 3 + 1.5, // 1.5-4.5s for varied twinkling
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      };
    });
  }, []);

  return (
    <div className="cosmos-background" aria-hidden="true">
      {/* Nebula gradient background */}
      <div className="cosmos-nebula" />

      {/* Twinkling stars with dynamic glow */}
      <div className="cosmos-stars">
        {stars.map((star) => {
          // PHASE 8: Dynamic glow based on star size
          const glowIntensity = star.size > 6 ? 'strong' : star.size > 3 ? 'medium' : 'subtle';
          const boxShadow =
            glowIntensity === 'strong'
              ? `0 0 12px ${star.color}, 0 0 24px ${star.color}, 0 0 36px ${star.color}80`
              : glowIntensity === 'medium'
              ? `0 0 8px ${star.color}, 0 0 16px ${star.color}cc`
              : `0 0 6px ${star.color}`;

          return (
            <motion.div
              key={star.id}
              className="cosmos-star"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                backgroundColor: star.color,
                boxShadow, // Dynamic glow
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      {/* Slow floating particles */}
      <div className="cosmos-particles" />
    </div>
  );
}

export default CosmosBackground;
