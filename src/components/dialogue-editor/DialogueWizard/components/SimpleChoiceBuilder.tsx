import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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
 * Preset templates for quick binary choices
 */
const CHOICE_TEMPLATES = [
  { a: 'Accepter', b: 'Refuser', emoji: '🤝' },
  { a: 'Aider', b: 'Ignorer', emoji: '💪' },
  { a: 'Aller à gauche', b: 'Aller à droite', emoji: '🧭' },
  { a: 'Continuer', b: 'Arrêter', emoji: '🚶' },
  { a: 'Oui', b: 'Non', emoji: '💬' },
];

/**
 * SimpleChoiceBuilder - Kid-friendly binary choice creator (8+)
 *
 * Design principles (NN/g, Scratch, Duolingo):
 * - Visual progress bars instead of numeric counters
 * - Preset templates for quick start
 * - Large touch targets (48px+)
 * - Micro-celebrations per card
 * - Progressive disclosure for advanced options
 * - Live preview of choices as player would see them
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
  const [showAdvanced, setShowAdvanced] = useState<[boolean, boolean]>([false, false]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    choices.forEach((choice, idx) => {
      if (!choice.text || choice.text.trim().length < 5) {
        errors.push(`Le choix ${idx + 1} doit avoir au moins 5 lettres`);
      }
    });
    return { isValid: errors.length === 0, errors };
  }, [choices]);

  useEffect(() => {
    onValidChange(validation.isValid);
  }, [validation.isValid, onValidChange]);

  // Apply a template
  const applyTemplate = (template: typeof CHOICE_TEMPLATES[0]) => {
    onUpdateChoice(0, { text: template.a });
    onUpdateChoice(1, { text: template.b });
  };

  const cardConfigs = [
    {
      index: 0 as const,
      emoji: '👍',
      gradient: 'from-emerald-500 to-green-600',
      borderValid: 'border-emerald-400',
      ringValid: 'ring-emerald-400/30',
      bgLight: 'bg-emerald-500/10',
      label: 'Premier chemin',
      hint: 'Que peut faire le joueur ?',
      placeholder: 'Accepter, Aider, Explorer...',
    },
    {
      index: 1 as const,
      emoji: '👎',
      gradient: 'from-rose-500 to-red-600',
      borderValid: 'border-rose-400',
      ringValid: 'ring-rose-400/30',
      bgLight: 'bg-rose-500/10',
      label: 'Deuxième chemin',
      hint: 'Ou bien que peut-il faire d\'autre ?',
      placeholder: 'Refuser, Ignorer, Fuir...',
    },
  ];

  // How many choices are valid
  const validCount = choices.filter(c => c.text && c.text.trim().length >= 5).length;

  return (
    <div className="space-y-6 px-2">

      {/* Guide character speech bubble */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-3xl">🎭</span>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-card border-2 border-border relative">
          {/* Speech bubble arrow */}
          <div className="absolute left-[-8px] top-5 w-4 h-4 bg-card border-l-2 border-b-2 border-border rotate-45" />
          <p className="text-base font-semibold text-foreground relative z-10">
            Ton personnage arrive à un carrefour !
          </p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">
            Écris deux chemins différents que le joueur pourra choisir.
          </p>
        </div>
      </div>

      {/* Mini progress: 0/2, 1/2, 2/2 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors duration-500",
              validCount === 0 ? "bg-muted-foreground/30" :
              validCount === 1 ? "bg-amber-400" : "bg-emerald-500"
            )}
            animate={{ width: `${(validCount / 2) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {validCount}/2
        </span>
      </div>

      {/* Preset templates */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">
          Besoin d'inspiration ? Choisis un modèle :
        </p>
        <div className="flex flex-wrap gap-2">
          {CHOICE_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(template)}
              className="px-3 py-2 rounded-xl bg-card border-2 border-border hover:border-primary/50
                         hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-1.5
                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                         min-h-[40px]"
            >
              <span>{template.emoji}</span>
              <span>{template.a} / {template.b}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two choice cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {cardConfigs.map((config) => {
          const choice = choices[config.index];
          const isValid = !!(choice.text && choice.text.trim().length >= 5);
          const charCount = choice.text?.length || 0;
          const advancedOpen = showAdvanced[config.index];

          return (
            <motion.div
              key={config.index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: config.index * 0.15 }}
              className={cn(
                "relative rounded-2xl border-3 transition-all duration-300 overflow-hidden",
                isValid
                  ? `${config.borderValid} ring-4 ${config.ringValid} shadow-xl`
                  : "border-border shadow-lg"
              )}
            >
              {/* Card header with emoji */}
              <div className={cn(
                "px-6 py-4 flex items-center gap-3",
                `bg-gradient-to-r ${config.gradient}`
              )}>
                <span className="text-3xl">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-white">{config.label}</h4>
                  <p className="text-xs text-white/80">{config.hint}</p>
                </div>

                {/* Star celebration */}
                <AnimatePresence>
                  {isValid && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <Star className="h-8 w-8 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-4">
                {/* Text input - large and friendly */}
                <div className="space-y-2">
                  <Input
                    value={choice.text || ''}
                    onChange={(e) => onUpdateChoice(config.index, { text: e.target.value })}
                    placeholder={config.placeholder}
                    maxLength={50}
                    className={cn(
                      "text-lg font-semibold h-12 rounded-xl",
                      isValid && `${config.borderValid}`
                    )}
                    aria-label={config.label}
                  />

                  {/* Visual progress bar instead of numeric counter */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          charCount < 5 ? "bg-orange-400" : "bg-emerald-500"
                        )}
                        animate={{ width: `${Math.min((charCount / 50) * 100, 100)}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    {charCount < 5 && (
                      <span className="text-xs text-orange-400 font-medium whitespace-nowrap">
                        encore {5 - charCount} lettre{5 - charCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {charCount >= 5 && (
                      <span className="text-xs text-emerald-500 font-medium">OK</span>
                    )}
                  </div>
                </div>

                {/* Advanced options (collapsed by default) */}
                <button
                  type="button"
                  onClick={() => {
                    const newState: [boolean, boolean] = [...showAdvanced];
                    newState[config.index] = !advancedOpen;
                    setShowAdvanced(newState);
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors
                             focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                >
                  {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span>Options avancées</span>
                </button>

                <AnimatePresence>
                  {advancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-3"
                    >
                      {/* Scene selector */}
                      <div className="space-y-1.5">
                        <label htmlFor={`scene-${config.index}`} className="text-sm font-medium text-muted-foreground">
                          Aller vers une autre scène
                        </label>
                        <Select
                          value={choice.nextSceneId || '__none__'}
                          onValueChange={(value) => {
                            const sceneId = value === '__none__' ? undefined : value;
                            onUpdateChoice(config.index, {
                              nextSceneId: sceneId,
                              nextDialogueId: sceneId ? undefined : choice.nextDialogueId
                            });
                          }}
                        >
                          <SelectTrigger id={`scene-${config.index}`} className="h-10 text-sm">
                            <SelectValue placeholder="-- Rester dans cette scène --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">-- Rester dans cette scène --</SelectItem>
                            {scenes.filter(s => s.id !== currentSceneId).map(scene => (
                              <SelectItem key={scene.id} value={scene.id}>
                                {scene.title || 'Sans titre'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dialogue selector */}
                      {currentScene && currentScene.dialogues.length > 0 && !choice.nextSceneId && (
                        <div className="space-y-1.5">
                          <label htmlFor={`dialogue-${config.index}`} className="text-sm font-medium text-muted-foreground">
                            Sauter à un dialogue
                          </label>
                          <Select
                            value={choice.nextDialogueId || '__none__'}
                            onValueChange={(value) => {
                              const dialogueId = value === '__none__' ? undefined : value;
                              onUpdateChoice(config.index, { nextDialogueId: dialogueId });
                            }}
                          >
                            <SelectTrigger id={`dialogue-${config.index}`} className="h-10 text-sm">
                              <SelectValue placeholder="-- Dialogue suivant --" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">-- Dialogue suivant --</SelectItem>
                              {currentScene.dialogues.map((dialogue, idx) => (
                                <SelectItem key={dialogue.id} value={dialogue.id}>
                                  #{idx + 1}: {dialogue.text?.substring(0, 30) || 'Vide'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live preview */}
      {(choices[0].text || choices[1].text) && (
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
        {!validation.isValid ? (
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
    </div>
  );
}

export default SimpleChoiceBuilder;
