import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReuest } from "../services/apiService";
import { useAuth } from '../provider/authProvider';

const Pricing = () => {
    const [navbarOpen, setNavbarOpen] = useState(false);
    const { token } = useAuth();
    const [packages, setPackages] = useState([]);

    const fetchPackages = useCallback(() => {
        getReuest(`get/mini-packages`, token)
            .then(res => {
                console.log('packages', res.packages);
                const filteredPackages = res.packages.filter(item => item.title !== 'Demo');
                setPackages(filteredPackages);
            })
            .catch(error => {
                console.error('Error fetching packages:', error);
            });
    }, [token]);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    return (
        <section id='pricing' className="w-full min-h-screen block z-10 overflow-hidden bg-white py-12 dark:bg-dark lg:pb-[90px] lg:px-40 md:px-16 sm:px-8">
            <div className="container mx-auto">
                <div className="-mx-4 flex flex-wrap">
                    <div className="w-full px-4">
                        <div className="mx-auto mb-[60px] max-w-[510px] text-center">
                            <span className="mb-2 block text-2xl font-semibold text-primary dark:text-secondary">
                                Pricing Table
                            </span>
                            <h2 className="mb-3 text-3xl font-bold leading-[1.208] text-black dark:text-white sm:text-4xl md:text-[40px]">
                                Our Pricing Plan
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="-mx-4 flex flex-wrap justify-center dark:text-white grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {packages.map(item => (
                        <div key={item.title} className="flex flex-col p-6 text-center text-gray-900 bg-white rounded-lg border-2 shadow-pricing dark:border-dark-3 dark:bg-dark-2  xl:p-8 dark:bg-gray-800 dark:text-white">
                            <h3 className="mb-4 text-4xl font-semibold">{item.title}</h3>
                            <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                                {item.summary}
                            </p>
                            <div className="flex justify-center items-baseline my-8">
                                <span className="mr-2 text-5xl font-extrabold">${item.price}</span>
                                <span className="text-gray-500 dark:text-gray-400">/month</span>
                            </div>
                            {/* List */}
                            <ul role="list" className="mb-8 space-y-4 text-left">
                                {item.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center space-x-3">
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to={token ? `/checkout/${item.title}` : '/register?redirect=price'}
                                className={`${item.title === 'Bronze' ? '!bg-[#CD7F32]' : ''} ${item.title === 'Silver' ? '!bg-[#71706e]' : ''} ${item.title === 'Gold' ? '!bg-[#E1C564]' : ''} mt-auto text-white hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-xl px-5 py-2.5 text-center dark:text-white dark:focus:ring-primary-900`}
                            >
                                Subscribe to {item.title}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export const CheckIcon = () => (
    <svg
        className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
        ></path>
    </svg>
);

export default Pricing;
