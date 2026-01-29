import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DialogueChoice, Scene } from '@/types';

interface SimpleChoiceBuilderProps {
  choices: [DialogueChoice, DialogueChoice];
  scenes: Scene[];
  currentSceneId: string;
  onUpdateChoice: (index: 0 | 1, updates: Partial<DialogueChoice>) => void;
  onValidChange: (isValid: boolean) => void;
}

/**
 * SimpleChoiceBuilder - Binary choice creator for Simple complexity
 *
 * Features:
 * - 2 fixed choices (cannot add/remove)
 * - Text input (5-50 chars recommended)
 * - Navigation to scene or dialogue
 * - Gaming aesthetic with color coding
 * - Real-time validation
 * - WCAG 2.2 AA compliant
 */
export function SimpleChoiceBuilder({
  choices,
  scenes,
  currentSceneId,
  onUpdateChoice,
  onValidChange
}: SimpleChoiceBuilderProps) {
  const currentScene = scenes.find(s => s.id === currentSceneId);

  // Validation logic
  const validation = useMemo(() => {
    const errors: string[] = [];

    choices.forEach((choice, idx) => {
      if (!choice.text || choice.text.trim().length < 5) {
        errors.push(`Le choix ${idx + 1} doit avoir au moins 5 caractères`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [choices]);

  // Notify parent of validation state
  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  const cardConfigs = [
    {
      index: 0,
      icon: '✅',
      color: 'from-green-500 to-green-600',
      borderColor: 'border-green-500',
      ringColor: 'ring-green-500/30',
      label: 'Choix 1',
      placeholder: 'Ex: Oui, Accepter, Continuer...'
    },
    {
      index: 1,
      icon: '❌',
      color: 'from-red-500 to-red-600',
      borderColor: 'border-red-500',
      ringColor: 'ring-red-500/30',
      label: 'Choix 2',
      placeholder: 'Ex: Non, Refuser, Arrêter...'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Crée les options pour le joueur
        </h3>
        <p className="text-muted-foreground">
          Mode Simple : 2 choix binaires (Oui/Non, Accepter/Refuser)
        </p>
      </div>

      {/* Two choice cards side-by-side */}
      <div className="grid md:grid-cols-2 gap-6">
        {cardConfigs.map((config) => {
          const choice = choices[config.index];
          const isValid = choice.text && choice.text.trim().length >= 5;
          const charCount = choice.text?.length || 0;

          return (
            <motion.div
              key={config.index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: config.index * 0.1 }}
              className={cn(
                "relative p-6 rounded-2xl border-4 transition-all duration-300",
                isValid
                  ? `${config.borderColor} ring-4 ${config.ringColor} shadow-xl`
                  : "border-border shadow-lg"
              )}
            >
              {/* Valid indicator */}
              {isValid && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Check className="h-5 w-5 text-white" />
                </motion.div>
              )}

              {/* Icon badge */}
              <div className={cn(
                "absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                `bg-gradient-to-br ${config.color}`
              )}>
                <span className="text-3xl">{config.icon}</span>
              </div>

              {/* Content */}
              <div className="space-y-4 pt-12">
                {/* Label */}
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">{config.label}</Label>
                  <span className={cn(
                    "text-xs font-mono",
                    charCount < 5 ? "text-destructive" : charCount > 50 ? "text-warning" : "text-muted-foreground"
                  )}>
                    {charCount}/50
                  </span>
                </div>

                {/* Text input */}
                <Input
                  value={choice.text || ''}
                  onChange={(e) => onUpdateChoice(config.index as 0 | 1, { text: e.target.value })}
                  placeholder={config.placeholder}
                  maxLength={50}
                  className={cn(
                    "text-base font-semibold",
                    charCount < 5 && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-label={`Texte ${config.label}`}
                  aria-describedby={`choice-${config.index}-help`}
                />
                <p id={`choice-${config.index}-help`} className="text-xs text-muted-foreground">
                  Entre 5 et 50 caractères recommandés
                </p>

                {/* Navigation */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Où aller ensuite ?
                  </Label>

                  {/* Scene selector */}
                  <div className="space-y-2">
                    <Label htmlFor={`scene-${config.index}`} className="text-xs text-muted-foreground">
                      Scène suivante
                    </Label>
                    <Select
                      value={choice.nextSceneId || '__none__'}
                      onValueChange={(value) => {
                        const sceneId = value === '__none__' ? undefined : value;
                        onUpdateChoice(config.index as 0 | 1, {
                          nextSceneId: sceneId,
                          nextDialogueId: sceneId ? undefined : choice.nextDialogueId
                        });
                      }}
                    >
                      <SelectTrigger id={`scene-${config.index}`} className="text-sm">
                        <SelectValue placeholder="-- Continuer dans cette scène --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Continuer dans cette scène --</SelectItem>
                        {scenes.filter(s => s.id !== currentSceneId).map(scene => (
                          <SelectItem key={scene.id} value={scene.id}>
                            {scene.title || 'Sans titre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dialogue selector (within current scene) */}
                  {currentScene && currentScene.dialogues.length > 0 && !choice.nextSceneId && (
                    <div className="space-y-2">
                      <Label htmlFor={`dialogue-${config.index}`} className="text-xs text-muted-foreground">
                        Ou dialogue suivant (même scène)
                      </Label>
                      <Select
                        value={choice.nextDialogueId || '__none__'}
                        onValueChange={(value) => {
                          const dialogueId = value === '__none__' ? undefined : value;
                          onUpdateChoice(config.index as 0 | 1, {
                            nextDialogueId: dialogueId
                          });
                        }}
                      >
                        <SelectTrigger id={`dialogue-${config.index}`} className="text-sm">
                          <SelectValue placeholder="-- Passer au dialogue suivant --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">-- Passer au dialogue suivant --</SelectItem>
                          {currentScene.dialogues.map((dialogue, idx) => (
                            <SelectItem key={dialogue.id} value={dialogue.id}>
                              #{idx + 1}: {dialogue.text?.substring(0, 30) || 'Vide'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Validation feedback */}
      {!validation.isValid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/50"
        >
          <p className="text-sm font-semibold text-destructive mb-2">
            Complète ces informations pour continuer :
          </p>
          <ul className="space-y-1 text-xs text-destructive">
            {validation.errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Success message */}
      {validation.isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-primary/10 border-2 border-primary/50 text-center"
        >
          <p className="text-sm font-semibold text-primary">
            ✨ Super ! Tes deux choix sont prêts ! Clique sur "Terminer" pour sauvegarder.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default SimpleChoiceBuilder;
