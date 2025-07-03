import React, { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { postReuest } from '../../services/apiService';
import { getMySubscription, getUser, useAuth } from '../../provider/authProvider';
import useCachedData from '../../hooks/useCachedData';
import ToastAlert from '../components/ToastAlert';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const SubscriptionPaymentForm = ({ product = null }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [email, setEmail] = useState('');
    const [subscription, setSubscription] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { token } = useAuth();
    const user = getUser().user;
    const [priceId, setPriceId] = useState(null);
    const { data, isLoading, isError, refetchData } = useCachedData('fetch-stripe-price-plans', token);
    // console.log(data)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if(localStorage.getItem('isDarkMode')!==null && localStorage.getItem('isDarkMode')==='true'){
            return true;
        }
        return false;

    });


    useEffect(() => {
        const myPackage = getMySubscription()
        // console.log('myPackage', myPackage)
        if (myPackage) {
            const package_ends = Date.parse(myPackage.ends_at)
            const now_time = Date.now()
            setSubscription(myPackage);
            // console.log('now_time', now_time)
            // console.log('package_ends', package_ends)
            // console.log('bool', package_ends > now_time)
            // setDisablePayBtn(package_ends > now_time)
        }
    }, []);

    useEffect(() => {
        setEmail(user.email);
    }, [user]);

    // useEffect(() => {
    //     if(token.length && pricePlans.length===0){
    //         setIsProcessing(true);
    //         fetchStripePricePlansReuest(token).then(res => {
    //             console.log(res)
    //             setIsProcessing(false);
    //             setPricePlans(res.price_plans);
    //         }).catch(err => {
    //             console.log('err', err);
    //             setIsProcessing(false);
    //         });
    //     }
    // }, [token]);

    useEffect(() => {
        console.log('price_plans', data);
        if (data?.error) {
            localStorage.removeItem(`cachedData-fetch-stripe-price-plans`);
            setTimeout(() => {
                refetchData();
            }, 1000);
        }
        console.log(product);
        if (data && product) {
            const selected = data.price_plans?.find(item => item.unit_amount_decimal == product.price * 100);
            if (selected)
                setPriceId(selected.id);
            console.log('selected', selected);
        }
    }, [data, product]);

    const handleSubmit = async (event) => {
        console.log('Form submitted');
        event.preventDefault();
        if (!stripe || !elements) {
            console.error('CardElement not found');
            return;
        }
        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            console.error('CardElement not found');
            setIsProcessing(false);
            return;
        }
        console.log('CardElement found ');

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                email: user.email,
            },
        });
        console.log('paymentMethod created found ');

        if (error) {
            console.log('paymentMethod error found ');
            setIsProcessing(false);
            console.error(error);
        } else {
            postReuest({
                amount: product.price * 100,
                payment_method_id: paymentMethod.id,
                email: email,
                type: product.title,
                price_id: priceId // Replace with your actual price_id
            }, `create-stripe-subscription`, token).then(res => {
                // setProfile(res.user);
                setSubscription(res.my_subscription);
                console.log('payment-store', res);
                setIsProcessing(false);
                cardElement.clear();
                cardElement.destroy();
                if (res.error) {
                    ToastAlert('Error Subscription!', `${res.error}`, "2");
                } else {
                    ToastAlert('Success', `You are successfully subscribed to ${product.title} package!`);
                }
            }).catch(err => {
                console.log('err', err);
                setIsProcessing(false);
            });

        }
    };

    const isDisabledPayBtn = useMemo(() => !stripe || !priceId || isProcessing || (subscription?.stripe_status === 'active' && subscription?.type!='Demo'), [stripe, priceId, isProcessing, subscription]);

    const cardElementOptions = useMemo(() => {
        console.log('isDarkMode', isDarkMode)
        return {
        style: {
            base: {
                color: isDarkMode ? '#ffffff' : '#000000',
                '::placeholder': {
                    color: isDarkMode ? '#ffffff' : '#aab7c4',
                },
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
            },
        },
    }}, [isDarkMode]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <label htmlFor="default-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    id="default-input"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:bg-black" />
            </div>
            <CardElement className='border px-4 py-2 rounded-lg my-4 dark:text-light' options={cardElementOptions} />
            <button type="submit" className={`${isDisabledPayBtn ? 'bg-secondary' : 'bg-primary'} text-xl rounded text-white rounded py-2 w-full`} disabled=
                {isDisabledPayBtn}>
                Subscribe to {product?.title}
                {isProcessing ?
                    <svg aria-hidden="true" role="status" className="inline w-6 h-6 ml-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2" />
                    </svg> : null}
            </button>

            {/* {priceId}
            <br />
            {isProcessing ? 'processing' : 'not processing'}
            <br />
            {subscription?.stripe_status}
            <br />
            {JSON.stringify(stripe)} */}


        </form>
    );
};

const App = ({ product }) => (
    <Elements stripe={stripePromise}>
        <div className='md:w-3/5 mx-auto'>
            <SubscriptionPaymentForm product={product} />
        </div>
    </Elements>
);

export default App;
