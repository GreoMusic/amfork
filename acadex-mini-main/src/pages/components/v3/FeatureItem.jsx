import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GradientText } from '../../../styles/StyledComponents';
import { useFeatureAnimation, useIntersectionObserver } from '../../../hooks/v3/useFeatureAnimation';

const FeatureItemContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 8rem 0;
`;

const FeatureContent = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
`;

const FeatureTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3.75rem);
  font-weight: bold;
  margin-bottom: 2rem;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(50px)'};
  transition: opacity 1s ease, transform 1s ease;
  
  @media (min-width: 768px) {
    font-size: clamp(2.5rem, 6vw, 6rem);
  }
`;

const FeatureParagraph = styled.p`
  font-size: 1.25rem;
  line-height: 1.6;
  color: #9ca3af;
  margin-bottom: 1.5rem;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(20px)'};
  transition: opacity 1s ease, transform 1s ease;
  max-width: 700px;
  margin: 0 auto 2rem;
`;

const ImagePlaceholder = styled.div`
  width: 80%;
  height: 400px;
  background: #1a1a1a;
  border-radius: 20px;
  margin: 4rem auto 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(50px)'};
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1s ease, transform 1s ease;
`;

const ImagePattern = styled.div`
  background-image: 
    linear-gradient(45deg, #2d2d2d 25%, transparent 25%),
    linear-gradient(-45deg, #2d2d2d 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2d2d2d 75%),
    linear-gradient(-45deg, transparent 75%, #2d2d2d 75%);
  background-size: 20px 20px;
  position: absolute;
  inset: 0;
`;

const FeatureItem = ({ title, paragraphs }) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);
  
  // Use custom hooks for animation
  const { titleRef, paragraphRefs, imageRef, animationStates } = useFeatureAnimation(inView);
  
  // Use intersection observer to detect when feature comes into view
  useIntersectionObserver(containerRef, setInView);
  
  return (
    <FeatureItemContainer ref={containerRef} className="scroll-section">
      <FeatureContent>
        <FeatureTitle 
          ref={titleRef} 
          className="feature-title"
          isVisible={animationStates.titleVisible}
        >
          <GradientText>{title}</GradientText>
        </FeatureTitle>
        
        {paragraphs.map((paragraph, index) => (
          <FeatureParagraph 
            key={index} 
            ref={el => paragraphRefs.current[index] = el}
            className="apple-paragraph"
            isVisible={animationStates.paragraphsVisible}
          >
            {paragraph}
          </FeatureParagraph>
        ))}
        
        <ImagePlaceholder 
          ref={imageRef}
          className="image-placeholder"
          isVisible={animationStates.imageVisible}
        >
          <ImagePattern className="image-pattern" />
        </ImagePlaceholder>
      </FeatureContent>
    </FeatureItemContainer>
  );
};

export default FeatureItem;
