import React, { useState, useEffect, useRef } from 'react';
import { GlobalStyles } from '../../styles/StyledComponents';
import Loader from '../components/v3/Loader';
import Header from '../components/v3/Header';
import HeroSection from '../components/v3/HeroSection';
import FeaturesSection from '../components/v3/FeaturesSection';
import DemoSection from '../components/v3/DemoSection';
import Footer from '../components/v3/Footer';
import PricingSection from '../components/v3/PricingSection';

const LandingV3 = () => {
  // Animation states for loader and initial animations
  const [animationState, setAnimationState] = useState({
    // Loader animations
    futureText: false,
    acadexMini: false,
    
    // Header animations
    headerVisible: false,
    headerLogo: false,
    navLinks: false,
    
    // Hero animations
    heroText: false,
    heroSubtext: false,
    ctaButton: false,
    
    // Feature animations (these are now handled by individual components)
    paragraphs: false,
    imagePlaceholder: false,
    
    // Horizontal scroll progress (0 to 1)
    horizontalScroll1: 0,
    horizontalScroll2: 0
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial loader animation sequence
  useEffect(() => {
    // "The Future of Grading" fade in
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, futureText: true }));
    }, 0);
    
    // "Acadex Mini" fade in
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, acadexMini: true }));
    }, 2000);
    
    // Header slide in
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, headerVisible: true }));
    }, 3000);
    
    // Header logo fade in
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, headerLogo: true }));
    }, 3500);
    
    // Nav links fade in
    setTimeout(() => {
      setAnimationState(prev => ({ ...prev, navLinks: true }));
    }, 3500);
    
    // Hide loader
    setTimeout(() => {
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
    }, 4500);
  }, []);
  
  // Scroll event listener for horizontal scroll sections
  useEffect(() => {
    const handleScroll = () => {
      // Find horizontal scroll sections
      const horizontalSections = document.querySelectorAll('.horizontal-scroll');
      
      horizontalSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const scrollPercentage = 1 - (rect.bottom / (window.innerHeight + rect.height));
        const clampedPercentage = Math.max(0, Math.min(1, scrollPercentage));
        
        // Update the appropriate horizontal scroll state
        if (index === 0) {
          setAnimationState(prev => ({ ...prev, horizontalScroll1: clampedPercentage }));
        } else if (index === 1) {
          setAnimationState(prev => ({ ...prev, horizontalScroll2: clampedPercentage }));
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <>
      <GlobalStyles />
      
      <Loader 
        isLoading={isLoading} 
        animationState={animationState} 
      />
      
      <Header 
        isVisible={animationState.headerVisible} 
        animationState={animationState} 
      />
      
      <main>
        <HeroSection animationState={animationState} />
        <FeaturesSection animationState={animationState} />
        <PricingSection />
        <DemoSection />
      </main>
      
      <Footer />
    </>
  );
};

export default LandingV3;
