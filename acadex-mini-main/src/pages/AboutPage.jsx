import React from 'react';
import Logo from '../images/logo/logo.png';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import AboutUs from '../layout/AboutUs';
import Footer from '../layout/Footer';
import MainLayout from '../layout/MainLayout';
import TopNav from '../layout/TopNav';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className='py-24'>
            <TopNav />
            <AboutUs />
            <Footer />
        </div>
    );
};

export default Home;
