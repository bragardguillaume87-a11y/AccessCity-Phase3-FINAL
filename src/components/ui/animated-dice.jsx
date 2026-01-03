import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TIMING } from '@/config/timing';

export function AnimatedDice({ finalValue, onComplete }) {
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRolling(false);
      onComplete?.();
    }, TIMING.DICE_ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-6xl font-bold text-white shadow-2xl"
      animate={rolling ? {
        rotate: [0, 90, 180, 270, 360, 450, 540],
        scale: [1, 1.2, 1, 1.2, 1, 1.2, 1],
      } : {}}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {rolling ? '?' : finalValue}
    </motion.div>
  );
}
