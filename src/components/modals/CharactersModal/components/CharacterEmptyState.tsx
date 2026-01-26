import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search } from 'lucide-react';

/**
 * Props for CharacterEmptyState component
 */
export interface CharacterEmptyStateProps {
  /** Current search query (if any) */
  searchQuery?: string;
  /** Callback when create character button is clicked */
  onCreateCharacter: () => void;
}

/**
 * CharacterEmptyState - Empty state display for character gallery
 *
 * Displays contextual empty states based on whether users are searching or
 * have no characters at all. Provides clear calls-to-action to guide users.
 *
 * Inspired by Nintendo UX Guide: Engaging, guiding empty states (not just "No data")
 *
 * ## Two Modes
 *
 * ### No Characters
 * - Encouraging creation message
 * - Large "Create my first character" CTA button
 * - Animated icon for visual interest
 *
 * ### No Search Results
 * - Shows search query that returned no results
 * - Helpful feedback message
 * - No CTA (user can clear search or adjust filters)
 *
 * @example
 * ```tsx
 * // No characters mode
 * <CharacterEmptyState onCreateCharacter={handleCreate} />
 *
 * // No search results mode
 * <CharacterEmptyState
 *   searchQuery="dragon"
 *   onCreateCharacter={handleCreate}
 * />
 * ```
 */
export function CharacterEmptyState({
  searchQuery,
  onCreateCharacter
}: CharacterEmptyStateProps) {
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

export default CharacterEmptyState;
