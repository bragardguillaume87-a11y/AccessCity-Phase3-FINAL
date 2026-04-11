import { Slider } from '@/components/ui/slider';
import type { MinigameConfig } from '@/types';
import {
  DIFFICULTY_INFO,
  TIME_PRESETS_S,
  TIME_CHIP_SEMANTIC,
  TIME_CIRCLE_EMOJI,
} from '@/config/minigames';

interface ParamsCardProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
}

export function ParamsCard({ cfg, update }: ParamsCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: 'rgba(94,234,212,0.07)',
        border: '1.5px solid rgba(94,234,212,0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 15,
      }}
    >
      {/* Difficulté */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Difficulté
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: DIFFICULTY_INFO[cfg.difficulty]?.color,
              }}
            >
              {cfg.difficulty} / 5
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 7,
                fontWeight: 800,
                background: DIFFICULTY_INFO[cfg.difficulty]?.bg,
                border: `1.5px solid ${DIFFICULTY_INFO[cfg.difficulty]?.border}`,
                color: DIFFICULTY_INFO[cfg.difficulty]?.color,
              }}
            >
              {DIFFICULTY_INFO[cfg.difficulty]?.label}
            </span>
          </span>
        </div>
        <Slider
          value={[cfg.difficulty]}
          onValueChange={([val]) => update({ difficulty: val })}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
      </div>

      {/* Minuterie */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}
        >
          Minuterie
        </div>
        <div
          role="radiogroup"
          aria-label="Mode minuterie"
          style={{ display: 'flex', gap: 7, marginBottom: 8 }}
        >
          {(
            [
              { label: '∞ Sans limite', value: false },
              { label: '⏱ Limitée', value: true },
            ] as const
          ).map((opt) => {
            const active = !!cfg.timeout === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ timeout: opt.value ? 10000 : undefined })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1.5px solid ${active ? 'rgba(45,212,191,0.55)' : 'rgba(255,255,255,0.16)'}`,
                  background: active ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.07)',
                  color: active ? '#ccfbf1' : 'rgba(255,255,255,0.80)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {!!cfg.timeout && (
          <>
            <div
              role="radiogroup"
              aria-label="Durée de minuterie"
              style={{ display: 'flex', gap: 5 }}
            >
              {TIME_PRESETS_S.map((s) => {
                const ms = s * 1000;
                const active = cfg.timeout === ms;
                const sc = TIME_CHIP_SEMANTIC[s];
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${s} secondes`}
                    onClick={() => update({ timeout: ms })}
                    style={{
                      flex: 1,
                      minWidth: 36,
                      background: active ? sc.bg : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${active ? sc.border : 'rgba(255,255,255,0.14)'}`,
                      borderRadius: 9,
                      padding: '8px 4px',
                      fontSize: 11,
                      fontWeight: 800,
                      color: active ? sc.color : 'rgba(255,255,255,0.70)',
                      cursor: 'pointer',
                      textAlign: 'center' as const,
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.2s',
                      boxShadow: active ? sc.shadow : 'none',
                    }}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1 }}>{TIME_CIRCLE_EMOJI[s]}</span>
                    <span style={{ fontSize: 11, fontWeight: 800 }}>{s}s</span>
                  </button>
                );
              })}
            </div>
            {cfg.type === 'qte' && (
              <p
                style={{
                  marginTop: 6,
                  fontSize: '0.65rem',
                  color: 'rgba(245,158,11,0.55)',
                  textAlign: 'center',
                }}
              >
                ⚠️ Pour QTE : durée totale divisée par le nombre de touches
              </p>
            )}
          </>
        )}
      </div>

      {/* Mode Lettre / Mot — Braille uniquement */}
      {cfg.type === 'braille' && (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
            }}
          >
            Mode
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {(
              [
                { id: 'letter', emoji: '🔤', label: 'Lettre' },
                { id: 'word', emoji: '📝', label: 'Mot' },
              ] as const
            ).map((m) => {
              const active = (cfg.brailleMode ?? 'letter') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update({ brailleMode: m.id })}
                  style={{
                    background: active ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${active ? 'rgba(45,212,191,0.55)' : 'rgba(255,255,255,0.14)'}`,
                    borderRadius: 11,
                    padding: 11,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    color: active ? '#ccfbf1' : 'rgba(255,255,255,0.80)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
