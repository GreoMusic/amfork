import React, { useState, useEffect } from 'react';
import { loadStripe as loadStripe2 } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { postReuest } from "../../services/apiService";
import CheckoutStripe from '../Form/CheckoutStripe';
import { getMySubscription } from "../../provider/authProvider";
import SubscriptionPaymentForm from './SubscriptionPaymentForm';

const StripeForm = ({ product, createPaymentIntent, clientSecret, handlePaymentSuccess }) => {
    const [disablePayBtn, setDisablePayBtn] = useState(false);

    useEffect(() => {
        const myPackage = getMySubscription()
        // console.log('myPackage', myPackage)
        if (myPackage) {
            const package_ends = Date.parse(myPackage.ends_at)
            const now_time = Date.now()
            // console.log('now_time', now_time)
            // console.log('package_ends', package_ends)
            // console.log('bool', package_ends > now_time)
            setDisablePayBtn(package_ends > now_time)
        }
    }, []);

    return (
        <div className="relative pb-[110px] dark:bg-dark lg:px-40 md:px-16 sm:px-8">
            <div className="container">
                <div className="leading-loose">
                    <div className="relative h-120 z-10 mb-10 overflow-hidden rounded-[10px] border-2 border-stroke bg-white px-8 py-10 shadow-pricing dark:border-dark-3 dark:bg-dark-2 sm:p-12 lg:px-6 lg:py-10 xl:p-[50px]">
                        <span className="mb-3 block text-2xl font-semibold text-primary">
                            Subscribe to {product.title}
                        </span>
                        <h2 className="mb-5 text-[42px] font-bold text-dark dark:text-white">
                            <span>For ${product.price}</span>
                            <span className="text-base font-medium text-body-color dark:text-white">
                                / month
                            </span>
                        </h2>
                        <p className="mb-8 border-b border-stroke pb-8 text-base text-body-color dark:border-dark-3 dark:text-white text-xl">
                            {product.summary}
                        </p>
                        <div className="mb-9 flex flex-col gap-[14px] grow ">
                            <div className='mx-auto max-w-md'>
                                {product?.features?.map((feature, idx) => (
                                    <p className="text-base text-body-color dark:text-white text-lg flex justify-start items-center gap-2 my-3" key={idx}>
                                        <CheckIcon />{feature}
                                    </p>)
                                )}
                            </div>
                        </div>
                        <SubscriptionPaymentForm product={product} onSuccess={handlePaymentSuccess} />
                        {clientSecret ? <CheckoutStripe clientSecret={clientSecret} paymentSuccess={() => { handlePaymentSuccess(); setDisablePayBtn(true); }} /> : null}
                        {/* {!clientSecret ? <button
                            disabled={disablePayBtn}
                            onClick={() => createPaymentIntent({ price: product.price })}
                            className={`block w-full rounded-md border ${disablePayBtn ? 'bg-secondary' : 'bg-primary'} p-3 text-center text-base font-medium text-white transition hover:bg-opacity-90 absolute left-0 bottom-0`}
                        >
                            Pay ${product.price}
                        </button> : null} */}
                        <div>
                            <span className="absolute right-0 top-7 z-[-1]">
                                <svg
                                    width={77}
                                    height={172}
                                    viewBox="0 0 77 172"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx={86} cy={86} r={86} fill="url(#paint0_linear)" />
                                    <defs>
                                        <linearGradient
                                            id="paint0_linear"
                                            x1={86}
                                            y1={0}
                                            x2={86}
                                            y2={172}
                                            gradientUnits="userSpaceOnUse"
                                        >
                                            <stop stopColor="#3056D3" stopOpacity="0.09" />
                                            <stop offset={1} stopColor="#C4C4C4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                            <span className="absolute right-4 top-4 z-[-1]">
                                <svg
                                    width={41}
                                    height={89}
                                    viewBox="0 0 41 89"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="38.9138"
                                        cy="87.4849"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 87.4849)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="74.9871"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 74.9871)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="62.4892"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 62.4892)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="38.3457"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 38.3457)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="13.634"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 13.634)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="50.2754"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 50.2754)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="26.1319"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 26.1319)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="38.9138"
                                        cy="1.42021"
                                        r="1.42021"
                                        transform="rotate(180 38.9138 1.42021)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="87.4849"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 87.4849)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="74.9871"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 74.9871)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="62.4892"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 62.4892)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="38.3457"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 38.3457)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="13.634"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 13.634)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="50.2754"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 50.2754)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="26.1319"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 26.1319)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="26.4157"
                                        cy="1.4202"
                                        r="1.42021"
                                        transform="rotate(180 26.4157 1.4202)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="87.4849"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 87.4849)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="74.9871"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 74.9871)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="62.4892"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 62.4892)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="38.3457"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 38.3457)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="13.634"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 13.634)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="50.2754"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 50.2754)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="26.1319"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 26.1319)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="13.9177"
                                        cy="1.42019"
                                        r="1.42021"
                                        transform="rotate(180 13.9177 1.42019)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="87.4849"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 87.4849)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="74.9871"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 74.9871)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="62.4892"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 62.4892)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="38.3457"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 38.3457)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="13.634"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 13.634)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="50.2754"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 50.2754)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="26.1319"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 26.1319)"
                                        fill="#3056D3"
                                    />
                                    <circle
                                        cx="1.41963"
                                        cy="1.4202"
                                        r="1.42021"
                                        transform="rotate(180 1.41963 1.4202)"
                                        fill="#3056D3"
                                    />
                                </svg>
                            </span>
                        </div>
                    </div>
                    {/* <form className="max-w-xl m-4 p-10 bg-white rounded shadow-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <p className="text-gray-800 font-medium">Customer information</p>
                        <div className="">
                            <label className="block text-sm text-gray-00" htmlFor="cus_name">Name</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_name" name="cus_name" type="text" required="" placeholder="Your Name" aria-label="Name" />
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm text-gray-600" htmlFor="cus_email">Email</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_email" name="cus_email" type="text" required="" placeholder="Your Email" aria-label="Email" />
                        </div>
                        <div className="mt-2">
                            <label className="block text-sm text-gray-600" htmlFor="cus_email">Address</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_email" name="cus_email" type="text" required="" placeholder="Street" aria-label="Email" />
                        </div>
                        <div className="mt-2">
                            <label className="hidden text-sm block text-gray-600" htmlFor="cus_email">City</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_email" name="cus_email" type="text" required="" placeholder="City" aria-label="Email" />
                        </div>
                        <div className="inline-block mt-2 w-1/2 pr-1">
                            <label className="hidden block text-sm text-gray-600" htmlFor="cus_email">Country</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_email" name="cus_email" type="text" required="" placeholder="Country" aria-label="Email" />
                        </div>
                        <div className="inline-block mt-2 -mx-1 pl-1 w-1/2">
                            <label className="hidden block text-sm text-gray-600" htmlFor="cus_email">Zip</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_email" name="cus_email" type="text" required="" placeholder="Zip" aria-label="Email" />
                        </div>
                        <p className="mt-4 text-gray-800 font-medium">Payment information</p>
                        <div className="">
                            <label className="block text-sm text-gray-600" htmlFor="cus_name">Card</label>
                            <input className="w-full px-5 py-1 text-gray-700 bg-gray-200 rounded border" id="cus_name" name="cus_name" type="text" required="" placeholder="Card Number MM/YY CVC" aria-label="Name" />
                        </div>
                        <div className="mt-4">
                            <button className="px-4 py-1 text-black font-light tracking-wider bg-gray-900 rounded border text-lg" onClick={() => createPaymentIntent({ price: product.price })} type="submit">{product.currency == 'usd' ? "$" : null} {product.price}</button>
                        </div>
                    </form> */}
                </div>
            </div>
        </div>
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

export default StripeForm;