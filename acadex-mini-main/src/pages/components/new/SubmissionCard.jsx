import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { calculatePercentage, getGradeColor, getLetterGrade } from '../../../utils/helper';
import { FiEdit, FiRepeat, FiTrash, FiXCircle, FiCheck, FiDownloadCloud, FiDownload, FiActivity, FiMoreVertical, FiEye } from 'react-icons/fi';
import { postReuest } from '../../../services/apiService';
import { useAuth } from '../../../provider/authProvider';
import ToastAlert from '../ToastAlert';
import { downloadDocx } from '../../../utils/docxDownload';
import DropdownPortal from './DropDownPortal';

export const SubmissionCard = ({
    evaluatePaper,
    group,
    submission,
    index,
    onCheckboxChange,
    refetchFiles,
    isDropdownOpen,
    onDropdownToggle,
    openResponse,
}) => {
    const filename = submission.file_path.split('/')[1];
    const timeAgo = moment(submission.created_at).fromNow();
    const perc = calculatePercentage(group.total_points, submission.obtained_points);
    const grade = getLetterGrade(perc);
    const gradeColor = getGradeColor(group.total_points, submission.obtained_points, submission.is_complete);

    const [titleEditMode, setTitleEditMode] = useState(false);
    const [editedTitle, setEditedTitle] = useState(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const { token } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is on the dropdown menu or its children
            if (event.target.closest('.action-element')) {
                return; // Don't close if clicking inside dropdown menu
            }

            if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
                onDropdownToggle(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);


    const handleDownload = (submission, type) => {
        const responses = [];
        const fileName = submission.file_path.split("/")[1];

        responses.push(fileName);
        responses.push('\n');
        responses.push('')
        responses.push('\n')
        if (type === 'content')
            responses.push(submission.response);
        else if (type === 'response')
            responses.push(submission.response);
        else
            responses.push(submission.pre_analysis);
        downloadDocx(responses, fileName)
    }

    const handleTitleInputChange = (e) => {
        console.log(e.target.value);
        setEditedTitle(prev => { return { id: prev.id, filename: e.target.value } })
    }

    const handleEditMode = (mode, id, filename) => {
        setTitleEditMode(mode);
        if (mode) {
            onDropdownToggle(id);
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
            console.log('submission rename', res);
            if (res.error) {
                ToastAlert('Error Subscription cancellation!', res.error, "2");

            } else {
                ToastAlert('Successful!', "File renamed successfully!", "0")
            }
            refetchFiles();
            handleEditMode(false);
        });
    }, [editedTitle])

    const handleFileDelete = (submission) => {
        console.log('submission delete', submission);
        const c = confirm('Deleting submission "' + submission.file_path.split('/')[1] + '"!\n\nAre you sure?')
        if (c) {
            postReuest({ file_id: submission.id }, `delete/file`, token).then(res => {
                console.log('submission delete', res);
                if (res.error) {
                    ToastAlert('Error deleting submission!', res.error, "2");

                } else {
                    ToastAlert('Successful!', "File deleted successfully!", "0")
                }
                refetchFiles();
                handleEditMode(false);
            });
        }

    }

    const handleDropdownClick = (e) => {
        // Get the button's bounding rectangle
        const rect = e.currentTarget.getBoundingClientRect();
        console.log(rect.bottom, window.scrollY);
        let fromBottom = 0;
        if (rect.bottom > 300)
            fromBottom = 300;
        // Adjust the position as needed (here we position it so that the dropdown appears below the button)
        setDropdownStyle({
            position: 'absolute',
            top: rect.bottom + window.scrollY - fromBottom + 'px',
            left: rect.left + window.scrollX - 220 + 'px'
        });
        onDropdownToggle();
    };

    return (
        <div
            className="card-element bg-white p-4 rounded-2xl shadow-md apple-hover fade-in-up"
            style={{ animationDelay: `${0.8 + index * 0.1}s` }}
        >

            <div className="flex justify-between items-start h-full gap-4">
                <div className="flex-1 min-h-[80px] flex items-center">

                    {titleEditMode && editedTitle ?
                        <div className='flex w-full'>
                            <form action="post" className='w-full' onSubmit={handleUpdateFilename}
                            // onBlur={() => handleEditMode(false, submission.id, submission.file_path.split('/')[1])}
                            >
                                <label htmlFor="search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                                <div className="relative w-full">

                                    <input type="search" id="search" className="block dark:bg-black pr-10 w-full p-4 ps-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="filename" value={editedTitle.filename} onChange={(e) => handleTitleInputChange(e)} required />
                                    <button type="submit" className="text-white absolute end-1 bottom-2.5 bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                        <FiCheck className='w-4 h-4 font-bold text-white bg-primary' />
                                    </button>
                                </div>

                            </form>
                        </div>
                        :
                        <div className='flex flex-col justify-center'>
                            <p className="text-lg text-black">{filename} - <span className="text-sm text-gray-500 dark:text-gray">Submitted: {timeAgo}</span></p>
                            <div className="flex">
                                <p className={`mt-2 font-bold ${gradeColor}`} title={submission.obtained_points}>Grade: {submission.is_complete ? grade : 'N/A'}</p>
                                {submission.is_complete ? <p className="mt-2 ml-2 text-gray-700 dark:text-white">{submission.obtained_points} / {group.total_points}</p> : null}
                            </div>

                        </div>
                    }
                </div>
                <div className="dropdown-container flex flex-col items-end justify-start h-full min-h-[80px] gap-2">
                    <div className='p-2 hover:bg-gray-100 rounded-full'>
                        <input type="checkbox" className="w-4 h-4" onChange={() => onCheckboxChange(submission.id)} />
                    </div>

                    <div className="relative">
                        {titleEditMode ?
                            <button
                                onClick={() => setTitleEditMode(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiXCircle className="text-red-600 w-5 h-5" />
                            </button> : <button
                                onClick={handleDropdownClick}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiMoreVertical className="text-gray-600 dark:text-white w-5 h-5" />
                            </button>
                        }

                        {isDropdownOpen && (
                            <DropdownPortal>
                                <div style={{ width: '256px', ...dropdownStyle }} className="bg-gray dark:bg-graydark dark:text-white action-element absolute top-full right-0 w-64 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                console.log('View button clicked');
                                                console.log('Submission:', submission);
                                                console.log('openResponse function:', openResponse);
                                                openResponse(submission);
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full"
                                        >
                                            <FiEye className="mr-3" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => {
                                                evaluatePaper(submission.id);
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full"
                                        >
                                            <FiRepeat className="mr-3" />
                                            Evaluate Paper
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleEditMode(true, submission.id, submission.file_path.split('/')[1]);
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full"
                                        >
                                            <FiEdit className="mr-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDownload(submission, 'response');
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full text-left"
                                        >
                                            <FiDownloadCloud className="mr-3" />
                                            Response Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDownload(submission, 'content');
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full text-left"
                                        >
                                            <FiDownload className="mr-3" />
                                            Content Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDownload(submission, 'pre-analysis');
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full text-left"
                                        >
                                            <FiActivity className="mr-3" />
                                            Pre-Analysis Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleFileDelete(submission);
                                                onDropdownToggle(submission.id);
                                            }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-3 hover:dark:bg-black  w-full border-t"
                                        >
                                            <FiTrash className="mr-3 text-red-600" />
                                            <span className="text-red-600">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </DropdownPortal>
                        )}
                    </div>
                </div>


            </div>
        </div>
    )
};