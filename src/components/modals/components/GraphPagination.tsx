import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface GraphPaginationProps {
  totalDialogues: number;
  onPageChange: (newPage: number, direction: 'forward' | 'backward') => void;
}

/**
 * GraphPagination - Grandes flèches latérales + indicateur de page centré
 *
 * Active pour tous les utilisateurs dès que le nombre de nœuds dépasse la taille de page.
 * Le menu Pro permet de désactiver la pagination.
 */
export function GraphPagination({ totalDialogues, onPageChange }: GraphPaginationProps) {
  const pageSize = useUIStore((state) => state.proPageSize);
  const currentPage = useUIStore((state) => state.proCurrentPage);

  const totalPages = Math.ceil(totalDialogues / pageSize);
  if (totalPages <= 1) return null;

  const safePage = Math.min(currentPage, totalPages - 1);
  const hasPrev = safePage > 0;
  const hasNext = safePage < totalPages - 1;

  const handlePrev = () => {
    if (hasPrev) onPageChange(safePage - 1, 'backward');
  };

  const handleNext = () => {
    if (hasNext) onPageChange(safePage + 1, 'forward');
  };

  const arrowBase =
    'absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center ' +
    'w-14 h-14 rounded-full bg-card/90 backdrop-blur-sm border-2 border-border shadow-xl ' +
    'transition-all duration-200 select-none';

  const arrowActive = 'hover:bg-accent hover:scale-110 cursor-pointer text-foreground';
  const arrowDisabled = 'opacity-20 cursor-not-allowed text-muted-foreground';

  return (
    <>
      {/* Flèche gauche */}
      <button
        className={`${arrowBase} left-3 ${hasPrev ? arrowActive : arrowDisabled}`}
        onClick={handlePrev}
        disabled={!hasPrev}
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      {/* Flèche droite */}
      <button
        className={`${arrowBase} right-3 ${hasNext ? arrowActive : arrowDisabled}`}
        onClick={handleNext}
        disabled={!hasNext}
        aria-label="Page suivante"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Indicateur de page — centré en bas */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/85 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border"
        role="navigation"
        aria-label="Pagination des dialogues"
      >
        {totalPages <= 8 ? (
          // Points de page pour ≤ 8 pages
          Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== safePage) onPageChange(i, i > safePage ? 'forward' : 'backward');
              }}
              aria-label={`Page ${i + 1}`}
              aria-current={i === safePage ? 'page' : undefined}
              className={`rounded-full transition-all duration-200 ${
                i === safePage
                  ? 'w-4 h-4 bg-primary scale-110'
                  : 'w-2.5 h-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/70 hover:scale-110'
              }`}
            />
          ))
        ) : (
          // Texte pour > 8 pages
          <span className="text-sm font-semibold px-1 tabular-nums">
            {safePage + 1} <span className="text-muted-foreground font-normal">/ {totalPages}</span>
          </span>
        )}
      </div>
    </>
  );
}
