import { useEffect, useCallback } from 'react';
import { matchesShortcut, KEYBOARD_SHORTCUTS, announceToScreenReader } from '@/utils/accessibility';
import { logger } from '@/utils/logger';

/**
 * Keyboard Shortcuts Hook - WCAG 2.2 AA Compliant
 *
 * Centralized keyboard shortcut management with:
 * - Accessibility announcements
 * - Conflict prevention
 * - Screen reader feedback
 * - Logging for debugging
 *
 * @example
 * ```tsx
 * function Editor() {
 *   useKeyboardShortcuts({
 *     onSave: () => saveProject(),
 *     onUndo: () => undo(),
 *     onRedo: () => redo(),
 *   });
 * }
 * ```
 */

export interface KeyboardShortcutHandlers {
  /**
   * Save project (Ctrl+S)
   */
  onSave?: () => void;

  /**
   * Undo last action (Ctrl+Z)
   */
  onUndo?: () => void;

  /**
   * Redo last undone action (Ctrl+Y)
   */
  onRedo?: () => void;

  /**
   * Preview mode (Ctrl+P)
   */
  onPreview?: () => void;

  /**
   * Next scene (Alt+Right)
   */
  onNextScene?: () => void;

  /**
   * Previous scene (Alt+Left)
   */
  onPreviousScene?: () => void;

  /**
   * Delete selected item (Delete)
   */
  onDelete?: () => void;

  /**
   * Duplicate selected item (Ctrl+D)
   */
  onDuplicate?: () => void;

  /**
   * Toggle left panel (Ctrl+1)
   */
  onToggleLeftPanel?: () => void;

  /**
   * Toggle right panel (Ctrl+2)
   */
  onToggleRightPanel?: () => void;

  /**
   * Open command palette (Ctrl+K)
   */
  onCommandPalette?: () => void;
}

export interface KeyboardShortcutOptions {
  /**
   * Enable shortcut handling
   * @default true
   */
  enabled?: boolean;

  /**
   * Announce shortcuts to screen readers
   * @default true
   */
  announceActions?: boolean;

  /**
   * Prevent shortcuts when typing in input fields
   * @default true
   */
  preventInInputs?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 *
 * @param handlers - Callback functions for each shortcut
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    announceActions = true,
    preventInInputs = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if disabled
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
    if (preventInInputs) {
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      if (isInput || isContentEditable) {
        // Allow Ctrl+S (save) even in inputs
        if (!matchesShortcut(event, KEYBOARD_SHORTCUTS.save)) {
          return;
        }
      }
    }

    // Save (Ctrl+S)
    if (handlers.onSave && matchesShortcut(event, KEYBOARD_SHORTCUTS.save)) {
      event.preventDefault();
      logger.info('[Keyboard] Save shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Sauvegarde en cours', 'polite');
      }
      handlers.onSave();
      return;
    }

    // Undo (Ctrl+Z)
    if (handlers.onUndo && matchesShortcut(event, KEYBOARD_SHORTCUTS.undo)) {
      event.preventDefault();
      logger.info('[Keyboard] Undo shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Action annulée', 'polite');
      }
      handlers.onUndo();
      return;
    }

    // Redo (Ctrl+Y)
    if (handlers.onRedo && matchesShortcut(event, KEYBOARD_SHORTCUTS.redo)) {
      event.preventDefault();
      logger.info('[Keyboard] Redo shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Action rétablie', 'polite');
      }
      handlers.onRedo();
      return;
    }

    // Preview (Ctrl+P)
    if (handlers.onPreview && matchesShortcut(event, KEYBOARD_SHORTCUTS.preview)) {
      event.preventDefault();
      logger.info('[Keyboard] Preview shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Ouverture du mode aperçu', 'polite');
      }
      handlers.onPreview();
      return;
    }

    // Next Scene (Alt+Right)
    if (handlers.onNextScene && matchesShortcut(event, KEYBOARD_SHORTCUTS.nextScene)) {
      event.preventDefault();
      logger.info('[Keyboard] Next scene shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Scène suivante', 'polite');
      }
      handlers.onNextScene();
      return;
    }

    // Previous Scene (Alt+Left)
    if (handlers.onPreviousScene && matchesShortcut(event, KEYBOARD_SHORTCUTS.previousScene)) {
      event.preventDefault();
      logger.info('[Keyboard] Previous scene shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Scène précédente', 'polite');
      }
      handlers.onPreviousScene();
      return;
    }

    // Delete (Delete key)
    if (handlers.onDelete && matchesShortcut(event, KEYBOARD_SHORTCUTS.delete)) {
      event.preventDefault();
      logger.info('[Keyboard] Delete shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Élément supprimé', 'polite');
      }
      handlers.onDelete();
      return;
    }

    // Duplicate (Ctrl+D)
    if (handlers.onDuplicate && matchesShortcut(event, KEYBOARD_SHORTCUTS.duplicate)) {
      event.preventDefault();
      logger.info('[Keyboard] Duplicate shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Élément dupliqué', 'polite');
      }
      handlers.onDuplicate();
      return;
    }

    // Toggle Left Panel (Ctrl+1)
    if (handlers.onToggleLeftPanel && matchesShortcut(event, KEYBOARD_SHORTCUTS.toggleLeftPanel)) {
      event.preventDefault();
      logger.info('[Keyboard] Toggle left panel shortcut triggered');
      handlers.onToggleLeftPanel();
      return;
    }

    // Toggle Right Panel (Ctrl+2)
    if (handlers.onToggleRightPanel && matchesShortcut(event, KEYBOARD_SHORTCUTS.toggleRightPanel)) {
      event.preventDefault();
      logger.info('[Keyboard] Toggle right panel shortcut triggered');
      handlers.onToggleRightPanel();
      return;
    }

    // Command Palette (Ctrl+K)
    if (handlers.onCommandPalette && matchesShortcut(event, KEYBOARD_SHORTCUTS.commandPalette)) {
      event.preventDefault();
      logger.info('[Keyboard] Command palette shortcut triggered');
      if (announceActions) {
        announceToScreenReader('Palette de commandes ouverte', 'polite');
      }
      handlers.onCommandPalette();
      return;
    }
  }, [handlers, enabled, announceActions, preventInInputs]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
