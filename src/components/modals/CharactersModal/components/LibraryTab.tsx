import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid3x3, List, X } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';
import type { ValidationError } from './CharacterCard';
import type { ViewMode } from './CharacterGallery';
import type {
  CharacterSortBy,
  CompletenessFilter,
  UsageFilter,
} from '../hooks/useCharacterFiltering';
import CharacterCard from './CharacterCard';
import CharacterGallery from './CharacterGallery';

/**
 * Props for LibraryTab component
 */
export interface LibraryTabProps {
  /** All characters to display */
  characters: Character[];
  /** Filtered characters based on current filters */
  filteredCharacters: Character[];
  /** Search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Current completeness filter */
  filterCompleteness: CompletenessFilter;
  /** Callback when completeness filter changes */
  onFilterCompletenessChange: (filter: CompletenessFilter) => void;
  /** Current usage filter */
  filterUsage: UsageFilter;
  /** Callback when usage filter changes */
  onFilterUsageChange: (filter: UsageFilter) => void;
  /** Current mood filter */
  filterMood: string;
  /** Callback when mood filter changes */
  onFilterMoodChange: (mood: string) => void;
  /** Current sort option */
  sortBy: CharacterSortBy;
  /** Callback when sort option changes */
  onSortChange: (sort: CharacterSortBy) => void;
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Function to get character stats */
  getCharacterStats: (character: Character) => CharacterStats;
  /** Map of character usage data */
  usageMap: Map<string, CharacterUsageData>;
  /** Validation errors map */
  validationErrors: Record<string, ValidationError[]>;
  /** Favorites set */
  isFavorite: (id: string) => boolean;
  /** Toggle favorite callback */
  onToggleFavorite: (id: string) => void;
  /** Callback when character card is clicked (opens preview) */
  onCharacterClick: (character: Character) => void;
  /** Callback when edit is clicked */
  onEdit: (character: Character) => void;
  /** Callback when duplicate is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete is clicked */
  onDelete: (character: Character) => void;
  /** Callback when create character is clicked */
  onCreateCharacter: () => void;
  /** Available moods (derived from actual character data) */
  availableMoods: string[];
}

/**
 * LibraryTab - Main browsing interface for characters
 *
 * The Library tab provides a comprehensive browsing and search interface
 * for all characters in the project. It includes advanced filtering,
 * sorting, and preview capabilities.
 *
 * ## Features
 * - Debounced search with clear button
 * - Completeness filter (All/Complete/Incomplete) with count badges
 * - Usage filter (All/Used/Unused)
 * - Mood filter (dynamically derived from character data)
 * - Sort options (A-Z, Z-A, by completeness)
 * - Grid/List view toggle
 * - Results count display
 * - Click on card opens preview panel
 * - Empty state with create prompt
 *
 * ## Design Pattern
 * Follows Material Design 3 guidelines for content browsing:
 * - Persistent filter bar at top
 * - Clear visual hierarchy
 * - Responsive grid layout
 * - Accessible controls
 *
 * @example
 * ```tsx
 * <LibraryTab
 *   characters={characters}
 *   filteredCharacters={filtered}
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   // ... other props
 *   onCharacterClick={setPreviewCharacter}
 * />
 * ```
 */
