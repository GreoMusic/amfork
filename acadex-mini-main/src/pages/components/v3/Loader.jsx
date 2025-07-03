import React from 'react';
import styled from 'styled-components';
import { GradientText, GradientTextTitle } from '../../../styles/StyledComponents';

const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: ${props => props.isLoading ? 1 : 0};
  transition: opacity 1s ease;
  pointer-events: ${props => props.isLoading ? 'all' : 'none'};
`;

const TitleWrapper = styled.div`
  position: relative;
  text-align: center;
`;

const FutureText = styled.h1`
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: bold;
  color: white;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 2s ease;

  @media (min-width: 768px) {
    font-size: clamp(3rem, 7vw, 7rem);
  }
`;

const AcadexMiniTitle = styled.h2`
  font-size: clamp(3rem, 9vw, 7rem);
  font-weight: bold;
  opacity: ${props => props.isVisible ? 1 : 0};
  margin-top: 2rem;
  transition: opacity 2s ease;

  @media (min-width: 768px) {
    font-size: clamp(5rem, 9vw, 9rem);
  }
`;

const Loader = ({ isLoading, animationState }) => {
  return (
    <LoaderContainer isLoading={isLoading} id="loader">
      <TitleWrapper>
        <FutureText isVisible={animationState.futureText} id="futureText">
          The Future of Grading
        </FutureText>
        <AcadexMiniTitle isVisible={animationState.acadexMini} id="acadexMini">
          <GradientTextTitle>Acadex Mini</GradientTextTitle>
        </AcadexMiniTitle>
      </TitleWrapper>
    </LoaderContainer>
  );
};

export default Loader;
