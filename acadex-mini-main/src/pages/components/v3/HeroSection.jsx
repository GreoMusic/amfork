import React from 'react';
import styled from 'styled-components';
import { GradientText, CTAButton } from '../../../styles/StyledComponents';

const HeroContainer = styled.section`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeroContent = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
`;

const HeroTitle = styled.h2`
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: bold;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1s ease;
  
  @media (min-width: 768px) {
    font-size: clamp(3.5rem, 7vw, 7rem);
  }
`;

const HeroSubtext = styled.p`
  margin-top: 2rem;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: #d1d5db;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 1s ease;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
  line-height: 40px;
  
  @media (min-width: 768px) {
    font-size: clamp(1.25rem, 2vw, 2rem);
  }
`;

const StyledCTAButton = styled(CTAButton)`
  margin-top: 3rem;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(20px)'};
  transition: opacity 1s ease, transform 1s ease;
`;

const HeroSection = ({ animationState }) => {
  return (
    <HeroContainer id="hero">
      <HeroContent>
        <HeroTitle isVisible={animationState.heroText} id="heroText">
          <GradientText>Revolutionize Your Grading Process</GradientText>
        </HeroTitle>
        <HeroSubtext isVisible={animationState.heroSubtext} id="heroSubtext">
          Acadex Mini combines the power of AI with your expertise to make grading faster, more consistent, and more personal than ever before.
        </HeroSubtext>
        <StyledCTAButton 
          isVisible={animationState.ctaButton} 
          id="ctaButton"
        >
          Start Free Trial
        </StyledCTAButton>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;
