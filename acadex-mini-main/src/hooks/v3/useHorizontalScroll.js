import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle horizontal scrolling functionality
 * @param {number} scrollProgress - Current scroll progress (0 to 1)
 * @returns {React.RefObject} - Reference to the container element
 */
export const useHorizontalScroll = (scrollProgress) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Apply the transform based on scroll progress
      const xPercent = -50 * scrollProgress;
      container.style.transform = `translateX(${xPercent}%)`;
    }
  }, [scrollProgress]);
  
  return containerRef;
};
