import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import moment from 'moment';
import { getMySubscription, useAuth } from '../provider/authProvider';
import { FiUpload, FiCheckSquare, FiCheck, FiDownloadCloud } from 'react-icons/fi';
import { Button } from './components/new/Button';
import { StatCard } from './components/new/StatCard';
import { SubmissionSection } from './components/new/SubmissionSection';
import { GraphModal } from './components/new/GraphModal';
import { PaperFilter } from './components/new/PaperFilter';
import { calculateAverageGrade, calculatePercentage, gradeRanges, getLetterGrade, base64toBlob } from '../utils/helper';
import { packages, getReuest } from '../services/apiService';
import ToastAlert from './components/ToastAlert';
import { useDashboardApi } from '../hooks/useDashboardApi';
import MainLayout from '../layout/MainLayout';
import LoadingComponent from '../layout/LoadingComponent';
import LoaderLine from './components/new/LoaderLine';
import NotificationList from './components/new/NotificationList';
import { read } from 'xlsx';
import { EvaluationModal } from './components/new/EvaluationModal';
import { UploadModal } from './components/new/UploadModal';
import PaperInstructionModal from './components/new/PaperInstructionModal';
import DownloadAllFeedback from './components/DownloadAllFeedback';

const MemoizedSubmissionSection = React.memo(SubmissionSection);
const allGrades = ['A', 'B', 'C', 'D', 'F'];

const host = window.location.hostname;
const siteUrl =
    host === 'localhost'
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_API_URL_PROD;
const apiUrl = siteUrl + '/api';

