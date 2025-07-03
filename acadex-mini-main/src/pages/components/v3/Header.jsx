import React, { useState } from 'react';
import styled from 'styled-components';
import { GradientText } from '../../../styles/StyledComponents';
import { useAuth } from '../../../provider/authProvider';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 50;
  padding: 1rem;
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(-100%)'};
  transition: transform 0.5s ease;
`;

const Nav = styled.nav`
  max-width: 80rem;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.5s ease;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.5s ease, color 0.3s ease;
  cursor: pointer;
  
  &:hover {
    color: #60a5fa;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    animation: slideDown 0.3s ease-out;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MobileNavLink = styled(NavLink)`
  padding: 0.75rem 1rem;
  width: 100%;
  text-align: center;
  border-radius: 0.5rem;
  
  &:hover {
    background-color: rgba(96, 165, 250, 0.1);
  }
`;

const Header = ({ isVisible, animationState }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
      const { token } = useAuth();
  
  const scrollToSection = (sectionId) => {
    console.log('scrollToSection', sectionId);
    if (sectionId === 'dashboard' || sectionId === 'login') {
      if(dashboard)
        window.location.href = '/groups';
      else
        window.location.href = '/login';
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = document.getElementById('header')?.offsetHeight || 0;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure elements are mounted
    setIsMobileMenuOpen(false); // Close menu after clicking
  };

  return (
    <HeaderContainer isVisible={isVisible} id="header">
      <Nav>
        <Logo isVisible={animationState.headerLogo} id="headerLogo">
          Acadex Mini
        </Logo>
        
        <NavLinks>
          {/* <NavLink 
            onClick={() => scrollToSection('dashboard')} 
            isVisible={animationState.navLinks} 
            className="nav-link flex items-center"
          >
            Dashboard
          </NavLink> */}
          <Link to={'/groups'} className={`nav-link `} aria-current="page">Dashboard</Link>
          
          <NavLink 
            onClick={() => scrollToSection('features')} 
            isVisible={animationState.navLinks} 
            className="nav-link flex items-center"
          >
            Features
          </NavLink>
          <NavLink 
            onClick={() => scrollToSection('pricing')} 
            isVisible={animationState.navLinks} 
            className="nav-link flex items-center"
          >
            Pricing
          </NavLink>
          <NavLink 
            onClick={() => scrollToSection('demo')} 
            isVisible={animationState.navLinks} 
            className="nav-link flex items-center"
          >
            Demo
          </NavLink>
          {token === null && 
            <Link to="/login" className="text-white bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Login</Link>
          }
        </NavLinks>

        <MobileMenuButton 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </MobileMenuButton>

        <MobileMenu isOpen={isMobileMenuOpen}>
          <MobileNavLink 
            onClick={() => scrollToSection('dashboard')}
            isVisible={true}
          >
            Dashboard
          </MobileNavLink>
          <MobileNavLink 
            onClick={() => scrollToSection('features')}
            isVisible={true}
          >
            Features
          </MobileNavLink>
          <MobileNavLink 
            onClick={() => scrollToSection('pricing')}
            isVisible={true}
          >
            Pricing
          </MobileNavLink>
          <MobileNavLink 
            onClick={() => scrollToSection('demo')}
            isVisible={true}
          >
            Demo
          </MobileNavLink>
        </MobileMenu>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
