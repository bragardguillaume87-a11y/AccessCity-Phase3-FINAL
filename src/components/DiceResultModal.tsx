import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatedDice } from '@/components/ui/animated-dice';
import { Confetti } from '@/components/ui/confetti';
import { motion } from 'framer-motion';

/**
 * Props for DiceResultModal component
 */
export interface DiceResultModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Dice roll result (1-20) */
  roll: number;
  /** Difficulty threshold */
  difficulty: number;
  /** Whether the roll was successful */
  success: boolean;
  /** Critical success threshold (default: 19) */
  criticalThreshold?: number;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * DiceResultModal - AAA Dice Roll Result Display
 *
 * Features:
 * - Animated rolling dice with framer-motion
 * - Confetti effect for critical success
 * - Dark theme consistent with editor
 * - Smooth transitions and reveals
 * - Keyboard navigation (Enter/Space to continue)
 *
 * @example
 * ```tsx
 * <DiceResultModal
 *   isOpen={showDiceRoll}
 *   roll={17}
 *   difficulty={15}
 *   success={true}
 *   criticalThreshold={19}
 *   onClose={() => setShowDiceRoll(false)}
 * />
 * ```
 */
export default function DiceResultModal({
  isOpen,
  roll,
  difficulty,
  success,
  criticalThreshold = 19,
  onClose
}: DiceResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [diceAnimationComplete, setDiceAnimationComplete] = useState(false);

  // Critical success if roll >= criticalThreshold
  const isCriticalSuccess = success && roll >= criticalThreshold;

  useEffect(() => {
    if (isOpen && isCriticalSuccess) {
      // Show confetti after dice animation completes
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 1200); // Dice animation is 1000ms, wait a bit more
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, isCriticalSuccess]);

  useEffect(() => {
    if (!isOpen) {
      // Reset animation state when modal closes
      setDiceAnimationComplete(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  // Keyboard handler for Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (diceAnimationComplete && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClose();
    }
  };

  // Determine result text and color based on roll
  const getResultText = (): string => {
    if (isCriticalSuccess) return 'Succès Critique !';
    if (success) return 'Succès';
    return 'Échec';
  };

  const getResultEmoji = (): string => {
    if (isCriticalSuccess) return '🎉';
    if (success) return '✓';
    return '✗';
  };

  const getResultColor = (): string => {
    if (success) return 'text-green-500';
    return 'text-red-500';
  };

  const getResultBgColor = (): string => {
    if (success) return 'bg-green-600';
    return 'bg-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md bg-gradient-to-br from-background via-card to-background border-2"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Résultat du lancer de dé</DialogTitle>
        <div className="py-8 space-y-6">
          {/* Dice animation */}
          <div className="flex justify-center">
            <AnimatedDice
              finalValue={roll}
              onComplete={() => setDiceAnimationComplete(true)}
            />
          </div>

          {/* Title - appears after dice stops rolling */}
          {diceAnimationComplete && (
            <motion.h2
              className={`text-3xl font-bold text-center ${getResultColor()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {getResultEmoji()} {getResultText()}
            </motion.h2>
          )}

          {/* Difficulty */}
          {diceAnimationComplete && (
            <motion.div
              className="text-center text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Difficulté : {difficulty}
            </motion.div>
          )}

          {/* Result badge */}
          {diceAnimationComplete && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
            >
              <div className={`px-6 py-3 rounded-full font-bold text-lg text-white ${getResultBgColor()}`}>
                {getResultEmoji()} {success ? 'RÉUSSI' : 'ÉCHOUÉ'}
              </div>
            </motion.div>
          )}

          {/* Continue button */}
          {diceAnimationComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={onClose}
                className="w-full"
                size="lg"
              >
                Continuer →
              </Button>
            </motion.div>
          )}
        </div>

        {/* Confetti for critical success */}
        {showConfetti && <Confetti />}
      </DialogContent>
    </Dialog>
  );
}
