/**
 * CosmosBackground - Animated starfield background for Cosmos theme
 *
 * Features:
 * - Twinkling stars with 3 size tiers (small/medium/large)
 * - Perplexity cosmic color palette
 * - Dynamic glow intensity based on star size
 * - Animated nebula gradients
 * - Floating particles
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { COSMOS_COLORS, COSMOS_DIMENSIONS, COSMOS_ANIMATIONS } from '@/config/cosmosConstants';
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

const palette = COSMOS_COLORS.starfield.palette;
const sf = COSMOS_DIMENSIONS.starfield;
const anim = COSMOS_ANIMATIONS.starTwinkle;

export function CosmosBackground(): React.JSX.Element {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: sf.count }, (_, i) => {
      const sizeRand = Math.random();
      let size: number;
      if (sizeRand < sf.thresholdSmall) {
        size = Math.random() * (sf.sizeSmall.max - sf.sizeSmall.min) + sf.sizeSmall.min;
      } else if (sizeRand < sf.thresholdMedium) {
        size = Math.random() * (sf.sizeMedium.max - sf.sizeMedium.min) + sf.sizeMedium.min;
      } else {
        size = Math.random() * (sf.sizeLarge.max - sf.sizeLarge.min) + sf.sizeLarge.min;
      }

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        delay: Math.random() * sf.delayMax,
        duration: Math.random() * sf.durationRange + sf.durationMin,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    });
  }, []);

  return (
    <div className="cosmos-background" aria-hidden="true">
      <div className="cosmos-nebula" />

      <div className="cosmos-stars">
        {stars.map((star) => {
          const boxShadow =
            star.size > sf.glowThresholdLarge
              ? COSMOS_COLORS.starfield.glowStrong(star.color)
              : star.size > sf.glowThresholdMedium
              ? COSMOS_COLORS.starfield.glowMedium(star.color)
              : COSMOS_COLORS.starfield.glowSubtle(star.color);

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
                boxShadow,
              }}
              animate={{
                opacity: anim.opacityKeyframes as unknown as number[],
                scale: anim.scaleKeyframes as unknown as number[],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                ease: anim.ease,
              }}
            />
          );
        })}
      </div>

      <div className="cosmos-particles" />
    </div>
  );
}

export default CosmosBackground;
