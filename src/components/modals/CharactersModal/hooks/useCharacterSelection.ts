import { useState, useCallback, useMemo } from 'react';

/**
 * Return type for useCharacterSelection hook
 */
export interface UseCharacterSelectionReturn {
  /** Set of selected character IDs */
  selectedIds: Set<string>;
  /** Check if a character is selected */
  isSelected: (id: string) => boolean;
  /** Toggle selection of a single character */
  toggleSelection: (id: string) => void;
  /** Select all provided character IDs */
  selectAll: (characterIds: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Toggle between select all and clear all */
  toggleSelectAll: (characterIds: string[]) => void;
  /** Number of selected characters */
  selectionCount: number;
  /** Whether all provided IDs are selected */
  isAllSelected: (characterIds: string[]) => boolean;
}

/**
 * Hook for managing bulk selection state in Management tab
 *
 * Provides a complete interface for selecting multiple characters
 * for bulk operations (duplicate, delete, etc.)
 *
 * @returns Selection state and methods
 *
 * @example
 * ```typescript
 * const selection = useCharacterSelection();
 *
 * // Check if selected
 * const selected = selection.isSelected(characterId);
 *
 * // Toggle selection
 * selection.toggleSelection(characterId);
 *
 * // Select all
 * selection.selectAll(filteredCharacters.map(c => c.id));
 *
 * // Clear selection
 * selection.clearSelection();
 *
 * // Bulk operations
 * if (selection.selectionCount > 0) {
 *   handleBulkDelete(Array.from(selection.selectedIds));
 * }
 * ```
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
   * Toggle selection of a single character
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
   * Select all provided character IDs
   */
  const selectAll = useCallback((characterIds: string[]): void => {
    setSelectedIds(new Set(characterIds));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback((): void => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Check if all provided IDs are selected
   */
  const isAllSelected = useCallback(
    (characterIds: string[]): boolean => {
      if (characterIds.length === 0) return false;
      return characterIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  /**
   * Toggle between select all and clear all
   * If all are selected, clear. Otherwise, select all.
   */
  const toggleSelectAll = useCallback(
    (characterIds: string[]): void => {
      if (isAllSelected(characterIds)) {
        clearSelection();
      } else {
        selectAll(characterIds);
      }
    },
    [isAllSelected, clearSelection, selectAll]
  );

  /**
   * Number of selected characters
   */
  const selectionCount = useMemo(() => selectedIds.size, [selectedIds]);

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
