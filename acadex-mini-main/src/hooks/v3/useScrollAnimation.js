import { useEffect, useCallback } from 'react';

/**
 * Custom hook to handle scroll-based animations
 * @param {React.RefObject} featuresRef - Reference to features section
 * @param {React.RefObject} horizontalScrollRefs - References to horizontal scroll sections
 * @param {Function} setAnimationState - State setter function for animation states
 */
export const useScrollAnimation = (featuresRef, horizontalScrollRefs, setAnimationState) => {
  // Function to handle scroll animations
  const handleScroll = useCallback(() => {
    // Animate paragraphs and images when they enter viewport
    const animateOnScroll = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('apple-paragraph')) {
            setAnimationState(prev => ({ ...prev, paragraphs: true }));
          } else if (entry.target.classList.contains('image-placeholder')) {
            setAnimationState(prev => ({ ...prev, imagePlaceholder: true }));
          }
        }
      });
    };

    // Handle horizontal scroll sections
    const handleHorizontalScroll = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const scrollSection = entry.target;
          const index = Array.from(scrollSection.parentNode.children).indexOf(scrollSection);
          
          // Calculate scroll progress (0 to 1)
          const rect = scrollSection.getBoundingClientRect();
          const scrollPercentage = 1 - (rect.bottom / (window.innerHeight + rect.height));
          const clampedPercentage = Math.max(0, Math.min(1, scrollPercentage));
          
          // Update the appropriate horizontal scroll state
          if (index === 0) {
            setAnimationState(prev => ({ ...prev, horizontalScroll1: clampedPercentage }));
          } else if (index === 1) {
            setAnimationState(prev => ({ ...prev, horizontalScroll2: clampedPercentage }));
          }
        }
      });
    };

    // Set up Intersection Observer for regular elements
    const observer = new IntersectionObserver(animateOnScroll, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    // Set up Intersection Observer for horizontal scroll sections
    const horizontalObserver = new IntersectionObserver(handleHorizontalScroll, {
      root: null,
      rootMargin: '0px',
      threshold: Array.from({ length: 101 }, (_, i) => i / 100) // 0 to 1 in 0.01 steps
    });

    // Observe elements
    if (featuresRef.current) {
      const paragraphs = featuresRef.current.querySelectorAll('.apple-paragraph');
      const images = featuresRef.current.querySelectorAll('.image-placeholder');
      
      paragraphs.forEach(paragraph => observer.observe(paragraph));
      images.forEach(image => observer.observe(image));
      
      // Observe horizontal scroll sections
      const horizontalSections = document.querySelectorAll('.horizontal-scroll');
      horizontalSections.forEach(section => horizontalObserver.observe(section));
    }

    // Cleanup function
    return () => {
      observer.disconnect();
      horizontalObserver.disconnect();
    };
  }, [featuresRef, setAnimationState]);

  useEffect(() => {
    // Set up scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check for elements already in viewport
    handleScroll();
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
};
