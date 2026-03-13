import { useState, useCallback } from 'react';
import { Search, ArrowUpRight, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Dialogue } from '@/types';
import { SELECT_NONE_VALUE } from '@/utils/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Truncate text at the last complete word before maxLen chars */
function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.substring(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.substring(0, lastSpace) : slice) + '…';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DialoguePickerProps {
  dialogues: Dialogue[];
  /** Currently selected nextDialogueId (undefined = no link) */
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}

/**
 * DialoguePicker — Searchable combobox for picking a target dialogue.
 *
 * Replaces the basic <Select> with a Popover + filtered list (cmdk-style).
 * The trigger is a compact icon button that shows the target index when linked.
 *
 * NNG: dropdowns with >5 items should support filtering.
 */
export function DialoguePicker({ dialogues, value, onChange }: DialoguePickerProps) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');

  const selectedIdx = value ? dialogues.findIndex(d => d.id === value) : -1;

  const filtered = dialogues.filter((d, i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.text?.toLowerCase().includes(q) ||
      String(i + 1).includes(q)
    );
  });

  const handleSelect = useCallback((id: string) => {
    onChange(id === SELECT_NONE_VALUE ? undefined : id);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClearSearch = useCallback(() => setSearch(''), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>

      {/* ── Trigger — compact icon or index badge ─────────────────────── */}
      <PopoverTrigger asChild>
        <button
          type="button"
          title={selectedIdx >= 0 ? `Lié au dialogue #${selectedIdx + 1}` : 'Lier à un dialogue'}
          aria-label="Choisir le dialogue cible"
          className={cn(
            'h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value
              ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
          )}
        >
          {selectedIdx >= 0 ? (
            <span className="text-[10px] font-bold font-mono">
              #{String(selectedIdx + 1).padStart(2, '0')}
            </span>
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>

      {/* ── Picker panel ────────────────────────────────────────────────── */}
      <PopoverContent className="p-0 w-72" align="end" sideOffset={4}>

        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Chercher un dialogue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            aria-label="Filtrer les dialogues"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dialogue list */}
        <div className="max-h-60 overflow-y-auto py-1">

          {/* "No link" option */}
          <button
            type="button"
            onClick={() => handleSelect(SELECT_NONE_VALUE)}
            className={cn(
              'w-full text-left px-3 py-2 text-xs transition-colors',
              !value
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            — Dialogue suivant (aucun lien)
          </button>

          {filtered.length > 0 ? filtered.map((dialogue) => {
            const realIdx  = dialogues.indexOf(dialogue);
            const isSelected = dialogue.id === value;
            const label    = truncateAtWord(dialogue.text?.trim() || '(vide)', 42);

            return (
              <button
                key={dialogue.id}
                type="button"
                onClick={() => handleSelect(dialogue.id)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-start gap-2.5 text-xs transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {/* Index badge */}
                <span className={cn(
                  'flex-shrink-0 font-mono font-bold tabular-nums mt-0.5',
                  'px-1 py-0.5 rounded text-[10px] leading-none',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}>
                  #{String(realIdx + 1).padStart(2, '0')}
                </span>
                <span className="leading-relaxed">{label}</span>
              </button>
            );
          }) : (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Aucun dialogue trouvé
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DialoguePicker;
