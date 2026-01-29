import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, Volume2, CheckCircle, AlertCircle } from 'lucide-react';
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
      if (length > 300) {
        success.push("Wow, c'est un long discours ! 📖");
      } else if (length > 150) {
        success.push("Parfait ! Ton personnage a beaucoup à dire 😊");
      } else {
        success.push("Super ! Un bon dialogue court et clair ✨");
      }
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
    <div className="w-full max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-pink-500 shadow-lg">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Qui parle et que dit-il ?
        </h2>
        <p className="text-muted-foreground text-lg">
          Choisis un personnage et écris ce qu'il va dire 💬
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 bg-card/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-border shadow-xl">
        {/* Character Selector */}
        <div className="space-y-3">
          <Label htmlFor="speaker" className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Qui parle ?
          </Label>
          <Select value={speaker || 'narrator'} onValueChange={onSpeakerChange}>
            <SelectTrigger
              id="speaker"
              className="h-14 text-base border-2 focus:ring-4 focus:ring-primary/20"
            >
              <SelectValue placeholder="Choisis un personnage..." />
            </SelectTrigger>
            <SelectContent>
              {/* Narrator option */}
              <SelectItem value="narrator" className="text-base py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📖</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">Narrateur</div>
                    <div className="text-xs text-muted-foreground truncate">Voix qui raconte l'histoire</div>
                  </div>
                </div>
              </SelectItem>

              {/* Characters */}
              {characters.map((char) => (
                <SelectItem key={char.id} value={char.id} className="text-base py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {char.sprites?.neutral ? (
                      <img
                        src={char.sprites.neutral}
                        alt={char.name}
                        className="w-8 h-8 rounded-lg object-contain bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">👤</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{char.name}</div>
                      <div className="text-xs text-muted-foreground truncate">Personnage</div>
                    </div>
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

          {/* Speaker info */}
          {speaker && speaker !== 'narrator' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>
                {characters.find(c => c.id === speaker)?.name || 'Narrateur'} va parler 👍
              </span>
            </motion.div>
          )}
        </div>

        {/* Dialogue Text */}
        <div className="space-y-3">
          <Label htmlFor="dialogue-text" className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Que dit-il ?
          </Label>
          <div className="relative">
            <Textarea
              id="dialogue-text"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Écris le dialogue ici... (minimum 10 caractères)"
              className={cn(
                "min-h-[200px] text-base border-2 focus:ring-4 focus:ring-primary/20 resize-none",
                "transition-all duration-200",
                validation.errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                validation.isValid && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              )}
              maxLength={550} // Soft limit, we show error at 500
            />

            {/* Character counter */}
            <div className={cn(
              "absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-semibold",
              "bg-background/90 backdrop-blur-sm border-2 transition-all duration-200",
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2",
                  message.type === 'error' && "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
                  message.type === 'warning' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
                  message.type === 'success' && "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                )}
              >
                <message.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{message.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sound Effect (Optional - Simplified for now) */}
        <div className="space-y-3 opacity-50">
          <Label htmlFor="sfx" className="text-base font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            Effet sonore (bientôt disponible)
          </Label>
          <p className="text-sm text-muted-foreground">
            Tu pourras bientôt ajouter un son qui se joue quand ce dialogue apparaît 🎵
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Astuce :</strong> Un bon dialogue doit être court et intéressant !
        </p>
        <p className="text-xs text-muted-foreground">
          Les joueurs préfèrent lire des dialogues courts qu'ils peuvent comprendre facilement
        </p>
      </div>
    </div>
  );
}

export default StepBasics;
