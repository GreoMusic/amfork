import React from 'react';
import Sidebar from '../layout/Sidebar';
import Sidebar2 from '../layout/Sidebar2';
import Profile from '../pages/components/Profile';

import '../assets/css/FileUploadStyle.css'; // Import or define your component styles

const MainLayout = ({ children, showProfile = false }) => {
    return (

        <div className="flex xl:flex-row flex-col px-2 pt-6 bg-white h-full dark:bg-black">
            <Sidebar2 />

            <div className="overlay"></div>

            <div className={`flex flex-col px-10 pt-4 min-h-dvh dark:bg-black ${showProfile ? 'w-full xl:w-4/5' : 'w-full'}`}>
                {children}
            </div>
            {showProfile ?
                <div className="flex flex-col px-18 xl:px-10 pt-10 xl:w-1/5 dark:bg-black w-full">
                    <Profile />
                </div> : null
            }
        </div>
    );
};

export default MainLayout;
