import React, { useCallback, useState } from 'react';
import { FiDownloadCloud, FiDownload, FiEdit, FiCheck, FiXCircle, FiTrash2 } from 'react-icons/fi';
import LoadingButton from './LoadingButton'; // Adjust the path as necessary
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { downloadDocx } from '../../utils/docxDownload'
import { calculatePercentage, getGradeColor } from '../../utils/helper';
import { postReuest } from '../../services/apiService';
import { useAuth } from '../../provider/authProvider';
import ToastAlert from './ToastAlert';

const PaperCard = ({
    file,
    idx,
    checkedList,
    handleCheckboxChange,
    group,
    siteUrl,
    isAllowedToEvaluate,
    isProcessing,
    evaluatePaper,
    analyzePaper,
    fetchAnalysis,
    openResponse,
    total,
    refetchFiles
}) => {
    const [titleEditMode, setTitleEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState(null);
    const { token } = useAuth();

    const handleDownload = (file) => {
        const responses = [];
        const fileName = file.file_path.split("/")[1];

        responses.push(fileName);
        responses.push('\n');
        responses.push('')
        responses.push('\n')
        responses.push(file.response);
        downloadDocx(responses, fileName)
    }

    const handleTitleInputChange = (e) => {
        console.log(e.target.value);
        setEditedTitle(prev => { return { id: prev.id, filename: e.target.value } })
    }

    const handleEditMode = (mode, id, filename) => {
        setTitleEditMode(mode);
        if (mode) {
            setEditedTitle({ id, filename: filename.split('.')[0] });
        } else {
            setEditedTitle(null);

        }
    }

    const handleUpdateFilename = useCallback((e) => {
        e.preventDefault();
        console.log('submitted editedTitle');
        console.log(editedTitle);


        postReuest(editedTitle, `update/file-path`, token).then(res => {
            console.log('file rename', res);
            if (res.error) {
                ToastAlert('Error Subscription cancellation!', res.error, "2");

            } else {
                ToastAlert('Successful!', "File renamed successfully!", "0")
            }
            refetchFiles();
            handleEditMode(false);
        });
    }, [editedTitle])

    const handleFileDelete = (file) => {
        const c = confirm('Deleting file "' + file.file_path.split('/')[1] + '"!\n\nAre you sure?')
        if (c) {
            postReuest({ file_id: file.id }, `delete/file`, token).then(res => {
                console.log('file delete', res);
                if (res.error) {
                    ToastAlert('Error deleting file!', res.error, "2");

                } else {
                    ToastAlert('Successful!', "File deleted successfully!", "0")
                }
                refetchFiles();
                handleEditMode(false);
            });
        }

    }

    return (
        <div className="w-full px-4 md:w-1/2 xl:w-1/3 rounded-xl ">
            <div className="mb-10 min-h-[250px] overflow-hidden rounded-lg bg-white shadow-3 duration-300 hover:shadow-3 dark:bg-dark-2 dark:shadow-card dark:hover:shadow-3 dark:border dark:bg-boxdark">
                <div className="px-2 py-3 relative">
                    <h1 className='text-black text-md font-bold mb-0 w-full flex justify-between'>
                        <div className='flex justify-between w-full'>
                            <input
                                type="checkbox"
                                value={file.id}
                                checked={checkedList.includes(file.id)}
                                onChange={() => handleCheckboxChange(file.id)}
                                className="w-4 h-4 mx-2 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className='float-right mx-2'> {idx + 1}/{total}</span>

                            <div className='flex'>
                                {titleEditMode ?
                                    <FiXCircle className='ml-3 mt-1 w-6 h-6' onClick={() => handleEditMode(false)} /> :
                                    <FiEdit className='ml-3 mt-1 text-xl cursor-pointer text-primary' onClick={() => handleEditMode(true, file.id, file.file_path.split('/')[1])} />
                                }
                                <FiTrash2 className="mb-2 text-2xl cursor-pointer text-danger ml-2" onClick={() => handleFileDelete(file)} />
                            </div>

                        </div>
                    </h1>

                    <h1 className='text-black text-md font-bold mb-4 w-full flex justify-between'>
                        <div className="flex text-center w-full">

                            {titleEditMode && editedTitle ?
                                <div className='flex w-full'>
                                    <form action="post" className='w-full' onSubmit={handleUpdateFilename}
                                    // onBlur={() => handleEditMode(false, file.id, file.file_path.split('/')[1])}
                                    >
                                        <label htmlFor="search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                                        <div className="relative w-full">

                                            <input type="search" id="search" className="block w-full p-4 ps-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="filename" value={editedTitle.filename} onChange={(e) => handleTitleInputChange(e)} required />
                                            <button type="submit" className="text-white absolute end-1 bottom-2.5 bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                                <FiCheck className='w-4 h-4 font-bold text-white bg-primary' />
                                            </button>
                                        </div>

                                    </form>
                                </div>
                                :
                                <div>{file.id}: {file.file_path.split('/')[1]}</div>
                            }
                        </div>

                    </h1>

                    <h1 className={`text-center ${getGradeColor(group?.total_points, file.obtained_points, file.is_complete)} text-2xl font-bold mb-1`}>
                        {file.obtained_points}/{group?.total_points}
                    </h1>
                    <p className={`text-center text-base ${getGradeColor(group?.total_points, file.obtained_points)} mb-3`}>({calculatePercentage(group?.total_points, file.obtained_points)}%)</p>

                    {/* <LoadingButton 
                            isDisabled={isProcessing} 
                            isLoading={isProcessing} 
                            handleOnClick={() => analyzePaper(file)} 
                            btnClasses={`text-right ${!isAllowedToEvaluate ? 'bg-gray text-black' : 'bg-primary text-white'} text-sm border-2 px-4 py-1 rounded-full font-medium`}
                        >
                            ANALYZE
                    </LoadingButton>
                    <LoadingButton 
                            isDisabled={isProcessing} 
                            isLoading={isProcessing} 
                            handleOnClick={() => fetchAnalysis(file)} 
                            btnClasses={`text-right ${!isAllowedToEvaluate ? 'bg-gray text-black' : 'bg-primary text-white'} text-sm border-2 px-4 py-1 rounded-full font-medium`}
                        >
                            Fetch Analysis
                    </LoadingButton> */}

                    <p className={`text-center ${file.is_complete == 1 ? 'text-success' : 'text-black'} text-sm`}>
                        {file.is_complete == 1 ? 'Done' : 'Not graded yet'}
                    </p>
                    <p className="mb-4 text-base leading-relaxed text-body-color">
                        {group?.files}
                    </p>
                    <div className='flex justify-between absolute top-[210px] w-full pr-4'>
                        <LoadingButton
                            isDisabled={!isAllowedToEvaluate}
                            isLoading={isProcessing}
                            handleOnClick={() => evaluatePaper(file.id)}
                            btnClasses={`text-right ${!isAllowedToEvaluate ? 'bg-gray text-black' : 'bg-primary text-white'} text-sm border-2 px-4 py-1 rounded-full font-medium`}
                        >
                            EVALUATE
                        </LoadingButton>
                        {file.response ? <FiDownload className="mb-2 text-2xl cursor-pointer" onClick={() => handleDownload(file)} /> : null}
                        <a className="text-center dark:text-white" href={siteUrl + '/' + file.file_path}>
                            <FiDownloadCloud className="mb-2 text-2xl cursor-pointer" />

                        </a>
                        {file.response ?
                            <LoadingButton
                                isLoading={isProcessing}
                                handleOnClick={() => openResponse(file)}
                                btnClasses="text-right text-black bg-secondary text-sm border-2 border-secondary px-4 py-1 rounded-full font-medium dark:text-graydark"
                            >
                                VIEW
                            </LoadingButton> : <p className='text-white'>.</p>}
                    </div>
                    {/* {file.pre_analysis==null || file.pre_analysis?.split('-*-').length > 1 ? <div className='text-yellow-500 text-sm text-center'>Wait for the pre analysis to complete</div> : null} */}
                </div>
            </div>
        </div>
    );
};

export default PaperCard;
