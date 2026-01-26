/**
 * Store Subscribers Utilities
 *
 * Centralized utilities for Zustand store subscriptions.
 * Eliminates code duplication across stores (scenesStore, charactersStore).
 *
 * Based on: https://brainhub.eu/library/zustand-architecture-patterns-at-scale
 */

import type { StoreApi } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface AutoSaveSubscriberOptions {
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Store name for debugging */
  storeName?: string;
}

interface SubscriberCleanup {
  /** Unsubscribe function */
  unsubscribe: () => void;
  /** Clear pending timeout */
  clearTimeout: () => void;
}

// ============================================================================
// AUTO-SAVE SUBSCRIBER
// ============================================================================

/**
 * Creates a debounced autosave subscriber for any Zustand store.
 *
 * Updates UIStore's lastSaved timestamp when the selected state changes.
 * Handles HMR cleanup automatically.
 *
 * @example
 * ```typescript
 * // In scenesStore.ts
 * const cleanup = createAutoSaveSubscriber(
 *   useScenesStore,
 *   (state) => state.scenes,
 *   { storeName: 'scenes' }
 * );
 *
 * // HMR cleanup
 * if (import.meta.hot) {
 *   import.meta.hot.dispose(() => cleanup.unsubscribe());
 * }
 * ```
 */
export function createAutoSaveSubscriber<TState, TSlice>(
  store: StoreApi<TState> & {
    subscribe: {
      (listener: (state: TState, prevState: TState) => void): () => void;
      <U>(
        selector: (state: TState) => U,
        listener: (selectedState: U, previousSelectedState: U) => void
      ): () => void;
    };
  },
  selector: (state: TState) => TSlice,
  options: AutoSaveSubscriberOptions = {}
): SubscriberCleanup {
  const { debounceMs = 1000, storeName = 'unknown' } = options;

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearSaveTimeout = () => {
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  };

  const unsubscribe = store.subscribe(
    selector,
    () => {
      clearSaveTimeout();

      saveTimeout = setTimeout(() => {
        // Dynamically import UIStore to avoid circular dependency
        import('../stores/uiStore').then(({ useUIStore }) => {
          useUIStore.getState().setLastSaved(new Date().toISOString());

          // Debug logging in development
          if (import.meta.env.DEV) {
            console.debug(`[AutoSave] ${storeName} saved at`, new Date().toISOString());
          }
        });
      }, debounceMs);
    }
  );

  return {
    unsubscribe: () => {
      clearSaveTimeout();
      unsubscribe();
    },
    clearTimeout: clearSaveTimeout,
  };
}

// ============================================================================
// HMR CLEANUP HELPER
// ============================================================================

/**
 * Registers HMR cleanup for store subscribers.
 *
 * @example
 * ```typescript
 * const cleanup = createAutoSaveSubscriber(...);
 * registerHMRCleanup(cleanup);
 * ```
 */
export function registerHMRCleanup(cleanup: SubscriberCleanup): void {
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      cleanup.clearTimeout();
      cleanup.unsubscribe();
    });
  }
}

// ============================================================================
// COMBINED HELPER
// ============================================================================

/**
 * Creates an autosave subscriber with automatic HMR cleanup.
 * One-liner replacement for the duplicated pattern in stores.
 *
 * @example
 * ```typescript
 * // In scenesStore.ts - replaces ~15 lines of code
 * setupAutoSave(useScenesStore, (state) => state.scenes, 'scenes');
 * ```
 */
export function setupAutoSave<TState, TSlice>(
  store: Parameters<typeof createAutoSaveSubscriber<TState, TSlice>>[0],
  selector: (state: TState) => TSlice,
  storeName: string,
  debounceMs = 1000
): SubscriberCleanup {
  const cleanup = createAutoSaveSubscriber(store, selector, {
    debounceMs,
    storeName,
  });

  registerHMRCleanup(cleanup);

  return cleanup;
}
