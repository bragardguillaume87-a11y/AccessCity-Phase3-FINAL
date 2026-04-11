import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAT_VARIABLES, GAME_STATS } from '@/i18n';
import type { MinigameConfig } from '@/types';

interface BrailleSectionProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
}

export function BrailleSection({ cfg, update }: BrailleSectionProps) {
  const hasPenalty = !!cfg.failurePenalty?.variable;
  const penaltyVar = cfg.failurePenalty?.variable ?? GAME_STATS.MENTALE;
  const penaltyAmt = cfg.failurePenalty?.amount ?? 10;
  const varLabel = STAT_VARIABLES.find((v) => v.value === penaltyVar)?.label ?? penaltyVar;

  return (
    <div className="space-y-3">
      {/* Options mode Mot */}
      {cfg.brailleMode === 'word' && (
        <>
          {/* Mots personnalisés */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="section-bar-label">Mots à deviner</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => update({ brailleWords: [...(cfg.brailleWords ?? []), ''] })}
              >
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Laisse vide pour utiliser les mots intégrés selon la difficulté.
            </p>
            <div className="space-y-1.5">
              {(cfg.brailleWords ?? []).map((word, idx) => (
                <div key={`bword-${idx}`} className="flex items-center gap-2">
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
                    value={word}
                    placeholder="ex: CHAT"
                    onChange={(e) => {
                      const words = [...(cfg.brailleWords ?? [])];
                      words[idx] = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                      update({ brailleWords: words });
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
                      fontFamily: 'monospace',
                      letterSpacing: '0.08em',
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    onClick={() => {
                      const words = (cfg.brailleWords ?? []).filter((_, i) => i !== idx);
                      update({ brailleWords: words });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Vies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="section-bar-label">Vies (pendu)</Label>
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#f87171',
                  letterSpacing: '0.05em',
                }}
              >
                {'❤️'.repeat(cfg.brailleLives ?? 6)}
              </span>
            </div>
            <Slider
              value={[cfg.brailleLives ?? 6]}
              onValueChange={([val]) => update({ brailleLives: val })}
              min={3}
              max={8}
              step={1}
              className="w-full"
            />
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {cfg.brailleLives ?? 6} erreur{(cfg.brailleLives ?? 6) > 1 ? 's' : ''} tolérée
              {(cfg.brailleLives ?? 6) > 1 ? 's' : ''} par lettre
            </p>
          </div>

          {/* Utiliser le dé */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `2px solid ${cfg.brailleUseDice ? 'rgba(139,92,246,0.5)' : 'var(--color-border-base)'}`,
              background: cfg.brailleUseDice ? 'rgba(139,92,246,0.08)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => update({ brailleUseDice: !cfg.brailleUseDice })}
          >
            <div>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: cfg.brailleUseDice ? 'var(--accent-purple)' : 'var(--color-text-primary)',
                  margin: 0,
                }}
              >
                🎲 Utiliser le résultat du dé
              </p>
              <p
                style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}
              >
                Le jet de dé précédent détermine la longueur du mot
              </p>
            </div>
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: cfg.brailleUseDice
                  ? 'var(--accent-purple)'
                  : 'var(--color-border-base)',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: cfg.brailleUseDice ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Pénalité en cas d'échec */}
      <div
        style={{
          borderRadius: 12,
          border: `2px solid ${hasPenalty ? 'rgba(239,68,68,0.45)' : 'var(--color-border-base)'}`,
          background: hasPenalty ? 'rgba(239,68,68,0.06)' : 'transparent',
          overflow: 'hidden',
          transition: 'all 0.2s',
        }}
      >
        {/* En-tête — toggle on/off */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            cursor: 'pointer',
          }}
          onClick={() =>
            update({
              failurePenalty: hasPenalty ? undefined : { variable: GAME_STATS.MENTALE, amount: 10 },
            })
          }
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: hasPenalty ? '#f87171' : 'var(--color-text-primary)',
              }}
            >
              💔 Pénalité en cas d'échec
            </p>
            {hasPenalty && (
              <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: 'rgba(248,113,113,0.7)' }}>
                → {varLabel} − {penaltyAmt} pts au total
              </p>
            )}
            {!hasPenalty && (
              <p
                style={{ margin: '2px 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}
              >
                Aucune — clique pour activer
              </p>
            )}
          </div>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: hasPenalty ? '#ef4444' : 'var(--color-border-base)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: hasPenalty ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Corps — visible uniquement si activé */}
        {hasPenalty && (
          <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              value={penaltyVar}
              onValueChange={(v) => update({ failurePenalty: { variable: v, amount: penaltyAmt } })}
            >
              <SelectTrigger className="h-8 text-xs bg-background/60" style={{ flex: 1 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAT_VARIABLES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#f87171',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              −
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                border: '2px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.08)',
              }}
            >
              <input
                type="number"
                min={1}
                max={100}
                value={penaltyAmt}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const amount = Math.max(1, parseInt(e.target.value) || 1);
                  update({ failurePenalty: { variable: penaltyVar, amount } });
                }}
                style={{
                  width: '2.8rem',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: '#f87171',
                  textAlign: 'center',
                  padding: 0,
                }}
              />
              <span
                style={{ fontSize: '0.65rem', color: 'rgba(248,113,113,0.65)', fontWeight: 600 }}
              >
                pts
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
