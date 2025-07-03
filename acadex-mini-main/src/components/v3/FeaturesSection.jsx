import React from 'react';
import styled from 'styled-components';

const Section = styled.section`
  padding: 4rem 0;
  background-color: #f9fafb;
`;

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #111827;
`;

const Paragraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.75rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 300px;
  background-color: #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
`;

const FeaturesSection = ({ animationState }) => {
  return (
    <Section id="features">
      <Container>
        <Title>Features</Title>
        <Paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Paragraph>
        <ImagePlaceholder />
        <Paragraph>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
        <ImagePlaceholder />
        <Paragraph>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
        </Paragraph>
      </Container>
    </Section>
  );
};

export default FeaturesSection;