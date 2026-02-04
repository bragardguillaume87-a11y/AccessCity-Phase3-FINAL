/**
 * CosmosBackground - Animated starfield background for Cosmos theme
 *
 * Features:
 * - 100 twinkling stars at random positions
 * - Animated nebula gradients
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

const STAR_COLORS = ['#ffffff', '#fef08a', '#93c5fd', '#f9a8d4'];
const STAR_COUNT = 100;

export function CosmosBackground(): React.JSX.Element {
  // Generate stars with random positions (memoized for performance)
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1-4px
      delay: Math.random() * 3, // 0-3s delay
      duration: Math.random() * 2 + 1, // 1-3s duration
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }, []);

  return (
    <div className="cosmos-background" aria-hidden="true">
      {/* Nebula gradient background */}
      <div className="cosmos-nebula" />

      {/* Twinkling stars */}
      <div className="cosmos-stars">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="cosmos-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
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
        ))}
      </div>

      {/* Slow floating particles */}
      <div className="cosmos-particles" />
    </div>
  );
}

export default CosmosBackground;
