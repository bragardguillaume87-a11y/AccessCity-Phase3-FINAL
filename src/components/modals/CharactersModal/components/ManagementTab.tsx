import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Copy, Trash2, AlertTriangle, X } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStats';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';
import type { UseCharacterSelectionReturn } from '../hooks/useCharacterSelection';
import { getUsageText } from '../hooks/useCharacterUsage';
import SelectableCharacterCard from './SelectableCharacterCard';

/**
 * Props for ManagementTab component
 */
export interface ManagementTabProps {
  /** All characters to display */
  characters: Character[];
  /** Filtered characters based on current search */
  filteredCharacters: Character[];
  /** Search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Function to get character stats */
  getCharacterStats: (character: Character) => CharacterStats;
  /** Map of character usage data */
  usageMap: Map<string, CharacterUsageData>;
  /** Selection state management */
  selection: UseCharacterSelectionReturn;
  /** Callback when duplicate button is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete button is clicked */
  onDelete: (characterId: string) => void;
}

/**
 * ManagementTab - Bulk operations interface for character management
 *
 * The Management tab provides tools for performing operations on multiple
 * characters at once. Includes selection management, usage warnings, and
 * bulk duplicate/delete operations.
 *
 * ## Features
 * - Select all/none checkbox with count badge
 * - Simple search filter (no advanced filters)
 * - Grid of selectable character cards (4-5 columns)
 * - Usage badges on cards showing where characters are used
 * - Bulk duplicate button (outline variant)
 * - Bulk delete button (destructive variant)
 * - Warning dialog before deleting used characters
 * - List of affected scenes in warning dialog
 * - Empty state when no selection
 *
 * ## Design Pattern
 * Follows Material Design 3 guidelines for bulk actions:
 * - Persistent selection bar at top
 * - Clear visual feedback for selected items
 * - Confirmation dialogs for destructive actions
 * - Usage warnings with context
 *
 * @example
 * ```tsx
 * <ManagementTab
 *   characters={characters}
 *   filteredCharacters={filtered}
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   getCharacterStats={getCharacterStats}
 *   usageMap={usageMap}
 *   selection={selection}
 *   onDuplicate={handleDuplicate}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function ManagementTab({
  characters,
  filteredCharacters,
  searchQuery,
  onSearchChange,
  getCharacterStats,
  usageMap,
  selection,
  onDuplicate,
  onDelete,
}: ManagementTabProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check if any selected characters are used in scenes
  const selectedUsageInfo = useMemo(() => {
    const selectedIds = Array.from(selection.selectedIds);
    const usedCharacters: Array<{ id: string; name: string; scenes: string[] }> = [];

    selectedIds.forEach((id) => {
      const character = characters.find((c) => c.id === id);
      const usage = usageMap.get(id);
      if (character && usage && usage.sceneCount > 0) {
        usedCharacters.push({
          id,
          name: character.name,
          scenes: usage.scenes,
        });
      }
    });

    return usedCharacters;
  }, [selection.selectedIds, characters, usageMap]);

  const hasUsedCharacters = selectedUsageInfo.length > 0;

  /**
   * Handle bulk duplicate
   */
  const handleBulkDuplicate = () => {
    const selectedIds = Array.from(selection.selectedIds);
    selectedIds.forEach((id) => onDuplicate(id));
    selection.clearSelection();
  };

  /**
   * Handle bulk delete (show confirmation dialog first)
   */
  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  /**
   * Confirm and execute bulk delete
   */
  const confirmBulkDelete = () => {
    const selectedIds = Array.from(selection.selectedIds);
    selectedIds.forEach((id) => onDelete(id));
    selection.clearSelection();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Bulk Actions Bar */}
        <div className="px-6 py-4 border-b bg-muted/30 space-y-4 flex-shrink-0">
          {/* Selection Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selection.isAllSelected(filteredCharacters.map((c) => c.id))}
                  onCheckedChange={() =>
                    selection.toggleSelectAll(filteredCharacters.map((c) => c.id))
                  }
                  aria-label="Tout sélectionner"
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium">Tout sélectionner</span>
              </div>

              {/* Selection Count Badge */}
              {selection.selectionCount > 0 && (
                <Badge variant="default" className="text-sm">
                  {selection.selectionCount} sélectionné{selection.selectionCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Bulk Action Buttons */}
            {selection.selectionCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkDuplicate}
                  variant="outline"
                  size="sm"
                  className="gap-2 transition-transform hover:scale-105"
                >
                  <Copy className="h-4 w-4" />
                  Dupliquer ({selection.selectionCount})
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="gap-2 transition-transform hover:scale-105"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer ({selection.selectionCount})
                </Button>
              </div>
            )}
          </div>

          {/* Simple Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un personnage..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 h-10"
              aria-label="Rechercher un personnage"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:scale-110 transition-transform"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Selectable Characters Grid */}
        <ScrollArea className="flex-1">
          {filteredCharacters.length > 0 ? (
            <div className="p-6 grid grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCharacters.map((character) => {
                const stats = getCharacterStats(character);
                const usage = usageMap.get(character.id);
                const usageBadge = usage ? getUsageText(character.id, usageMap) : undefined;

                return (
                  <SelectableCharacterCard
                    key={character.id}
                    character={character}
                    stats={stats}
                    isSelected={selection.isSelected(character.id)}
                    onToggle={() => selection.toggleSelection(character.id)}
                    usageBadge={usageBadge}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-6 rounded-full bg-muted mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun personnage trouvé</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Essayez une autre recherche'
                  : 'Créez votre premier personnage pour commencer'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer {selection.selectionCount} personnage
              {selection.selectionCount > 1 ? 's' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Êtes-vous sûr de vouloir supprimer{' '}
                {selection.selectionCount > 1 ? 'ces personnages' : 'ce personnage'} ?
              </div>

              {/* Warning for Used Characters */}
              {hasUsedCharacters && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">
                        Attention : {selectedUsageInfo.length} personnage
                        {selectedUsageInfo.length > 1 ? 's sont utilisés' : ' est utilisé'} dans
                        des scènes :
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedUsageInfo.slice(0, 5).map((info) => (
                      <div key={info.id} className="text-xs text-muted-foreground">
                        <span className="font-medium">{info.name}</span>
                        <span className="text-muted-foreground/70">
                          {' '}
                          - {info.scenes.length} scène{info.scenes.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                    {selectedUsageInfo.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{selectedUsageInfo.length - 5} autre
                        {selectedUsageInfo.length - 5 > 1 ? 's' : ''}...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-sm font-semibold">Cette action est irréversible.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ManagementTab;
