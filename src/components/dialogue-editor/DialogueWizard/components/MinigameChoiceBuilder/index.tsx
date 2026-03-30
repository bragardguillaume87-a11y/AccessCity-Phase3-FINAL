import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Keyboard, X } from 'lucide-react';
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
import { useSceneDialogues } from '@/stores/selectors';
import { STAT_VARIABLES, GAME_STATS } from '@/i18n';
import type { MinigameConfig, MinigameType } from '@/types';

interface MinigameChoiceBuilderProps {
  config: MinigameConfig | undefined;
  onUpdate: (config: MinigameConfig) => void;
  currentSceneId: string;
}

const MINIGAME_TYPES: Array<{
  id: MinigameType;
  emoji: string;
  label: string;
  description: string;
}> = [
  {
    id: 'falc',
    emoji: '🗂️',
    label: 'FALC',
    description: 'Réordonner des cartes dans le bon ordre',
  },
  { id: 'qte', emoji: '⌨️', label: 'QTE', description: 'Appuyer sur des touches dans les temps' },
  { id: 'braille', emoji: '⠿', label: 'Braille', description: 'Identifier une lettre en Braille' },
];

const MINIGAME_TYPE_COLORS: Record<
  MinigameType,
  { border: string; bg: string; color: string; bgInactive: string }
> = {
  falc: {
    border: 'rgba(245,158,11,0.55)',
    bg: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    bgInactive: 'rgba(245,158,11,0.05)',
  },
  qte: {
    border: 'rgba(6,182,212,0.55)',
    bg: 'rgba(6,182,212,0.15)',
    color: '#06b6d4',
    bgInactive: 'rgba(6,182,212,0.05)',
  },
  braille: {
    border: 'rgba(167,139,250,0.55)',
    bg: 'rgba(167,139,250,0.15)',
    color: '#a78bfa',
    bgInactive: 'rgba(167,139,250,0.05)',
  },
};

const DEFAULT_CONFIG: MinigameConfig = {
  type: 'falc',
  difficulty: 3,
  timeout: undefined,
  items: ['Étape 1', 'Étape 2', 'Étape 3'],
  onSuccess: {},
  onFailure: {},
};

// Presets en secondes (stockés en ms en interne)
const TIME_PRESETS_S = [3, 5, 10, 15, 20, 30] as const;

// Couleurs progressives : urgence (rouge) → sérénité (bleu) — gradient temporel visuel
const TIME_CIRCLE_EMOJI: Record<number, string> = {
  3: '🔴',
  5: '🟠',
  10: '🟡',
  15: '🟢',
  20: '🔵',
  30: '🟣',
};

// Couleurs sémantiques par chip : design brief §10 — urgent (rouge/3s) → confort (bleu/30s)
const TIME_CHIP_SEMANTIC: Record<
  number,
  { color: string; bg: string; border: string; shadow: string }
> = {
  3: {
    color: '#ff7070',
    bg: 'rgba(255,112,112,0.18)',
    border: 'rgba(255,112,112,0.55)',
    shadow: '0 0 0 2px rgba(255,112,112,0.25)',
  },
  5: {
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.18)',
    border: 'rgba(251,146,60,0.55)',
    shadow: '0 0 0 2px rgba(251,146,60,0.25)',
  },
  10: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.18)',
    border: 'rgba(251,191,36,0.55)',
    shadow: '0 0 0 2px rgba(251,191,36,0.25)',
  },
  15: {
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.18)',
    border: 'rgba(74,222,128,0.55)',
    shadow: '0 0 0 2px rgba(74,222,128,0.25)',
  },
  20: {
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.18)',
    border: 'rgba(45,212,191,0.55)',
    shadow: '0 0 0 2px rgba(45,212,191,0.25)',
  },
  30: {
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.55)',
    shadow: '0 0 0 2px rgba(96,165,250,0.25)',
  },
};

const SENTINEL_AUTO = '__auto__';

const DIFFICULTY_INFO: Record<
  number,
  { label: string; color: string; bg: string; border: string }
> = {
  1: {
    label: 'Facile',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
  },
  2: {
    label: 'Modéré',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
  },
  3: {
    label: 'Risqué',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
  },
  4: {
    label: 'Difficile',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
  },
  5: {
    label: 'Extrême',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
  },
};

const KEY_DISPLAY_MAP: Record<string, string> = {
  ' ': '⎵ Espace',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Enter: '↵ Entrée',
  Escape: 'Échap',
  Backspace: '⌫',
  Tab: '⇥ Tab',
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
};
function displayKey(k: string) {
  return KEY_DISPLAY_MAP[k] ?? k.toUpperCase();
}

