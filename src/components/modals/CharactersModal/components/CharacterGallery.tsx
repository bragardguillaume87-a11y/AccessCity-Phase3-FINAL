import { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CharacterEmptyState from './CharacterEmptyState';

/**
 * View mode for character gallery
 */
export type ViewMode = 'grid' | 'list';

/**
 * Props for CharacterGallery component
 */
export interface CharacterGalleryProps {
  /** Child elements (CharacterCard components) to render */
  children?: ReactNode;
  /** Current view mode (grid or list) */
  viewMode: ViewMode;
  /** Whether there are characters to display */
  hasCharacters: boolean;
  /** Current search query (for empty state) */
  searchQuery?: string;
  /** Callback when create character button is clicked in empty state */
  onCreateCharacter: () => void;
}

/**
 * CharacterGallery - Wrapper for character cards with grid/list layouts
 *
 * Provides the main display area for character cards with support for both
 * grid and list view modes. Handles empty states when no characters are present
 * or when search returns no results.
 *
 * Inspired by Nintendo UX Guide: Pokémon Box visual organization
 *
 * ## Features
 * - Grid layout (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
 * - List layout (vertical stack)
 * - Empty state handling (no characters vs. no search results)
 * - Smooth animations (fadeIn for cards)
 * - Scrollable area for large character lists
 *
 * @example
 * ```tsx
 * <CharacterGallery
 *   viewMode="grid"
 *   hasCharacters={characters.length > 0}
 *   searchQuery={searchQuery}
 *   onCreateCharacter={handleCreate}
 * >
 *   {characters.map(character => (
 *     <CharacterCard key={character.id} {...cardProps} />
 *   ))}
 * </CharacterGallery>
 * ```
 */
export function CharacterGallery({
  children,
  viewMode,
  hasCharacters,
  searchQuery,
  onCreateCharacter
}: CharacterGalleryProps) {
  return (
    <ScrollArea className="flex-1 px-8 py-6">
      {!hasCharacters ? (
        <CharacterEmptyState
          searchQuery={searchQuery}
          onCreateCharacter={onCreateCharacter}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
          }
        >
          {children}
        </div>
      )}
    </ScrollArea>
  );
}

export default CharacterGallery;
