import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { postReuest } from '../../services/apiService';
import { getUser, useAuth } from '../../provider/authProvider';
import useCachedData from '../../hooks/useCachedData';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../../layout/LoadingOverlay';
import LoadingComponent from '../../layout/LoadingComponent';


const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({product = null}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [email, setEmail] = useState('');
    const [subscription, setSubscription] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { token } = useAuth();
    const user = getUser().user;
    const [priceId, setPriceId] = useState(null);
    const { data, isLoading, isError, refetchData } = useCachedData('fetch-stripe-price-plans', token);

    useEffect(() => {
        setEmail(user.email);
    }, [user]);

    useEffect(() => {
        console.log(data?.price_plans);
        console.log(product);
        if (data && product) {
            const selected = data.price_plans.find(item => item.unit_amount_decimal == product.price * 100);
            if (selected)
                setPriceId(selected.id);
            console.log('selected', selected);
        }
    }, [data, product]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) {
            return;
        }
        setIsProcessing(true);

        const cardElement = elements.getElement(CardElement);
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            console.error(error);
            setIsProcessing(false);
        } else {
            postReuest({
                payment_method_id: paymentMethod.id,
                email: email,
                price_id: priceId // Replace with your actual price_id
            }, `create-stripe-subscription`, token).then(res => {
                // setProfile(res.user);
                setSubscription(res.data);
                console.log('payment-store', res);
                setIsProcessing(false);
            }).catch(err => {
                console.log('err', err);
                setIsProcessing(false);
            });
            

            // setSubscription(res.data);
        }
    };

    if (isProcessing) {
        return (<LoadingComponent isLoading={isProcessing} />);

    }

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
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                </div>
                <CardElement className='border px-4 py-2 rounded-lg my-4' />
                
                <button type="submit" className={`${!stripe || !priceId ? 'bg-secondary' : 'bg-primary'} text-xl rounded text-white rounded py-2 w-full`} disabled={!stripe || !priceId}>
                    Subscribe to {product?.title}
                </button>
                {subscription && <div>Subscription ID: {subscription.id}
                </div>}
        </form>
    );
};

const App = ({product}) => (
    <Elements stripe={stripePromise}>
        <div className='md:w-3/5 mx-auto'>
            <CheckoutForm product={product}  />
        </div>
    </Elements>
);

export default App;
