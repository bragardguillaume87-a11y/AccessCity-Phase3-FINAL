import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { DiceCheckBranch } from '@/types';

interface OutcomeEditorProps {
  type: 'success' | 'failure';
  branch: DiceCheckBranch;
  onChange: (branch: DiceCheckBranch) => void;
}

export function OutcomeEditor({ type, branch, onChange }: OutcomeEditorProps) {
  const isSuccess = type === 'success';

  const config = isSuccess
    ? {
        emoji: '✅',
        label: 'En cas de succès',
        placeholder: 'Que se passe-t-il si le joueur réussit le test ?',
        border: 'border-green-500/30',
        bg: 'bg-green-500/5',
        ring: 'focus-within:ring-green-500/20',
      }
    : {
        emoji: '❌',
        label: 'En cas d\'échec',
        placeholder: 'Que se passe-t-il si le joueur échoue ?',
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        ring: 'focus-within:ring-red-500/20',
      };

  return (
    <div className={cn("rounded-xl p-4 border-2", config.border, config.bg, config.ring)}>
      <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
        <span className="text-lg">{config.emoji}</span>
        {config.label}
      </Label>
      <Textarea
        value={branch.nextDialogueId || ''}
        onChange={(e) => onChange({ ...branch, nextDialogueId: e.target.value })}
        placeholder={config.placeholder}
        className="min-h-[60px] resize-none bg-transparent border-0 p-0 focus-visible:ring-0 text-sm"
        rows={2}
      />
    </div>
  );
}

export default OutcomeEditor;
