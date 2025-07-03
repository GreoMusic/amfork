import React, { useState } from 'react';
import { FiArrowRightCircle, FiThumbsUp, FiUsers, FiGrid, FiLogOut, FiDollarSign, FiInfo, FiLogIn, FiHome } from 'react-icons/fi';
import { Link } from "react-router-dom";
import LogoLetter from '../images/logo/logo-letter.png';
import DarkModeSwitch from '../pages/components/DarkModeSwitch';
import { useAuth } from "../provider/authProvider";

const Sidebar = () => {
    const { token } = useAuth();
    const [showMenuLabel, setShowMenuLabel] = useState(false);

    const handleToggle = (e) => {
        console.log(e);
    }
    return (
        <>
            <div className="bg-white dark:bg-[#0f0a32] min-h-[800px] ml-4 my-6 shadow-3 shadow rounded-2xl z-40 w-16 fixed top-0 pt-10 left-0 overflow-x-hidden transition-transform duration-500 ease-in-out transform hover:translate-x-0 hover:w-64" onMouseOver={() => setShowMenuLabel(true)} onMouseOut={() => setShowMenuLabel(false)}>
                <div className="">
                    {/* Logo */}
                    <Link to='/home'>
                        <img src={LogoLetter} alt="Logo" className="w-10 h-10 mx-auto mb-5 rounded-full" />
                    </Link>

                    {/* Navigation */}
                    <nav className="text-gray-700 mt-auto">
                        <ul>
                            {/* <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300">
                                <Link to={`${token ? '/groups' : '/home'}`} className="flex items-center">
                                    <FiHome className="text-white my-2 text-lg" />
                                    {showMenuLabel ? <p className='title ml-4 text-white text-lg'>Home</p> : null}
                                </Link>
                            </li> */}
                            {token ? <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300">
                                <Link to='/groups' className="flex items-center">
                                    <FiHome className="text-black my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-black text-lg'>Home</p> : null}
                                </Link>
                            </li> : null}
                            <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300">
                                <Link to='/about-us' className="flex items-center">
                                    <FiInfo className="text-black my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-black text-lg'>About us</p> : null}
                                </Link>
                            </li>
                            <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300">
                                <Link to='/pricing' className="flex items-center">
                                    <FiDollarSign className="text-black my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-black text-lg'>Pricing</p> : null}
                                </Link>
                            </li>

                            {token ? <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300">
                                <Link to='/sentence' className="flex items-center">
                                    <FiThumbsUp className="text-black my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-black text-lg'>Feedback Editor</p> : null}
                                </Link>
                            </li> : null}

                            <li className="block cursor-pointer p-2 hover:bg-gray-800 hover:text-gray-300 absolute bottom-40 left-3">
                                <DarkModeSwitch onToggle={(e) => handleToggle(e)} />
                            </li>
                            {token ? <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300 absolute bottom-30 left-0">
                                <Link to='/profile' className="flex items-center">
                                    <FiUsers className="text-black my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-black text-lg'>Profile</p> : null}
                                </Link>
                            </li> : null}
                            {token ? <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300 absolute bottom-10 left-0">
                                <Link to='/logout' className="flex items-center">
                                    <FiLogOut className="text-danger my-2 text-lg cursor-pointer" />
                                    {showMenuLabel ? <p className='title ml-4 text-danger text-lg'>Logout</p> : null}
                                </Link>
                            </li> : null}
                            {!token ? 
                            <>
                                <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300 absolute bottom-20 text-primary dark:text-secondary">
                                    <Link to='/login' className="flex items-center">
                                        <FiLogIn className="my-2 text-lg cursor-pointer" />
                                        {showMenuLabel ? <p className='title ml-4  text-lg'>Login</p> : null}
                                    </Link>
                                </li>
                                <li className="block cursor-pointer p-2 pl-6 hover:bg-gray-800 hover:text-gray-300 absolute bottom-10 text-primary dark:text-secondary">
                                    <Link to='/register' className="flex items-center">
                                        <FiArrowRightCircle className="my-2 text-lg cursor-pointer" />
                                        {showMenuLabel ? <p className='title ml-4 text-lg'>Register</p> : null}
                                    </Link>
                                </li>
                            </> : null}
                        </ul>
                    </nav>
                </div>
            </div>
            {/* <div className="h-screen z-50 w-16 fixed top-0 pt-10 left-0 overflow-x-hidden transition-transform duration-500 ease-in-out transform hover:translate-x-0 hover:w-64 border-r border-gray-700" onMouseOver={() => setShowMenuLabel(true)} onMouseOut={() => setShowMenuLabel(false)}>

            <div className="flex items-center justify-center h-16">
                <div className='flex'>
                    <Link to='/'><FiHome className="text-white text-2xl" /></Link>
                    {showMenuLabel ? <p className='title mr-4 text-white text-xl'>Home</p> : null}
                </div>
            </div>
            <div className="flex flex-col items-center mt-8">
                <div className='flex items-center justify-start'>
                    <Link to='/about-us'><FiInfo className="text-white my-4 text-xl cursor-pointer" /></Link>
                    {showMenuLabel ? <p className='title ml-4 text-white text-xl'>About Us</p> : null}
                </div>
                <div className='flex items-center justify-start'>
                    <Link to='/pricing'><FiDollarSign className="text-white my-4 text-xl cursor-pointer" /></Link>
                    {showMenuLabel ? <p className='title ml-4 text-white text-xl'>Pricing</p> : null}
                </div>

            </div>
            <div className="flex flex-col items-center mt-8">
                {token ? <Link to='/sentence'><FiSettings className="text-white my-4 text-xl cursor-pointer" /></Link> : null}
                {token ? <Link to='/groups'><FiUpload className="text-white my-4 text-xl cursor-pointer" /></Link> : null}
            </div>
            <div className="absolute flex flex-col items-center bottom-0 left-0 w-full p-4">
                {token ? <Link to='/profile'><FiUsers className="text-white my-4 text-xl cursor-pointer" /></Link> : null}
                <DarkModeSwitch />
                {token ? <Link to='/logout'><FiLogOut className="text-danger mt-8 text-xl cursor-pointer" /></Link> : null}
            </div>
        </div> */}
        </>
    );
};

export default Sidebar;
