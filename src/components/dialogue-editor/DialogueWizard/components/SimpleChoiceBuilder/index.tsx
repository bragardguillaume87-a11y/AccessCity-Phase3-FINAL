import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
import type { DialogueChoice, Scene } from '@/types';
import type { ResponseData } from '../../hooks/useDialogueForm';
import { TemplateSelector } from './TemplateSelector';
import { ChoiceCard, type CardConfig } from './ChoiceCard';
import { ChoicePreview } from './ChoicePreview';

interface SimpleChoiceBuilderProps {
  choices: [DialogueChoice, DialogueChoice];
  scenes: Scene[];
  currentSceneId: string;
  onUpdateChoice: (index: 0 | 1, updates: Partial<DialogueChoice>) => void;
  onValidChange: (isValid: boolean) => void;
  responses?: ResponseData[];
  defaultSpeaker?: string;
  onUpdateResponse?: (index: number, updates: Partial<ResponseData>) => void;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    index: 0,
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
    index: 1,
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

/** Compact response field rendered below each ChoiceCard once choices are valid */
function ResponseInlineCard({
  config,
  choice,
  response,
  defaultSpeaker,
  onUpdate,
}: {
  config: CardConfig;
  choice: DialogueChoice;
  response: ResponseData;
  defaultSpeaker?: string;
  onUpdate: (updates: Partial<ResponseData>) => void;
}) {
  const characters = useCharactersStore(state => state.characters);
  const speakerValue = response.speaker || defaultSpeaker || DEFAULTS.DIALOGUE_SPEAKER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/40 overflow-hidden"
    >
      <div className={cn('px-4 py-2 text-xs font-semibold text-white/90', `bg-gradient-to-r ${config.gradient}`)}>
        {config.emoji} Si le joueur choisit : « {choice.text || '...'} »
      </div>
      <div className="p-3 space-y-2">
        <Select
          value={speakerValue}
          onValueChange={(value) => onUpdate({ speaker: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Qui répond ?" />
          </SelectTrigger>
          <SelectContent>
            {characters.map((char) => (
              <SelectItem key={char.id} value={char.id} className="text-xs py-1.5">
                <div className="flex items-center gap-2">
                  {char.sprites?.neutral ? (
                    <img src={char.sprites.neutral} alt={char.name} className="w-5 h-5 rounded object-contain bg-muted" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                  )}
                  <span>{char.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={response.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Réponse après ce choix (optionnel)..."
          className="min-h-[60px] text-sm resize-none"
          maxLength={500}
        />
      </div>
    </motion.div>
  );
}

/**
 * SimpleChoiceBuilder - Kid-friendly binary choice creator
 *
 * Includes optional inline response fields (replaces StepResponses step).
 */
export function SimpleChoiceBuilder({
  choices,
  scenes,
  currentSceneId,
  onUpdateChoice,
  onValidChange,
  responses,
  defaultSpeaker,
  onUpdateResponse,
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

  // How many choices are valid
  const validCount = choices.filter(c => c.text && c.text.trim().length >= 5).length;

  return (
    <div className="space-y-5 px-2">

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
      <TemplateSelector
        onApply={(template) => {
          onUpdateChoice(0, { text: template.a });
          onUpdateChoice(1, { text: template.b });
        }}
      />

      {/* Two choice cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {CARD_CONFIGS.map((config) => (
          <ChoiceCard
            key={config.index}
            config={config}
            choice={choices[config.index]}
            scenes={scenes}
            currentScene={currentScene}
            currentSceneId={currentSceneId}
            advancedOpen={showAdvanced[config.index]}
            onToggleAdvanced={() => {
              const newState: [boolean, boolean] = [...showAdvanced];
              newState[config.index] = !showAdvanced[config.index];
              setShowAdvanced(newState);
            }}
            onUpdateChoice={onUpdateChoice}
          />
        ))}
      </div>

      {/* Live preview + validation feedback */}
      <ChoicePreview choices={choices} isValid={validation.isValid} />

      {/* Inline response fields — revealed only when both choices are valid */}
      {responses && onUpdateResponse && validation.isValid && (
        <div className="space-y-3 pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Réponses après chaque choix (optionnel)
          </p>
          {CARD_CONFIGS.map((config) => (
            <ResponseInlineCard
              key={config.index}
              config={config}
              choice={choices[config.index]}
              response={responses[config.index] ?? { speaker: '', text: '' }}
              defaultSpeaker={defaultSpeaker}
              onUpdate={(updates) => onUpdateResponse(config.index, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SimpleChoiceBuilder;
