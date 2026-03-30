import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

/**
 * UI Layouts Store
 *
 * Stores Puck layout data (JSON) keyed by layout ID.
 *
 * Built-in layout IDs:
 * - 'studio-main'  → Studio shell arrangement
 * - 'game-hud'     → In-game HUD overlay
 *
 * Users can create additional named layouts.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Puck serializes layouts as plain JSON objects */
export type PuckData = Record<string, unknown>;

export interface UILayoutMetadata {
  id: string;
  name: string;
  /** 'studio' = editor layout, 'game' = in-game HUD */
  context: 'studio' | 'game';
  updatedAt: string;
}

interface UILayoutsState {
  layouts: Record<string, PuckData>;
  layoutMetadata: UILayoutMetadata[];

  // Queries
  getLayout: (id: string) => PuckData | undefined;

  // Actions
  saveLayout: (id: string, name: string, context: UILayoutMetadata['context'], data: PuckData) => void;
  deleteLayout: (id: string) => void;

  // Import
  importLayouts: (layouts: Record<string, PuckData>, metadata: UILayoutMetadata[]) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useUILayoutsStore = create<UILayoutsState>()(
  devtools(
    persist(
      (set, get) => ({
        layouts: {},
        layoutMetadata: [],

        getLayout: (id) => get().layouts[id],

        saveLayout: (id, name, context, data) => {
          const now = new Date().toISOString();
          set((state) => {
            const existingMeta = state.layoutMetadata.find(m => m.id === id);
            const newMeta: UILayoutMetadata = existingMeta
              ? { ...existingMeta, name, context, updatedAt: now }
              : { id, name, context, updatedAt: now };
            return {
              layouts: { ...state.layouts, [id]: data },
              layoutMetadata: existingMeta
                ? state.layoutMetadata.map(m => m.id === id ? newMeta : m)
                : [...state.layoutMetadata, newMeta],
            };
          }, false, 'uiLayouts/saveLayout');
        },

        deleteLayout: (id) => {
          set((state) => {
            const { [id]: _deleted, ...rest } = state.layouts;
            return {
              layouts: rest,
              layoutMetadata: state.layoutMetadata.filter(m => m.id !== id),
            };
          }, false, 'uiLayouts/deleteLayout');
        },

        importLayouts: (layouts, metadata) => {
          set(() => ({ layouts, layoutMetadata: metadata }), false, 'uiLayouts/importLayouts');
        },
      }),
      {
        name: 'accesscity-ui-layouts',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ layouts: state.layouts, layoutMetadata: state.layoutMetadata }),
      }
    ),
    { name: 'UILayoutsStore' }
  )
);
