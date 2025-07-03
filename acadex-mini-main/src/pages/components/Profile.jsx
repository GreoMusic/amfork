import React, { useCallback, useState } from 'react';
import { getUser } from "../../provider/authProvider";
import { useAuth, setUser } from "../../provider/authProvider";
import LoadingOverlay from '../../layout/LoadingOverlay';
import ImageUpload from '../components/ImageUpload';
import { Link } from 'react-router-dom';
import LoadingComponent from '../../layout/LoadingComponent';

const host = window.location.hostname
const siteUrl = host === 'mini.acadex.co' ? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL;
const apiUrl = siteUrl + '/api';

const Profile = ({ examFiles }) => {
    const user = getUser().user;
    const about = getUser().about;
    const { token } = useAuth();
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    // console.log(user);
    // const handleSubmit = async (event) => {
    //     event.preventDefault();
    //     console.log(event)
    //     if (event) {
    //         console.log(event.target)
    //         const formData = new FormData();
    //         formData.append("selectedFile", event.target[0].value);

    //         // const res = await fetch("http://localhost:8000/api/upload/image", {
    //         //     method: "POST",
    //         //     body: formData,
    //         // }).then((res) => res.json());

    //         try {
    //             // We will send formData object as a data to the API URL here.
    //             const response = await axios.post(`http://localhost:8000/api/upload/image`, formData, {
    //                 headers: {
    //                     "Authorization": `Bearer ${token}`,
    //                     "Content-Type": "multipart/form-data",
    //                 }
    //             }).then((res) => {
    //                 console.log(res)
    //                 alert("File Uploaded Successfully");
    //                 count++;
    //             }).catch((error) => {
    //                 // alert("Error")
    //             });
    //         } catch (error) {
    //             console.log(error)
    //         }
    //         // alert(JSON.stringify(`${res.message}, status: ${res.status}`));
    //     }
    // }


    return (
        <>
            <LoadingComponent isLoading={isProcessing} />

            <div className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="px-4 pb-6 text-center ">
                    <div className="relative z-30 mx-auto h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
                        <ImageUpload />

                    </div>
                    <div className="mt-8">
                        <h3 className="mb-1.5 text-2xl font-semibold text-black dark:text-white">
                            <Link to="/profile" >{user.first_name} {user.last_name} </Link>
                        </h3>
                        <p className="font-medium dark:text-white">{about}</p>
                        

                        <div className="mx-auto max-w-180">
                            {examFiles?.length ?
                                <h4 className="font-semibold text-black dark:text-white">
                                    Files
                                </h4> : null
                            }
                            {examFiles?.length ? <ol className="list-decimal px-1 text-left mx-auto py-4 pr-4 max-h-[480px] overflow-y-scroll bg-red-100">
                                {examFiles.map((item, idx) => <li className='my-2 ml-4 text-black' key={idx}>{item.name}</li>)}
                            </ol> : null}
                        </div>
                        
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
