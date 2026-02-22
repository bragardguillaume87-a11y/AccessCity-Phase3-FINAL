import { useEffect } from 'react';
import { useScenesStore } from '@/stores/scenesStore';
import { useCharactersStore } from '@/stores/charactersStore';
import { useUIStore } from '@/stores';

/**
 * Props for KeyboardShortcuts component
 */
export interface KeyboardShortcutsProps {
  /** Currently active tab in the editor */
  activeTab?: string;
  /** Callback to change active tab */
  setActiveTab?: (tab: string) => void;
}

/**
 * KeyboardShortcuts - Global Keyboard Shortcuts Handler
 *
 * Manages global keyboard shortcuts for the application:
 * - Ctrl/Cmd+K: Open command palette
 * - Ctrl/Cmd+N: Create new scene
 * - Ctrl/Cmd+P: Open preview modal
 * - Ctrl/Cmd+Shift+C: Add new character
 * - Ctrl/Cmd+Shift+B: Switch to backgrounds tab
 * - Ctrl/Cmd+Shift+S: Switch to scenes tab
 * - Ctrl/Cmd+Shift+P: Switch to characters tab
 * - Ctrl/Cmd+S: Save project (preventDefault to avoid browser save dialog)
 * - Ctrl/Cmd+Shift+A: Open assets library
 *
 * Cross-platform compatible (uses Meta key on Mac, Ctrl on Windows/Linux).
 *
 * @example
 * ```tsx
 * <KeyboardShortcuts
 *   onOpenCommandPalette={() => setCommandPaletteOpen(true)}
 *   onOpenModal={(modal) => handleModalOpen(modal)}
 *   activeTab={currentTab}
 *   setActiveTab={setCurrentTab}
 * />
 * ```
 */
export default function KeyboardShortcuts({
  activeTab,
  setActiveTab
}: KeyboardShortcutsProps) {
  const addScene = useScenesStore(state => state.addScene);
  const addCharacter = useCharactersStore(state => state.addCharacter);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect platform (Mac uses metaKey, others use ctrlKey)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Ctrl+S and Ctrl+K in input fields
        if (modifier && e.key.toLowerCase() === 's') {
          e.preventDefault();
          return;
        }
        if (modifier && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          useUIStore.getState().setCommandPaletteOpen(true);
          return;
        }
        return;
      }

      // Command Palette: Ctrl/Cmd+K
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUIStore.getState().setCommandPaletteOpen(true);
        return;
      }

      // New Scene: Ctrl/Cmd+N
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addScene();
        return;
      }

      // Preview: Ctrl/Cmd+P
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        useUIStore.getState().setActiveModal('preview');
        return;
      }

      // Save Project: Ctrl/Cmd+S (prevent browser save dialog)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Auto-save is handled by useAutoSave hook
        return;
      }

      // Add Character: Ctrl/Cmd+Shift+C
      if (modifier && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        addCharacter();
        return;
      }

      // Switch to Backgrounds Tab: Ctrl/Cmd+Shift+B
      if (modifier && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('backgrounds');
        return;
      }

      // Switch to Scenes Tab: Ctrl/Cmd+Shift+S
      if (modifier && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('scenes');
        return;
      }

      // Switch to Characters Tab: Ctrl/Cmd+Shift+P
      if (modifier && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('characters');
        return;
      }

      // Open Assets Library: Ctrl/Cmd+Shift+A
      if (modifier && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useUIStore.getState().setActiveModal('assets');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addScene, addCharacter, activeTab, setActiveTab]);

  return null;
}
