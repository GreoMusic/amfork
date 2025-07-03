import { createGlobalStyle } from "styled-components";
import styled, { keyframes } from "styled-components";

// Keyframes
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Global Styles
export const GlobalStyles = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
  
  body {
    background-color: black;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
  }
`;

// Reusable Styled Components
export const GradientText = styled.span`
  background: linear-gradient(
    45deg,
    #00ff87,
    #60efff,
    #60efff,
    #0061ff,
    #4d96ff,
    #845ec2,
    #845ec2,
    #d65db1,
    #ff6b6b,
    #4d96ff,
    #6bcb77,
    #ffd93d
  );
  background-size: 400% 400%;
  animation: ${gradientFlow} 40s ease infinite;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  line-height: 100px;
`;
export const GradientTextTitle = styled.span`
  background: linear-gradient(
    45deg,
    #00ff87,
    #60efff,
    #60efff,
    #0061ff,
    #4d96ff,
    #845ec2,
    #845ec2,
    #d65db1,
    #ff6b6b,
    #4d96ff,
    #6bcb77,
    #ffd93d
  );
  background-size: 400% 400%;
  animation: ${gradientFlow} 40s ease infinite;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  line-height: 150px;
`;

export const CTAButton = styled.button`
  display: inline-block;
  background: linear-gradient(90deg, #4d96ff, #6bcb77);
  border-radius: 50px;
  padding: 1rem 2.5rem;
  color: white;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 10px 20px rgba(77, 150, 255, 0.3);
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px rgba(77, 150, 255, 0.4);
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

export const Section = styled.section`
  padding: 4rem 0;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: bold;
  margin-bottom: 2rem;
`;

export const Paragraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.6;
  color: #d1d5db;
  margin-bottom: 1.5rem;
`;
