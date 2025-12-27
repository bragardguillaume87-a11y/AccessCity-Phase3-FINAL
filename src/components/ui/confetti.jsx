import { motion } from 'framer-motion';

export function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    color: ['#f43f5e', '#3b82f6', '#eab308', '#22c55e'][Math.floor(Math.random() * 4)],
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: piece.x,
            top: -20,
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            rotate: [0, 720],
            opacity: [1, 0],
          }}
          transition={{
            duration: 3,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
