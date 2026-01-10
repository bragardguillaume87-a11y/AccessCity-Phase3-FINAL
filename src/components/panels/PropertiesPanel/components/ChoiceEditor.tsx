import * as React from 'react';
import type { DialogueChoice, Effect } from '@/types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Extended DialogueChoice with diceRoll support (game mechanic)
interface DiceRollOutcome {
  message: string;
  moral: number;
  illustration: string;
}

interface DiceRoll {
  enabled: boolean;
  difficulty: number;
  successOutcome: DiceRollOutcome;
  failureOutcome: DiceRollOutcome;
}

interface DialogueChoiceWithDiceRoll extends Omit<DialogueChoice, 'nextSceneId'> {
  nextScene?: string; // Legacy support - maps to nextSceneId
  diceRoll?: DiceRoll;
}

export interface ChoiceEditorProps {
  choice: DialogueChoiceWithDiceRoll;
  choiceIndex: number;
  onUpdate: (choiceIndex: number, updatedChoice: DialogueChoiceWithDiceRoll) => void;
  onDelete: (choiceIndex: number) => void;
}

/**
 * ChoiceEditor - Edit a single dialogue choice
 *
 * Displays and allows editing of:
 * - Choice text
 * - Next scene ID
 * - Dice roll toggle and configuration
 * - Success/failure outcomes (message, moral impact, illustration)
 * - Legacy effects (readonly)
 */
export function ChoiceEditor({ choice, choiceIndex, onUpdate, onDelete }: ChoiceEditorProps) {
  const updateChoice = (updates: Partial<DialogueChoiceWithDiceRoll>) => {
    onUpdate(choiceIndex, { ...choice, ...updates });
  };

  const updateDiceRoll = (diceRollUpdates: Partial<DiceRoll>) => {
    const currentDiceRoll: DiceRoll = choice.diceRoll || {
      enabled: false,
      difficulty: 12,
      successOutcome: { message: '', moral: 0, illustration: '' },
      failureOutcome: { message: '', moral: 0, illustration: '' }
    };
    updateChoice({
      diceRoll: { ...currentDiceRoll, ...diceRollUpdates }
    });
  };

  const updateOutcome = (outcomeType: 'successOutcome' | 'failureOutcome', updates: Partial<DiceRollOutcome>) => {
    const currentDiceRoll: DiceRoll = choice.diceRoll || {
      enabled: true,
      difficulty: 12,
      successOutcome: { message: '', moral: 0, illustration: '' },
      failureOutcome: { message: '', moral: 0, illustration: '' }
    };
    updateChoice({
      diceRoll: {
        ...currentDiceRoll,
        [outcomeType]: { ...currentDiceRoll[outcomeType], ...updates }
      }
    });
  };

  return (
    <div className="p-4 bg-slate-900 border-2 border-slate-700 rounded-lg space-y-3">
      {/* Choice header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-blue-400">Choice {choiceIndex + 1}</div>
        <Button
          variant="danger-ghost"
          size="sm"
          onClick={() => {
            if (confirm(`Delete choice ${choiceIndex + 1}?`)) {
              onDelete(choiceIndex);
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>

      {/* Choice text */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Choice Text
        </label>
        <input
          type="text"
          value={choice.text || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateChoice({ text: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Accept the mission"
        />
      </div>

      {/* Next scene */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Next Scene ID
        </label>
        <input
          type="text"
          value={choice.nextScene || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateChoice({ nextScene: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., scene-2 (optional)"
        />
      </div>

      {/* Dice roll toggle */}
      <div className="pt-3 border-t border-slate-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={choice.diceRoll?.enabled || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDiceRoll({ enabled: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-slate-600 rounded focus:ring-2 focus:ring-purple-500 bg-slate-800"
          />
          <span className="text-xs font-semibold text-purple-400">
            🎲 Enable dice roll
          </span>
        </label>
      </div>

      {/* Dice configuration */}
      {choice.diceRoll?.enabled && (
        <div className="p-3 border border-purple-500/30 rounded-lg bg-purple-900/20 space-y-3">
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1.5">
              Difficulty (1-20)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={choice.diceRoll?.difficulty || 12}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDiceRoll({ difficulty: parseInt(e.target.value) || 12 })}
              className="w-full px-3 py-2 bg-slate-800 border border-purple-500/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-purple-400 mt-1">Player must roll this score or higher (d20)</p>
          </div>

          {/* Success outcome */}
          <div className="p-3 border border-green-500/30 rounded-lg bg-green-900/20">
            <h4 className="text-xs font-bold text-green-300 mb-2">✅ On Success</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-green-400 mb-1">Message</label>
                <input
                  type="text"
                  value={choice.diceRoll?.successOutcome?.message || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('successOutcome', { message: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="e.g., Found a spot!"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-400 mb-1">Moral Impact</label>
                <input
                  type="number"
                  value={choice.diceRoll?.successOutcome?.moral || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('successOutcome', { moral: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-400 mb-1">Illustration</label>
                <input
                  type="text"
                  value={choice.diceRoll?.successOutcome?.illustration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('successOutcome', { illustration: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-green-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="parking-success.png"
                />
              </div>
            </div>
          </div>

          {/* Failure outcome */}
          <div className="p-3 border border-red-500/30 rounded-lg bg-red-900/20">
            <h4 className="text-xs font-bold text-red-300 mb-2">❌ On Failure</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-red-400 mb-1">Message</label>
                <input
                  type="text"
                  value={choice.diceRoll?.failureOutcome?.message || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('failureOutcome', { message: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="e.g., No spots..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-400 mb-1">Moral Impact</label>
                <input
                  type="number"
                  value={choice.diceRoll?.failureOutcome?.moral || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('failureOutcome', { moral: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="-3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-400 mb-1">Illustration</label>
                <input
                  type="text"
                  value={choice.diceRoll?.failureOutcome?.illustration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOutcome('failureOutcome', { illustration: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-red-500/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="parking-fail.png"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Effects (legacy support - read-only for now) */}
      {choice.effects && choice.effects.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <div className="text-xs font-semibold text-amber-400 mb-2">Effects (legacy):</div>
          {choice.effects.map((effect: Effect, eIdx: number) => (
            <div key={eIdx} className="text-xs text-amber-500 ml-2">
              {effect.variable}: {effect.operation} {effect.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
