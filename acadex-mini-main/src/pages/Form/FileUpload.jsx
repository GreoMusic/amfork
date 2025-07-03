import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { fetchSubscription, useAuth } from "../../provider/authProvider";
import LoadingOverlay from '../../layout/LoadingOverlay';
import { useParams } from 'react-router-dom';
import LoadingButton from '../components/LoadingButton';
import { postReuest } from "../../services/apiService";

import '../../assets/css/FileUploadStyle.css'; // Import or define your component styles
import moment from 'moment';
import LoadingComponent from '../../layout/LoadingComponent';

const host = window.location.hostname
const siteUrl = host === 'localhost' ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL_PROD;
const apiUrl = siteUrl + '/api';

const FileUploadComponent = ({ setUploadFiles, isAllowedToUpload, total_points, onUpload }) => {
    const [files, setFiles] = useState([]);
    const { token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [rejectedFiles, setRejectedFiles] = useState([]);
    const [isPackageExpired, setIsPackageExpired] = useState(false);
    const [userPackage, setUserPackage] = useState(null);
    let { group_id } = useParams();

    useEffect(() => {
        fetchSubscription().then(res => {
            setUserPackage(res);
            if (res && moment().format("X") > moment(res?.ends_at).format("X")) {
                setIsPackageExpired(true);
            }
        })
    }, []);

    const updateUsage = useCallback((upload_count) => {
        const data = { upload_count, evaluation_count: 0 };
        setIsProcessing(true);
        postReuest(data, `my-usage/create-update`, token).then(res => {
            // setProfile(res.user);
            console.log('usage', res);
            // setClientSecret(res.payment.client_secret)
            setIsProcessing(false);
            setClientSecret('')
        }).catch(err => {

            setIsProcessing(false);
        });
    }, [token]);

    const handleSubmit = useCallback(async () => {
        console.log(files.length)
        if (!files.length)
            return
        setIsProcessing(true);
        let count = 0;
        files.map(async (selectedFile, idx) => {
            const formData = new FormData();
            // Append file to the formData object here
            formData.append("selectedFile", selectedFile);
            formData.append("total_points", total_points);

            try {
                // We will send formData object as a data to the API URL here.
                const response = await axios.post(`${apiUrl}/upload/pdf/${group_id}`, formData, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    }
                }).then((res) => {
                    console.log(res)
                    // alert("File Uploaded Successfully");
                    count++;
                }).catch((error) => {
                    // alert("Error")
                });
            } catch (error) {
                console.log(error)
            }
            if (idx === files.length - 1) {
                setIsProcessing(false);
                setFiles([]);
                setTimeout(() => {
                    updateUsage(count);
                    const msg = `${count} of ${files.length} file(s) were uploaded successfully`;
                    onUpload(msg);
                    setSuccessMsg(msg);
                }, 500);
            }
        });
    }, [files, group_id]);



    const removeFile = useCallback((index) => {
        console.log(index);
        setFiles(prevFiles => prevFiles.filter((_, idx) => idx !== index));


    }, [files]);

    const onDrop = useCallback((acceptedFiles, rejectedDocs) => {
        // Do something with the dropped files
        console.log(acceptedFiles);

        if (rejectedDocs.length > 0) {
            setRejectedFiles(rejectedDocs)
            console.log(rejectedDocs);
        }
        setFiles(acceptedFiles);
        setUploadFiles(acceptedFiles);


    }, [token]);


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': [],
            'application/msword': [],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
            'image/jpeg': [],
            'image/jpg': [],
            'image/png': [],
            'image/gif': [],
            'image/webp': [],
            'image/bmp': [],
            'application/zip': [],
        },
        maxFiles: 20
    });

    return (

        <div className='mt-10'>
            <LoadingComponent isLoading={isProcessing} />

            {/* <div className="grid grid-cols-4 gap-4 mx-20">
                {files.map((item, index) =>
                    <div key={index} className='border-black p-4 text-black font-bold'>

                        <button className="bg-black hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2" onClick={() => removeFile(index)}>
                            X
                        </button>
                        {item.name}
                    </div>
                )}
            </div> */}
            {successMsg ? <div className="w-full p-4 mb-4 h-8 text-xl text-center text-sm text-success rounded-lg bg-red-50 dark:bg-gray-800" role="alert">
                {successMsg}
            </div> : null}
            {isAllowedToUpload && !isPackageExpired ? <div {...getRootProps()} className={`dropzone mb-10 mx-20 text-success text-xl font-medium ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} Selected` : ''}

                {rejectedFiles.length > 0 ? <div className='text-danger'>Max 20 files</div> : ''}
                <p className='text-2xl text-black my-4 font-light'>Drag & drop files to grade</p>
                <p className='text-sm text-slate-500'>Upload Limit: 20 files</p>

            </div> : <div className="w-full p-4 mb-4 h-8 text-xl text-center text-sm text-danger rounded-lg bg-red-50 dark:bg-gray-800" role="alert">
                You are not allowed to upload {isPackageExpired ? `- Package expired at ${moment(userPackage?.ends_at).format("MMM Do, YY")}` : null}
            </div>}
            <div className="flex justify-center">
                {/* <button className="bg-black hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleSubmit()}>
                    UPLOAD
                </button> */}
                <LoadingButton isLoading={isProcessing} handleOnClick={handleSubmit} isDisabled={files.length == 0}>
                    UPLOAD
                </LoadingButton>
            </div>
        </div>
    );
};

export default FileUploadComponent;
