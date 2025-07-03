import React from 'react';
// import Logo from '../images/logo/logo.png';

const FormStep1 = ({ response, setResponse }) => {
    return (
        <div className='shadow-xl p-10 rounded-2xl text-black'>
            <div className='flex text-3xl font-normal'>How would respond to this bad sentence?</div>
            <div className='flex text-md font-normal'>This will your stylized type of feedback used to grade all your papers</div>
            <div className='flex justify-center px-20 my-6'>
                <p className='w-full lg:w-3/5 text-center'>“The moon typically rotates around the earth, so the moon rotates around earth. We often see the moon like never, and we need the moon sometimes bro.”</p>
            </div>
            <div className='flex text-xl font-normal'>Give us feedback that would be considered your “harsh” feedback</div>


            <div className="">
                <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={12}
                    className="w-full rounded-2xl border-[2px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-blackr dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
            </div>
        </div>
    );
};

export default FormStep1;
