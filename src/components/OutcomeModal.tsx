import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatedProgressBar } from '@/components/ui/progress-bar';
import { motion } from 'framer-motion';

/**
 * Moral impact data structure
 */
export interface MoralImpact {
  /** Variable name (e.g., "Empathie", "Courage") */
  variable: string;
  /** Change amount (positive or negative) */
  delta: number;
}

/**
 * Color type for moral impact visualization
 */
export type MoralColor = 'blue' | 'green' | 'red';

/**
 * Props for OutcomeModal component
 */
export interface OutcomeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Descriptive message of the outcome */
  message: string;
  /** Optional illustration URL */
  illustration?: string;
  /** Moral impact with variable and delta */
  moral?: MoralImpact;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * OutcomeModal - AAA Outcome Display with Moral Impact
 *
 * Professional outcome display modal inspired by AAA games with:
 * - Dark theme consistent with editor
 * - Smooth transitions for content reveal
 * - Animated progress bar for moral stats
 * - Image support with fade-in animation
 * - Keyboard navigation (Enter/Space to continue)
 *
 * Features:
 * - Framer Motion animations for smooth transitions
 * - Color-coded moral impact (green for positive, red for negative, blue for neutral)
 * - Responsive layout with max-width 2xl
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <OutcomeModal
 *   isOpen={showOutcome}
 *   message="Votre choix a eu un impact significatif sur la situation."
 *   illustration="/assets/outcome.png"
 *   moral={{ variable: 'Empathie', delta: 10 }}
 *   onClose={() => setShowOutcome(false)}
 * />
 * ```
 */
export default function OutcomeModal({ 
  isOpen, 
  message, 
  illustration, 
  moral, 
  onClose 
}: OutcomeModalProps) {
  // Keyboard handler for Enter/Space
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  // Determine moral color based on delta
  const getMoralColor = (): MoralColor => {
    if (!moral || moral.delta === 0) return 'blue';
    return moral.delta > 0 ? 'green' : 'red';
  };

  const getMoralBadgeColor = (): string => {
    if (!moral || moral.delta === 0) return 'bg-blue-600';
    return moral.delta > 0 ? 'bg-green-600' : 'bg-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onKeyDown={handleKeyDown}>
        <div className="py-6 space-y-6">
          {/* Illustration */}
          {illustration && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src={illustration}
                alt="Outcome"
                className="max-w-full max-h-64 object-contain rounded-lg"
              />
            </motion.div>
          )}

          {/* Message */}
          <motion.div
            className="bg-card rounded-lg p-6 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.div>

          {/* Moral impact */}
          {moral && moral.variable && moral.delta !== 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-3">
                {/* Label with delta */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{moral.variable}</span>
                  <div className={`px-3 py-1 rounded-full text-white font-bold text-sm ${getMoralBadgeColor()}`}>
                    {moral.delta > 0 ? '+' : ''}{moral.delta}
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className="bg-gradient-to-r from-card to-background rounded-lg p-4">
                  <AnimatedProgressBar
                    label={moral.variable}
                    value={Math.abs(moral.delta)}
                    max={10}
                    color={getMoralColor()}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: moral && moral.delta !== 0 ? 0.6 : 0.4 }}
          >
            <Button onClick={onClose} className="w-full" size="lg">
              Continuer →
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
