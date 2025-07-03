import { useAuth } from "../../provider/authProvider";
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

import { getReuest, postReuest } from "../../services/apiService";
import FileToTextarea from "../components/FileToTextarea";
import ToastAlert from "../components/ToastAlert";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const GradeSampleForm = forwardRef(({ setIsProcessing, group_id, handleReload }, ref) => {
    
  const { token } = useAuth();
  
  const [contentGradeA, setContentGradeA] = useState('');
  const [contentGradeF, setContentGradeF] = useState('');
  const [reasonGradeA, setReasonGradeA] = useState('');
  const [reasonGradeF, setReasonGradeF] = useState('');
  const [gradeSamples, setGradeSamples] = useState([]);

  const [showGradeSample, setShowGradeSample] = useState(false);
  
    useEffect(() => {
        if(group_id && token)
        fetchGradeSamples(group_id, token);
    }, [group_id, token]);


  const fetchGradeSamples = (group_id, token) => {
    setIsProcessing(true)
    getReuest(`grade-samples/${group_id}`, token).then(res => {
        console.log('res.grade_samples', res.grade_samples)
        res.grade_samples.forEach(item => {
            if(item.grade=='A'){
                setContentGradeA(item.content);
                setReasonGradeA(item.reason);
            } else if(item.grade=='F') {
                setContentGradeF(item.content);
                setReasonGradeF(item.reason);
            }
        });
        setIsProcessing(false)
        setGradeSamples(res.grade_samples);
    });
}

  const updateGradeSample = async (group_id, grade, content, reason, grade_sample_id = 0) => {
    const formData = {group_id, grade, content, reason, grade_sample_id};
    console.log('formData', formData)

    return postReuest(formData, 'create-update/grade-sample', token)
}

  const handleSubmitGradeSample = async (e) => {
    e?.preventDefault();
    // const data = [contentGradeA, contentGradeF];
    
    if(contentGradeA.length && contentGradeF.length){
        let grade_a = gradeSamples.find(item => item.grade=='A') || {id: 0};
        let grade_f = gradeSamples.find(item => item.grade=='F') || {id: 0};
        console.log(contentGradeA.length, contentGradeF.length);

        setIsProcessing(true);
        updateGradeSample(group_id, 'A', contentGradeA, reasonGradeA, grade_a?.id).then(res => {
            updateGradeSample(group_id, 'F', contentGradeF, reasonGradeF, grade_f?.id).then((res) => {
                console.log(res)
                setIsProcessing(false);
                ToastAlert('Success', res.message, "0");
                fetchGradeSamples(group_id, token);
                if(handleReload) handleReload();
            // alert("File Uploaded Successfully");
            }).catch((error) => {
                ToastAlert('Error', 'Something went wront', "1")
                console.log('error', error)
                setIsProcessing(false);
            // alert("Error")
            });


        }).catch(err => {
            console.error('err 2', err);
                ToastAlert('Error', res.message, "1")
            setIsProcessing(false);

        });
        
    }

    
}


useImperativeHandle(ref, () => ({
    handleSubmitGradeSample
  }));

  return <>
        <form action="" method='post' onSubmit={(e) => handleSubmitGradeSample(e)}>
                <div className="flex">
                    {/* <div className='w-full'>
                        <pre>
                            {JSON.stringify(gradeSamples, null, 4)}
                        </pre>
                    </div> */}
                    <div className='w-1/2'>

                        {/* <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="large_size">A grade file</label> */}
                        <FileToTextarea label="Upload file for grade A" onFileSelect={(e) => setContentGradeA(e.trim()) } />
                        
                        <textarea
                            name="content_a"
                            rows={8}
                            value={contentGradeA}
                            onChange={(e) => setContentGradeA(e.target.value)}
                            className={`mt-1 p-2 w-full border rounded-md `}
                        />

                        <label htmlFor="reason_b">Reason for the grade <span className={`${reasonGradeA?.length > 1000 ? 'text-danger' : 'text-success'}`}>({reasonGradeA?.length ?? 0})</span></label>
                        <textarea
                            name="reason_a"
                            id="reason_a"
                            rows={4}
                            value={reasonGradeA}
                            onChange={(e) => setReasonGradeA(e.target.value)}
                            className={`mt-1 p-2 w-full border rounded-md `}
                        />

                    </div>
                    <div className='w-1/2 ml-4'>
                        {/* <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="large_size">F grade file</label> */}
                        <FileToTextarea label="Upload file for grade F" onFileSelect={(e) => setContentGradeF(e.trim()) } />
                        
                        <textarea
                            name="content_f"
                            rows={8}
                            value={contentGradeF}
                            onChange={(e) => setContentGradeF(e.target.value)}
                            className={`mt-1 p-2 w-full border rounded-md `}
                        />

                        <label htmlFor="reason_b">Reason for the grade <span className={`${reasonGradeF?.length > 1000 ? 'text-danger' : 'text-success'}`}>({reasonGradeF?.length ?? 0})</span></label>
                        <textarea
                            name="content_b"
                            id="content_b"
                            rows={4}
                            value={reasonGradeF}
                            onChange={(e) => setReasonGradeF(e.target.value)}
                            className={`mt-1 p-2 w-full border rounded-md `}
                        />
                    </div>
                </div>
                {/* <button type='submit' className='bg-black text-white text-2xl px-4 py-2 rounded'>submit</button> */}
            </form> 
        </>;
});

export default GradeSampleForm;

