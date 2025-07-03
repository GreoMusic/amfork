import React from 'react';

const FormStep2 = ({ response, setResponse }) => {
    return (
        <div className='shadow-xl p-10 rounded-2xl'>
            <div className='flex text-3xl text-whitefont-normal'>How would respond to this normal sentence?</div>
            <div className='flex text-md text-whitefont-normal'>This will your stylized type of feedback used to grade all your papers</div>
            <div className='flex justify-center px-20 my-6'>
                <p className='w-full lg:w-3/5 text-center'>“Dogs, while they may lack a sense of eyesight, often make up for it in their superb hearing. Dogs typically use their hearing to alert their owners of the environment around them!”</p>
            </div>
            <div className='flex text-xl text-whitefont-normal'>Give us feedback that would be considered your “normal” feedback</div>


            <div className="">
                <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={12}
                    className="w-full rounded-2xl border-[2px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                ></textarea>
            </div>
        </div>
    );
};

export default FormStep2;
