import React, { useEffect, useState } from 'react';
import { useAuth } from "../provider/authProvider";
import MainLayout from '../layout/MainLayout';
import LoadingOverlay from '../layout/LoadingOverlay';
import { getReuest, postReuest } from "../services/apiService";
import AssesmentForm from './Form/AssesmentForm';
import moment from 'moment';
import { useNavigate, useSearchParams } from 'react-router-dom';

import '../assets/css/FileUploadStyle.css'; // Import or define your component styles
import { Link } from 'react-router-dom';
import GroupCard from './components/GroupCard';
import AssesmentCard from './components/AssesmentCard';
import ToastAlert from './components/ToastAlert';
import LoadingComponent from '../layout/LoadingComponent';
import GroupInstructionModal from './components/new/GroupInstructionModal';
import { useGroups } from '../hooks/useGroups';

const Groups = () => {
    const [files, setFiles] = useState([]);
    const { token } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
    const [step, setStep] = useState(-1);
    const [isWaitingForUserAction, setIsWaitingForUserAction] = useState(false);
    const navigate = useNavigate();

    const { groups, isProcessing, fetchGroups } = useGroups(token);

    // Get a specific query parameter
    useEffect(() => {
        const editGroupId = searchParams.get('edit');
        const selGrp = groups.find(item => item.id == editGroupId);
        console.log('selGrp', selGrp);
        setSelectedGroup(selGrp);
        if (selGrp?.id) {
            setShowForm(true);
        }

    }, [searchParams, groups]);

    useEffect(() => {
        if (localStorage.getItem('isGroupInstructionComplete') == null || localStorage.getItem('isGroupInstructionComplete') == '0')
            setIsInstructionModalOpen(true);
        if (localStorage.getItem('isGroupInstructionComplete') == '1' && (localStorage.getItem('isPaperInstructionComplete') == null || localStorage.getItem('isPaperInstructionComplete') == '0')) {
            setIsWaitingForUserAction(true);
        }

        console.log('isGroupInstructionComplete', localStorage.getItem('isGroupInstructionComplete'), localStorage.getItem('isPaperInstructionComplete'));
    }, []);

    useEffect(() => {
        console.log('step', step);
        console.log('groups', groups);
        if (step == 2 && groups.length == 0) {
            // console.log('Please create a group first');
            ToastAlert('Info', "Create a group to continue!", "2");
            setIsInstructionModalOpen(false);

        } else if (step == 2 && isInstructionModalOpen) {
            setIsInstructionModalOpen(false);
            setIsWaitingForUserAction(true);
            ToastAlert('Info', "Create a group to continue this tutorial!", "3");
            navigate(`/group/${groups[0].id}/files`);
        }
    }, [step]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleGroupFormSubmit = () => {
        setTimeout(() => {
            fetchGroups();
            setSearchParams({});
        }, 500);
        setShowForm(false);

    }

    const handleSave = (updatedGroup) => {
        // Implement save logic here (e.g., updating the state or making an API call)
        console.log('Saving group:', updatedGroup);
        submitGroup({ ...updatedGroup })
    };



    // Function to handle form submission
    const submitGroup = (data) => {
        console.log(data);
        // setError('');

        postReuest(data, 'submit/group', token).then(res => {
            console.log(res);
            ToastAlert('Success', "Group updated!", "0");
            setTimeout(() => {
                getGroups(token);

            }, 1000)

        });
        console.log('group submitted:', data);
        // You can add further logic for handling the submitted title
    };

    const handleToggleEdit = (group) => {
        setShowForm(true);
        setSelectedGroup(group);
    }

    const handleBottomStepper = (step) => {
        if (step == 2 && groups.length == 0) {
            // console.log('Please create a group first');
            ToastAlert('Info', "Create a group to continue!", "2");
            setIsInstructionModalOpen(false);

        } else if (step == 2 && groups.length > 0 && isInstructionModalOpen) {
            setIsInstructionModalOpen(false);
            // setIsWaitingForUserAction(false);
            ToastAlert('Info', "Upload files to grade!", "3");
            navigate(`/group/${groups[0].id}/files`);
            localStorage.setItem('isGroupInstructionComplete', '1');
            setIsInstructionModalOpen(false);
        }
        console.log(`Bottom Stepper: ${step}`);
    }

    return (

        <MainLayout >
            <GroupInstructionModal onClose={() => console.log('Group instruction modal closed')} />
            <LoadingComponent isLoading={isProcessing} />
            <div className='h-full no-blur-container'>
                <div className='w-full md:flex justify-start mb-4 no-blur-overlay'>
                    <div className='text-3xl lg:text-6xl text-black font-normal pl-10'>
                        Assessments
                    </div>
                    <button onClick={() => { setSelectedGroup(null); setShowForm(prev => !prev) }} className={`${step == 0 ? "z-[51]" : null} ml-6 px-4 mt-3 bg-gradient-to-r from-[#4B0082] to-[#A855F7] rounded-md text-slate-100 font-medium transition-colors duration-300 button-gradient flex items-center`} aria-label="Create Assessment">
                        Create Assessment {showForm ? '-' : '+'}
                    </button>
                </div>

                {showForm ?
                    <div className="w-full ml-8 mx-auto dark:bg-boxdark p-8 rounded-xl shadow-3 mb-6">
                        <AssesmentForm handleReload={() => handleGroupFormSubmit()} group={selectedGroup} closeForm={() => { console.log('closed form'); setShowForm(false); }} />
                    </div> : null
                }

                <div className={`w-full relative mx-auto ml-8 ${step == 1 ? "lg:z-[51] mt-48" : ''}`}>
                    <div className="mx-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) =>
                            <AssesmentCard group={group} onSave={handleSave} key={group.id} showEdit={handleToggleEdit} refetchGroups={() => getGroups(token)} />
                        )}
                    </div>
                </div>

                <div className='flex px-8 mb-10'>
                    {!groups.length && <div className="w-1/2 rounded-2xl shadow-xl p-6 mx-4">
                        <h1 className='text-black text-center text-2xl font-bold mb-4'>
                            No Groups yet
                        </h1>
                        <p className='text-center text-[#FE764B] text-xs'>Please add</p>
                    </div>}
                </div>

                <div className="grid grid-cols-4 gap-4 mx-20">
                    {files.map((item, index) =>
                        <div key={index} className='border-black p-4 text-black font-bold'>

                            <button className="bg-black hover:bg-blue-700 text-black font-bold py-2 px-4 rounded mr-2" onClick={() => removeFile(index)}>
                                X
                            </button>
                            {item.name}
                        </div>
                    )}
                </div>
            </div>

        </MainLayout>
    );
};

export default Groups;
