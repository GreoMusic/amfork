import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, getMySubscription } from "../provider/authProvider";
import MainLayout from '../layout/MainLayout';
import FileUpload from './Form/FileUpload';
import { getReuest, postReuest, packages, postOllamaRequest } from "../services/apiService";
import { useParams } from 'react-router-dom';
import Switcher from './components/Switcher';
import Profile from './components/Profile';
import LoadingButton from './components/LoadingButton';
import PDFViewerModal from './components/PDFViewerModal';
import ReadMore from './components/ReadMore';
import { FiChevronLeft } from 'react-icons/fi';
import { Link } from "react-router-dom";
import PaperCard from './components/PaperCard';
import { allGrades, gradeRanges, calculatePercentage, getLetterGrade } from '../utils/helper';
import moment from 'moment';
import momentZone from 'moment-timezone';

import '../assets/css/FileUploadStyle.css'; // Import or define your component styles
import ToastAlert from './components/ToastAlert';
import DocxViewer from '../components/shared/DocxViewer';
import DownloadAllFeedback from './components/DownloadAllFeedback';
import LoadingComponent from '../layout/LoadingComponent';
import Collapsible from '../components/shared/Collapsible';
import PaperManagementInstruction from '../newComponents/PaperManagementInstruction';
import BottomStepper from './components/BottomStepper';

const host = window.location.hostname
const siteUrl = host === 'localhost' ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL_PROD;
const apiUrl = siteUrl + '/api';

const instructionModalTexts = ['Upload files', 'Grade files', 'Upload & grade files to complete the tutorial'];

