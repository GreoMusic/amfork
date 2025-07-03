import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import LogoImg from '../images/logo/logo.png';
import LogoImg2 from '../images/logo/logo-dark.png';
import { useAuth } from '../provider/authProvider';
import DarkModeSwitch from '../pages/components/DarkModeSwitch';

const links = [{title: 'Home', uri: '/groups', loggedStateShow: true}, {title: 'About', uri: '/about-us', loggedStateShow: false }, {title: 'Pricing', uri: '/pricing', loggedStateShow: false}, {title: 'Feedback Editor', uri: '/sentence', loggedStateShow: true}]

const TopNav = () => {
    const [navbarOpen, setNavbarOpen] = useState(false);
    const location = useLocation();
    const { token } = useAuth();
    const navRef = useRef(null);

    // Close the menu if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setNavbarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navRef]);

    const getLinks = useMemo(() => {
        return (
            <div className={`items-center justify-between w-full xl:flex xl:w-auto xl:order-1 ${navbarOpen ? 'block' : 'hidden'}`} id="navbar-sticky">
                <ul className="flex flex-col p-4 xl:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 xl:space-x-8 rtl:space-x-reverse xl:flex-row xl:mt-0 xl:border-0 xl:bg-white dark:bg-gray-800 xl:dark:bg-gray-900 dark:border-gray-700 bg-white">
                    {links.map(item => (
                        <li key={item.uri}>
                            <Link to={item.uri} className={`block py-2 px-4 text-2xl rounded text-gray-900 hover:bg-gray-100 xl:hover:text-blue-700 xl:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white xl:dark:hover:bg-transparent dark:border-gray-700 rounded-full py-2 ${location.pathname === item.uri ? 'bg-graydark text-white' : 'bg-white'} ${item.loggedStateShow && token == null ? 'hidden' : ''}`} aria-current="page">{item.title}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }, [location.pathname, token, navbarOpen]);

    return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 shadow-md border-gray-200 dark:border-gray-600" ref={navRef}>
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto">
            <div className="max-w-full px-4  w-full flex justify-center md:w-96 md:justify-start">
                <a href="" className="block w-96 flex justify-center">
                    {/* <img
                        src={LogoImg}
                        alt="logo"
                        className="block w-3/4 xl:w-full dark:hidden"
                    /> */}
                    <img
                        src={LogoImg2}
                        alt="logo"
                        className="w-3/4 xl:w-full"
                    />
                </a>
            </div>
            <div className="flex xl:order-2 space-x-3 xl:space-x-0 rtl:space-x-reverse w-full justify-center md:w-auto md:justify-start">
                {token == null ? 
                    <Link to="/login" className="text-white bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Login</Link> :
                    <div>
                        <Dropdown />
                    </div>
                }
                <span className='pt-2 px-4'>
                    <DarkModeSwitch onToggle={(e) => console.log(e)} />
                </span>
                <button 
                    data-collapse-toggle="navbar-sticky" 
                    type="button" 
                    className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg xl:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
                    aria-controls="navbar-sticky" 
                    aria-expanded={navbarOpen}
                    onClick={() => setNavbarOpen(!navbarOpen)}
                >
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                    </svg>
                </button>
            </div>
            {getLinks}
        </div>
    </nav>
    );
};

const Dropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState('Profile');
    const dropdownRef = useRef(null);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
  
    const handleSelect = (option) => {
        setSelected(option);
        setIsOpen(false);
    };

    // Close the dropdown if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);
  
    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium hover:bg-gray-50 text-gray-900 focus:outline-none dark:text-white"
                    onClick={toggleDropdown}
                >
                    {selected}
                    <svg
                        className="-mr-1 ml-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 011.06-.02.75.75 0 01.02 1.06l-4 3.5a.75.75 0 01-1.06 0l-4-3.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
  
            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1 text-gray-900 dark:text-white" role="none">
                        <Link
                            className="text-gray-700 block px-4 py-2 text-xl font-bold w-full text-left hover:bg-gray-100"
                            role="menuitem"
                            to='/profile'
                        >
                            Profile
                        </Link>
                        <Link
                            className="text-danger block px-4 py-2 text-xl font-bold w-full text-left hover:bg-gray-100"
                            role="menuitem"
                            to='/logout'
                        >
                            Logout
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopNav;
