import React from 'react';
import Navbar from '../newComponents/Navbar';
import Hero from '../newComponents/Hero';
import Features from '../newComponents/Features';
import Pricing from '../newComponents/Pricing';
import AboutSydney from '../newComponents/AboutSydney';
import Footer from '../newComponents/Footer';
import '../../src/assets/css/custom.css';

const Home2 = () => {

    return (
        <div>
            <Navbar />
            <Hero />
            <Features />
            <AboutSydney />
            <Pricing />
            <Footer />
        </div>
    );
};

export default Home2;
