import { useEffect } from 'react';

/**
 * Custom hook to handle the initial loader animation sequence
 * @param {Function} setAnimationState - State setter function for animation states
 * @param {Function} setIsLoading - State setter function for loading state
 */
export const useLoaderAnimation = (setAnimationState, setIsLoading) => {
  useEffect(() => {
    // Initial animation sequence timing
    const animationSequence = [
      // "The Future of Grading" fade in
      { 
        time: 0, 
        action: () => setAnimationState(prev => ({ ...prev, futureText: true }))
      },
      // "Acadex Mini" fade in
      { 
        time: 2000, 
        action: () => setAnimationState(prev => ({ ...prev, acadexMini: true }))
      },
      // Header slide in
      { 
        time: 3000, 
        action: () => setAnimationState(prev => ({ ...prev, headerVisible: true }))
      },
      // Header logo fade in
      { 
        time: 3500, 
        action: () => setAnimationState(prev => ({ ...prev, headerLogo: true }))
      },
      // Nav links fade in
      { 
        time: 3500, 
        action: () => setAnimationState(prev => ({ ...prev, navLinks: true }))
      },
      // Hide loader
      { 
        time: 4500, 
        action: () => {
          setIsLoading(false);
          
          // Animate hero section elements
          setTimeout(() => {
            setAnimationState(prev => ({ ...prev, heroText: true }));
          }, 100);
          
          setTimeout(() => {
            setAnimationState(prev => ({ ...prev, heroSubtext: true }));
          }, 400);
          
          setTimeout(() => {
            setAnimationState(prev => ({ ...prev, ctaButton: true }));
          }, 700);
        }
      }
    ];

    // Execute each animation step at its specified time
    animationSequence.forEach(step => {
      setTimeout(step.action, step.time);
    });
  }, [setAnimationState, setIsLoading]);
};