const Dashboard = () => {
    // State management
    const { token } = useAuth();
    const { group_id } = useParams();

    const [files, setFiles] = useState([]);
    const [gradedFiles, setGradedFiles] = useState([]);
    const [group, setGroup] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
    const [checkedList, setCheckedList] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gradeRangeFilter, setGradeRangeFilter] = useState('');
    const [commentsFilter, setCommentsFilter] = useState('');
    const [preventReload, setPreventReload] = useState(false);
    const [thisMonthUsage, setThisMonthUsage] = useState({});
    const [isDemoTrialEnded, setIsDemoTrialEnded] = useState(false);
    const [mySubscription, setMySubscription] = useState({});
    const [isAllowedToUpload, setIsAllowedToUpload] = useState(false);
    const [isAllowedToEvaluate, setIsAllowedToEvaluate] = useState(false);
    const [isGoldUser, setIsGoldUser] = useState(false);
    const [isSydneyPlusEnabled, setIsSydneyPlusEnabled] = useState(false);
    const [response, setResponse] = useState('');
    const [obtainedPoints, setObtainedPoints] = useState('');
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [isAllPreAnalyzed, setIsAllPreAnalyzed] = useState(false);
    const [selectedPdfFile, setSelectedPdfFile] = useState('');
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [isPdf, setIsPdf] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [msg, setMsg] = useState('');
    const [evaluationWorker, setEvaluationWorker] = useState(null);


    // Memoize filtered files
    const filteredFiles = useMemo(() => {
        return files.filter((file) => {
            let matchesStatus = true,
                matchesGradeRange = true,
                matchesComments = true;

            if (statusFilter === 'Graded') {
                matchesStatus = file.is_complete === 1;
            } else if (statusFilter === 'Ungraded') {
                matchesStatus = file.is_complete !== 1;
            } else if (statusFilter === 'In-progress') {
                matchesStatus = file.is_complete === 2;
            }

            if (gradeRangeFilter && gradeRanges[gradeRangeFilter]) {
                const points = calculatePercentage(
                    parseInt(file.total_points, 10),
                    parseInt(file.obtained_points, 10)
                );
                const range = gradeRanges[gradeRangeFilter];
                matchesGradeRange = points >= range.min && points <= range.max;
            }

            if (commentsFilter === 'With Comments') {
                matchesComments = file.response && file.response.length > 0;
            } else if (commentsFilter === 'Without Comments') {
                matchesComments = !file.response || file.response.length === 0;
            }

            return matchesStatus && matchesGradeRange && matchesComments;
        });
    }, [files, statusFilter, gradeRangeFilter, commentsFilter]);

    // Handlers for filter changes
    const handleStatusFilterChange = useCallback((e) => setStatusFilter(e.target.value), []);
    const handleGradeRangeFilterChange = useCallback((e) => setGradeRangeFilter(e.target.value), []);
    const handleCommentsFilterChange = useCallback((e) => setCommentsFilter(e.target.value), []);

    // Initialize the dashboard API hook
    const {
        fetchFiles: apiFetchFiles,
        fetchMyUsage: apiFetchMyUsage,
        analyzePaper,
        evaluateMultiple,
        updateFile,
        updateUsage
    } = useDashboardApi(token, group_id);

    // Fetch usage info and update allowed actions
    const fetchUsage = useCallback(() => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const my_subscription = getMySubscription();
        setMySubscription(my_subscription);
        if (my_subscription && my_subscription.stripe_status === 'active') {
            const my_package = packages.find((item) => item.title === my_subscription.type);
            setIsGoldUser(my_subscription.type === 'Gold');

            apiFetchMyUsage().then((res) => {
                if (res.usages && res.usages.length && res.usages[0].year <= year && res.usages[0].month <= month) {
                    setThisMonthUsage(res.usages[0]);
                    setIsAllowedToUpload(res.usages[0].upload_count < my_package.upload_limit);
                    setIsAllowedToEvaluate(res.usages[0].evaluation_count < my_package.evaluation_limit);
                }
                if (res.usages && res.usages.length && year > res.usages[0].year) {
                    setIsAllowedToUpload(true);
                    setIsAllowedToEvaluate(true);
                }
                if (!res.usages || res.usages.length === 0) {
                    setIsAllowedToUpload(true);
                    setIsAllowedToEvaluate(true);
                }
                if (
                    my_subscription.type === 'Demo' &&
                    my_subscription.trial_ends_at &&
                    moment(my_subscription.trial_ends_at).unix() < moment().unix()
                ) {
                    setIsAllowedToUpload(false);
                    setIsAllowedToEvaluate(false);
                    setIsDemoTrialEnded(true);
                }
            });
        }
    }, [token, apiFetchMyUsage]);

    // Fetch files and update stats using the API hook
    const refetchFiles = useCallback(() => {
        if (!isPreAnalyzing) {
            setIsProcessing(true);
            apiFetchFiles()
                .then((res) => {
                    setGroup(res.group);
                    setFiles(res.files);
                    setGradedFiles(res.files.filter((file) => file.is_complete));
                    const hasNullPreAnalysis = res.files.some((item) => item.pre_analysis === null);
                    setIsAllPreAnalyzed(!hasNullPreAnalysis);
                })
                .catch((error) => {
                    console.error('Error fetching files:', error);
                })
                .finally(() => setIsProcessing(false));
        }
    }, [apiFetchFiles, isPreAnalyzing]);

    // Check and process pre-analysis on files
    const checkPreAnalysis = useCallback(async () => {
        const processFile = async (file) => {
            try {
                const res = await analyzePaper(group, file);
                if (res) {
                    ToastAlert('Successful!', `File ${file.file_path.split('/')[1]} analysis updated successfully!`, "0");
                    return true;
                } else {
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
                if (
                    file.pre_analysis == null ||
                    (file.pre_analysis && file.pre_analysis.split('-*-').length > 1)
                ) {
                    await processFile(file);
                }
            }
            setTimeout(() => {
                refetchFiles();
            }, 3000);
            setIsPreAnalyzing(false);
        }
    }, [files, analyzePaper, group, refetchFiles]);

    // Set up interval pre-analysis check
    useEffect(() => {
        let interval;
        if (!isAllPreAnalyzed && isAllowedToEvaluate && !isPreAnalyzing) {
            checkPreAnalysis();
            interval = setInterval(() => {
                checkPreAnalysis();
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isAllPreAnalyzed, isAllowedToEvaluate, isPreAnalyzing, checkPreAnalysis]);

    // Initialize worker
    useEffect(() => {
        const worker = new Worker(new URL('../workers/evaluationWorker.js', import.meta.url));
        setEvaluationWorker(worker);

        worker.onmessage = (event) => {
            const { type, fileId, data, error } = event.data;

            if (type === 'SUCCESS') {
                setResponse(data.response);
                setObtainedPoints(data.obtained_points);
                const points_perc = calculatePercentage(data.total_points, parseInt(data.obtained_points, 10));
                const fileName = data.file.file_path.split('/')[1];
                const grade = getLetterGrade(points_perc);

                ToastAlert('Success', `Grade updated to ${grade} for ${fileName}`, "0");
                refetchFiles();
                setIsPreAnalyzing(false);
                setShowModal(true);

            } else {
                ToastAlert('Error', error, "2");
            }
            setIsProcessing(false);
        };

        return () => worker.terminate();
    }, []);
    // Evaluate a paper
    const evaluatePaper = useCallback(
        (file_id, isEvaluateAll = false) => {
            const selectedFile = files.find((file) => file.id === file_id);
            setIsPreAnalyzing(true);

            if (!evaluationWorker) {
                ToastAlert('Error', 'Evaluation system not ready', "2");
                return;
            }

            if (
                selectedFile.pre_analysis == null ||
                (selectedFile.pre_analysis &&
                    selectedFile.pre_analysis.split('-*-').length > 1)
            ) {
                analyzePaper(group, selectedFile)
                    .then((res) => {
                        if (res?.success) {
                            evaluationWorker.postMessage({
                                fileId: file_id,
                                paper: selectedFile,
                                isSydneyEnabled: isSydneyPlusEnabled,
                                isGold: isGoldUser
                            });
                        } else {
                            setIsPreAnalyzing(false);
                            ToastAlert('Error', 'Pre-analysis failed', "2");
                        }
                    })
                    .catch((err) => {
                        setIsPreAnalyzing(false);
                        ToastAlert('Error', err.message, "2");
                    });
            } else {
                evaluationWorker.postMessage({
                    fileId: file_id,
                    paper: selectedFile,
                    isSydneyEnabled: isSydneyPlusEnabled,
                    isGold: isGoldUser,
                    token,
                    siteUrl
                });
            }
        },
        [files, analyzePaper, group, isSydneyPlusEnabled, isGoldUser, evaluationWorker]
    );

    const evaluateCheckedPapers = useCallback(async () => {
        if (checkedList.length === 0) {
            ToastAlert('Invalid', "Check at least one paper!", "1");
            return;
        }
        if (confirm(`Are you sure you want to evaluate ${checkedList.length} paper(s)?`)) {
            try {
                const fileIds = checkedList.map(file => file).join(',');
                setIsPreAnalyzing(true);
                const result = await evaluateMultiple(fileIds);
                console.log('Result:', result);
                ToastAlert('Success', `Evaluated ${checkedList.length} papers`, "0");
                refetchFiles();
                updateUsage(fileIds.split(',').length);
                setCheckedList([]);
            } catch (err) {
                console.error('Error evaluating checked papers:', err);
                ToastAlert('Error', `An error occurred during evaluation. ${err}`, "2");
            } finally {
                setIsPreAnalyzing(false);
            }
        }
    }, [checkedList, evaluateMultiple, apiFetchFiles, group_id, token, updateUsage]);

    const evaluateAllPapers = useCallback(async () => {
        if (!filteredFiles.length) {
            ToastAlert('No file', "Upload file to evaluate", "1");
            return;
        }
        if (confirm(`Are you sure you want to evaluate ${filteredFiles.length} paper(s)?`)) {
            try {
                const fileIds = filteredFiles.map(file => file.id).join(',');
                setIsPreAnalyzing(true);
                const result = await evaluateMultiple(fileIds);
                ToastAlert('Success', `Evaluated ${checkedList.length} papers`, "0");
                refetchFiles();
                updateUsage(fileIds.split(',').length);
            } catch (err) {
                console.error('Error evaluating papers:', err);
                ToastAlert('Error', `An error occurred during evaluation. ${err}`, "2");
            } finally {
                setIsPreAnalyzing(false);
            }
        }
    }, [filteredFiles, evaluateMultiple, apiFetchFiles, group_id, token, updateUsage]);

    // Handle checkbox selection
    const handleCheckboxChange = useCallback((value) => {
        console.log('Checkbox value:', value);
        setCheckedList((prev) =>
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        );
    }, []);

    // Download feedback
    useEffect(() => {
        console.log('Checked list:', checkedList);
    }, [checkedList]);

    const showPdf = useCallback((file_path) => {
        setSelectedFilePath(file_path);
        if (file_path.split('.').pop()?.toLowerCase() !== 'pdf') {
            setIsPdf(false);
            return;
        }
        setIsPdf(true);
        const file = file_path.replace('uploadedFiles', 'pdf');
        try {
            getReuest(file, token)
                .then((res) => {
                    if (res.pdf) {
                        const blob = base64toBlob(res.pdf);
                        const url = URL.createObjectURL(blob);
                        setSelectedPdfFile(url);
                        setIsPdf(true);
                    } else if (res.content) {
                        setSelectedPdfFile(res.content);
                        setIsPdf(false);
                    }
                })
                .catch((err) => {
                    console.error('Error fetching PDF:', err);
                });
        } catch (error) {
            console.error('Error fetching PDF:', error);
        }
    }, [token]);

    const openResponse = useCallback((file) => {
        showPdf(file.file_path);
        setSelectedFileId(file.id);
        setAnalysis(file.pre_analysis);
        setResponse(file.response);
        setShowModal(true);
    }, [showPdf]);

    // Initial fetching of files and usage data
    useEffect(() => {
        if (group_id && token && !isUploadModalOpen && !preventReload) {
            refetchFiles();
            fetchUsage();
        }
    }, [token, group_id, isUploadModalOpen, preventReload, refetchFiles, fetchUsage]);



    return (
        <MainLayout>
            <PaperInstructionModal onClose={() => console.log('Instruction modal closed')} />
            <LoaderLine isShowing={isPreAnalyzing} indefinite />
            <NotificationList group={group} mySubscription={mySubscription} isDemoTrialEnded={isDemoTrialEnded} />
            <LoadingComponent isLoading={isProcessing} />
            <div className="w-full h-full pl-8 md:px-[10%] mx-auto py-6">
                <header className="flex-none md:flex justify-between items-center mb-8 fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h1 className="text-3xl text-black font-semibold">Grading Dashboard</h1>
                    <Button
                        className={`w-full md:w-auto flex justify-center md:flex-none ${!isAllowedToUpload ? 'opacity-50' : ''}`}
                        icon={FiUpload}
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        Upload Papers
                    </Button>
                </header>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 corner-gradient">
                    <StatCard title="Total Papers" value={files.length.toString()} delay="0.2" />
                    <StatCard title="Papers Graded" value={gradedFiles.length.toString()} delay="0.3" />
                    <StatCard title="Average Grade" value={calculateAverageGrade(gradedFiles)} delay="0.4" />
                </section>
                <div className="flex-none md:flex justify-center space-y-2 md:space-x-4 md:space-y-0 mb-4 fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <Button
                        className={`w-full md:w-auto flex justify-center md:flex-none ${!isAllowedToEvaluate ? 'opacity-20' : ''}`}
                        icon={FiCheckSquare}
                        onClick={evaluateAllPapers}
                        disabled={!isAllowedToEvaluate || isProcessing}
                    >
                        Grade All
                    </Button>
                    <Button
                        className={`w-full md:w-auto flex justify-center md:flex-none ${!isAllowedToEvaluate ? 'opacity-20' : ''}`}
                        icon={FiCheck}
                        variant="secondary"
                        onClick={evaluateCheckedPapers}
                        disabled={!isAllowedToEvaluate || isProcessing || checkedList.length === 0}
                    >
                        Grade Checked
                    </Button>
                    <DownloadAllFeedback group={group} files={filteredFiles} isAllowedToEvaluate={isAllowedToEvaluate} isProcessing={isProcessing} />
                </div>
                <PaperFilter
                    statusFilter={statusFilter}
                    handleStatusFilterChange={handleStatusFilterChange}
                    gradeRangeFilter={gradeRangeFilter}
                    handleGradeRangeFilterChange={handleGradeRangeFilterChange}
                    commentsFilter={commentsFilter}
                    handleCommentsFilterChange={handleCommentsFilterChange}
                    allGrades={allGrades}
                />
                <MemoizedSubmissionSection
                    title="Recent Submissions"
                    submissions={filteredFiles}
                    group={group}
                    onCheckboxChange={handleCheckboxChange}
                    checkedList={checkedList}
                    onEvaluate={evaluatePaper}
                    isProcessing={isProcessing}
                    isAllowedToEvaluate={isAllowedToEvaluate}
                    refetchFiles={refetchFiles}
                    openResponse={openResponse}
                />
                <GraphModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    type={modalType}
                    data={files}
                />
                <EvaluationModal
                    isOpen={showModal}
                    onClose={() => {
                        console.log('Closing modal');
                        setShowModal(false);
                    }}
                    analysis={analysis}
                    response={response}
                    obtainedPoints={obtainedPoints}
                    onPointsChange={(value) => setObtainedPoints(value)}
                    onSave={() => updateFile(selectedFileId, obtainedPoints)}
                    isPdf={isPdf}
                    selectedPdfFile={selectedPdfFile}
                    selectedFilePath={selectedFilePath}
                />
                <UploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={() => {
                        ToastAlert('Success', msg, "0");
                        refetchFiles();
                    }}
                    isAllowedToUpload={isAllowedToUpload}
                    group_id={group_id}
                    setUploadFiles={setUploadFiles}
                    total_points={group?.total_points}
                    isDemoTrialEnded={isDemoTrialEnded}
                    mySubscription={mySubscription}
                />
            </div>
        </MainLayout>
    );
};

export default Dashboard;