import React, { useCallback, useEffect, useState } from 'react';
import StripeForm from './Form/StripeForm';
import '../assets/css/FileUploadStyle.css'; // Import or define your component styles
import { getReuest, postReuest } from "../services/apiService";
import { getUser, useAuth, fetchSubscription, getMySubscription } from "../provider/authProvider";
import MainLayout from '../layout/MainLayout';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import CheckoutStripe from './Form/CheckoutStripe';
import LoadingComponent from '../layout/LoadingComponent';

const CheckoutPage = () => {
    const { package_name } = useParams();
    const [selectedPackage, setSelectedPackage] = useState({});
    const [clientSecret, setClientSecret] = useState();
    const [stripeStatus, setStripeStatus] = useState();
    const user = getUser().user;
    const [profile, setProfile] = useState({});
    const { token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [userPackage, setUserPackage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [isPackageExpired, setIsPackageExpired] = useState(false);

    const fetchPackages = useCallback(() => {
        getReuest(`get/mini-packages`, '').then(res => {
            setPackages(res.packages);
            fetchSubscription();
            setTimeout(() => {
                setUserPackage(getMySubscription());
            }, 1000);
        });
    }, []);

    useEffect(() => {
        if (userPackage) {
            if (moment().format("X") > moment(userPackage?.ends_at).format("X")) {
                setIsPackageExpired(true);
            }
        }
    }, [userPackage]);

    const fetchProfile = (user_id, token) => {
        getReuest(`user/profile/${user_id}`, token).then(res => {
            setProfile(res.user);
            // console.log('profile', res);
        });
    }

    useEffect(() => {
        // // console.log(package_name)
        if (packages.length) {
            const packageSel = packages.find(item => item.title === package_name)
            setSelectedPackage(packageSel);
            // console.log(packageSel, packageSel)
            setUserPackage(getMySubscription());
        }
    }, [package_name, packages]);

    useEffect(() => {
        if (user.id && token) {
            fetchProfile(user.id, token);
            fetchPackages();
            checkSubscription();
        }
    }, []);

    const handlePaymentIntent = (product) => {
        setIsProcessing(true);
        postReuest(product, `create/payment-intent`, token).then(res => {
            // setProfile(res.user);
            // console.log('payment-intent', res);
            setClientSecret(res.payment.client_secret)
            setStripeStatus(res?.stripe_status)
            setIsProcessing(false);
        }).catch(err => {

            setIsProcessing(false);
        });
    }

    const checkSubscription = useCallback(() => {
        setIsProcessing(true);
        postReuest({ subscription_id: null }, `check-stripe-subscription`, token).then(res => {
            // setProfile(res.user);
            console.log('check-subscription', res);
            setIsProcessing(false);
        }).catch(err => {
            console.log('err', err);
            setIsProcessing(false);
        });
    }, [token]);

    const handlePaymentSuccess = () => {
        const data = { type: selectedPackage.title, stripe_status: 'success', quantity: 1, stripe_price: selectedPackage.price };
        setIsProcessing(true);
        postReuest(data, `create/subscription`, token).then(res => {
            // setProfile(res.user);
            // console.log('subscription', res);
            // setClientSecret(res.payment.client_secret)
            setTimeout(() => {
                fetchSubscription();
                setTimeout(() => {
                    setUserPackage(getMySubscription());
                }, 1000);
            }, 2000);
            setIsProcessing(false);
            setClientSecret('')
        }).catch(err => {

            setIsProcessing(false);
        });
    }

    return (
        <MainLayout >
            <LoadingComponent isLoading={isProcessing} />

            <div className="relative pb-[110px] dark:bg-dark lg:px-40 md:px-16 sm:px-8">
                <div className="container mx-auto">
                    <div className="-mx-4 flex flex-wrap items-center">
                        <div className="w-full">
                            {/* <CheckoutStripe clientSecret={clientSecret} /> */}
                            {userPackage?.type && userPackage?.stripe_status=='active' ? <div className='package text-4xl text-center font-bold mb-4 dark:text-white'>
                                You are already subscribed to {userPackage?.type}
                            </div> : null}
                            {/* {clientSecret ? <CheckoutStripe clientSecret={clientSecret} /> : null} */}
                            {selectedPackage ? <StripeForm clientSecret={clientSecret} createPaymentIntent={handlePaymentIntent} handlePaymentSuccess={handlePaymentSuccess} product={selectedPackage} /> : null}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout >
    );
};

export default CheckoutPage;
