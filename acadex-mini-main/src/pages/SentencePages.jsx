import React, { useCallback, useEffect, useState } from 'react';
// import Logo from '../images/logo/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import FormStep1 from './steps/FormStep1';
import FormStep2 from './steps/FormStep2';
import FormStep3 from './steps/FormStep3';
import ExampleStep from './steps/ExampleStep';
import { useAuth, getUser, getMySubscription } from "../provider/authProvider";
import { getReuest, postReuest } from "../services/apiService";
import { all } from 'axios';
import MainLayout from '../layout/MainLayout';
import LoadingOverlay from '../layout/LoadingOverlay';
import LoadingComponent from '../layout/LoadingComponent';

const stepTypes = ['', 'bad', 'normal1', 'normal2', 'grade'];
const allowedPackages = ['Bronze', 'Silver', 'Gold'];

const SentencePages = () => {
    const navigate = useNavigate();
    const { token, get } = useAuth();
    const [step, setStep] = useState(1);
    const [response, setResponse] = useState('');
    const [allResponses, setAllResponses] = useState([]);
    const [grade, setGrade] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(true);
    const [mySubscription, setMySubscription] = useState(null);

    useEffect(() => {
        setIsProcessing(true)
        const my_subscription = getMySubscription();
        setMySubscription(my_subscription);
        console.log('my_subscription', mySubscription?.type);
        console.log('allowedPackages', allowedPackages.includes(mySubscription?.type));
        // setIsFeedbackEnabled(allowedPackages.includes(mySubscription?.type));

        getReuest('responses', token).then(res => {
            console.log('responses', res.responses);
            setAllResponses(res.responses)
            setResponse(res.responses[0].response)
            // if (res.responses?.length > 3) {
            //     navigate('/groups');
            // }
            // setStep(res.responses?.length + 1);
            setIsProcessing(false)
        }).catch(err => {
            setIsProcessing(false)

        });
    }, [token]);

    // useEffect(() => {
    //     console.log(response)
    //     console.log('grade is', grade)
    //     console.log(stepTypes[step])
    // }, [response, step, grade]);

    const handleStep = useCallback(() => {
        const user = getUser().user;
        const shouldUpdate = allResponses.length===0 || allResponses[step - 1]?.response==undefined || (allResponses.length >= step && allResponses[step - 1].response != response && response.length)
        console.log(allResponses[step - 1]?.response)
        console.log(allResponses.length, step, allResponses[step - 1]?.response.length, response?.length)
        console.log('shouldUpdate', shouldUpdate)
        if (shouldUpdate) {

            const data = { response, type: stepTypes[step], teacher_user_id: user.id, grade, id: allResponses[step - 1]?.id || 0 }
            console.log(data)
            postReuest(data, 'submit/response', token).then(res => {
                console.log(res);
                setResponse(allResponses.length ? allResponses[step+1] : '');
                if (step < 4) {
                    setStep(prev => prev + 1)
                } else if (step == 3) {
                    setStep(prev => prev + 1)
                    setGrade(allResponses[step - 1].grade)
                } else {
                    navigate('/groups')
                }
            })
        } else {
            if (step == 4) {
                navigate('/groups')
                return
            }
            setStep(prev => prev + 1)
            setResponse(allResponses[step]?.response)
            if (step == 3) {
                console.log('step', step, allResponses[step])
                setGrade(allResponses[step]?.grade)
            }
        }
    }, [grade, step, response, allResponses]);

    return (
        <MainLayout >
            <LoadingComponent isLoading={isProcessing} />
            <div className="flex flex-col px-20 py-10">
                <div className='flex text-6xl text-black font-normal py-4 px-10'>Welcome!</div>
                {!isFeedbackEnabled ? <div className='flex text-danger'>
                    <h2 className=' pl-8 text-danger font-medium'>Available only for paid account!</h2> 
                    <Link to="/pricing" className='px-2 underline'>
                        Click here
                    </Link>
                    to check our pricing
                </div>: null}  
                {step === 1 ? <FormStep1 response={response} setResponse={setResponse} /> : null}
                {step === 2 ? <FormStep2 response={response} setResponse={setResponse} /> : null}
                {step === 3 ? <FormStep3 response={response} setResponse={setResponse} /> : null}
                {step === 4 ? <ExampleStep response={response} setResponse={setResponse} grade={grade} setGrade={setGrade} /> : null}

                <div className='flex justify-end'>
                    <button disabled={!response?.length || !isFeedbackEnabled} className={`${!response?.length || !isFeedbackEnabled ? 'bg-gray text-graydark' : 'bg-primary text-white hover:bg-boxdark'} font-bold py-2 px-4 rounded m-4 ${step === 4 ? 'text-green bg-success' : ''}`} onClick={() => handleStep()}>
                        {step < 4 ? 'NEXT' : 'COMPLETE'}
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default SentencePages;
