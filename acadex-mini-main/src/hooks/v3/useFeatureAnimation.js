import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

/**
 * Custom hook to handle scroll-triggered animations for feature items
 * @param {boolean} inView - Whether the element is in view
 * @returns {Object} - Refs and animation states for the feature
 */
export const useFeatureAnimation = (inView = false) => {
  const titleRef = useRef(null);
  const paragraphRefs = useRef([]);
  const imageRef = useRef(null);
  
  const [animationStates, setAnimationStates] = React.useState({
    titleVisible: false,
    paragraphsVisible: false,
    imageVisible: false
  });
  
  useEffect(() => {
    if (inView) {
      // Animate title first
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, titleVisible: true }));
      }, 100);
      
      // Then animate paragraphs
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, paragraphsVisible: true }));
      }, 300);
      
      // Finally animate image
      setTimeout(() => {
        setAnimationStates(prev => ({ ...prev, imageVisible: true }));
      }, 500);
    }
  }, [inView]);
  
  return {
    titleRef,
    paragraphRefs,
    imageRef,
    animationStates
  };
};

/**
 * Custom hook to handle intersection observer for scroll animations
 * @param {React.RefObject} ref - Reference to the element to observe
 * @param {Function} callback - Callback function when element enters viewport
 */
export const useIntersectionObserver = (ref, callback) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(true);
            // Once triggered, no need to observe anymore
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, callback]);
};
