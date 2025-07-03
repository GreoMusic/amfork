
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import DocxViewer from '../../components/shared/DocxViewer';
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


const PDFViewerModal = ({ file, isPdf }) => {
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
    return (
        <div className=''>

            {!isPdf ? 
                <DocxViewer content={file} /> : 
                <>
                    <Document file={`${file}`} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                    <div className='fixed bottom-32 bg-white ml-20'>
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
                </>
            }
        </div>
    );
};

export default PDFViewerModal;