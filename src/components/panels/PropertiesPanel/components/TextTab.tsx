import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Dialogue, Character } from '@/types';
import { Slider } from '@/components/ui/slider';
import { InlineAccordion } from '@/components/ui/InlineAccordion';
import { MessageSquare, Palette, Eye, Bold } from 'lucide-react';
import { SectionCard, SectionHeader } from './FormSectionHelpers';

// ── Palette 8 couleurs (Miyamoto §1.2 — symboles universels) ─────────────────
const RICH_COLORS: { label: string; hex: string; bg: string }[] = [
  { label: 'Blanc', hex: '#ffffff', bg: '#ffffff' },
  { label: 'Jaune', hex: '#fbbf24', bg: '#fbbf24' },
  { label: 'Rouge', hex: '#f87171', bg: '#f87171' },
  { label: 'Vert', hex: '#4ade80', bg: '#4ade80' },
  { label: 'Bleu', hex: '#60a5fa', bg: '#60a5fa' },
  { label: 'Orange', hex: '#fb923c', bg: '#fb923c' },
  { label: 'Violet', hex: '#c084fc', bg: '#c084fc' },
  { label: 'Rose', hex: '#f472b6', bg: '#f472b6' },
];

interface TextTabProps {
  dialogue: Dialogue;
  characters: Character[];
  onUpdate: (updates: Partial<Dialogue>) => void;
  /** Déclenché quand l'utilisateur clique ✂️ dans le header — position curseur dans le texte */
  onSplitRequested?: (splitPos: number, plainText: string, richHtml: string) => void;
  /** Ref externe pour déclencher le split depuis le parent (DialoguePropertiesForm) */
  splitTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Sanitise l'HTML entrant : n'autorise que strong, em, span[style].
 * Empêche tout script ou attribut dangereux.
 */
function sanitizeRichText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}

