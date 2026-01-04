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
        requestAnimationFrame(() => {
          const { width, height } = canvasRef.current.getBoundingClientRect();
          if (width > 0 && height > 0) {
            setDimensions({ width, height });
          }
        });
      }
    };

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(updateDimensions);

    if (canvasRef.current) {
      // Start observing the canvas element
      resizeObserver.observe(canvasRef.current);
      // Initial dimension update
      updateDimensions();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);

  return dimensions;
}
