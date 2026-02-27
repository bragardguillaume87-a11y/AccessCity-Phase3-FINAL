import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
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

interface StepBasicsProps {
  speaker: string;
  text: string;
  onSpeakerChange: (speaker: string) => void;
  onTextChange: (text: string) => void;
  onValidChange: (isValid: boolean) => void;
}

/**
 * StepBasics - Dialogue speaker and text input
 *
 * Features:
 * - Character selector with narrator option
 * - Text input with real-time validation (10-500 chars)
 * - Character counter with visual feedback
 * - Encouraging messages
 * - Gaming aesthetic for kids
 */
export function StepBasics({
  speaker,
  text,
  onSpeakerChange,
  onTextChange,
  onValidChange
}: StepBasicsProps) {
  const characters = useCharactersStore(state => state.characters);

  // Validation
  const validation = useMemo(() => {
    const trimmedText = text.trim();
    const length = trimmedText.length;

    const errors: string[] = [];
    const warnings: string[] = [];
    const success: string[] = [];

    // Text validation
    if (length === 0) {
      errors.push("Le dialogue ne peut pas être vide");
    } else if (length < 10) {
      warnings.push(`Encore ${10 - length} caractère${10 - length > 1 ? 's' : ''} minimum`);
    } else if (length > 500) {
      errors.push("Maximum 500 caractères dépassé");
    } else if (length >= 10 && length <= 500) {
      success.push("Bon dialogue");
    }

    const isValid = errors.length === 0 && length >= 10 && length <= 500;

    return { errors, warnings, success, isValid, length };
  }, [text]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  // Get encouraging message
  const getMessage = () => {
    if (validation.errors.length > 0) {
      return {
        type: 'error' as const,
        icon: AlertCircle,
        text: validation.errors[0]
      };
    }
    if (validation.warnings.length > 0) {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        text: validation.warnings[0]
      };
    }
    if (validation.success.length > 0) {
      return {
        type: 'success' as const,
        icon: CheckCircle,
        text: validation.success[0]
      };
    }
    return null;
  };

  const message = getMessage();

  // Character count color
  const getCounterColor = () => {
    if (validation.length === 0) return 'text-muted-foreground';
    if (validation.length < 10) return 'text-yellow-500';
    if (validation.length > 500) return 'text-red-500';
    if (validation.length > 450) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-3 space-y-3">
      {/* Form */}
      <div className="space-y-4 bg-card/50 rounded-xl p-5 border border-border shadow-sm">
        {/* Character Selector */}
        <div className="space-y-2">
          <Label htmlFor="speaker" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
            <User className="w-4 h-4" />
            Qui parle ?
          </Label>
          <Select value={speaker || DEFAULTS.DIALOGUE_SPEAKER} onValueChange={onSpeakerChange}>
            <SelectTrigger
              id="speaker"
              className="h-10 text-sm border focus:ring-2 focus:ring-primary/20 [&>span]:flex [&>span]:items-center [&>span]:overflow-hidden [&>span]:min-w-0"
            >
              <SelectValue placeholder="Choisis un personnage..." />
            </SelectTrigger>
            <SelectContent>
              {characters.map((char) => (
                <SelectItem key={char.id} value={char.id} className="text-sm py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {char.sprites?.neutral ? (
                      <img
                        src={char.sprites.neutral}
                        alt={char.name}
                        className="w-6 h-6 rounded object-contain bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">👤</span>
                      </div>
                    )}
                    <span className="font-medium truncate">{char.name}</span>
                  </div>
                </SelectItem>
              ))}

              {/* No characters warning */}
              {characters.length === 0 && (
                <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                  <p>Aucun personnage disponible</p>
                  <p className="text-xs mt-1">Crée d'abord un personnage !</p>
                </div>
              )}
            </SelectContent>
          </Select>

        </div>

        {/* Dialogue Text */}
        <div className="space-y-2">
          <Label htmlFor="dialogue-text" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            Que dit-il ?
          </Label>
          <div className="relative">
            <Textarea
              id="dialogue-text"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Écris le dialogue ici..."
              className={cn(
                "min-h-[100px] text-sm border focus:ring-2 focus:ring-primary/20 resize-none",
                "transition-all duration-200",
                validation.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                validation.isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              )}
              maxLength={550}
            />

            {/* Character counter */}
            <div className={cn(
              "absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium",
              "bg-background/90 backdrop-blur-sm border transition-all duration-200",
              getCounterColor()
            )}>
              {validation.length} / 500
            </div>
          </div>

          {/* Validation message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message.type}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
                  message.type === 'error' && "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
                  message.type === 'warning' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
                  message.type === 'success' && "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                )}
              >
                <message.icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export default StepBasics;
