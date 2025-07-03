
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import { tAndCPdfUrl } from '../../services/apiService';


const TermsAndConditions = () => {
    const [showModal, setShowModal] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const goToPrevPage = () => {
        setPageNumber(pageNumber - 1);
    };

    const goToNextPage = () => {
        setPageNumber(pageNumber + 1);
    };

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowModal(false);
        }
    };

    return (
        <span className=''>

            <button type='button' className='text-primary dark:text-secondary' onClick={() => setShowModal(true)}> Terms & Services</button>

            {showModal ? <>
                <div
                    className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none" onClick={handleBackgroundClick}
                >
                    <div className="relative w-auto my-6 mx-auto sm:mx-12 lg:mx-24">
                        {/*content*/}
                        <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white dark:bg-gray-800 outline-none focus:outline-none">
                            {/*header*/}
                            <div className="bg-white flex  items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">

                                <div className="w-full flex items-start justify-between">
                                    <h3 className="w-full text-3xl font-semibold">
                                        Acadex Terms & Conditions
                                    </h3>
                                    <button
                                        className="p-1 ml-auto bg-white border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                        onClick={() => setShowModal(false)}
                                    >
                                        <span className="bg-white text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                                            X
                                        </span>
                                    </button>
                                </div>
                            </div>
                            {/*body*/}

                            <div className="flex justify-end ">
                                <Document file={tAndCPdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                    <Page pageNumber={pageNumber} />
                                </Document>
                                <div className='fixed bottom-8 bg-white'>
                                    <button type='button' className='bg-primary p-4 text-white mx-4 disabled:bg-gray disabled:text-black' disabled={pageNumber <= 1} onClick={goToPrevPage}>
                                        Previous
                                    </button>
                                    <span>
                                        Page {pageNumber} of {numPages}
                                    </span>
                                    <button type='button' className='bg-primary p-4 text-white mx-4 disabled:bg-gray disabled:text-black' disabled={pageNumber >= numPages} onClick={goToNextPage}>
                                        Next
                                    </button>


                                </div>
                            </div>
                            {/*footer*/}
                            {/* <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                                <button
                                    className="bg-danger text-white background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                >
                                    X Close
                                </button>
                            </div> */}
                        </div>
                    </div>
                </div>
                <div className="opacity-75 fixed inset-0 z-40 bg-black"></div>
            </> : null}
        </span>
    );
};

export default TermsAndConditions;