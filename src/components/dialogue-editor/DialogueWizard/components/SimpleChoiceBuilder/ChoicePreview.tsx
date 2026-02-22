
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DialogueChoice } from '@/types';

interface ChoicePreviewProps {
  choices: [DialogueChoice, DialogueChoice];
  isValid: boolean;
}

/**
 * ChoicePreview - Live preview + validation feedback
 */
export function ChoicePreview({ choices, isValid }: ChoicePreviewProps) {
  const hasAnyText = choices[0].text || choices[1].text;

  return (
    <>
      {/* Live preview */}
      {hasAnyText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <p className="text-sm font-semibold text-muted-foreground text-center">
            Voici ce que le joueur verra :
          </p>
          <div className="flex justify-center gap-4">
            {choices.map((choice, idx) => (
              <div
                key={idx}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-bold transition-all min-w-[120px] text-center",
                  choice.text && choice.text.trim().length >= 5
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground border-2 border-dashed border-border"
                )}
              >
                {choice.text && choice.text.trim().length > 0
                  ? choice.text
                  : `Choix ${idx + 1}...`
                }
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Validation feedback - inline, encouraging */}
      <AnimatePresence mode="wait">
        {!isValid ? (
          <motion.div
            key="incomplete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-center"
          >
            <p className="text-sm font-semibold text-amber-400">
              Écris au moins 5 lettres pour chaque chemin pour continuer
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center"
          >
            <p className="text-base font-bold text-emerald-400">
              Bravo ! Tes deux chemins sont prêts ! Clique sur Terminer
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
