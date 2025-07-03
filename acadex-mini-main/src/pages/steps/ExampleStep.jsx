import React from 'react';

const ExampleStep = ({ response, setResponse, grade, setGrade }) => {

    return (
        <>
            <div className='flex'>
                <div className="w-1/2 rounded-2xl shadow-xl p-6 mx-4">
                    <h1 className='text-center text-whitetext-2  font-bold mb-6'>
                        Business Essay Example
                    </h1>
                    <p>
                        An article in Harvard Business Review's September 2012 issue stresses upon the importance of carefully picking a brand name in China and this even applies to global brand names with high brand recognition rates worldwide. The article mentions that choosing the right brand name is more difficult task in China than in most other countries because Chinese language is quite complex, with thousands of characters and each with many meanings and pronunciations. The article suggests four strategies for adopting a brand name in China which include leaving the brand name intact in China (No Adaptation), choosing a brand name with similar sound (Sound Adaptation), choosing a brand name with similar meaning though different sound (Meaning Adaptation, and choosing a brand name with quite similar sound and meaning (Dual Adaptation) (Fetscher, Alon, Littrell, & Chan, 2012).
                        This article is an interesting and important read because it reminds us of the importance of taking into account cultural differences when doing business overseas. This also explains why it is important to do comprehensive marketing research to avoid costly mistakes and why it sometimes pays to partner with a local firm which may better understand the local trends and culture. We are also reminded that a global brand name is not always transferable to an international market and, thus, the importance of creating a single brand identity on a global scale may have been exaggerated. Another thing we are reminded of after reading the article is that brands are important communication tools and help create perceptions of the company and its products in consumers' minds.
                    </p>
                    <p>Reference</p>
                    <p>Fetscher, M., Alon, I., Littrell, R., & Chan, A. (2012, September). In China? Pick Your Brand Name Carefully. Harvard Business Review, p. 26.</p>
                </div>
                <div className="w-1/2 rounded-2xl shadow-xl p-6 mx-4">
                    <h1 className='text-center text-whitetext-2xl font-bold mb-6 flex'>
                        How would you grade this paper? Grade  <input className='w-15 border-[2px] border-stroke mx-2' value={grade} onChange={(e) => setGrade(parseInt(e.target.value))} />/ 100
                    </h1>
                    <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={24}
                        className="w-full rounded-2xl border-[2px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    ></textarea>
                </div>
            </div>
        </>
    );
};

export default ExampleStep;
