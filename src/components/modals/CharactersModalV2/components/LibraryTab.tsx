import { useMemo } from 'react';
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
import { Search, X, Grid3X3, List } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStatsV2';
import type { CompletenessFilter, UsageFilter, CharacterSortBy } from '../hooks/useCharacterFilteringV2';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';
import { CharacterGallery, type ViewMode } from './CharacterGallery';
import { CharacterCardV2, type ValidationError } from './CharacterCardV2';

/**
 * Props for LibraryTab component
 */
export interface LibraryTabProps {
  /** All characters */
  characters: Character[];
  /** Filtered characters to display */
  filteredCharacters: Character[];
  /** Current search query */
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
  /** Available moods (derived from character data) */
  availableMoods: string[];
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
  /** Function to check if character is favorite */
  isFavorite: (id: string) => boolean;
  /** Callback when favorite is toggled */
  onToggleFavorite: (id: string) => void;
  /** Callback when character is clicked (opens preview) */
  onCharacterClick: (character: Character) => void;
  /** Callback when duplicate is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete is clicked */
  onDelete: (character: Character) => void;
  /** Callback to create a new character */
  onCreateCharacter: () => void;
  /** Validation errors by character ID */
  validationErrors?: Record<string, ValidationError[]>;
}

/**
 * LibraryTab - Browse and search tab
 *
 * Pattern: EXACT copy structure AssetsLibraryModal LibraryTab
 *
 * Main browsing interface with advanced filtering capabilities.
 * Displays characters in a grid with search, filters, and quick actions.
 *
 * CRITICAL Layout Classes:
 * - Root div: flex flex-col flex-1 min-h-0
 * - Filter toolbar: flex-shrink-0
 * - CharacterGallery: flex-1
 *
 * Features:
 * - Debounced search: Input with clear button
 * - Completeness filters: 3 buttons with badge counts
 * - Usage filter: Select dropdown
 * - Mood filter: Dynamic, derived from character data
 * - Sort options: Name (A-Z, Z-A), completeness
 * - View mode toggle: Grid/List
 * - Results count: Shows when filters are active
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
  availableMoods,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  getCharacterStats,
  usageMap,
  isFavorite,
  onToggleFavorite,
  onCharacterClick,
  onDuplicate,
  onDelete,
  onCreateCharacter,
  validationErrors,
}: LibraryTabProps) {
  // Calculate counts for completeness filter badges
  const completenessCount = useMemo(() => {
    let complete = 0;
    let incomplete = 0;

    characters.forEach((char) => {
      const stats = getCharacterStats(char);
      if (stats.completeness === 100) {
        complete++;
      } else {
        incomplete++;
      }
    });

    return {
      all: characters.length,
      complete,
      incomplete,
    };
  }, [characters, getCharacterStats]);

  // Calculate counts for usage filter
  const usageCount = useMemo(() => {
    let used = 0;
    let unused = 0;

    characters.forEach((char) => {
      const usage = usageMap.get(char.id);
      if (usage && usage.sceneCount > 0) {
        used++;
      } else {
        unused++;
      }
    });

    return {
      all: characters.length,
      used,
      unused,
    };
  }, [characters, usageMap]);

  // Check if any filter is active (for showing results count)
  const isFiltering =
    searchQuery.trim() !== '' ||
    filterCompleteness !== 'all' ||
    filterUsage !== 'all' ||
    filterMood !== 'all';

  return (
    // CRITICAL: flex flex-col flex-1 min-h-0
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter Toolbar - Dark theme compact style */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 space-y-3 flex-shrink-0">
        {/* Row 1: Search + Quick Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-8 h-8 text-xs bg-slate-800 border-slate-600 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Completeness Quick Filters */}
          <div className="flex items-center gap-1">
            <Button
              variant={filterCompleteness === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFilterCompletenessChange('all')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              Tous
              <Badge variant="outline" className="ml-0.5 text-[10px] h-4 px-1 border-slate-600">
                {completenessCount.all}
              </Badge>
            </Button>
            <Button
              variant={filterCompleteness === 'complete' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFilterCompletenessChange('complete')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              Complets
              <Badge variant="outline" className="ml-0.5 text-[10px] h-4 px-1 border-green-700 text-green-400">
                {completenessCount.complete}
              </Badge>
            </Button>
            <Button
              variant={filterCompleteness === 'incomplete' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFilterCompletenessChange('incomplete')}
              className="h-7 px-2.5 text-xs gap-1"
            >
              Incomplets
              <Badge variant="outline" className="ml-0.5 text-[10px] h-4 px-1 border-yellow-700 text-yellow-400">
                {completenessCount.incomplete}
              </Badge>
            </Button>
          </div>

          {/* Sort + View Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as CharacterSortBy)}>
              <SelectTrigger className="w-[110px] h-7 text-xs bg-slate-800 border-slate-600">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom (A→Z)</SelectItem>
                <SelectItem value="name-desc">Nom (Z→A)</SelectItem>
                <SelectItem value="completeness">Complétude</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border border-slate-600 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-r-none"
                onClick={() => onViewModeChange('grid')}
                aria-label="Vue grille"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-l-none"
                onClick={() => onViewModeChange('list')}
                aria-label="Vue liste"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Additional Filters (collapsible) */}
        <div className="flex items-center gap-2">
          {/* Usage Filter */}
          <Select value={filterUsage} onValueChange={(v) => onFilterUsageChange(v as UsageFilter)}>
            <SelectTrigger className="w-[130px] h-7 text-xs bg-slate-800 border-slate-600">
              <SelectValue placeholder="Utilisation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({usageCount.all})</SelectItem>
              <SelectItem value="used">Utilisés ({usageCount.used})</SelectItem>
              <SelectItem value="unused">Non utilisés ({usageCount.unused})</SelectItem>
            </SelectContent>
          </Select>

          {/* Mood Filter */}
          {availableMoods.length > 0 && (
            <Select value={filterMood} onValueChange={onFilterMoodChange}>
              <SelectTrigger className="w-[130px] h-7 text-xs bg-slate-800 border-slate-600">
                <SelectValue placeholder="Humeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes humeurs</SelectItem>
                {availableMoods.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Results Count */}
          {isFiltering && (
            <span className="text-[11px] text-slate-400 ml-auto">
              {filteredCharacters.length}/{characters.length} personnages
            </span>
          )}
        </div>
      </div>

      {/* Characters Gallery */}
      <CharacterGallery
        viewMode={viewMode}
        hasCharacters={characters.length > 0}
        hasFilteredResults={filteredCharacters.length > 0}
        searchQuery={searchQuery}
        onCreateCharacter={onCreateCharacter}
      >
        {filteredCharacters.map((character) => (
          <CharacterCardV2
            key={character.id}
            character={character}
            stats={getCharacterStats(character)}
            errors={validationErrors?.[character.id]}
            isFavorite={isFavorite(character.id)}
            onToggleFavorite={onToggleFavorite}
            onClick={onCharacterClick}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </CharacterGallery>
    </div>
  );
}

export default LibraryTab;
