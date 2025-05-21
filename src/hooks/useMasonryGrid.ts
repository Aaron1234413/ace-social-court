
import { useEffect, useRef, useState } from 'react';

export const useMasonryGrid = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  
  const resizeGrid = () => {
    if (!gridRef.current) return;
    
    const grid = gridRef.current;
    const gridItems = Array.from(grid.getElementsByClassName('masonry-item')) as HTMLElement[];
    
    // Reset heights for recalculation
    gridItems.forEach(item => {
      item.style.gridRowEnd = '';
    });
    
    // Calculate grid row spans
    requestAnimationFrame(() => {
      const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
      const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap')) || 16; // default to 16px if undefined
      
      gridItems.forEach(item => {
        const rowSpan = Math.ceil((item.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = `span ${rowSpan || 1}`;
      });
      
      setRendered(true);
    });
  };
  
  useEffect(() => {
    resizeGrid();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      resizeGrid();
    });
    
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    
    // Handle window resize
    window.addEventListener('resize', resizeGrid);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeGrid);
    };
  }, []);
  
  return { gridRef, rendered, resizeGrid };
};
