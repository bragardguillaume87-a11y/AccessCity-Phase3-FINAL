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
import { Search, X, Copy, Trash2, AlertTriangle, Users } from 'lucide-react';
import type { Character } from '@/types';
import type { CharacterStats } from '../hooks/useCharacterStatsV2';
import type { CharacterUsageData } from '../hooks/useCharacterUsage';
import type { UseCharacterSelectionReturn } from '../hooks/useCharacterSelection';
import { getUsageText } from '../hooks/useCharacterUsage';
import { SelectableCharacterCard } from './SelectableCharacterCard';

/**
 * Props for ManagementTab component
 */
export interface ManagementTabProps {
  /** All characters */
  characters: Character[];
  /** Filtered characters to display */
  filteredCharacters: Character[];
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Function to get character stats */
  getCharacterStats: (character: Character) => CharacterStats;
  /** Map of character usage data */
  usageMap: Map<string, CharacterUsageData>;
  /** Selection state and methods */
  selection: UseCharacterSelectionReturn;
  /** Callback when duplicate is clicked */
  onDuplicate: (characterId: string) => void;
  /** Callback when delete is clicked */
  onDelete: (characterId: string) => void;
}

/**
 * ManagementTab - Bulk operations tab
 *
 * Pattern: EXACT copy structure AssetsLibraryModal ManagementTab
 *
 * Management interface for bulk operations (duplicate, delete).
 * Uses Set-based selection for O(1) operations.
 *
 * CRITICAL Layout Classes:
 * - Root div: flex flex-col flex-1 min-h-0
 * - Bulk actions bar: flex-shrink-0
 * - ScrollArea: flex-1
 * - Padding INSIDE ScrollArea in inner div
 *
 * Features:
 * - Select all checkbox: Toggle all filtered characters
 * - Selection count badge: Shows "X selectionne(s)"
 * - Bulk duplicate: Duplicate all selected characters
 * - Bulk delete: Delete with usage warnings
 * - Usage warnings: Shows which characters are used in scenes
 * - Simple search: Filter characters by name
 *
 * Usage Warnings Pattern:
 * Before bulk delete, checks which selected characters are used in scenes.
 * Displays warning with list of top 5 characters + overflow count.
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

  // Get IDs of filtered characters for select all
  const filteredIds = useMemo(
    () => filteredCharacters.map((c) => c.id),
    [filteredCharacters]
  );

  // Calculate usage info for selected characters (for warnings)
  const selectedUsageInfo = useMemo(() => {
    const usedCharacters: { id: string; name: string; sceneCount: number }[] = [];

    selection.selectedIds.forEach((id) => {
      const usage = usageMap.get(id);
      if (usage && usage.sceneCount > 0) {
        const character = characters.find((c) => c.id === id);
        if (character) {
          usedCharacters.push({
            id,
            name: character.name,
            sceneCount: usage.sceneCount,
          });
        }
      }
    });

    return usedCharacters;
  }, [selection.selectedIds, usageMap, characters]);

  const hasUsedCharacters = selectedUsageInfo.length > 0;

  // Handle bulk duplicate
  const handleBulkDuplicate = () => {
    selection.selectedIds.forEach((id) => {
      onDuplicate(id);
    });
    selection.clearSelection();
  };

  // Handle bulk delete confirmation
  const handleBulkDelete = () => {
    selection.selectedIds.forEach((id) => {
      onDelete(id);
    });
    selection.clearSelection();
    setShowDeleteDialog(false);
  };

  return (
    <>
      {/* CRITICAL: flex flex-col flex-1 min-h-0 */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Bulk Actions Bar - Dark theme compact */}
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/30 space-y-3 flex-shrink-0">
          {/* Row 1: Select All + Bulk Actions */}
          <div className="flex items-center justify-between">
            {/* Left: Select All + Count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    filteredIds.length > 0 && selection.isAllSelected(filteredIds)
                  }
                  onCheckedChange={() => selection.toggleSelectAll(filteredIds)}
                  aria-label="Tout sélectionner"
                  className="border-slate-500"
                />
                <label
                  htmlFor="select-all"
                  className="text-xs font-medium cursor-pointer text-slate-300"
                >
                  Tout sélectionner
                </label>
              </div>

              {selection.selectionCount > 0 && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/50 text-primary">
                  {selection.selectionCount} sélectionné
                  {selection.selectionCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Right: Bulk Action Buttons */}
            {selection.selectionCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDuplicate}
                  className="gap-1 h-7 text-xs border-slate-600 hover:bg-slate-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Dupliquer ({selection.selectionCount})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-1 h-7 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer ({selection.selectionCount})
                </Button>
              </div>
            )}
          </div>

          {/* Row 2: Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filtrer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-8 h-8 text-xs bg-slate-800 border-slate-600 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Effacer le filtre"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Characters Grid */}
        <ScrollArea className="flex-1">
          {/* Padding INSIDE ScrollArea */}
          <div className="p-4">
            {filteredCharacters.length === 0 ? (
              // Empty state
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Users className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500">
                    {searchQuery
                      ? `Aucun résultat pour "${searchQuery}"`
                      : 'Aucun personnage'}
                  </p>
                </div>
              </div>
            ) : (
              // Grid layout - more columns for compact view
              <div className="grid grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredCharacters.map((character) => (
                  <SelectableCharacterCard
                    key={character.id}
                    character={character}
                    stats={getCharacterStats(character)}
                    isSelected={selection.isSelected(character.id)}
                    onToggle={() => selection.toggleSelection(character.id)}
                    usageBadge={getUsageText(character.id, usageMap)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selection.selectionCount} personnage
              {selection.selectionCount > 1 ? 's' : ''} ?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Cette action est irréversible. Les personnages supprimés ne pourront
                  pas être récupérés.
                </p>

                {/* Usage Warning */}
                {hasUsedCharacters && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-destructive font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Attention : {selectedUsageInfo.length} personnage
                        {selectedUsageInfo.length > 1 ? 's sont utilisés' : ' est utilisé'} dans
                        des scènes
                      </span>
                    </div>
                    <ul className="text-sm text-destructive/80 space-y-1 ml-6">
                      {selectedUsageInfo.slice(0, 5).map((info) => (
                        <li key={info.id}>
                          <strong>{info.name}</strong> ({info.sceneCount} scène
                          {info.sceneCount > 1 ? 's' : ''})
                        </li>
                      ))}
                      {selectedUsageInfo.length > 5 && (
                        <li className="text-muted-foreground">
                          ... et {selectedUsageInfo.length - 5} autre
                          {selectedUsageInfo.length - 5 > 1 ? 's' : ''} personnage
                          {selectedUsageInfo.length - 5 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer {selection.selectionCount} personnage
              {selection.selectionCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ManagementTab;
