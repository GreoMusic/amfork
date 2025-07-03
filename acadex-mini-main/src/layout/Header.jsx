// Header.js

import React, { useState } from 'react';
import { useAuth } from "../provider/authProvider";
import LogoImg from '../images/logo/logo.png';
import LogoImg2 from '../images/logo/logo.svg';
import { Link } from "react-router-dom";

const Header = () => {
    const [navbarOpen, setNavbarOpen] = useState(false);
    const { token } = useAuth();

    return (
        <header className="absolute left-0 top-0 z-50 w-full lg:px-20 md:px-16 sm:px-8">
            <div className="container mx-auto">
                <div className="relative -mx-4 flex items-center justify-between">
                    <div className="w-96 max-w-full px-4">
                        <a href="" className="block w-full py-5">
                            <img
                                src={LogoImg}
                                alt="logo"
                                className="block w-full dark:hidden"
                            />
                            <img
                                src={LogoImg2}
                                alt="logo"
                                className="hidden w-full dark:block"
                            />
                        </a>
                    </div>
                    <div className="flex w-full items-center justify-between px-4">
                        <div>
                            <button
                                onClick={() => setNavbarOpen(!navbarOpen)}
                                className={`absolute right-4 top-1/2 block -translate-y-1/2 rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden ${navbarOpen && 'navbarTogglerActive'
                                    }`}
                                id="navbarToggler"
                            >
                                <span className="relative my-[6px] block h-[2px] w-[30px] bg-body-color dark:bg-white"></span>
                                <span className="relative my-[6px] block h-[2px] w-[30px] bg-body-color dark:bg-white"></span>
                                <span className="relative my-[6px] block h-[2px] w-[30px] bg-body-color dark:bg-white"></span>
                            </button>
                            <nav
                                className={`absolute right-4 top-full w-full max-w-[250px] rounded-lg bg-white px-6 py-5 shadow transition-all dark:bg-dark-2 lg:static lg:block lg:w-full lg:max-w-full lg:bg-transparent lg:shadow-none xl:ml-11 ${!navbarOpen && 'hidden'
                                    }`}
                                id="navbarCollapse"
                            >
                                <ul className="block lg:flex">
                                    <li>
                                        <Link
                                            to="/"
                                            className="flex py-2 text-base font-medium text-dark hover:text-primary dark:text-white lg:ml-10 lg:inline-flex"
                                        >
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/pricing"
                                            className="flex py-2 text-base font-medium text-dark hover:text-primary dark:text-white lg:ml-10 lg:inline-flex"
                                        >
                                            Pricing
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/about-us"
                                            className="flex py-2 text-base font-medium text-dark hover:text-primary dark:text-white lg:ml-10 lg:inline-flex"
                                        >
                                            About Us
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                        {token ? <div className="hidden justify-end pr-16 sm:flex lg:pr-0">
                            <a
                                href="/landing"
                                className="px-7 py-3 text-base font-medium text-dark hover:text-primary dark:text-white"
                            >
                                Dashboard
                            </a>
                        </div>
                            : <div className="hidden justify-end pr-16 sm:flex lg:pr-0">
                                <a
                                    href="/login"
                                    className="px-7 py-3 text-base font-medium text-dark hover:text-primary dark:text-white"
                                >
                                    Login
                                </a>
                                <a
                                    href="/register"
                                    className="rounded-md bg-primary px-7 py-3 text-base font-medium text-white hover:bg-blue-dark"
                                >
                                    Sign Up
                                </a>
                            </div>}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
