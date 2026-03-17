import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DialoguePicker } from '@/components/ui/DialoguePicker';
import { cn } from '@/lib/utils';
import { useCharactersStore } from '@/stores';
import { DEFAULTS } from '@/config/constants';
import { SELECT_NONE_VALUE } from '@/utils/constants';
import type { DialogueChoice, Scene } from '@/types';
import type { ResponseData } from '../../DialogueWizard/hooks/useDialogueForm';

// ── Visual config per slot (A / B) ───────────────────────────────────────────
const SLOT_CONFIG = [
  {
    emoji: '👍',
    label: 'Premier chemin',
    placeholder: 'Accepter, Aider, Explorer…',
    validBorder: 'border-emerald-500/40 focus:border-emerald-500',
    barColor:    'bg-emerald-500',
    cardBorder:  'border-emerald-500/30',
  },
  {
    emoji: '👎',
    label: 'Deuxième chemin',
    placeholder: 'Refuser, Ignorer, Fuir…',
    validBorder: 'border-rose-500/40 focus:border-rose-500',
    barColor:    'bg-rose-500',
    cardBorder:  'border-rose-500/30',
  },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface BinaryChoiceFieldProps {
  choiceIndex: 0 | 1;
  choice: DialogueChoice;
  response: ResponseData | undefined;
  defaultSpeaker: string;
  scenes: Scene[];
  currentScene: Scene | undefined;
  currentSceneId: string;
  onUpdateChoice: (updates: Partial<DialogueChoice>) => void;
  onUpdateResponse: (updates: Partial<ResponseData>) => void;
}

/**
 * BinaryChoiceField — Lean binary choice editor for the Composer.
 *
 * Design decisions vs legacy ChoiceCard:
 * - No heavy gradient header block (the tab IS the header)
 * - Dialogue picker → compact icon [↗] opening a searchable combobox
 * - Scene selector → thin inline row (only when other scenes exist)
 * - Response section → appears progressively once choice text is valid (≥5 chars)
 */
export function BinaryChoiceField({
  choiceIndex,
  choice,
  response,
  defaultSpeaker,
  scenes,
  currentScene,
  currentSceneId,
  onUpdateChoice,
  onUpdateResponse,
}: BinaryChoiceFieldProps) {
  const characters  = useCharactersStore(state => state.characters);
  const cfg         = SLOT_CONFIG[choiceIndex];
  const charCount   = choice.text?.length ?? 0;
  const isValid     = charCount >= 5;
  const otherScenes = useMemo(() => scenes.filter(s => s.id !== currentSceneId), [scenes, currentSceneId]);
  const speakerVal  = response?.speaker || defaultSpeaker || DEFAULTS.DIALOGUE_SPEAKER;

  return (
    <div className="space-y-3">

      {/* ── Choice text row ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">

        {/* Slot header — minimal, no heavy gradient */}
        <div className="flex items-center gap-1.5">
          <span className="text-base">{cfg.emoji}</span>
          <span className="text-xs font-semibold text-muted-foreground">{cfg.label}</span>
          <AnimatePresence>
            {isValid && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="ml-auto text-xs text-green-500 font-bold"
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Input + dialogue picker icon (inline, no extra row) */}
        <div className="flex gap-1.5">
          <Input
            value={choice.text || ''}
            onChange={(e) => onUpdateChoice({ text: e.target.value })}
            placeholder={cfg.placeholder}
            maxLength={50}
            className={cn(
              'h-9 text-sm flex-1 transition-colors',
              isValid && cfg.validBorder,
            )}
            aria-label={cfg.label}
          />
          {/* Dialogue picker — only shown when there are dialogues to link to */}
          {currentScene && currentScene.dialogues.length > 0 && !choice.nextSceneId && (
            <DialoguePicker
              dialogues={currentScene.dialogues}
              value={choice.nextDialogueId}
              onChange={(id) => onUpdateChoice({ nextDialogueId: id })}
            />
          )}
        </div>

        {/* Compact progress bar (1px height, no text) */}
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', isValid ? cfg.barColor : 'bg-amber-400')}
            animate={{ width: `${Math.min((charCount / 50) * 100, 100)}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        {/* Scene jump — thin inline selector, only when other scenes exist */}
        {otherScenes.length > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">→ Scène :</span>
            <Select
              value={choice.nextSceneId || SELECT_NONE_VALUE}
              onValueChange={(v) => {
                const sceneId = v === SELECT_NONE_VALUE ? undefined : v;
                onUpdateChoice({
                  nextSceneId: sceneId,
                  nextDialogueId: sceneId ? undefined : choice.nextDialogueId,
                });
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-1 border-none bg-muted/50 focus:ring-0">
                <SelectValue placeholder="Cette scène" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_NONE_VALUE} className="text-xs">Cette scène</SelectItem>
                {otherScenes.map(scene => (
                  <SelectItem key={scene.id} value={scene.id} className="text-xs">
                    {scene.title || 'Sans titre'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Response section — progressive reveal ───────────────────────── */}
      <AnimatePresence>
        {isValid && response !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn('rounded-xl border p-3 space-y-2 bg-card/40 mt-1', cfg.cardBorder)}>

              {/* Inline header — no gradient block */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs">↩</span>
                <span className="text-xs font-semibold text-muted-foreground">Réponse</span>
                <span className="text-[11px] text-muted-foreground/60">(optionnel)</span>
              </div>

              {/* Speaker */}
              <Select value={speakerVal} onValueChange={(v) => onUpdateResponse({ speaker: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Qui répond ?" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id} className="text-xs py-1.5">
                      <div className="flex items-center gap-2">
                        {char.sprites?.neutral
                          ? <img src={char.sprites.neutral} alt={char.name} className="w-5 h-5 rounded object-contain bg-muted" />
                          : <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"><span className="text-[10px]">👤</span></div>
                        }
                        <span>{char.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Response text */}
              <Textarea
                value={response.text}
                onChange={(e) => onUpdateResponse({ text: e.target.value })}
                placeholder={`Réponse si « ${choice.text?.trim() || '…'} »…`}
                className="min-h-[56px] text-xs resize-none"
                maxLength={500}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BinaryChoiceField;
