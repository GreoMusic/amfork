import React, { useCallback } from 'react';
import LoadingButton from './LoadingButton';
import { downloadDocx } from '../../utils/docxDownload'
import ToastAlert from './ToastAlert';
import { FiDownloadCloud } from 'react-icons/fi';
import { Button } from './new/Button';

const DownloadAllFeedback = ({ files = [], isAllowedToEvaluate, isProcessing, group }) => {
    const downloadAllFeedback = useCallback(async () => {
        console.log(files)
        if (!files.length) {
            ToastAlert('No file!', "No feedback to download", "1");
            return false;
        }
        const responses = [];

        for (const feedback of files) {
            console.log(feedback)
            responses.push(feedback.file_path.split('/')[1])
            responses.push('\n')
            responses.push(feedback.response)
            responses.push('\n')
            responses.push('\n')
            responses.push('')
            responses.push('\n')
            responses.push('\n')
            responses.push('')
            // responses = responses ? `${responses} ${feedback.file_path.split('/')[1]} \n ${feedback.response ?? ''}\n\n\n` : `${feedback.file_path.split('/')[1]} \n ${feedback.response ?? ''}\n\n\n`;

        };
        downloadDocx(responses, group.title);
    }, [files]);


    return (
        <>
            {/* <LoadingButton isDisabled={!isAllowedToEvaluate} isLoading={isProcessing} handleOnClick={() => downloadAllFeedback()} btnClasses={`w-full md:w-auto flex justify-center md:flex-none ${!isAllowedToEvaluate ? 'opacity-50' : ''}`}>
                Download Feedback
            </LoadingButton> */}
            <Button
                className={`w-full md:w-auto flex justify-center md:flex-none ${!isAllowedToEvaluate ? 'opacity-20' : ''}`}
                icon={FiDownloadCloud}
                onClick={downloadAllFeedback}
                disabled={!isAllowedToEvaluate}
            >
                Download Feedback
            </Button>
        </>
    );

};

export default DownloadAllFeedback;
