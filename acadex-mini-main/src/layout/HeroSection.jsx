import React from 'react';
import HeroImg from '../images/hero-image-01.png';
import { Link } from "react-router-dom";

const HeroSection = () => {
    return (
        <div className="relative bg-white pb-[110px] pt-[20px] dark:bg-black lg:pt-[30px] lg:px-40 md:px-16 sm:px-8">
            <div className="container mx-auto">
                <div className="-mx-4 flex flex-wrap items-center">
                    <div className="w-full px-4 lg:w-5/12">
                        <div className="hero-content">
                            <h1 className="mb-5 text-4xl font-bold leading-[1.208] text-black dark:text-white sm:text-[42px] lg:text-[40px] xl:text-5xl">

                                {/* <span className='uppercase'>Welcome to Acadex mini</span>  <br /> <br />  */}
                                <span className='text-4xl'>Your Ultimate Grading Solution Powered by AI</span>
                            </h1>
                            <p className="mb-8 max-w-[480px] text-base text-body-color text-black dark:text-dark-6">
                                Acadex Mini revolutionizes the grading process for educators by harnessing the power of AI to streamline and automate the evaluation of student papers. With Acadex Mini, teachers can save valuable time, improve grading consistency, and focus on providing meaningful feedback to students. This innovative tool offers efficient paper grading, customizable rubrics, and insightful analytics to enhance the overall teaching and learning experience.
                            </p>
                            <ul className="flex flex-wrap items-center">
                                <li>

                                    <Link to="/landing" className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-7 py-3 text-center text-base font-medium text-white hover:bg-opacity-90">
                                        Get Started
                                    </Link>
                                </li>
                                {/* <li>
                                    <a
                                        onClick={() => alert('Coming soon')}
                                        className="inline-flex items-center justify-center px-5 py-3 text-center text-base font-medium text-[#464646] hover:text-primary dark:text-white"
                                    >
                                        <span className="mr-2">
                                            <svg
                                                width="24"
                                                height="25"
                                                viewBox="0 0 24 25"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle cx="12" cy="12.6152" r="12" fill="#3758F9" />
                                                <rect
                                                    x="7.99893"
                                                    y="14.979"
                                                    width="8.18182"
                                                    height="1.63636"
                                                    fill="white"
                                                />
                                                <rect
                                                    x="11.2717"
                                                    y="7.61523"
                                                    width="1.63636"
                                                    height="4.09091"
                                                    fill="white"
                                                />
                                                <path
                                                    d="M12.0898 14.1606L14.9241 11.0925H9.25557L12.0898 14.1606Z"
                                                    fill="white"
                                                />
                                            </svg>
                                        </span>
                                        Download App
                                    </a>
                                </li> */}
                            </ul>
                            {/* <div className="clients pt-16">
                                <h6 className="mb-6 flex items-center text-xs font-normal text-body-color dark:text-dark-6">
                                    Some Of Our Clients
                                    <span className="ml-3 inline-block h-px w-8 bg-body-color"></span>
                                </h6>
                                <div className="flex items-center gap-4 xl:gap-[50px]">
                                    <a className="block py-3">
                                        <img src="assets/images/brands/oracle.svg" alt="oracle" />
                                    </a>
                                    <a className="block py-3">
                                        <img src="assets/images/brands/intel.svg" alt="intel" />
                                    </a>
                                    <a className="block py-3">
                                        <img src="assets/images/brands/logitech.svg" alt="logitech" />
                                    </a>
                                </div>
                            </div> */}
                        </div>
                    </div>
                    <div className="hidden px-4 lg:block lg:w-1/12"></div>
                    <div className="w-full px-4 lg:w-6/12">
                        <div className="lg:ml-auto lg:text-right">
                            <div className="relative z-10 inline-block pt-11 lg:pt-0">
                                <img
                                    src={HeroImg}
                                    alt="hero"
                                    className="max-w-full lg:ml-auto"
                                />
                                <span className="absolute -bottom-8 -left-8 z-[-1]">
                                    <svg
                                        width="93"
                                        height="93"
                                        viewBox="0 0 93 93"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle cx="2.5" cy="2.5" r="2.5" fill="#3056D3" />
                                        <circle cx="2.5" cy="24.5" r="2.5" fill="#3056D3" />
                                        <circle cx="2.5" cy="46.5" r="2.5" fill="#3056D3" />
                                        <circle cx="2.5" cy="68.5" r="2.5" fill="#3056D3" />
                                        <circle cx="2.5" cy="90.5" r="2.5" fill="#3056D3" />
                                        <circle cx="24.5" cy="2.5" r="2.5" fill="#3056D3" />
                                        <circle cx="24.5" cy="24.5" r="2.5" fill="#3056D3" />
                                        <circle cx="24.5" cy="46.5" r="2.5" fill="#3056D3" />
                                        <circle cx="24.5" cy="68.5" r="2.5" fill="#3056D3" />
                                        <circle cx="24.5" cy="90.5" r="2.5" fill="#3056D3" />
                                        <circle cx="46.5" cy="2.5" r="2.5" fill="#3056D3" />
                                        <circle cx="46.5" cy="24.5" r="2.5" fill="#3056D3" />
                                        <circle cx="46.5" cy="46.5" r="2.5" fill="#3056D3" />
                                        <circle cx="46.5" cy="68.5" r="2.5" fill="#3056D3" />
                                        <circle cx="46.5" cy="90.5" r="2.5" fill="#3056D3" />
                                        <circle cx="68.5" cy="2.5" r="2.5" fill="#3056D3" />
                                        <circle cx="68.5" cy="24.5" r="2.5" fill="#3056D3" />
                                        <circle cx="68.5" cy="46.5" r="2.5" fill="#3056D3" />
                                        <circle cx="68.5" cy="68.5" r="2.5" fill="#3056D3" />
                                        <circle cx="68.5" cy="90.5" r="2.5" fill="#3056D3" />
                                        <circle cx="90.5" cy="2.5" r="2.5" fill="#3056D3" />
                                        <circle cx="90.5" cy="24.5" r="2.5" fill="#3056D3" />
                                        <circle cx="90.5" cy="46.5" r="2.5" fill="#3056D3" />
                                        <circle cx="90.5" cy="68.5" r="2.5" fill="#3056D3" />
                                        <circle cx="90.5" cy="90.5" r="2.5" fill="#3056D3" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
