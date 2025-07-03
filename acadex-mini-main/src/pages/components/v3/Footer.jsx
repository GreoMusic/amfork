import React from 'react';
import styled from 'styled-components';
import { GradientText } from '../../../styles/StyledComponents';

const FooterContainer = styled.footer`
  background-color: #111827;
  padding: 3rem 0;
`;

const FooterContent = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const FooterTop = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const FooterBranding = styled.div`
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const BrandTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const BrandTagline = styled.p`
  color: #9ca3af;
`;

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FooterLinkColumn = styled.div``;

const FooterLinkTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const FooterLinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FooterLink = styled.a`
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: white;
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #1f2937;
  margin-top: 3rem;
  padding-top: 2rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterTop>
          <FooterBranding>
            <BrandTitle>
              <GradientText>Acadex Mini</GradientText>
            </BrandTitle>
            <BrandTagline>The future of grading is here.</BrandTagline>
          </FooterBranding>
          
          <FooterLinks>
            <FooterLinkColumn>
              <FooterLinkTitle>Product</FooterLinkTitle>
              <FooterLinkList>
                <li><FooterLink href="#features">Features</FooterLink></li>
                <li><FooterLink href="#pricing">Pricing</FooterLink></li>
                <li><FooterLink href="#demo">Demo</FooterLink></li>
              </FooterLinkList>
            </FooterLinkColumn>
            
            <FooterLinkColumn>
              <FooterLinkTitle>Support</FooterLinkTitle>
              <FooterLinkList>
                <li><FooterLink href="#">Documentation</FooterLink></li>
                <li><FooterLink href="#">FAQ</FooterLink></li>
                <li><FooterLink href="#">Contact</FooterLink></li>
              </FooterLinkList>
            </FooterLinkColumn>
            
            <FooterLinkColumn>
              <FooterLinkTitle>Company</FooterLinkTitle>
              <FooterLinkList>
                <li><FooterLink href="#">About</FooterLink></li>
                <li><FooterLink href="#">Blog</FooterLink></li>
                <li><FooterLink href="#">Careers</FooterLink></li>
              </FooterLinkList>
            </FooterLinkColumn>
          </FooterLinks>
        </FooterTop>
        
        <FooterBottom>
          <p>&copy; 2025 Acadex, Inc. All rights reserved.</p>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
