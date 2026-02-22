import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import { cn } from '@/lib/utils';
import type { DialogueChoice } from '@/types';
import type { ResponseData } from '../hooks/useDialogueForm';

interface ResponseCardConfig {
  index: 0 | 1;
  emoji: string;
  gradient: string;
  borderValid: string;
  label: string;
}

const CARD_CONFIGS: ResponseCardConfig[] = [
  {
    index: 0,
    emoji: '👍',
    gradient: 'from-emerald-600 to-emerald-500',
    borderValid: 'border-emerald-500',
    label: 'Réponse A',
  },
  {
    index: 1,
    emoji: '👎',
    gradient: 'from-rose-600 to-rose-500',
    borderValid: 'border-rose-500',
    label: 'Réponse B',
  },
];

interface StepResponsesProps {
  choices: DialogueChoice[];
  responses: ResponseData[];
  defaultSpeaker: string;
  onUpdateResponse: (index: number, updates: Partial<ResponseData>) => void;
  onValidChange: (isValid: boolean) => void;
  onSkip: () => void;
}

/**
 * StepResponses - Optional step to write branch responses
 *
 * After the player makes a choice (A or B), what happens?
 * Two colored cards let the creator write different responses.
 * The step can be skipped entirely (responses are optional).
 *
 * Design: matches SimpleChoiceBuilder aesthetic (emerald/rose cards)
 */
export function StepResponses({
  choices,
  responses,
  defaultSpeaker,
  onUpdateResponse,
  onValidChange,
  onSkip,
}: StepResponsesProps) {
  const characters = useCharactersStore(state => state.characters);

  // Ensure responses array matches choices length
  const safeResponses: ResponseData[] = useMemo(() => {
    return choices.map((_, i) => responses[i] || { speaker: '', text: '' });
  }, [choices, responses]);

  // Validation: either both responses are filled, or both are empty (skip)
  const validation = useMemo(() => {
    const filled = safeResponses.filter(r => r.text.trim().length > 0);

    // All empty = valid (user will skip)
    if (filled.length === 0) return { isValid: true, allEmpty: true };

    // All filled with minimum text = valid
    const allValid = safeResponses.every(r => r.text.trim().length >= 5);
    return { isValid: allValid, allEmpty: false };
  }, [safeResponses]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold">
          <span className="text-3xl mr-2">💡</span>
          Que se passe-t-il après le choix ?
        </h2>
        <p className="text-muted-foreground text-sm">
          Écris ce qui arrive quand le joueur fait son choix.
          Tu peux aussi passer cette étape.
        </p>
      </motion.div>

      {/* Skip button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onSkip}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="w-4 h-4" />
          Passer cette étape
        </Button>
      </motion.div>

      {/* Response cards */}
      <div className="space-y-4">
        {CARD_CONFIGS.map((config) => {
          const choice = choices[config.index];
          const response = safeResponses[config.index];
          if (!choice) return null;

          const hasText = response.text.trim().length > 0;
          const isValid = response.text.trim().length >= 5;
          const speakerValue = response.speaker || defaultSpeaker || DEFAULTS.DIALOGUE_SPEAKER;

          return (
            <motion.div
              key={config.index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: config.index * 0.15 + 0.2 }}
              className={cn(
                "rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                isValid
                  ? `${config.borderValid} shadow-xl`
                  : "border-border shadow-lg"
              )}
            >
              {/* Card header */}
              <div className={cn(
                "px-5 py-3 flex items-center gap-3",
                `bg-gradient-to-r ${config.gradient}`
              )}>
                <span className="text-2xl">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white">
                    {config.label}
                  </h4>
                  <p className="text-xs text-white/80 truncate">
                    Si le joueur choisit : « {choice.text || '...'} »
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 space-y-4">
                {/* Speaker selector */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Qui répond ?
                  </label>
                  <Select
                    value={speakerValue}
                    onValueChange={(value) => onUpdateResponse(config.index, { speaker: value })}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Choisis un personnage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id} className="text-sm py-2">
                          <div className="flex items-center gap-2">
                            {char.sprites?.neutral ? (
                              <img src={char.sprites.neutral} alt={char.name} className="w-6 h-6 rounded object-contain bg-muted" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                                <span className="text-xs">👤</span>
                              </div>
                            )}
                            <span className="font-medium">{char.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Response text */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    Que dit-il ?
                  </label>
                  <Textarea
                    value={response.text}
                    onChange={(e) => onUpdateResponse(config.index, { text: e.target.value })}
                    placeholder="Écris la réponse ici..."
                    className={cn(
                      "min-h-[80px] text-base resize-none rounded-xl",
                      isValid && config.borderValid
                    )}
                    maxLength={500}
                  />
                  {hasText && !isValid && (
                    <p className="text-xs text-orange-400">
                      Encore {5 - response.text.trim().length} lettre{5 - response.text.trim().length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Validation feedback */}
      {!validation.allEmpty && validation.isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3"
        >
          <p className="text-emerald-400 font-semibold text-sm">
            Tes deux réponses sont prêtes ! Clique sur Terminer pour vérifier.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default StepResponses;
