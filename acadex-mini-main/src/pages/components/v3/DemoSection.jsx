import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GradientText, CTAButton } from '../../../styles/StyledComponents';
import { useIntersectionObserver } from '../../../hooks/v3/useFeatureAnimation';

const DemoContainer = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 8rem 0;
`;

const DemoContent = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
`;

const DemoTitle = styled.h2`
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

const DemoParagraph = styled.p`
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

const VideoPlaceholder = styled.div`
  width: 80%;
  height: 24rem;
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

const StyledCTAButton = styled(CTAButton)`
  margin-top: 3rem;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(20px)'};
  transition: opacity 1s ease, transform 1s ease;
`;

const DemoSection = () => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);
  
  // Animation states
  const [animationStates, setAnimationStates] = useState({
    titleVisible: false,
    paragraphVisible: false,
    videoVisible: false,
    buttonVisible: false
  });
  
  // Use intersection observer to detect when demo section comes into view
  useIntersectionObserver(containerRef, setInView);
  
  // Handle animations when section comes into view
  useEffect(() => {
    if (inView) {
      const animationSequence = [
        { time: 0, state: 'titleVisible' },
        { time: 300, state: 'paragraphVisible' },
        { time: 600, state: 'videoVisible' },
        { time: 900, state: 'buttonVisible' }
      ];
      
      animationSequence.forEach(({ time, state }) => {
        setTimeout(() => {
          setAnimationStates(prev => ({ ...prev, [state]: true }));
        }, time);
      });
    }
  }, [inView]);
  
  return (
    <DemoContainer ref={containerRef} id="demo" className="scroll-section">
      <DemoContent>
        <DemoTitle isVisible={animationStates.titleVisible}>
          <GradientText>See Acadex Mini in Action</GradientText>
        </DemoTitle>
        
        <DemoParagraph 
          className="apple-paragraph"
          isVisible={animationStates.paragraphVisible}
        >
          Watch how Acadex Mini transforms the grading process, saving time and improving feedback quality.
        </DemoParagraph>
        
        <VideoPlaceholder 
          className="image-placeholder h-96"
          isVisible={animationStates.videoVisible}
        >
          <ImagePattern className="image-pattern" />
        </VideoPlaceholder>
        
        <StyledCTAButton 
          isVisible={animationStates.buttonVisible}
          className="cta-button"
        >
          Request a Demo
        </StyledCTAButton>
      </DemoContent>
    </DemoContainer>
  );
};

export default DemoSection;