export function TextTab({
  dialogue,
  characters,
  onUpdate,
  onSplitRequested,
  splitTriggerRef,
}: TextTabProps) {
  const [apparenceOpen, setApparenceOpen] = useState(false);
  const [aperçuOpen, setAperçuOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false); // IME guard

  const boxStyle = dialogue.boxStyle ?? {};
  const handleUpdateBoxStyle = (patch: Partial<NonNullable<typeof dialogue.boxStyle>>) => {
    onUpdate({ boxStyle: { ...dialogue.boxStyle, ...patch } });
  };

  // ── Init : peupler le contenteditable depuis richText ou text ─────────────
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const target = dialogue.richText || dialogue.text || '';
    // Éviter de remplacer si l'utilisateur est en train de taper
    if (el.innerHTML !== target) {
      el.innerHTML = target;
    }
    // Seulement au montage ou changement de dialogue (id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue.id]);

  // ── Sync contenu → store ──────────────────────────────────────────────────
  const syncContent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    const plain = el.innerText;
    onUpdate({
      text: plain,
      richText: raw === plain ? undefined : sanitizeRichText(raw),
    });
  }, [onUpdate]);

  // ── Commandes de formatage (Word-like) ────────────────────────────────────
  const applyBold = () => {
    editorRef.current?.focus();
    document.execCommand('bold');
    syncContent();
  };

  const applyColor = (hex: string) => {
    editorRef.current?.focus();
    document.execCommand('foreColor', false, hex);
    syncContent();
  };

  const removeFormat = () => {
    editorRef.current?.focus();
    document.execCommand('removeFormat');
    syncContent();
  };

  // ── Split au curseur (expose via splitTriggerRef) ─────────────────────────
  const doSplit = useCallback(() => {
    const el = editorRef.current;
    if (!el || !onSplitRequested) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      // Pas de sélection : couper au milieu du texte
      const mid = Math.floor(el.innerText.length / 2);
      const plain = el.innerText;
      onSplitRequested(mid, plain, el.innerHTML);
      return;
    }

    const range = sel.getRangeAt(0);
    // Calculer la position du curseur dans le texte brut
    const preRange = document.createRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.startContainer, range.startOffset);
    const splitPos = preRange.toString().length;

    onSplitRequested(splitPos, el.innerText, el.innerHTML);
  }, [onSplitRequested]);

  // Expose doSplit au parent via ref
  useEffect(() => {
    if (splitTriggerRef) splitTriggerRef.current = doSplit;
  }, [splitTriggerRef, doSplit]);

  // ── Rendu du texte enrichi pour l'Aperçu ─────────────────────────────────
  const previewHtml = dialogue.richText || dialogue.text || '';

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* ── Éditeur de texte enrichi ── */}
      <SectionCard>
        <SectionHeader
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Texte"
          colorClass="text-violet-400"
        />

        {/* Barre de formatage (Miyamoto §1.1 — feedback < 100ms) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px 0',
            borderBottom: '1px solid var(--color-border-base)',
            paddingBottom: 6,
          }}
        >
          {/* Gras */}
          <button
            type="button"
            title="Gras (sélectionner du texte puis cliquer)"
            onClick={applyBold}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: '1px solid var(--color-border-hover)',
              background: 'var(--color-bg-hover)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-active)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          >
            <Bold size={12} />
          </button>

          {/* Séparateur */}
          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--color-border-base)',
              margin: '0 2px',
            }}
          />

          {/* Palette 8 couleurs */}
          {RICH_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => applyColor(c.hex)}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: c.bg,
                border: '1.5px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                transition: 'transform 0.1s, box-shadow 0.1s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 6px ${c.hex}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            />
          ))}

          {/* Effacer le formatage */}
          <div
            style={{
              width: 1,
              height: 16,
              background: 'var(--color-border-base)',
              margin: '0 2px',
            }}
          />
          <button
            type="button"
            title="Effacer le formatage"
            onClick={removeFormat}
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid var(--color-border-hover)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            ✕ format
          </button>
        </div>

        {/* Zone d'édition contenteditable — Word-like */}
        <div className="px-3 py-2.5">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onCompositionStart={() => {
              isComposing.current = true;
            }}
            onCompositionEnd={() => {
              isComposing.current = false;
              syncContent();
            }}
            onInput={() => {
              if (!isComposing.current) syncContent();
            }}
            onBlur={syncContent}
            style={{
              minHeight: 80,
              padding: '8px 12px',
              background: 'var(--color-bg-base)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 14,
              color: 'var(--color-text-primary)',
              lineHeight: 1.55,
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              cursor: 'text',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
            }}
            onBlurCapture={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          />
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Sélectionner du texte → cliquer B ou une couleur
          </p>
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
          onToggle={() => setApparenceOpen((v) => !v)}
        />
        <InlineAccordion isOpen={apparenceOpen}>
          <div className="px-3 py-3 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taille du texte</span>
                <span className="text-xs font-semibold text-fuchsia-400">
                  {boxStyle.fontSize ?? 15} px
                </span>
              </div>
              <Slider
                value={[boxStyle.fontSize ?? 15]}
                onValueChange={([v]) => handleUpdateBoxStyle({ fontSize: v })}
                min={10}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vitesse de frappe</span>
                <span className="text-xs font-semibold text-fuchsia-400">
                  {(boxStyle.typewriterSpeed ?? 40) <= 20
                    ? 'Rapide'
                    : (boxStyle.typewriterSpeed ?? 40) <= 55
                      ? 'Normal'
                      : 'Lent'}
                </span>
              </div>
              <Slider
                value={[boxStyle.typewriterSpeed ?? 40]}
                onValueChange={([v]) => handleUpdateBoxStyle({ typewriterSpeed: v })}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Position</span>
              <div className="grid grid-cols-3 gap-1">
                {(['top', 'center', 'bottom'] as const).map((pos) => (
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
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Bordure</span>
              <div className="grid grid-cols-3 gap-1">
                {(['none', 'subtle', 'prominent'] as const).map((s) => (
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

      {/* Aperçu — rendu richText ou text */}
      <SectionCard>
        <SectionHeader
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Aperçu"
          colorClass="text-sky-400"
          isCollapsible
          isOpen={aperçuOpen}
          onToggle={() => setAperçuOpen((v) => !v)}
        />
        <InlineAccordion isOpen={aperçuOpen}>
          <div className="px-3 py-3 space-y-2">
            <div
              className="rounded-lg p-3"
              style={{
                background: `rgba(0,0,0,${boxStyle.boxOpacity ?? 0.75})`,
                border:
                  (boxStyle.borderStyle ?? 'subtle') === 'none'
                    ? '1px solid transparent'
                    : (boxStyle.borderStyle ?? 'subtle') === 'prominent'
                      ? '2px solid var(--color-primary)'
                      : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-primary)' }}>
                {characters.find((c) => c.id === dialogue.speaker)?.name || '—'}
              </p>
              {/* Rendu du texte enrichi */}
              {previewHtml ? (
                <p
                  style={{
                    fontSize: `${boxStyle.fontSize ?? 15}px`,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p
                  style={{
                    fontSize: `${boxStyle.fontSize ?? 15}px`,
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.55,
                  }}
                >
                  (aucun texte)
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                {(boxStyle.position ?? 'bottom') === 'top'
                  ? '▲ Haut'
                  : (boxStyle.position ?? 'bottom') === 'center'
                    ? '● Centre'
                    : '▼ Bas'}
              </span>
            </div>
          </div>
        </InlineAccordion>
      </SectionCard>
    </div>
  );
}