export function LibraryTab({
  characters,
  filteredCharacters,
  searchQuery,
  onSearchChange,
  filterCompleteness,
  onFilterCompletenessChange,
  filterUsage,
  onFilterUsageChange,
  filterMood,
  onFilterMoodChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  getCharacterStats,
  usageMap,
  validationErrors,
  isFavorite,
  onToggleFavorite,
  onCharacterClick,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateCharacter,
  availableMoods,
}: LibraryTabProps) {
  // Calculate counts for filter badges
  const completeCounts = useMemo(() => {
    const complete = characters.filter((c) => {
      const stats = getCharacterStats(c);
      return stats.completeness === 100;
    }).length;
    const incomplete = characters.length - complete;
    return { all: characters.length, complete, incomplete };
  }, [characters, getCharacterStats]);

  const usageCounts = useMemo(() => {
    const used = characters.filter((c) => {
      const usage = usageMap.get(c.id);
      return usage && usage.sceneCount > 0;
    }).length;
    const unused = characters.length - used;
    return { all: characters.length, used, unused };
  }, [characters, usageMap]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Enhanced Filter Toolbar */}
      <div className="px-6 py-4 border-b bg-muted/30 space-y-4 flex-shrink-0">
        {/* Search Bar with Clear Button */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un personnage par nom ou description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11"
            aria-label="Rechercher un personnage"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:scale-110 transition-transform"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Row 1: Completeness + Usage */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Completeness Filter with Badges */}
          <div className="flex gap-1.5">
            <Button
              variant={filterCompleteness === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterCompletenessChange('all')}
              className="gap-2 transition-all hover:scale-105"
            >
              Tous
              <Badge variant="secondary" className="ml-1">
                {completeCounts.all}
              </Badge>
            </Button>
            <Button
              variant={filterCompleteness === 'complete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterCompletenessChange('complete')}
              className="gap-2 transition-all hover:scale-105"
            >
              Complets
              <Badge variant="secondary" className="ml-1">
                {completeCounts.complete}
              </Badge>
            </Button>
            <Button
              variant={filterCompleteness === 'incomplete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterCompletenessChange('incomplete')}
              className="gap-2 transition-all hover:scale-105"
            >
              Incomplets
              <Badge variant="secondary" className="ml-1">
                {completeCounts.incomplete}
              </Badge>
            </Button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Usage Filter */}
          <Select value={filterUsage} onValueChange={onFilterUsageChange}>
            <SelectTrigger className="w-44" aria-label="Filtrer par utilisation">
              <SelectValue placeholder="Utilisation" />
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="all">Tous ({usageCounts.all})</SelectItem>
              <SelectItem value="used">Utilisés ({usageCounts.used})</SelectItem>
              <SelectItem value="unused">Non utilisés ({usageCounts.unused})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Row 2: View Mode + Mood + Sort */}
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

          {/* Mood Filter (Dynamic) */}
          <Select value={filterMood} onValueChange={onFilterMoodChange}>
            <SelectTrigger className="w-48" aria-label="Filtrer par humeur">
              <SelectValue placeholder="Filtrer par humeur" />
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="all">Toutes les humeurs</SelectItem>
              {availableMoods.map((mood) => (
                <SelectItem key={mood} value={mood}>
                  {mood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48" aria-label="Trier par">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="name">A → Z</SelectItem>
              <SelectItem value="name-desc">Z → A</SelectItem>
              <SelectItem value="completeness">Complétude</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        {(searchQuery || filterMood !== 'all' || filterCompleteness !== 'all' || filterUsage !== 'all') && (
          <div className="text-sm text-muted-foreground animate-fadeIn">
            {filteredCharacters.length} résultat{filteredCharacters.length !== 1 ? 's' : ''} trouvé
            {filteredCharacters.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Characters Gallery */}
      <CharacterGallery
        viewMode={viewMode}
        hasCharacters={filteredCharacters.length > 0}
        searchQuery={searchQuery}
        onCreateCharacter={onCreateCharacter}
      >
        {filteredCharacters.map((character) => {
          const stats = getCharacterStats(character);
          const charErrors = validationErrors[character.id];

          return (
            <CharacterCard
              key={character.id}
              character={character}
              stats={stats}
              errors={charErrors}
              isFavorite={isFavorite(character.id)}
              onToggleFavorite={onToggleFavorite}
              onEdit={(char) => {
                onCharacterClick(char); // Open preview panel
              }}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              viewMode={viewMode}
            />
          );
        })}
      </CharacterGallery>
    </div>
  );
}

export default LibraryTab;
