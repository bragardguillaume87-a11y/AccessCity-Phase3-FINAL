import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search } from 'lucide-react';

/**
 * CharacterEmptyState - Empty state display for character gallery
 * Inspired by Nintendo UX Guide: Engaging, guiding empty states (not just "No data")
 *
 * Two modes:
 * - No characters: Encouraging creation with clear CTA
 * - No search results: Helpful feedback with search query
 */
function CharacterEmptyState({ searchQuery, onCreateCharacter }) {
  // No search results
  if (searchQuery) {
    return (
      <Card className="border-dashed animate-fadeIn">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Aucun personnage ne correspond à <strong>"{searchQuery}"</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  // No characters at all
  return (
    <Card className="border-dashed border-2 animate-fadeIn">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-full bg-muted mb-4 animate-bounce-slow">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun personnage</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          Commencez par créer votre premier personnage pour donner vie à votre scénario
        </p>
        <Button
          onClick={onCreateCharacter}
          size="lg"
          className="gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Créer mon premier personnage
        </Button>
      </CardContent>
    </Card>
  );
}

CharacterEmptyState.propTypes = {
  searchQuery: PropTypes.string,
  onCreateCharacter: PropTypes.func.isRequired
};

export default CharacterEmptyState;
