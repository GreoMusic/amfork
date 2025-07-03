import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LoadingOverlay from '../../layout/LoadingOverlay';
import { useState } from 'react';
import ToastAlert from '../components/ToastAlert';
import { useAuth } from '../../provider/authProvider';
import { postReuest } from '../../services/apiService';
import LoadingComponent from '../../layout/LoadingComponent';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, paymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { token } = useAuth();


    const savePayment = (payment) => {
        setIsProcessing(true);
        console.log('savePayment', payment)
        const { amount, id, currency, object, payment_method, status, receipt_email, payment_method_types, created } = payment;
        if (payment) {
            postReuest({ amount, payment_id: id, currency, object, payment_method, status, receipt_email, payment_method_types: payment_method_types.join(','), payment_made_at: created }, `store-payment`, token).then(res => {
                // setProfile(res.user);
                console.log('payment-store', res);
                setIsProcessing(false);
            }).catch(err => {
                console.log('err', err);
                setIsProcessing(false);
            });
        }
    }

    const handleSubmit = async (event) => {
        setIsProcessing(true);
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not loaded yet
            setIsProcessing(false);
            return;
        }

        // Use the card element to confirm the PaymentIntent
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        });

        if (result.error) {
            ToastAlert('Error', 'Payment Error: ' + result.error.message, "2");
            console.log('Payment Error: ')
            setIsProcessing(false);
            console.error(result.error.message);
        } else {
            // Payment succeeded, handle the success
            ToastAlert('Success', "Paid successfully!", "0")
            console.log(result.paymentIntent);
            savePayment(result.paymentIntent);
            console.log("this payment", result);
            paymentSuccess();
            setIsProcessing(false);
        }
    };

    return (
        <>
            <LoadingComponent isLoading={isProcessing} />

            <form className="max-w-xl m-4 p-10 bg-white rounded shadow-xl mx-auto" onSubmit={handleSubmit}>
                <CardElement className='border px-4 py-2 rounded-lg my-4' />
                <button className='bg-primary py-4 text-white border px-4 py-2 rounded-lg my-4' type="submit" disabled={!stripe}>
                    Pay
                </button>
            </form>
        </>
    );
};

const StripePayment = ({ clientSecret, paymentSuccess }) => (
    <Elements stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} paymentSuccess={paymentSuccess} />
    </Elements>
);

export default StripePayment;
