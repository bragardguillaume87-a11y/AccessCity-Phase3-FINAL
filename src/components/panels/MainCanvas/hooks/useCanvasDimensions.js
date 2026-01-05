import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useCanvasDimensions - Track canvas dimensions using callback ref + ResizeObserver
 *
 * This hook uses the callback ref pattern to handle dimension tracking correctly
 * with React.lazy, Suspense, and dynamic component mounting. The callback ref
 * executes synchronously when the element attaches to the DOM, eliminating timing
 * issues that occur with useRef + useEffect/useLayoutEffect.
 *
 * @returns {[function, {width: number, height: number}]} Tuple of [ref callback, dimensions]
 *
 * @example
 * const [canvasRef, canvasDimensions] = useCanvasDimensions();
 * return <div ref={canvasRef}>...</div>
 */
export function useCanvasDimensions() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const observerRef = useRef(null);

  // Callback ref - executes synchronously when element attaches
  const measureRef = useCallback((node) => {
    // Cleanup previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // If node is null, element was unmounted
    if (!node) {
      setDimensions({ width: 0, height: 0 });
      return;
    }

    // Get initial dimensions immediately
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }

    // Set up ResizeObserver to track future dimension changes
    observerRef.current = new ResizeObserver((entries) => {
      if (entries.length === 0) return;

      const { width, height } = entries[0].contentRect;
      const newWidth = Math.round(width);
      const newHeight = Math.round(height);

      if (newWidth > 0 && newHeight > 0) {
        setDimensions(prev =>
          prev.width !== newWidth || prev.height !== newHeight
            ? { width: newWidth, height: newHeight }
            : prev
        );
      }
    });

    observerRef.current.observe(node);
  }, []); // Empty deps - callback remains stable across re-renders

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [measureRef, dimensions];
}
