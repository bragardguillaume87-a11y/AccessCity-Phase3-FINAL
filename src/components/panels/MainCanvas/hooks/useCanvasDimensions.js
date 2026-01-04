import { useState, useEffect } from 'react';

/**
 * useCanvasDimensions - Track canvas dimensions using ResizeObserver
 *
 * @param {React.RefObject} canvasRef - Reference to canvas element
 * @returns {{ width: number, height: number }} Canvas dimensions
 */
export function useCanvasDimensions(canvasRef) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newWidth = Math.round(rect.width);
        const newHeight = Math.round(rect.height);

        if (newWidth > 0 && newHeight > 0) {
          setDimensions(prev => {
            // Only update if dimensions actually changed
            if (prev.width !== newWidth || prev.height !== newHeight) {
              return { width: newWidth, height: newHeight };
            }
            return prev;
          });
        }
      }
    };

    // Retry mechanism: check multiple times if ref isn't ready
    const retryIntervals = [0, 50, 100, 200, 500];
    const timeouts = retryIntervals.map(delay =>
      setTimeout(updateDimensions, delay)
    );

    // Create ResizeObserver to watch for size changes
    let resizeObserver = null;

    // Set up observer after a short delay to ensure ref is attached
    setTimeout(() => {
      if (canvasRef.current) {
        resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(canvasRef.current);
      }
    }, 100);

    return () => {
      timeouts.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []); // Empty deps - run once on mount

  return dimensions;
}
