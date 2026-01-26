import { useState, useCallback } from 'react';

/**
 * Return type for useCharacterSelection hook
 */
export interface UseCharacterSelectionReturn {
  /** Set of selected character IDs */
  selectedIds: Set<string>;
  /** Check if a character is selected */
  isSelected: (id: string) => boolean;
  /** Toggle selection for a single character */
  toggleSelection: (id: string) => void;
  /** Select all characters with given IDs */
  selectAll: (ids: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Toggle between select all and clear selection */
  toggleSelectAll: (ids: string[]) => void;
  /** Number of selected characters */
  selectionCount: number;
  /** Check if all given IDs are selected */
  isAllSelected: (ids: string[]) => boolean;
}

/**
 * useCharacterSelection - Bulk selection state management
 *
 * **Pattern:** AssetsLibraryModal ManagementTab Set-based selection pattern
 *
 * Manages multi-selection state for bulk operations (duplicate, delete).
 * Uses Set for O(1) lookup, add, and delete operations.
 *
 * ## Features
 * - **Set-based storage:** O(1) operations vs O(n) for arrays
 * - **Immutable updates:** Creates new Set on each change
 * - **Select all/none:** Toggle between full selection and empty
 * - **Individual toggle:** Click to select/deselect single characters
 * - **Selection count:** Efficient count for badges
 *
 * ## Usage
 * ```tsx
 * const selection = useCharacterSelection();
 *
 * // Check if selected
 * {selection.isSelected(character.id) && <Badge>Selected</Badge>}
 *
 * // Toggle selection
 * <Checkbox
 *   checked={selection.isSelected(character.id)}
 *   onCheckedChange={() => selection.toggleSelection(character.id)}
 * />
 *
 * // Select all/none
 * <Checkbox
 *   checked={selection.isAllSelected(filteredIds)}
 *   onCheckedChange={() => selection.toggleSelectAll(filteredIds)}
 * />
 *
 * // Bulk operations
 * <Button disabled={selection.selectionCount === 0}>
 *   Supprimer ({selection.selectionCount})
 * </Button>
 * ```
 *
 * @returns Selection state and methods
 */
export function useCharacterSelection(): UseCharacterSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Check if a character is selected
   */
  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Toggle selection for a single character
   * Uses immutable pattern with new Set
   */
  const toggleSelection = useCallback((id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Select all characters with given IDs
   */
  const selectAll = useCallback((ids: string[]): void => {
    setSelectedIds(new Set(ids));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback((): void => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Toggle between select all and clear selection
   * If all given IDs are selected, clear. Otherwise, select all.
   */
  const toggleSelectAll = useCallback(
    (ids: string[]): void => {
      // Check if all IDs are already selected
      const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));

      if (allSelected) {
        // Clear selection
        setSelectedIds(new Set());
      } else {
        // Select all
        setSelectedIds(new Set(ids));
      }
    },
    [selectedIds]
  );

  /**
   * Check if all given IDs are selected
   */
  const isAllSelected = useCallback(
    (ids: string[]): boolean => {
      if (ids.length === 0) return false;
      return ids.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  /**
   * Get selection count (more efficient than converting Set to Array)
   */
  const selectionCount = selectedIds.size;

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    selectionCount,
    isAllSelected,
  };
}

export default useCharacterSelection;
