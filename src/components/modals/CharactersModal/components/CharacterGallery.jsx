import React from 'react';
import PropTypes from 'prop-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import CharacterEmptyState from './CharacterEmptyState';

/**
 * CharacterGallery - Wrapper for character cards with grid/list layouts
 * Inspired by Nintendo UX Guide: Pokémon Box visual organization
 *
 * Features:
 * - Grid layout (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
 * - List layout (vertical stack)
 * - Empty state handling
 * - Smooth animations (fadeIn for cards)
 */
function CharacterGallery({
  children,
  viewMode,
  hasCharacters,
  searchQuery,
  onCreateCharacter
}) {
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

CharacterGallery.propTypes = {
  children: PropTypes.node,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  hasCharacters: PropTypes.bool.isRequired,
  searchQuery: PropTypes.string,
  onCreateCharacter: PropTypes.func.isRequired
};

export default CharacterGallery;
