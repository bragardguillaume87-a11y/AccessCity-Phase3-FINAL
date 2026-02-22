import { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search } from 'lucide-react';

/**
 * View mode type
 */
export type ViewMode = 'grid' | 'list';

/**
 * Props for CharacterGallery component
 */
export interface CharacterGalleryProps {
  /** View mode (grid or list) */
  viewMode: ViewMode;
  /** Whether there are characters to display */
  hasCharacters: boolean;
  /** Whether characters exist but none match filters */
  hasFilteredResults: boolean;
  /** Current search query (for empty state message) */
  searchQuery?: string;
  /** Callback to create a new character */
  onCreateCharacter: () => void;
  /** Children (character cards) */
  children: ReactNode;
}

/**
 * CharacterGallery - Grid/List wrapper with ScrollArea and Empty States
 *
 * Pattern: AssetsLibraryModal grid pattern
 *
 * Wrapper component that handles layout (grid/list), scrolling, and empty states.
 * Contains the ScrollArea with proper padding placement (inside inner div).
 *
 * Features:
 * - Grid mode: 4-5 columns responsive grid
 * - List mode: Vertical stack
 * - ScrollArea: Proper flex-1 with padding inside
 * - Empty states: Different messages for no characters vs no results
 * - Create CTA: Button to create first character
 *
 * CRITICAL: Padding must be inside ScrollArea, not on ScrollArea itself.
 */
export function CharacterGallery({
  viewMode,
  hasCharacters,
  hasFilteredResults,
  searchQuery,
  onCreateCharacter,
  children,
}: CharacterGalleryProps) {
  // Empty state: No characters at all - Dark theme
  if (!hasCharacters) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Users className="h-6 w-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-slate-300">Aucun personnage</h3>
            <p className="text-xs text-slate-500">
              Créez votre premier personnage pour commencer.
            </p>
          </div>
          <Button onClick={onCreateCharacter} size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Créer un personnage
          </Button>
        </div>
      </div>
    );
  }

  // Empty state: No filtered results - Dark theme
  if (!hasFilteredResults) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-slate-300">Aucun résultat</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `Aucun personnage pour "${searchQuery}"`
                : 'Modifiez vos filtres.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal display with characters
  return (
    <ScrollArea className="flex-1">
      {/* Padding inside ScrollArea */}
      <div className="p-4">
        {viewMode === 'grid' ? (
          // Grid layout: 5-6 columns for compact view
          <div className="grid grid-cols-5 xl:grid-cols-6 gap-3">
            {children}
          </div>
        ) : (
          // List layout: Vertical stack
          <div className="flex flex-col gap-2">
            {children}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default CharacterGallery;
