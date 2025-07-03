import React from 'react';
import HeroSection from '../layout/HeroSection';
import Pricing from '../layout/Pricing';
import Footer from '../layout/Footer';
import MainLayout from '../layout/MainLayout';
import TopNav from '../layout/TopNav';

import WelcomeBanner from './components/WelcomeBanner';
import Header from '../layout/Header';
import { useAuth } from '../provider/authProvider';

const Home = () => {
    const { token } = useAuth();

    return (
        < >
            <TopNav />
            {/* <Header /> */}
            <WelcomeBanner token={token} />
            <HeroSection />
            <Pricing />
            <Footer />
        </>
    );
};

export default Home;
