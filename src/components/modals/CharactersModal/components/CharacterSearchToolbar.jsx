import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3x3, List } from 'lucide-react';

/**
 * CharacterSearchToolbar - Search, view mode, sorting, and filtering controls
 * Inspired by Nintendo UX Guide: Pokémon Box visual library pattern
 *
 * Features:
 * - Instant search with icon
 * - View mode toggle (grid/list)
 * - Sort dropdown (A-Z, Z-A, Completeness)
 * - Mood filter dropdown
 * - Results count display
 */
function CharacterSearchToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  filterMood,
  onFilterMoodChange,
  resultsCount
}) {
  return (
    <div className="px-8 py-4 border-b bg-muted/30 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un personnage par nom ou description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11"
          aria-label="Rechercher un personnage"
        />
      </div>

      {/* Toolbar: View Mode + Sort + Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1" role="group" aria-label="Mode d'affichage">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="gap-2 transition-all hover:scale-105"
            aria-pressed={viewMode === 'grid'}
            aria-label="Affichage en grille"
          >
            <Grid3x3 className="h-4 w-4" />
            Grille
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="gap-2 transition-all hover:scale-105"
            aria-pressed={viewMode === 'list'}
            aria-label="Affichage en liste"
          >
            <List className="h-4 w-4" />
            Liste
          </Button>
        </div>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48" aria-label="Trier par">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">A → Z</SelectItem>
            <SelectItem value="name-desc">Z → A</SelectItem>
            <SelectItem value="completeness">Complétude</SelectItem>
          </SelectContent>
        </Select>

        {/* Mood Filter */}
        <Select value={filterMood} onValueChange={onFilterMoodChange}>
          <SelectTrigger className="w-48" aria-label="Filtrer par humeur">
            <SelectValue placeholder="Filtrer par humeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les humeurs</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="happy">Happy</SelectItem>
            <SelectItem value="sad">Sad</SelectItem>
            <SelectItem value="angry">Angry</SelectItem>
            <SelectItem value="surprised">Surprised</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground animate-fadeIn">
          {resultsCount} résultat{resultsCount !== 1 ? 's' : ''} trouvé{resultsCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

CharacterSearchToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  sortBy: PropTypes.oneOf(['name', 'name-desc', 'completeness']).isRequired,
  onSortChange: PropTypes.func.isRequired,
  filterMood: PropTypes.string.isRequired,
  onFilterMoodChange: PropTypes.func.isRequired,
  resultsCount: PropTypes.number.isRequired
};

export default CharacterSearchToolbar;
