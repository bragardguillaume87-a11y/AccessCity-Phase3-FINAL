import { useState, useCallback } from 'react';

/**
 * Props for useDragAndDrop hook
 */
export interface UseDragAndDropProps {
  /** Callback when file is dropped */
  onFileDrop: (file: File) => Promise<void>;
}

/**
 * Return type for useDragAndDrop hook
 */
export interface UseDragAndDropReturn {
  dragActive: boolean;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * useDragAndDrop - Manage drag and drop interactions for file uploads
 *
 * This hook provides all event handlers needed for a drag & drop zone:
 * - Visual feedback (dragActive state)
 * - Drag event handling (enter, leave, over, drop)
 * - File extraction from drop event
 *
 * @param props - Configuration and callbacks
 * @returns Drag state and event handlers
 *
 * @example
 * ```tsx
 * const { dragActive, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useDragAndDrop({
 *   onFileDrop: handleFileUpload
 * });
 *
 * <div
 *   onDragEnter={handleDragEnter}
 *   onDragLeave={handleDragLeave}
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 *   className={dragActive ? 'border-blue-500' : 'border-slate-300'}
 * >
 *   Drop zone
 * </div>
 * ```
 */
export function useDragAndDrop({ onFileDrop }: UseDragAndDropProps): UseDragAndDropReturn {
  const [dragActive, setDragActive] = useState(false);

  /**
   * Handle drag enter - Activate visual feedback
   */
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  /**
   * Handle drag leave - Deactivate visual feedback
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  /**
   * Handle drag over - Required to allow drop
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop - Extract file and trigger upload
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        onFileDrop(file);
      }
    },
    [onFileDrop]
  );

  return {
    dragActive,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop
  };
}