const FileList = () => {
    const [files, setFiles] = useState([]);
    const [gradedFiles, setGradedFiles] = useState([]);
    const { token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [response, setResponse] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [group, setGroup] = useState('');
    const [isUploadPage, setIsUploadPage] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [obtainedPoints, setObtainedPoints] = useState('');
    const [selectedFileId, setSelectedFileId] = useState(0);
    const [checkedList, setCheckedList] = useState([]);
    const [selectedPdfFile, setSelectedPdfFile] = useState('');
    const [thisMonthUsage, setThisMonthUsage] = useState(null);
    const [isAllowedToUpload, setIsAllowedToUpload] = useState(false);
    const [isAllowedToEvaluate, setIsAllowedToEvaluate] = useState(false);
    const [isSydneyPlusEnabled, setIsSydneyPlusEnabled] = useState(false);
    const [isGoldUser, setIsGoldUser] = useState(false);
    const [mySubscription, setMySubscription] = useState({});
    const [isDemoTrialEnded, setIsDemoTrialEnded] = useState(false);
    const [isPdf, setIsPdf] = useState(false);
    const [selectedPdfFilePath, setSelectedPdfFilePath] = useState('');
    const [responseDocx, setResponseDocx] = useState(null);
    const [isAllPreAnalyzed, setIsAllPreAnalyzed] = useState(false);
    const [step, setStep] = useState(0);
    const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
    const [preventReload, setPreventReload] = useState(false);
    const [bottomStep, setBottomStep] = useState(0);
    const [isWaitingForUserAction, setIsWaitingForUserAction] = useState(false);
    const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);

    let { group_id } = useParams();



    useEffect(() => {
        console.log('step', step);
        setBottomStep(step);
        if (step == 2) {
            setPreventReload(true);
            setIsUploadPage(false);
        } else {
            setPreventReload(false);

        }

        if (step == 2 && files.length == 0) {
            // console.log('Please create a group first');
            ToastAlert('Info', "Upload a file to continue!", "3");
            setIsInstructionModalOpen(false);
            setIsWaitingForUserAction(true);

        } else if (step == 2 && files.length > 0 && isWaitingForUserAction) {
            setIsInstructionModalOpen(false);
            setIsWaitingForUserAction(false);
            ToastAlert('Info', "Now you can grade paper!", "3");
        }

    }, [step]);

    useEffect(() => {
        if (localStorage.getItem('isPaperInstructionComplete') == null || localStorage.getItem('isPaperInstructionComplete') == '0')
            setIsInstructionModalOpen(true);
        console.log('isPaperInstructionComplete', localStorage.getItem('isPaperInstructionComplete'));
    }, []);

    useEffect(() => {
        let interval;
        if (!isAllPreAnalyzed && isAllowedToEvaluate && !isPreAnalyzing) {
            checkPreAnalysis(); // Initial check
            interval = setInterval(() => {
                checkPreAnalysis();
            }, 10000); // Adjust the interval as needed
        }
        return () => clearInterval(interval);
    }, [isAllPreAnalyzed, isAllowedToEvaluate, isPreAnalyzing]);

    const fetchFiles = (group_id, token) => {
        setIsProcessing(true)
        getReuest(`files-by-group/${group_id}`, token).then(res => {
            setIsProcessing(false)
            setGroup(res.group);
            setFiles(res.files);
            setGradedFiles(res.files.filter(file => file.is_complete));
            const hasNullPreAnalysis = res.files.some(item => item.pre_analysis === null);
            console.log('hasNullPreAnalysis', hasNullPreAnalysis)
            setIsAllPreAnalyzed(!hasNullPreAnalysis);
            // setTimeout(() => {
            //     checkPreAnalysis();
            // }, 2000);
        });
    }

    const fetchMyUsage = useCallback(() => {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1;
        const my_subscription = getMySubscription();
        setMySubscription(my_subscription);
        console.log('my_subscription', my_subscription)
        if (my_subscription && my_subscription.stripe_status === 'active') {
            const my_package = packages.find(item => item.title == my_subscription.type);
            setIsGoldUser(my_subscription.type === 'Gold');

            getReuest(`my-usage`, localStorage.getItem("token")).then(res => {
                if (res.usages.length && res.usages[0].year <= year && res.usages[0].month <= month) {
                    setThisMonthUsage(res.usages[0]);
                    setIsAllowedToUpload(res.usages[0].upload_count < my_package.upload_limit)
                    setIsAllowedToEvaluate(res.usages[0].evaluation_count < my_package.evaluation_limit)
                }
                if (res.usages === null || res.usages.length === 0) {
                    setIsAllowedToUpload(true);
                    setIsAllowedToEvaluate(true);
                }
                console.log(moment(my_subscription.trial_ends_at).unix())
                console.log(moment().unix())
                if (my_subscription.type === 'Demo' && my_subscription.trial_ends_at && moment(my_subscription.trial_ends_at).unix() < moment().unix()) {

                    setIsAllowedToUpload(false);
                    setIsAllowedToEvaluate(false);
                    setIsDemoTrialEnded(true);
                }
                // console.log('usages', res);
                // console.log(res.usages[0].year, year);
                // console.log(res.usages[0].month, month);
                // console.log(res.usages[0].upload_count, my_package.upload_limit);
                // console.log(res.usages[0].evaluation_count, my_package.evaluation_limit);
            });
        }
    }, [token]);

    useEffect(() => {
        if (group_id && token && !isUploadPage && !preventReload) {
            fetchFiles(group_id, token);
            fetchMyUsage();
        }

    }, [token, group_id, isUploadPage, preventReload]);

    const checkPreAnalysis = useCallback(async () => {

        const processFile = async (file) => {
            try {
                const res = await analyzePaper(file);
                console.log(res);

                if (res?.success) {
                    ToastAlert('Successful!', "File analysis updated successfully!", "0");
                    return true;
                } else {
                    // const updateRes = await updatePaperAnalysis(file, res.output);
                    ToastAlert('Error updating analysis of file!', res?.error, "2");
                    return false;
                }


            } catch (err) {
                console.error(err);
                ToastAlert('Error', 'An error occurred during pre-analysis.', "2");
                return false;
            }
        };

        if (files) {
            setIsPreAnalyzing(true);
            for (const file of files) {
                if (file.pre_analysis == null || file.pre_analysis?.split('-*-').length > 1) {
                    console.log('file.pre_analysis', file.pre_analysis);

                    // Wait for each analysis to complete before moving to the next file
                    await processFile(file);
                }
            }
            // Refetch all files after processing completes
            setTimeout(() => {
                refetchFiles();
            }, 3000);
            setIsPreAnalyzing(false);
        }

        // Set isProcessing to false only after all processing is complete
    }, [files]);






    const updateUsage = useCallback((evaluation_count) => {
        setIsProcessing(true);
        const data = { upload_count: 0, evaluation_count };
        postReuest(data, `my-usage/create-update`, token).then(res => {
            // setProfile(res.user);
            // setClientSecret(res.payment.client_secret)
            setIsProcessing(false);
            setClientSecret('')
        }).catch(err => {

            setIsProcessing(false);
        });
    }, [token]);

    const callOpenAi = (file_id, isEvaluateAll = false) => {
        console.log('evaluating ...')
        setSelectedFileId(file_id);
        setIsProcessing(true);
        getReuest(`evaluate/paper/${file_id}/${isSydneyPlusEnabled && isGoldUser ? 1 : 0}`, token).then(res => {
            setResponse(res.response);
            console.log(res)
            setObtainedPoints(res.obtained_points)
            const obtained_points = parseInt(res.obtained_points);
            const points_perc = calculatePercentage(res.total_points, obtained_points);
            const file = res.file.file_path.split('/')[1];
            const grade = getLetterGrade(points_perc);

            const msg = `Grade updated to ${grade} for ${file} percentage ${points_perc}`;
            ToastAlert('Success', msg, "0")
            setIsProcessing(false);
            !isEvaluateAll ? setShowModal(true) : null;

            !isEvaluateAll ? fetchFiles(group_id, token) : null
            !isEvaluateAll ? updateUsage(1) : null;
        }).catch(err => {
            setIsProcessing(false);
            setObtainedPoints('');
        });
    }

    const evaluatePaper = useCallback((file_id, isEvaluateAll = false) => {
        console.log(file_id)
        const selectedFile = files.find(file => file.id == file_id);
        console.log(selectedFile);
        setIsProcessing(true);

        if (selectedFile.pre_analysis == null || selectedFile.pre_analysis.split('-*-').length > 1) {
            analyzePaper(selectedFile).then(res => {
                console.log(res);
                if (res) {
                    // const filename = res.file.file_path.split('/')[1];
                    ToastAlert('Success', 'Pre-analysis request saved', "0");
                    if (res.output)
                        updatePaperAnalysis(selectedFile, res.output).then(res => {
                            callOpenAi(file_id, isEvaluateAll);
                            console.log('file update/paper-analysis', res);
                            if (res.error) {
                                ToastAlert('Error updating analysis of file!', res.error, "2");

                            } else {
                                ToastAlert('Successful!', "File analysis updated successfully!", "0")
                            }
                            // refetchFiles();
                        });
                }

                setIsProcessing(false);
            }).catch(err => {
                setIsProcessing(false);
            });
        } else {
            callOpenAi(file_id, isEvaluateAll);
        }

    }, [token, isSydneyPlusEnabled, isGoldUser, files]);

    const evaluateMultiple = useCallback((idStr) => {
        setIsProcessing(true);
        postReuest({ file_ids: idStr }, 'evaluate/multiple', token).then(res => {
            setIsProcessing(false);
            console.log('res', res);
            // setIsProcessing(false);
            fetchFiles(group_id, token);
            updateUsage(idStr.split(',').length);


        }).catch(err => {
            console.error('err', err);
            setIsProcessing(false);

        });
    }, [token]);

    const updateFile = useCallback(() => {
        setIsProcessing(true);
        postReuest({ file_id: selectedFileId, obtained_points: obtainedPoints }, 'update/file', token).then(res => {
            setIsProcessing(false);
            setShowModal(false);
            setResponse('');
            fetchFiles(group_id, token)

        }).catch(err => {
            setIsProcessing(false);

        });
    }, [obtainedPoints, selectedFileId, token]);

    const evaluateAllPapers = async () => {
        if (!files.length) {
            ToastAlert('No file', "Upload file to evaluate", "1");
            return false;
        }
        const c = confirm(`Are you sure you want to evaluate ${files.length} paper(s) ?`);
        if (c) {
            setIsProcessing(true);
            const fileIds = [];
            let promises = files.map(file => {
                fileIds.push(file.id);
                // evaluatePaper(file.id, true)
                // setTimeout(() => { }, 200)
            });

            Promise.all(promises).then(follow => {
                const idsStr = fileIds.join(',');
                console.log(idsStr);
                evaluateMultiple(idsStr);
                // setTimeout(() => {
                //     fetchFiles(group_id, token);
                //     updateUsage(files.length);
                //     ToastAlert('Success', "All paper evaluated!", "0")
                // }, 1000 * files.length);
            }).catch(err => {
                setIsProcessing(false);
                console.log(err)
                // res.sendStatus(500);
            });
            // setTimeout(() => {
            //     fetchFiles(group_id, token);

            // }, 0)
        }
    }
    const handleCheckboxChange = (value) => {
        if (checkedList.includes(value)) {
            // If the value is already in the list, remove it
            setCheckedList(checkedList.filter(item => item !== value));
        } else {
            // If the value is not in the list, add it
            setCheckedList([...checkedList, value]);
        }
    };

    const evaluateCheckedPapers = async () => {
        if (checkedList.length == 0) {
            ToastAlert('Invalid', "Check at least one paper!", "1")
            return
        }
        const c = confirm(`Are you sure you want to evaluate ${checkedList.length} paper(s) ?`);

        if (c) {
            const fileIds = [];
            let promises = checkedList.map(id => {
                evaluatePaper(id, true);
                fileIds.push(id);
                setTimeout(() => { }, 200);
            });

            Promise.all(promises).then(follow => {
                const idsStr = fileIds.join(',');
                console.log(idsStr);
                evaluateMultiple(idsStr);
            }).catch(err => {
                console.log(err)
            });


        }
    }

    const base64toBlob = (data) => {
        // Cut the prefix `data:application/pdf;base64` from the raw base 64
        const base64WithoutPrefix = data.substr('data:application/pdf;base64,'.length);

        const bytes = atob(base64WithoutPrefix);
        let length = bytes.length;
        let out = new Uint8Array(length);

        while (length--) {
            out[length] = bytes.charCodeAt(length);
        }

        return new Blob([out], { type: 'application/pdf' });
    };

    const showPdf = (file_path) => {
        setSelectedPdfFilePath(file_path);
        if (file_path.split('.').reverse()[0] != 'pdf') {
            setIsPdf(false);
            return;
        }
        setIsPdf(true);
        // setSelectedPdfFile(file_path)
        // setSelectedPdfFile(file_path.replace('uploadedFiles', 'pdf'))
        const file = file_path.replace('uploadedFiles', 'pdf')
        try {
            getReuest(file, token).then(res => {
                // const pdfData = decode(res.pdf)
                if (res.pdf) {
                    const blob = base64toBlob(res.pdf);
                    const url = URL.createObjectURL(blob);
                    setSelectedPdfFile(url);
                    setIsPdf(true);
                } else if (res.content) {
                    setSelectedPdfFile(res.content);
                    setIsPdf(false);
                }
            }).catch(err => {
            });
        } catch (error) {
            console.error('Error fetching PDF:', error);
        }
    }



    const openResponse = (file) => {

        // setObtainedPoints(findGrade(file.response, parseInt(file.total_points)))
        showPdf(file.file_path)
        setSelectedFileId(file.id);
        setAnalysis(file.pre_analysis);
        setResponse(file.response)
        setShowModal(true)
    };
    useEffect(() => {
        if (responseDocx != null) {
            setResponseDocx(null);
        }
    }, [responseDocx])
    const handleDownloadFeedback = (file) => {

        console.log(file);
        setResponseDocx(file);
        // setResponseDocx(null);

        // await sleep(rand(500));
        // setTimeout(async () => {
        //     await setResponseDocx(null);
        // }, 0)
        // return file;
    };

    // useEffect(() => {
    //     console.log(checkedList)
    // }, [checkedList])
    const [statusFilter, setStatusFilter] = useState('');
    const [gradeRangeFilter, setGradeRangeFilter] = useState('');
    const [commentsFilter, setCommentsFilter] = useState('');

    const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
    const handleGradeRangeFilterChange = (e) => {
        console.log(e.target.value)
        setGradeRangeFilter(e.target.value);
    };
    const handleCommentsFilterChange = (e) => setCommentsFilter(e.target.value);

    const filteredFiles = files.filter((file) => {
        let matchesStatus = true;
        if (statusFilter === 'Graded') matchesStatus = file.is_complete === 1;
        else if (statusFilter === 'Ungraded') matchesStatus = file.is_complete !== 1;
        else if (statusFilter === 'In-progress') matchesStatus = file.is_complete === 2;

        let matchesGradeRange = true;
        if (gradeRangeFilter && gradeRanges[gradeRangeFilter]) {
            const points = calculatePercentage(parseInt(file.total_points), parseInt(file.obtained_points));
            const range = gradeRanges[gradeRangeFilter];
            matchesGradeRange = points >= range.min && points <= range.max;
        }

        let matchesComments = true;
        if (commentsFilter === 'With Comments')
            matchesComments = file.response && file.response.length > 0;
        else if (commentsFilter === 'Without Comments')
            matchesComments = !file.response || file.response.length === 0;

        return matchesStatus && matchesGradeRange && matchesComments;
    });

    const getFileContent = useMemo(() => {
        if (selectedPdfFile && isPdf) {
            return (<PDFViewerModal file={selectedPdfFile} isPdf={isPdf} />);
        } else {
            return (<DocxViewer filename={selectedPdfFilePath} />);
        }
    }, [selectedPdfFile, selectedPdfFilePath, isPdf]);

    const refetchFiles = useCallback(() => {
        if (!isPreAnalyzing)
            fetchFiles(group_id, token);
    }, [isPreAnalyzing]);

    const handleFileChange = (event, grade) => {
        gradeSampleFiles[grade] = event.target.files[0];
        // setGradeSampleFiles()
        console.log(event.target.files[0]);
    };

    const updatePaperAnalysis = (file, analysis) => {

        return postReuest({ file_id: file.id, pre_analysis: analysis }, `update/paper-analysis`, token)
    }

    const analyzePaper = useCallback((file) => {
        if (file.content?.length) {
            const prompt = `
            You are an AI pre-analysis assistant for Acadex Mini. Your task is to provide a detailed pre-analysis of a student’s paper based on the following inputs:

            1.	Assignment Name: ${group.title}
            2.	Assignment Description: ${group.about_assignment}
            3.	Rubric: ${group.criteria}
            4.	“Look Out For”: ${group.look_out}
            5.	The ${group.grade_year} student’s paper: **paper start** ${file.content} **paper end**
            6.	Total Point Scale: 0 to ${group.total_points}

            Your goal is to conduct a strict and critical analysis of the paper. The total point scale is provided as an input and may vary between assignments, so your grading must adjust accordingly. Ensure that gaps in depth, supporting evidence, or coherence are penalized appropriately. The rubric should be the primary grading focus, with the “Look Out For” section as a secondary adjustment. Your analysis should include:

                1.	Rubric Alignment (Primary Focus): Analyze how well the paper meets the rubric. Ensure that the final grading reflects the total point scale provided. Be critical of sections that are underdeveloped or lack depth, and penalize accordingly.
            2.	Look Out For Section (Secondary Focus): Use the “Look Out For” section to fine-tune your evaluation, but ensure that rubric alignment remains the primary driver of the grade.
            3.	Preliminary Grade: Suggest a preliminary grade that aligns with the total point scale provided. Be cautious about overestimating the grade if the paper lacks depth, coherence, or supporting evidence.
            4.	In-Depth Complexity Analysis: Penalize papers that handle complex concepts superficially, such as decision-making models or AI. Ensure that areas requiring deeper analysis are properly reflected in the preliminary grade.
            5.	Summary of Key Insights: Summarize the key strengths and weaknesses of the paper. Ensure that the final grade reflects both strengths and gaps, based on the total point scale.

            Your pre-analysis should prioritize the rubric, using the total point scale provided as the basis for assigning an accurate and balanced preliminary grade.
            `
            console.log('analyzing ...')
            // setIsProcessing(true);
            return postReuest({ prompt, file_id: file.id }, `create/pre-analysis`, token);

        } else {
            ToastAlert('Warning', 'No content in the file.', "1");
            return Promise.resolve();
        }
    }, [group]);

    const fetchAnalysis = useCallback((file) => {
        const status = file.pre_analysis.split('-*-')
        console.log(' fetching analysis ...')
        if (status[0] == 'pending' && status[1].match(/^[0-9a-fA-F]{24}$/)) {
            setIsProcessing(true);
            return postOllamaRequest({ ids: status[1] }, `ollama`);
        } else {
            return Promise.resolve();
        }
    }, [group]);

    const handleBottomStepper = (step) => {
        if (files.length > 0 || step == -2) {
            localStorage.setItem('isPaperInstructionComplete', '1');
            setIsInstructionModalOpen(false);
            setIsWaitingForUserAction(false);
        }
        console.log(`Bottom Stepper: ${step}`);
    }

    return (

        <MainLayout >
            <LoadingComponent isLoading={isProcessing} />

            <div className='h-full'>
                <Link to='/groups' className="flex items-center pl-4 w-20">
                    <FiChevronLeft className="mb-2 text-6xl cursor-pointer dark:text-white" />
                </Link>
                <div className='flex'>
                    <div className='w-1/2 text-6xl pl-8 text-black dark:text-white mb-4'>
                        {group.title}
                    </div>
                    <div className={`w-1/2 text-2xl flex justify-end ${step == 0 ? 'z-[51]' : ''}`}>
                        <Switcher title="Show Upload" enabled={isUploadPage} handleClick={(e) => setIsUploadPage(e)} />
                    </div>
                </div>

                {group && !group.about_assignment ? <div className="p-4 mb-4 text-lg text-danger rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 pl-10" role="alert">
                    <span className="font-medium">No description for the assignment!</span> Please <Link to={`/groups?edit=${group.id}`}><span className='underline'>Edit group</span></Link> provide more details on this assignment for better evaluation
                </div> : null}
                {mySubscription?.stripe_status !== 'active' ?
                    (<div className="p-4 mb-4 text-lg text-danger rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 pl-10" role="alert">
                        <span className="font-medium">No subscription!</span> Please subscribe with us <Link to="/pricing"><span className='underline'>Click here</span></Link>
                    </div>) :
                    (<div className="p-4 mb-4 text-lg text-success rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 pl-10" role="alert">
                        <span className="font-medium">Thank you!</span> For subscribing with us {mySubscription.type} package.
                    </div>)
                }

                {isPreAnalyzing ? <div className="flex items-center justify-center min-h-24 bg-gray-100">
                    Pre-Analyze is in progress <svg
                        className="animate-spin h-10 w-10 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.964 7.964 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div> : null}

                <div className='flex'>
                    {isUploadPage ?
                        <div className={`w-full ${step == 1 ? 'z-[51]' : ''}`}>
                            {isDemoTrialEnded ? <h2 className=' pl-8 text-danger font-medium'>Trial period ended</h2> : null}
                            <h2 className=' pl-8 text-danger font-medium'>{mySubscription?.stripe_status === 'active' && !isAllowedToUpload ? 'You have reached your limit for upload.' : ''}</h2>
                            <FileUpload onUpload={(msg) => { ToastAlert('Success', msg, "0"); setIsUploadPage(false); }} isAllowedToUpload={isAllowedToUpload} group_id={group_id} setUploadFiles={setUploadFiles} total_points={group.total_points} />
                        </div> :
                        <div className='w-full'>


                            <div className='w-4/5 flex text-black font-normal pl-10'>

                            </div>
                            <p className="pl-10 mb-2 text-left text-base leading-relaxed text-black">
                                Total points: <span className='text-black font-bold'>{group.total_points}</span>
                            </p>
                            <p className="pl-10 mb-2 text-left text-base leading-relaxed text-black">
                                Response type: <span className='font-bold'>{group.grade_type}</span>
                            </p>
                            <p className="pl-10 mb-2 text-left text-base leading-relaxed text-black">
                                Evaluation Level: <span className='font-bold'>{group.grade_year}</span>
                            </p>

                            <div className='pl-10'>
                                <ReadMore label="Criteria: " text={group.criteria} maxLength={100} />
                            </div>
                            <div className='flex px-8 mb-10 mt-2'>
                                <div className="w-1/2 rounded-2xl shadow-xl p-6 bg-white dark:border dark:bg-boxdark">
                                    <h1 className='text-black text-2xl font-bold mb-4'>
                                        Total Upload
                                    </h1>
                                    <h1 className='text-center text-black text-2xl  font-bold mb-4'>
                                        {files.length}
                                    </h1>
                                    {/* <p className='text-right text-black text-2 '>Monthly Use</p> */}
                                </div>
                                <div className="w-1/2 rounded-2xl shadow-xl p-6 ml-8 bg-white dark:border dark:bg-boxdark">
                                    <h1 className='text-black text-2xl font-bold mb-4'>
                                        Currently Graded
                                    </h1>
                                    <h1 className={`text-center ${gradedFiles.length == files.length ? 'text-success' : 'text-black'} text-2xl  font-bold mb-4`}>
                                        {gradedFiles.length}/{files.length}
                                    </h1>
                                    {isProcessing ? <p className='text-center text-[#FE764B] text-xs'>In Progress: 10 mins EST remaining</p> : null}
                                </div>
                            </div>


                            {/* <iframe
                            title="PDF Viewer"
                            width="100%"
                            height="600px"
                            src={'http://localhost:8000/api/pdf/ENT-320-RS-T1-Business-Opportunity-Worksheet%20(1).pdf'}
                        /> */}
                            {/* <Document file={pdfUrl}>
                            <Page pageNumber={1} />
                        </Document> */}
                            <div className={`container mx-auto ${step == 2 ? 'z-[51]' : ''}`}>
                                <div className="mb-4 flex flex-wrap justify-start px-8 gap-4">
                                    <select value={statusFilter} onChange={handleStatusFilterChange} className="p-2 border rounded dark:bg-black dark:text-white">
                                        <option value="">All Statuses</option>
                                        <option value="Graded">Graded</option>
                                        <option value="Ungraded">Ungraded</option>
                                        <option value="In-progress">In-progress</option>
                                    </select>
                                    <select value={gradeRangeFilter} onChange={handleGradeRangeFilterChange} className="p-2 border rounded dark:bg-black dark:text-white">
                                        <option value="">Any Grade Ranges</option>
                                        {allGrades.map(item => <option value={item} key={item}>{item}</option>)}
                                    </select>
                                    <select value={commentsFilter} onChange={handleCommentsFilterChange} className="p-2 border rounded dark:bg-black dark:text-white">
                                        <option value="">With/Without Comments</option>
                                        <option value="With Comments">With Comments</option>
                                        <option value="Without Comments">Without Comments</option>
                                    </select>
                                </div>
                                {isDemoTrialEnded ? <h2 className=' pl-8 text-danger font-medium'>Trial period ended</h2> : null}
                                <h2 className=' pl-8 text-danger font-medium'>{mySubscription?.stripe_status === 'active' && !isAllowedToEvaluate ? 'You have reached your limit for evaluation.' : ''}</h2>
                                <div className={`mx-4 flex flex-wrap ${step == 2 ? 'z-[51]' : ''}`}>
                                    {filteredFiles.map((file, idx) => (
                                        <PaperCard
                                            key={idx}
                                            file={file}
                                            idx={idx}
                                            checkedList={checkedList}
                                            handleCheckboxChange={handleCheckboxChange}
                                            group={group}
                                            siteUrl={siteUrl}
                                            isAllowedToEvaluate={isAllowedToEvaluate}
                                            isProcessing={isProcessing}
                                            evaluatePaper={evaluatePaper}
                                            analyzePaper={analyzePaper}
                                            fetchAnalysis={analyzePaper}
                                            openResponse={openResponse}
                                            total={filteredFiles.length}
                                            refetchFiles={refetchFiles}
                                        />
                                    ))}
                                    {filteredFiles.length == 0 ? <p className='px-8 text-xl dark:text-white'>No File</p> : ''}
                                </div>
                            </div>
                        </div>
                    }
                    <div className="flex flex-col w-2/6">
                        <Profile examFiles={uploadFiles} />
                        {!isUploadPage ?
                            <div className={`${step == 3 ? 'z-[51]' : ''}`}>
                                <div className='mt-6'>
                                    {isGoldUser ? <Switcher title="Enable Sydney+" handleClick={(e) => setIsSydneyPlusEnabled(e)} /> : null}
                                </div>
                                <div className=''>
                                    <LoadingButton isDisabled={!isAllowedToEvaluate} isLoading={isProcessing} handleOnClick={() => evaluateAllPapers()} btnClasses="w-full text-center mt-4 text-white bg-primary text-md p-4 rounded-full font-medium">
                                        GRADE ALL
                                    </LoadingButton>
                                </div>
                                <div className=''>
                                    <LoadingButton isDisabled={!isAllowedToEvaluate} isLoading={isProcessing} handleOnClick={() => evaluateCheckedPapers()} btnClasses="w-full text-center mt-4 text-black dark:text-graydark bg-secondary text-md border-2 border-secondary p-4 rounded-full font-medium">
                                        GRADE CHECKED
                                    </LoadingButton>
                                </div>
                                <div className=''>
                                    <DownloadAllFeedback group={group} files={filteredFiles} isAllowedToEvaluate={isAllowedToEvaluate} isProcessing={isProcessing} />
                                </div>
                                {/* <div className=''>
                                    <LoadingButton isDisabled={!isAllowedToEvaluate} isLoading={isProcessing} handleOnClick={() => checkPreAnalysis()} btnClasses="w-full text-center mt-4 text-white bg-success text-md p-4 rounded-full font-medium">
                                        CHECK ALL PRE-ANALYSIS
                                    </LoadingButton>
                                </div> */}
                            </div>
                            : null}
                    </div>
                </div>


                {/* <div className="flex justify-center">
                <button className="bg-black hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleSubmit()}>
                    UPLOAD
                </button>
            </div> */}

                {showModal && selectedFileId ? (
                    <>
                        <div
                            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
                        >
                            <div className="relative w-auto my-6 mx-auto sm:mx-12 lg:mx-24">
                                {/*content*/}
                                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white dark:bg-gray-800 outline-none focus:outline-none">
                                    {/*header*/}
                                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                                        <h3 className="w-1/2 text-3xl font-semibold">
                                            Sydney response
                                        </h3>
                                        <div className="w-1/2 flex items-start justify-between">
                                            <h3 className="text-3xl font-semibold">
                                                File Content
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
                                    <div className="flex">
                                        <div className='w-1/2'>
                                            <div className="relative p-6 flex-auto">
                                                <div className="my-4 text-blueGray-500 text-lg leading-relaxed  max-h-[450px] overflow-y-scroll">
                                                    <Collapsible title="Pre-Analysis" isCollapsed={true} classes="mt-6 mb-2">
                                                        <div className='bg-gray dark:bg-black text-black p-2' dangerouslySetInnerHTML={{ __html: analysis?.replace(/\n/g, '<br />') }} />
                                                    </Collapsible>
                                                    <Collapsible title="AI Response" isCollapsed={false} classes="mb-2">
                                                        <div className='bg-gray dark:bg-black text-black p-2' dangerouslySetInnerHTML={{ __html: response?.replace(/\n/g, '<br />') }} />
                                                    </Collapsible>
                                                </div>

                                                <div>
                                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                                        Points
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={obtainedPoints}
                                                        onChange={(e) => setObtainedPoints(e.target.value)}
                                                        className={`mt-1 p-2 w-full border rounded-md`}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {obtainedPoints == 0 ? <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                                                <p className="font-bold">Be Warned</p>
                                                <p>Sydney response grade not updated! Update Grade.</p>
                                            </div> : null}


                                            <button
                                                disabled={obtainedPoints < 1}
                                                className={`${obtainedPoints < 1 ? 'bg-gray text-black' : 'bg-primary text-white'} float-right active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150`}
                                                type="button"
                                                onClick={() => updateFile()}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                        <div className='w-1/2'>
                                            {/*content*/}
                                            {/*body*/}
                                            <div className="relative p-6 flex-auto max-h-[600px] overflow-y-scroll">
                                                {getFileContent}
                                            </div>

                                        </div>
                                    </div>
                                    {/*footer*/}
                                    <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                                        <button
                                            className="bg-danger text-white background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                        >
                                            X Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
                    </>
                ) : null}



                {/* Paper management Instruction Modal */}

                <PaperManagementInstruction
                    isOpen={isInstructionModalOpen}
                    onClose={() => {
                        setIsInstructionModalOpen(false);
                        setPreventReload(false);
                        localStorage.setItem('isPaperInstructionComplete', '1');
                    }
                    }
                    onStepUpdate={(val) => setStep(val)}
                />
                <BottomStepper isOpen={isInstructionModalOpen || isWaitingForUserAction} onStepChange={handleBottomStepper} bottomStep={bottomStep} title={instructionModalTexts[bottomStep]} steps={instructionModalTexts} />
            </div>
        </MainLayout>
    );
};

export default FileList;
