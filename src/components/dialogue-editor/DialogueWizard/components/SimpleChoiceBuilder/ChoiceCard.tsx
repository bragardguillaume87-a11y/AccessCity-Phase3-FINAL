import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DialogueChoice, Scene } from '@/types';
import { SELECT_NONE_VALUE } from '@/utils/constants';

export interface CardConfig {
  index: 0 | 1;
  emoji: string;
  gradient: string;
  borderValid: string;
  ringValid: string;
  bgLight: string;
  label: string;
  hint: string;
  placeholder: string;
}

interface ChoiceCardProps {
  config: CardConfig;
  choice: DialogueChoice;
  scenes: Scene[];
  currentScene: Scene | undefined;
  currentSceneId: string;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  onUpdateChoice: (index: 0 | 1, updates: Partial<DialogueChoice>) => void;
}

/**
 * ChoiceCard - A single choice card with input, progress bar, and advanced options
 */
export function ChoiceCard({
  config,
  choice,
  scenes,
  currentScene,
  currentSceneId,
  advancedOpen,
  onToggleAdvanced,
  onUpdateChoice,
}: ChoiceCardProps) {
  const isValid = !!(choice.text && choice.text.trim().length >= 5);
  const charCount = choice.text?.length || 0;

  return (
    <motion.div
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
          onClick={onToggleAdvanced}
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
                  value={choice.nextSceneId || SELECT_NONE_VALUE}
                  onValueChange={(value) => {
                    const sceneId = value === SELECT_NONE_VALUE ? undefined : value;
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
                    <SelectItem value={SELECT_NONE_VALUE}>-- Rester dans cette scène --</SelectItem>
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
                    value={choice.nextDialogueId || SELECT_NONE_VALUE}
                    onValueChange={(value) => {
                      const dialogueId = value === SELECT_NONE_VALUE ? undefined : value;
                      onUpdateChoice(config.index, { nextDialogueId: dialogueId });
                    }}
                  >
                    <SelectTrigger id={`dialogue-${config.index}`} className="h-10 text-sm">
                      <SelectValue placeholder="-- Dialogue suivant --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SELECT_NONE_VALUE}>-- Dialogue suivant --</SelectItem>
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
}