export function MinigameChoiceBuilder({
  config,
  onUpdate,
  currentSceneId,
}: MinigameChoiceBuilderProps) {
  const cfg = config ?? DEFAULT_CONFIG;
  const dialogues = useSceneDialogues(currentSceneId);
  const [isListening, setIsListening] = useState(false);
  const listeningRef = useRef(false);

  useEffect(() => {
    listeningRef.current = isListening;
    if (!isListening) return;

    const IGNORED = new Set(['Meta', 'Control', 'Shift', 'Alt', 'CapsLock', 'Dead']);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (IGNORED.has(e.key)) return;
      const newSeq = [...(cfg.keySequence ?? []), e.key];
      update({ keySequence: newSeq });
      setIsListening(false);
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const update = (partial: Partial<MinigameConfig>) => onUpdate({ ...cfg, ...partial });

  return (
    <div className="space-y-4 p-1">
      {/* Type de mini-jeu */}
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
                {/* Icon dans une boîte colorée — style mockup */}
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

      {/* ── PARAMÈTRES — glass card teal (design brief §4) ─────────── */}
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

        {/* Mode Lettre / Mot — uniquement pour Braille, dans le params-block */}
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

      {/* Items FALC */}
      {cfg.type === 'falc' && (
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
      )}

      {/* Touches QTE — enregistrement par pression */}
      {cfg.type === 'qte' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="section-bar-label">Séquence de touches</Label>
            {(cfg.keySequence ?? []).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsListening(false);
                  update({ keySequence: [] });
                }}
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                }}
              >
                Tout effacer
              </button>
            )}
          </div>

          {/* Pills des touches enregistrées */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }}>
            {(cfg.keySequence ?? []).map((key, idx) => (
              <span
                key={`seq-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(139,92,246,0.15)',
                  border: '1.5px solid rgba(139,92,246,0.45)',
                  color: 'var(--accent-purple)',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {displayKey(key)}
                <button
                  type="button"
                  onClick={() => {
                    const next = (cfg.keySequence ?? []).filter((_, i) => i !== idx);
                    update({ keySequence: next });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'inherit',
                    opacity: 0.6,
                    lineHeight: 1,
                  }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {(cfg.keySequence ?? []).length === 0 && !isListening && (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  alignSelf: 'center',
                }}
              >
                Aucune touche — clique sur "+ Enregistrer"
              </span>
            )}
          </div>

          {/* Bouton enregistrement */}
          <button
            type="button"
            onClick={() => setIsListening((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: `2px solid ${isListening ? '#f59e0b' : 'rgba(139,92,246,0.45)'}`,
              background: isListening ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.1)',
              color: isListening ? '#f59e0b' : 'var(--accent-purple)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              animation: isListening ? 'qtePulse 0.8s ease-in-out infinite alternate' : 'none',
            }}
          >
            <Keyboard size={14} />
            {isListening ? '⏺ Appuie sur une touche…' : '+ Enregistrer une touche'}
          </button>
          {isListening && (
            <style>{`@keyframes qtePulse{from{box-shadow:0 0 0 rgba(245,158,11,0)}to{box-shadow:0 0 12px rgba(245,158,11,0.6)}}`}</style>
          )}
        </div>
      )}

      {/* ── Braille — options spécifiques ─────────────────────────────── */}
      {cfg.type === 'braille' && (
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
                      color: cfg.brailleUseDice
                        ? 'var(--accent-purple)'
                        : 'var(--color-text-primary)',
                      margin: 0,
                    }}
                  >
                    🎲 Utiliser le résultat du dé
                  </p>
                  <p
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--color-text-muted)',
                      margin: '2px 0 0',
                    }}
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
          {(() => {
            const hasPenalty = !!cfg.failurePenalty?.variable;
            const penaltyVar = cfg.failurePenalty?.variable ?? GAME_STATS.MENTALE;
            const penaltyAmt = cfg.failurePenalty?.amount ?? 10;
            const varLabel =
              STAT_VARIABLES.find((v) => v.value === penaltyVar)?.label ?? penaltyVar;
            return (
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
                      failurePenalty: hasPenalty
                        ? undefined
                        : { variable: GAME_STATS.MENTALE, amount: 10 },
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
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: '0.65rem',
                          color: 'rgba(248,113,113,0.7)',
                        }}
                      >
                        → {varLabel} − {penaltyAmt} pts au total
                      </p>
                    )}
                    {!hasPenalty && (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: '0.65rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Aucune — clique pour activer
                      </p>
                    )}
                  </div>
                  {/* Toggle switch */}
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
                  <div
                    style={{
                      padding: '0 12px 12px',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    {/* Variable selector */}
                    <Select
                      value={penaltyVar}
                      onValueChange={(v) =>
                        update({ failurePenalty: { variable: v, amount: penaltyAmt } })
                      }
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

                    {/* Signe − */}
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

                    {/* Montant */}
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
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(248,113,113,0.65)',
                          fontWeight: 600,
                        }}
                      >
                        pts
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Branches succès / échec */}
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
    </div>
  );
}

export default MinigameChoiceBuilder;
