import React from 'react';
import { FiX } from 'react-icons/fi';
import FileUpload from '../../Form/FileUpload';

export const UploadModal = ({
    isOpen,
    onClose,
    onUpload,
    isAllowedToUpload,
    group_id,
    setUploadFiles,
    total_points,
    isDemoTrialEnded,
    mySubscription
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                <div className="relative w-auto my-6 mx-auto max-w-3xl">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                            <h3 className="text-3xl font-semibold text-black">Upload Papers</h3>
                            <button
                                className="p-1 ml-auto border-0 text-black float-right text-3xl leading-none font-semibold"
                                onClick={onClose}
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="relative p-6 flex-auto">
                            {isDemoTrialEnded &&
                                <h2 className="text-danger font-medium mb-4">
                                    Trial period ended
                                </h2>
                            }

                            {mySubscription?.stripe_status === 'active' && !isAllowedToUpload &&
                                <h2 className="text-danger font-medium mb-4">
                                    You have reached your limit for upload.
                                </h2>
                            }

                            <FileUpload
                                onUpload={(msg) => {
                                    onUpload(msg);
                                    onClose();
                                }}
                                isAllowedToUpload={isAllowedToUpload}
                                group_id={group_id}
                                setUploadFiles={setUploadFiles}
                                total_points={total_points}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-75 fixed inset-0 z-40 bg-black"></div>
        </>
    );
};