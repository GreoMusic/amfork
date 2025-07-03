import React, { useEffect } from 'react';
import Logo from '../images/logo/logo.png';
import { useNavigate } from 'react-router-dom';
import { fetchSubscription, useAuth } from "../provider/authProvider";
import WelcomeBanner from './components/WelcomeBanner';

const Landing = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    useEffect(() => {
        fetchSubscription();
        if(token!=null){
            navigate("/groups", { replace: true });
        }
    }, []);

    return (
        <div className="flex flex-col py-20" onClick={() => navigate("/sentence")}>
            <WelcomeBanner />
            <div className='flex justify-center text-6xl text-black font-normal'>Welcome to</div>
            <div className='flex justify-center px-10'>
                <img src={Logo} alt="Logo" />
            </div>
            <div className='flex justify-center text-6xl text-black font-normal'>Mini</div>
            <div className='flex justify-center my-4 text-4xl text-black font-normal'>Effortless Grading, Elevate Education</div>
            <div className='flex justify-center my-4 text-3xl text-black font-normal'>Click anywhere to start</div>
        </div>
    );
};

export default Landing;
