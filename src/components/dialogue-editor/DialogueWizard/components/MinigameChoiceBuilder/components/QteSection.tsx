import { useState, useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import type { MinigameConfig } from '@/types';
import { displayKey } from '@/config/minigames';

interface QteSectionProps {
  cfg: MinigameConfig;
  update: (partial: Partial<MinigameConfig>) => void;
}

export function QteSection({ cfg, update }: QteSectionProps) {
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

  return (
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
  );
}
