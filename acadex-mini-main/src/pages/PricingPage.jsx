import React from 'react';
import Logo from '../images/logo/logo.png';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Pricing from '../layout/Pricing';
import StripePricing from '../layout/StripePricing';
import Footer from '../layout/Footer';
import MainLayout from '../layout/MainLayout';
import TopNav from '../layout/TopNav';

const PricingPage = () => {
    const navigate = useNavigate();
    return (
        <div className='py-24'>
            <TopNav />
            <Pricing />
            <Footer />
        </div>
    );
};

export default PricingPage;
