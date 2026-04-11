import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { MinigameConfig } from '@/types';

interface FalcSectionProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
}

export function FalcSection({ cfg, update }: FalcSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="section-bar-label">Éléments à ordonner</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() =>
            update({ items: [...(cfg.items ?? []), `Étape ${(cfg.items?.length ?? 0) + 1}`] })
          }
        >
          <Plus className="w-3 h-3" /> Ajouter
        </Button>
      </div>
      <div className="space-y-1.5">
        {(cfg.items ?? []).map((item, idx) => (
          <div key={`item-${idx}`} className="flex items-center gap-2">
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                width: '1rem',
                textAlign: 'center',
              }}
            >
              {idx + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const items = [...(cfg.items ?? [])];
                items[idx] = e.target.value;
                update({ items });
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                height: '1.75rem',
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border-base)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-7 w-7 p-0"
              onClick={() => {
                const items = (cfg.items ?? []).filter((_, i) => i !== idx);
                update({ items });
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
