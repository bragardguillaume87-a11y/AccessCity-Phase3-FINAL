import * as React from 'react';
import { useState } from 'react';
import type { Dialogue, Character } from '@/types';
import { Slider } from '@/components/ui/slider';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MessageSquare, Palette, Eye } from 'lucide-react';
import { SectionCard, SectionHeader } from './FormSectionHelpers';

interface TextTabProps {
  dialogue: Dialogue;
  characters: Character[];
  onUpdate: (updates: Partial<Dialogue>) => void;
}

export function TextTab({ dialogue, characters, onUpdate }: TextTabProps) {
  const [apparenceOpen, setApparenceOpen] = useState(false);
  const [aperçuOpen,    setAperçuOpen]    = useState(false);

  const boxStyle = dialogue.boxStyle ?? {};
  const handleUpdateBoxStyle = (patch: Partial<NonNullable<typeof dialogue.boxStyle>>) => {
    onUpdate({ boxStyle: { ...dialogue.boxStyle, ...patch } });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">

      {/* Textarea principale */}
      <SectionCard>
        <SectionHeader
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Texte"
          colorClass="text-violet-400"
        />
        <div className="px-3 py-2.5">
          <textarea
            value={dialogue.text || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ text: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            placeholder="Texte"
          />
        </div>
      </SectionCard>

      {/* Apparence — accordéon fermé par défaut */}
      <SectionCard>
        <SectionHeader
          icon={<Palette className="h-3.5 w-3.5" />}
          label="Apparence"
          colorClass="text-fuchsia-400"
          isCollapsible
          isOpen={apparenceOpen}
          onToggle={() => setApparenceOpen(v => !v)}
        />
        <InlineAccordion isOpen={apparenceOpen}>
          <div className="px-3 py-3 space-y-4">

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taille du texte</span>
                <span className="text-xs font-semibold text-fuchsia-400">{boxStyle.fontSize ?? 15} px</span>
              </div>
              <Slider
                value={[boxStyle.fontSize ?? 15]}
                onValueChange={([v]) => handleUpdateBoxStyle({ fontSize: v })}
                min={10} max={24} step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vitesse de frappe</span>
                <span className="text-xs font-semibold text-fuchsia-400">
                  {(boxStyle.typewriterSpeed ?? 40) <= 20 ? 'Rapide' : (boxStyle.typewriterSpeed ?? 40) <= 55 ? 'Normal' : 'Lent'}
                </span>
              </div>
              <Slider
                value={[boxStyle.typewriterSpeed ?? 40]}
                onValueChange={([v]) => handleUpdateBoxStyle({ typewriterSpeed: v })}
                min={10} max={100} step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Position</span>
              <div className="grid grid-cols-3 gap-1">
                {(['top', 'center', 'bottom'] as const).map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleUpdateBoxStyle({ position: pos })}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      (boxStyle.position ?? 'bottom') === pos
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {pos === 'top' ? 'Haut' : pos === 'center' ? 'Centre' : 'Bas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Opacité du fond</span>
                <span className="text-xs font-semibold text-fuchsia-400">
                  {Math.round((boxStyle.boxOpacity ?? 0.75) * 100)} %
                </span>
              </div>
              <Slider
                value={[(boxStyle.boxOpacity ?? 0.75) * 100]}
                onValueChange={([v]) => handleUpdateBoxStyle({ boxOpacity: v / 100 })}
                min={0} max={100} step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Bordure</span>
              <div className="grid grid-cols-3 gap-1">
                {(['none', 'subtle', 'prominent'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleUpdateBoxStyle({ borderStyle: s })}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${
                      (boxStyle.borderStyle ?? 'subtle') === s
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s === 'none' ? 'Aucune' : s === 'subtle' ? 'Subtile' : 'Forte'}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </InlineAccordion>
      </SectionCard>

      {/* Aperçu — accordéon fermé par défaut */}
      <SectionCard>
        <SectionHeader
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Aperçu"
          colorClass="text-sky-400"
          isCollapsible
          isOpen={aperçuOpen}
          onToggle={() => setAperçuOpen(v => !v)}
        />
        <InlineAccordion isOpen={aperçuOpen}>
          <div className="px-3 py-3 space-y-2">
            <div
              className="rounded-lg p-3"
              style={{
                background: `rgba(0,0,0,${boxStyle.boxOpacity ?? 0.75})`,
                border: (boxStyle.borderStyle ?? 'subtle') === 'none'
                  ? '1px solid transparent'
                  : (boxStyle.borderStyle ?? 'subtle') === 'prominent'
                    ? '2px solid var(--color-primary)'
                    : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-primary)' }}>
                {characters.find(c => c.id === dialogue.speaker)?.name || '—'}
              </p>
              <p style={{ fontSize: `${boxStyle.fontSize ?? 15}px`, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55 }}>
                {dialogue.text || '(aucun texte)'}
              </p>
            </div>
            <div className="flex justify-center">
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                {(boxStyle.position ?? 'bottom') === 'top' ? '▲ Haut' : (boxStyle.position ?? 'bottom') === 'center' ? '● Centre' : '▼ Bas'}
              </span>
            </div>
          </div>
        </InlineAccordion>
      </SectionCard>

    </div>
  );
}
