import { Label } from '@/components/ui/label';
import type { MinigameConfig } from '@/types';
import { MINIGAME_TYPES, MINIGAME_TYPE_COLORS } from '@/config/minigames';

interface TypePickerProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
}

export function TypePicker({ cfg, update }: TypePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Type de mini-jeu
      </Label>
      <div role="radiogroup" aria-label="Type de mini-jeu" className="flex gap-2">
        {MINIGAME_TYPES.map((t) => {
          const isActive = cfg.type === t.id;
          const tc = MINIGAME_TYPE_COLORS[t.id];
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              title={t.description}
              onClick={() => update({ type: t.id })}
              style={{
                flex: 1,
                padding: '14px 6px 12px',
                borderRadius: 12,
                border: `2px solid ${isActive ? tc.border : 'var(--color-border-base)'}`,
                background: isActive ? tc.bg : tc.bgInactive,
                color: isActive ? tc.color : 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isActive ? `${tc.color}22` : `${tc.color}0d`,
                  border: `1.5px solid ${isActive ? tc.border : `${tc.color}28`}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  transition: 'all 0.15s',
                }}
              >
                {t.emoji}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: isActive ? tc.color : 'var(--color-text-primary)',
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  color: isActive ? tc.color : 'var(--color-text-muted)',
                  opacity: 0.9,
                  padding: '0 2px',
                }}
              >
                {t.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
