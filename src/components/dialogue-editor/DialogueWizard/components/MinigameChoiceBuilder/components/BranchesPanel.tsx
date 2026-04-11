import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MinigameConfig } from '@/types';
import { SENTINEL_AUTO } from '@/config/minigames';

interface BranchesPanelProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
  dialogues: Array<{ id: string; text?: string }>;
}

export function BranchesPanel({ cfg, update, dialogues }: BranchesPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['onSuccess', 'onFailure'] as const).map((branch) => {
        const isSuccess = branch === 'onSuccess';
        const branchData = cfg[branch] ?? {};
        return (
          <div
            key={branch}
            className="rounded-xl p-3 space-y-2 border-2"
            style={{
              borderColor: isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
              background: isSuccess ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            }}
          >
            <Label className="flex items-center gap-1 text-xs font-semibold">
              <span>{isSuccess ? '✅' : '❌'}</span>
              {isSuccess ? 'Si réussi' : 'Si raté'}
            </Label>
            <Select
              value={branchData.nextDialogueId || SENTINEL_AUTO}
              onValueChange={(value) =>
                update({
                  [branch]: { nextDialogueId: value === SENTINEL_AUTO ? undefined : value },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs bg-background/60">
                <SelectValue placeholder="— Suite auto —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENTINEL_AUTO}>— Suite auto —</SelectItem>
                {dialogues.map((d, idx) => (
                  <SelectItem key={d.id} value={d.id}>
                    💬 {d.text?.substring(0, 40) || `Dialogue ${idx + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
