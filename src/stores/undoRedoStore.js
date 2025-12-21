import { create } from 'zustand';

/**
 * Undo/Redo Store + Auto-save Status
 *
 * NOTE: This is a minimal implementation for migration purposes.
 * Full undo/redo functionality should be implemented using Zustand temporal middleware
 * or by integrating with the existing useUndoRedo hook.
 *
 * For now, this provides the state and stub functions needed by UI components.
 */
export const useUndoRedoStore = create((set, get) => ({
  // Undo/Redo state
  canUndo: false,
  canRedo: false,

  // Auto-save status
  lastSaved: null,
  isSaving: false,

  // Undo/Redo actions (stubs - to be implemented with temporal middleware)
  undo: () => {
    console.log('[undoRedoStore] undo() called - not yet implemented');
    // TODO: Implement with Zustand temporal middleware or useUndoRedo integration
  },

  redo: () => {
    console.log('[undoRedoStore] redo() called - not yet implemented');
    // TODO: Implement with Zustand temporal middleware or useUndoRedo integration
  },

  // Auto-save actions
  setLastSaved: (timestamp) => set({ lastSaved: timestamp }),
  setIsSaving: (saving) => set({ isSaving: saving }),

  // Update undo/redo availability (called by temporal middleware when implemented)
  setCanUndo: (can) => set({ canUndo: can }),
  setCanRedo: (can) => set({ canRedo: can }),
}));
