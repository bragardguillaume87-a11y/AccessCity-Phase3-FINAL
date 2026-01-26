/**
 * Accessibility Utilities
 *
 * WCAG 2.2 AA compliance helpers for keyboard navigation, focus management, and ARIA
 */

import { useEffect, useRef } from 'react';

/**
 * Generate a unique ID for ARIA relationships
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Announce a message to screen readers
 * Uses ARIA live regions for dynamic content updates
 *
 * @param message - Message to announce
 * @param priority - Announcement priority ('polite' | 'assertive')
 *
 * @example
 * announceToScreenReader('Scene saved successfully', 'polite');
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Screen reader only
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement (screen readers will have read it)
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook to manage focus trap within a modal or dialog
 * Keeps focus within the container when Tab/Shift+Tab is pressed
 *
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const trapRef = useFocusTrap(isOpen);
 *   return <div ref={trapRef}>{content}</div>;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to restore focus when a component unmounts
 * Useful for modals/dialogs to return focus to trigger element
 *
 * @example
 * ```tsx
 * function Modal() {
 *   useFocusReturn();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useFocusReturn(): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    return () => {
      // Restore focus on unmount
      previousFocusRef.current?.focus();
    };
  }, []);
}

/**
 * Hook to handle Escape key press
 * Common pattern for closing modals/menus
 *
 * @param callback - Function to call when Escape is pressed
 * @param isActive - Whether the listener is active
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   useEscapeKey(onClose, true);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useEscapeKey(
  callback: () => void,
  isActive: boolean = true
): void {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, isActive]);
}

/**
 * ARIA role descriptions for common interactive patterns
 * Use these to provide context to screen reader users
 */
export const ARIA_DESCRIPTIONS = {
  scene: 'Scene in visual novel editor',
  dialogue: 'Dialogue line in scene',
  character: 'Character in the story',
  canvas: 'Visual scene canvas',
  toolbar: 'Editor toolbar',
  panel: 'Editor panel',
  modal: 'Dialog window',
  deleteButton: 'Delete item (cannot be undone)',
  saveButton: 'Save changes',
  cancelButton: 'Cancel and discard changes',
  addButton: 'Add new item',
  editButton: 'Edit item',
  duplicateButton: 'Create a copy of this item',
  previewButton: 'Preview in play mode',
  exportButton: 'Export project',
  importButton: 'Import project file',
} as const;

/**
 * Keyboard shortcuts registry
 * Centralized location for all keyboard shortcuts in the app
 */
export const KEYBOARD_SHORTCUTS = {
  // Global
  save: { key: 's', modifiers: ['ctrl'] },
  undo: { key: 'z', modifiers: ['ctrl'] },
  redo: { key: 'y', modifiers: ['ctrl'] },
  preview: { key: 'p', modifiers: ['ctrl'] },

  // Navigation
  nextScene: { key: 'ArrowRight', modifiers: ['alt'] },
  previousScene: { key: 'ArrowLeft', modifiers: ['alt'] },

  // Editor
  delete: { key: 'Delete', modifiers: [] },
  duplicate: { key: 'd', modifiers: ['ctrl'] },

  // Panels
  toggleLeftPanel: { key: '1', modifiers: ['ctrl'] },
  toggleRightPanel: { key: '2', modifiers: ['ctrl'] },

  // Command palette
  commandPalette: { key: 'k', modifiers: ['ctrl'] },
} as const;

/**
 * Format keyboard shortcut for display
 * @param shortcut - Shortcut object from KEYBOARD_SHORTCUTS
 * @returns Formatted string (e.g., "Ctrl+S")
 */
export function formatShortcut(shortcut: { key: string; modifiers: readonly string[] }): string {
  const parts = [...shortcut.modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)), shortcut.key];
  return parts.join('+');
}

/**
 * Check if a keyboard event matches a shortcut
 * @param event - Keyboard event
 * @param shortcut - Shortcut to check against
 * @returns True if the event matches the shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: { key: string; modifiers: readonly string[] }
): boolean {
  const hasCtrl = shortcut.modifiers.includes('ctrl');
  const hasAlt = shortcut.modifiers.includes('alt');
  const hasShift = shortcut.modifiers.includes('shift');

  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.ctrlKey === hasCtrl &&
    event.altKey === hasAlt &&
    event.shiftKey === hasShift
  );
}
