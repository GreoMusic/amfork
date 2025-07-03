import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useHorizontalScroll } from '../../../hooks/v3/useHorizontalScroll';

// Update the HorizontalScrollFeature component to use the useHorizontalScroll hook
const HorizontalScrollContainer = styled.div`
  height: 100vh;
  overflow: hidden;
`;

const HorizontalPanels = styled.div`
  display: flex;
  width: 200vw;
  height: 100vh;
  transition: transform 0.1s ease;
`;

const HorizontalPanel = styled.div`
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 2rem;
  background-color: ${props => props.darkBackground ? '#111827' : 'transparent'};
  justify-content: ${props => {
    if (props.centered) return 'center';
    return props.index % 2 === 0 ? 'flex-end' : 'flex-start';
  }};
`;

const PanelContent = styled.div`
  max-width: 48rem;
  width: 100%;
  margin: ${props => props.centered ? '0 auto' : '0'};
  padding: ${props => props.centered ? '0' : '0 2rem'};
  margin-left: ${props => {
    return props.index % 2 === 0 ? '40%' : '0';
  }};
  margin-right: ${props => {
    return props.index % 2 !== 0 ? '60%' : '0';
  }};
`;

const PanelTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3.75rem);
  font-weight: bold;
  margin-bottom: 2rem;
  line-height: 100px;
  text-align: ${props => props.centered ? 'center' : props.index % 2 === 0 ? 'right' : 'left'};
  
  @media (min-width: 768px) {
    font-size: clamp(2.5rem, 6vw, 6rem);
  }
`;

const PanelSubtitle = styled.p`
  font-size: clamp(1.25rem, 2vw, 2rem);
  margin-bottom: 1rem;
`;

const PanelDescription = styled.p`
  font-size: 1.125rem;
  line-height: 1.6;
  color: #d1d5db;
  margin-bottom: 2rem;
  max-width: 36rem;
  
  @media (min-width: 768px) {
    font-size: 1.25rem;
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
  width: 100%;
  height: 400px;
  background: #1a1a1a;
  border-radius: 20px;
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

const HorizontalScrollFeature = ({ title, panels, scrollProgress, animationState }) => {
  // Use the custom hook for horizontal scrolling
  const containerRef = useHorizontalScroll(scrollProgress);
  
  return (
    <HorizontalScrollContainer className="horizontal-scroll">
      <HorizontalPanels 
        ref={containerRef} 
        className="horizontal-panels"
      >
        {panels.map((panel, index) => (
          <HorizontalPanel 
            key={index}
            darkBackground={panel.darkBackground}
            centered={panel.centered}
            index={index}
            className="horizontal-panel"
          >
            <PanelContent 
              centered={panel.centered}
              index={index}
            >
              {panel.title && (
                <PanelTitle
                  centered={panel.centered}
                  index={index}
                >
                  <span className="gradient-text">{panel.title}</span>
                </PanelTitle>
              )}
              
              {panel.subtitle && (
                <PanelSubtitle>
                  <span className="gradient-text">{panel.subtitle}</span>
                </PanelSubtitle>
              )}
              
              {panel.description && (
                <PanelDescription>{panel.description}</PanelDescription>
              )}
              
              {panel.paragraph && (
                <FeatureParagraph 
                  className="apple-paragraph"
                  isVisible={animationState.paragraphs}
                >
                  {panel.paragraph}
                </FeatureParagraph>
              )}
              
              {panel.showImage && (
                <ImagePlaceholder 
                  className="image-placeholder"
                  isVisible={animationState.imagePlaceholder}
                >
                  <ImagePattern className="image-pattern" />
                </ImagePlaceholder>
              )}
            </PanelContent>
          </HorizontalPanel>
        ))}
      </HorizontalPanels>
    </HorizontalScrollContainer>
  );
};

export default HorizontalScrollFeature;
