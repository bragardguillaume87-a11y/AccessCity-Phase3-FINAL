import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';

interface GraphPaginationProps {
  totalDialogues: number;
}

/**
 * GraphPagination - Floating pagination bar for Pro mode
 *
 * Shows page navigation when Pro mode + pagination are enabled
 * and the dialogue count exceeds the page size.
 */
export function GraphPagination({ totalDialogues }: GraphPaginationProps) {
  const pageSize = useUIStore((state) => state.proPageSize);
  const currentPage = useUIStore((state) => state.proCurrentPage);
  const setCurrentPage = useUIStore((state) => state.setProCurrentPage);

  const totalPages = Math.ceil(totalDialogues / pageSize);

  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const startItem = safeCurrentPage * pageSize + 1;
  const endItem = Math.min((safeCurrentPage + 1) * pageSize, totalDialogues);

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/90 backdrop-blur-sm border-2 border-border rounded-xl px-4 py-2 z-10 shadow-xl"
      role="navigation"
      aria-label="Pagination des dialogues"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 0}
        aria-label="Page précédente"
        className="hover:bg-accent transition-colors disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium min-w-[120px] text-center">
        {startItem}–{endItem} sur {totalDialogues}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPage(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= totalPages - 1}
        aria-label="Page suivante"
        className="hover:bg-accent transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
