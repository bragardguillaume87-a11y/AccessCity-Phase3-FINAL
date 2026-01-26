/**
 * EditorContext
 *
 * Provides common editor state and actions to child components,
 * reducing prop drilling in the editor layout.
 *
 * Usage:
 * ```typescript
 * // In a child component
 * const { openModal, selectedElement, setSelectedElement } = useEditorContext();
 * ```
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { SelectedElementType, FullscreenMode, ModalContext, ModalType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface EditorContextValue {
  // Modal management
  activeModal: string | null;
  modalContext: ModalContext;
  openModal: (modal: ModalType | string, context?: ModalContext) => void;
  closeModal: () => void;

  // Selection state
  selectedElement: SelectedElementType;
  setSelectedElement: (element: SelectedElementType) => void;

  // Fullscreen mode
  fullscreenMode: FullscreenMode;
  setFullscreenMode: (mode: FullscreenMode) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const EditorContext = createContext<EditorContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface EditorProviderProps {
  children: React.ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState<ModalContext>({});

  // Selection state
  const [selectedElement, setSelectedElement] = useState<SelectedElementType>(null);

  // Fullscreen mode
  const [fullscreenMode, setFullscreenMode] = useState<FullscreenMode>(null);

  // Memoized modal handlers
  const openModal = useCallback((modal: ModalType | string, context: ModalContext = {}) => {
    setActiveModal(modal);
    setModalContext(context);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalContext({});
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<EditorContextValue>(
    () => ({
      activeModal,
      modalContext,
      openModal,
      closeModal,
      selectedElement,
      setSelectedElement,
      fullscreenMode,
      setFullscreenMode,
    }),
    [activeModal, modalContext, openModal, closeModal, selectedElement, fullscreenMode]
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access editor context.
 *
 * @throws Error if used outside EditorProvider
 */
export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }

  return context;
}

// ============================================================================
// SELECTIVE HOOKS (for optimized re-renders)
// ============================================================================

/**
 * Hook for modal management only.
 * Components using this won't re-render when selection changes.
 */
export function useEditorModal() {
  const { activeModal, modalContext, openModal, closeModal } = useEditorContext();
  return { activeModal, modalContext, openModal, closeModal };
}

/**
 * Hook for selection state only.
 * Components using this won't re-render when modal state changes.
 */
export function useEditorSelection() {
  const { selectedElement, setSelectedElement } = useEditorContext();
  return { selectedElement, setSelectedElement };
}

/**
 * Hook for fullscreen mode only.
 */
export function useEditorFullscreen() {
  const { fullscreenMode, setFullscreenMode } = useEditorContext();
  return { fullscreenMode, setFullscreenMode };
}
